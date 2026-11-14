import { Router, Request, Response } from 'express';
import { ProjectAssignment } from '../models/ProjectAssignment.js';
import { Project } from '../models/Project.js';
import { Intern } from '../models/Intern.js';
import { Notification } from '../models/Notification.js';
import { requireAdmin, authenticate } from '../middleware/auth.js';
import { broadcastNotification } from '../socket.js';
import { sendAssignmentEmail } from '../services/emailService.js';

const router = Router();

// GET /api/assignments - list all assignments
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const assignments = await ProjectAssignment.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: assignments.length, assignments });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/assignments/intern/:internId - get projects for specific intern
router.get('/intern/:internId', authenticate, async (req: Request, res: Response) => {
  try {
    const { internId } = req.params;
    const assignments = await ProjectAssignment.find({ internId, assignmentStatus: 'active' }).lean();
    const projectIds = assignments.map((a) => a.projectId);
    const projects = await Project.find({ projectId: { $in: projectIds } }).lean();

    const formatted = projects.map((p: any) => ({
      ...p,
      id: p.projectId,
      name: p.projectName,
      status: p.projectStatus,
    }));

    return res.json({ success: true, count: formatted.length, projects: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/assignments/project/:projectId - get interns for specific project
router.get('/project/:projectId', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const assignments = await ProjectAssignment.find({ projectId, assignmentStatus: 'active' }).lean();
    const internIds = assignments.map((a) => a.internId);
    const interns = await Intern.find({ internId: { $in: internIds } })
      .select('-passwordHash')
      .lean();

    return res.json({ success: true, count: interns.length, interns });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/assignments - assign interns to project (Admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { projectId, internIds, internId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required.' });
    }

    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Support single or multiple internIds
    const targetInternIds: string[] = internIds || (internId ? [internId] : []);
    if (!Array.isArray(targetInternIds)) {
      return res.status(400).json({ success: false, message: 'internIds must be an array.' });
    }

    // Fetch existing active assignments for this project
    const currentAssignments = await ProjectAssignment.find({
      projectId,
      assignmentStatus: 'active',
    });
    const currentInternIdSet = new Set(currentAssignments.map((a) => a.internId));
    const nextInternIdSet = new Set(targetInternIds);

    // Identify removals
    const toRemove = currentAssignments.filter((a) => !nextInternIdSet.has(a.internId));
    for (const rem of toRemove) {
      rem.assignmentStatus = 'removed';
      await rem.save();
    }

    // Identify additions
    const toAdd = targetInternIds.filter((id) => !currentInternIdSet.has(id));
    for (const id of toAdd) {
      const assignmentId = `ASG-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
      await ProjectAssignment.create({
        assignmentId,
        projectId,
        internId: id,
        assignedBy: req.user?.id || 'PTS-CEO-001',
        assignedDate: new Date().toISOString(),
        assignmentStatus: 'active',
      });

      // Dispatch Real-time Notification to Intern
      const notif = await Notification.create({
        notificationId: `notif-${Date.now()}-${id}`,
        recipientId: id,
        recipientRole: 'intern',
        notificationTitle: 'New Project Assigned – Phoenix Tech Solutions',
        notificationMessage: `You have been allocated to "${project.projectName}". Please inspect requirements and prepare weekly reporting.`,
        notificationType: 'project_assigned',
        relatedProjectId: project.projectId,
        isRead: false,
      });
      broadcastNotification(notif);

      // Automated Email Notification dispatch per Section 11
      try {
        const internDoc = await Intern.findOne({ internId: id });
        if (internDoc && internDoc.email) {
          await sendAssignmentEmail({
            internName: internDoc.fullName,
            internId: internDoc.internId,
            internEmail: internDoc.email,
            projectName: project.projectName,
            projectId: project.projectId,
            projectDescription: project.description || '',
            assignedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            deadline: project.deadline || 'Per project schedule',
            assignedBy: req.user?.name || req.user?.username || 'Phoenix Tech Solutions Administration',
          });
        }
      } catch (emailErr: any) {
        console.warn(`[Assignment] Email dispatch notice for intern ${id}:`, emailErr?.message || emailErr);
      }
    }

    // Create Admin notification
    const adminNotif = await Notification.create({
      notificationId: `notif-admin-${Date.now()}`,
      recipientId: req.user?.id || 'PTS-CEO-001',
      recipientRole: 'admin',
      notificationTitle: 'Project Assignment Completed',
      notificationMessage: `Team roster updated for "${project.projectName}" (${targetInternIds.length} members assigned).`,
      notificationType: 'project_assigned',
      relatedProjectId: project.projectId,
      isRead: false,
    });
    broadcastNotification(adminNotif);

    return res.json({
      success: true,
      message: `Assigned ${targetInternIds.length} interns to project "${project.projectName}".`,
      assignedInternIds: targetInternIds,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/assignments/:id - remove assignment
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const assignment = await ProjectAssignment.findOneAndUpdate(
      { assignmentId: req.params.id },
      { $set: { assignmentStatus: 'removed' } },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    return res.json({ success: true, message: 'Project assignment removed.', assignment });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
