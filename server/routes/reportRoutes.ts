import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { Report, IUploadedFile } from '../models/Report';
import { Project } from '../models/Project';
import { Intern } from '../models/Intern';
import { Notification } from '../models/Notification';
import { requireAdmin, authenticate } from '../middleware/auth';
import { getGridFSBucket } from '../db/connection';
import { broadcastNotification } from '../socket';
import { logActivity } from '../services/activityLogger';

const router = Router();

// Multer for report attachments (supports PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported for "${file.originalname}". Only PDF, DOC, DOCX, XLS, XLSX, JPG, and PNG are allowed.`));
    }
  },
});

// Helper to save buffer into GridFS
async function saveFileToGridFS(file: Express.Multer.File, internId: string, projectId: string): Promise<IUploadedFile> {
  const bucket = getGridFSBucket();
  const storedFileName = `rep_${internId}_${Date.now()}_${file.originalname}`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(storedFileName, {
      metadata: {
        contentType: file.mimetype || 'application/octet-stream',
        originalFileName: file.originalname,
        fileSize: file.size,
        internId,
        projectId,
        uploadedAt: new Date(),
      },
    });

    const readable = new Readable();
    readable.push(file.buffer);
    readable.push(null);

    readable.pipe(uploadStream);

    uploadStream.on('error', (err) => reject(err));
    uploadStream.on('finish', () => {
      resolve({
        fileId: uploadStream.id.toString(),
        originalFileName: file.originalname,
        storedFileName,
        contentType: file.mimetype || 'application/octet-stream',
        fileSize: file.size,
        dataUrl: `/api/files/${uploadStream.id}`,
      });
    });
  });
}

// GET /api/reports - list reports with rich filtering
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId, internId, month, year, weekNumber, status, search } = req.query;
    const filter: any = {};

    if (projectId && projectId !== 'All') filter.projectId = projectId;
    if (internId && internId !== 'All') filter.internId = internId;
    if (month && month !== 'All') filter.month = month;
    if (year && year !== 'All') filter.year = Number(year);
    if (weekNumber && weekNumber !== 'All') filter.weekNumber = Number(weekNumber);
    if (status && status !== 'All') filter.submissionStatus = status;

    // If logged in as intern, restrict strictly to their own reports
    if (req.user?.role === 'intern') {
      filter.internId = req.user.id;
    }

    if (search) {
      const q = search.toString();
      filter.$or = [
        { reportTitle: { $regex: q, $options: 'i' } },
        { reportId: { $regex: q, $options: 'i' } },
        { workSummary: { $regex: q, $options: 'i' } },
      ];
    }

    const reports = await Report.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/:id - single report
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const report = await Report.findOne({
      $or: [{ reportId: req.params.id }, { _id: req.params.id }],
    }).lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Role security check
    if (req.user?.role === 'intern' && report.internId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this report.' });
    }

    const intern = await Intern.findOne({ internId: report.internId }).select('-passwordHash').lean();
    const project = await Project.findOne({ projectId: report.projectId }).lean();

    return res.json({ success: true, report, intern, project });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reports - submit or draft a weekly report with file uploads
router.post('/', authenticate, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      reportTitle,
      description,
      workSummary,
      completedActivities,
      workProgress,
      challengesFaced,
      nextWeekPlan,
      additionalComments,
      month,
      year,
      weekNumber,
      weekStartDate,
      weekEndDate,
      isDraft,
      existingReportId,
    } = req.body;

    const internId = req.user?.role === 'intern' ? req.user.id : req.body.internId;
    if (!internId) {
      return res.status(400).json({ success: false, message: 'internId is required.' });
    }
    if (!projectId || !reportTitle) {
      return res.status(400).json({ success: false, message: 'Project and Report Title are required.' });
    }

    const intern = await Intern.findOne({ internId });
    const project = await Project.findOne({ projectId });
    if (!intern || !project) {
      return res.status(404).json({ success: false, message: 'Associated project or intern record not found.' });
    }

    const draftFlag = isDraft === 'true' || isDraft === true;
    const submissionStatus = draftFlag ? 'Draft' : 'Submitted';

    // Store uploaded files in GridFS
    const files = req.files as Express.Multer.File[];
    const uploadedFileList: IUploadedFile[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const storedFile = await saveFileToGridFS(file, internId, projectId);
        uploadedFileList.push(storedFile);
      }
    }

    // Default dates & periods if not passed
    const now = new Date();
    const repMonth = month || now.toLocaleString('default', { month: 'long' });
    const repYear = Number(year) || now.getFullYear();
    const repWeek = Number(weekNumber) || 1;
    const startStr = weekStartDate || now.toISOString().split('T')[0];
    const endStr = weekEndDate || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check for existing report to prevent duplicate entries
    let targetReport = null;
    if (existingReportId) {
      targetReport = await Report.findOne({ reportId: existingReportId });
    } else {
      targetReport = await Report.findOne({
        projectId,
        internId,
        year: repYear,
        month: repMonth,
        weekNumber: repWeek,
      });
    }

    if (targetReport) {
      // Update existing record
      targetReport.reportTitle = reportTitle;
      targetReport.description = description || targetReport.description;
      targetReport.workSummary = workSummary || targetReport.workSummary;
      targetReport.completedActivities = completedActivities || targetReport.completedActivities;
      targetReport.workProgress = Number(workProgress) || targetReport.workProgress;
      targetReport.challengesFaced = challengesFaced || targetReport.challengesFaced;
      targetReport.nextWeekPlan = nextWeekPlan || targetReport.nextWeekPlan;
      targetReport.additionalComments = additionalComments || targetReport.additionalComments;
      targetReport.submissionStatus = submissionStatus;

      if (!draftFlag) {
        targetReport.submittedAt = new Date();
      }

      if (uploadedFileList.length > 0) {
        targetReport.uploadedFiles.push(...uploadedFileList);
      }

      await targetReport.save();

      // Dispatch notification on submission
      if (!draftFlag) {
        // Update project progress
        const nextProgress = Math.max(project.progress, Number(workProgress) || 0);
        project.progress = nextProgress;
        await project.save();

        const notif = await Notification.create({
          notificationId: `notif-${Date.now()}`,
          recipientId: 'ADM-1001',
          recipientRole: 'admin',
          notificationTitle: 'New Weekly Report Submitted',
          notificationMessage: `${intern.fullName} (${intern.internId}) submitted Week ${repWeek} report for "${project.projectName}".`,
          notificationType: 'report_submitted',
          relatedProjectId: project.projectId,
          relatedReportId: targetReport.reportId,
          isRead: false,
        });
        broadcastNotification(notif);

        await logActivity({
          category: 'report_submission',
          action: 'REPORT_SUBMITTED',
          severity: 'info',
          actor: { id: intern.internId, name: intern.fullName, role: 'intern', avatar: intern.profileImage },
          target: { type: 'report', id: targetReport.reportId, title: targetReport.reportTitle },
          summary: `${intern.fullName} submitted report for "${project.projectName}" (${targetReport.workProgress}% progress)`,
          details: { reportId: targetReport.reportId, projectId: project.projectId, workProgress: targetReport.workProgress },
        });
      }

      return res.json({
        success: true,
        message: draftFlag ? 'Report draft saved successfully.' : 'Report submitted for review successfully.',
        report: targetReport,
      });
    }

    // Create new report
    const newReportId = `REP-${Math.floor(100 + Math.random() * 900)}`;
    const newReport = await Report.create({
      reportId: newReportId,
      projectId,
      internId,
      month: repMonth,
      year: repYear,
      weekNumber: repWeek,
      weekStartDate: startStr,
      weekEndDate: endStr,
      reportTitle,
      description: description || '',
      workSummary: workSummary || '',
      completedActivities: completedActivities || '',
      workProgress: Number(workProgress) || 50,
      challengesFaced: challengesFaced || '',
      nextWeekPlan: nextWeekPlan || '',
      additionalComments: additionalComments || '',
      uploadedFiles: uploadedFileList,
      submissionStatus,
      submittedAt: draftFlag ? undefined : new Date(),
    });

    if (!draftFlag) {
      // Update project progress
      project.progress = Math.max(project.progress, Number(workProgress) || 0);
      await project.save();

      const notif = await Notification.create({
        notificationId: `notif-${Date.now()}`,
        recipientId: 'ADM-1001',
        recipientRole: 'admin',
        notificationTitle: 'New Weekly Report Submitted',
        notificationMessage: `${intern.fullName} (${intern.internId}) submitted Week ${repWeek} report for "${project.projectName}".`,
        notificationType: 'report_submitted',
        relatedProjectId: project.projectId,
        relatedReportId: newReport.reportId,
        isRead: false,
      });
      broadcastNotification(notif);
    }

    return res.status(201).json({
      success: true,
      message: draftFlag ? 'Report draft saved successfully.' : 'Report submitted for review successfully.',
      report: newReport,
    });
  } catch (err: any) {
    console.error('Report submission error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reports/:id/review - Admin reviews report (Approve / Reject / Under Review)
router.put('/:id/review', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, reviewComments } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Review status is required.' });
    }

    const report = await Report.findOne({
      $or: [{ reportId: req.params.id }, { _id: req.params.id }],
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.submissionStatus = status;
    report.reviewComments = reviewComments || '';
    report.reviewedBy = req.user?.name || 'Administrator';
    report.reviewedAt = new Date();
    await report.save();

    // Create real-time notification for Intern
    const notifTitle =
      status === 'Approved'
        ? 'Report Approved 🎉'
        : status === 'Rejected'
        ? 'Report Needs Revision'
        : 'Report Under Review';

    const notif = await Notification.create({
      notificationId: `notif-rev-${Date.now()}`,
      recipientId: report.internId,
      recipientRole: 'intern',
      notificationTitle: notifTitle,
      notificationMessage: `Admin reviewed "${report.reportTitle}": Status is now "${status}". Feedback: "${(reviewComments || '').slice(0, 100)}"`,
      notificationType: 'report_reviewed',
      relatedProjectId: report.projectId,
      relatedReportId: report.reportId,
      isRead: false,
    });
    broadcastNotification(notif);

    await logActivity({
      category: 'report_review',
      action: `REPORT_${String(status).toUpperCase().replace(/\s+/g, '_')}`,
      severity: status === 'Approved' ? 'success' : status === 'Rejected' ? 'warning' : 'info',
      actor: { id: req.user?.id || 'admin', name: req.user?.name || 'Administrator', role: 'admin' },
      target: { type: 'report', id: report.reportId, title: report.reportTitle },
      summary: `Administrator marked report "${report.reportTitle}" as ${status}`,
      details: { reportId: report.reportId, status, reviewComments: (reviewComments || '').slice(0, 150) },
    });

    return res.json({
      success: true,
      message: `Report status updated to ${status}.`,
      report,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
