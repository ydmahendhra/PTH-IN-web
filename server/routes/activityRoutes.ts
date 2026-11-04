import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ActivityLog, ActivityCategory, ActivitySeverity } from '../models/ActivityLog';
import { InternCheckIn, CheckInStatus, WorkMode } from '../models/InternCheckIn';
import { Intern } from '../models/Intern';
import { Project } from '../models/Project';
import { authenticate, requireAdmin } from '../middleware/auth';
import { logActivity, logInternCheckInEvent, logInternCheckOutEvent } from '../services/activityLogger';
import { getIO } from '../socket';

const router = Router();

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET /api/activity/dashboard - High-level metrics & latest feeds for the dashboard
router.get('/dashboard', authenticate, async (_req: Request, res: Response) => {
  try {
    const today = getTodayDateString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalInterns,
      todayCheckIns,
      activeCheckIns,
      projectUpdatesCount,
      alertsCount,
      recentCheckIns,
      recentProjectUpdates,
    ] = await Promise.all([
      Intern.countDocuments({ accountStatus: 'active' }),
      InternCheckIn.countDocuments({ dateString: today }),
      InternCheckIn.countDocuments({
        dateString: today,
        status: { $in: ['Present', 'Working Remotely', 'In Office'] },
      }),
      ActivityLog.countDocuments({
        category: 'project_update',
        timestamp: { $gte: oneDayAgo },
      }),
      ActivityLog.countDocuments({
        severity: { $in: ['warning', 'error'] },
        timestamp: { $gte: oneDayAgo },
      }),
      InternCheckIn.find({ dateString: today }).sort({ checkInTime: -1 }).limit(10).lean(),
      ActivityLog.find({ category: 'project_update' }).sort({ timestamp: -1 }).limit(10).lean(),
    ]);

    // 7-day sparkline/trend data
    const last7Days: { date: string; checkIns: number; projectUpdates: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const [cCount, pCount] = await Promise.all([
        InternCheckIn.countDocuments({ dateString: dateStr }),
        ActivityLog.countDocuments({
          category: 'project_update',
          timestamp: { $gte: startOfDay, $lte: endOfDay },
        }),
      ]);

      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      last7Days.push({
        date: label,
        checkIns: cCount,
        projectUpdates: pCount,
      });
    }

    const checkInRate = totalInterns > 0 ? Math.round((todayCheckIns / totalInterns) * 100) : 0;

    return res.json({
      success: true,
      summary: {
        totalInterns,
        todayCheckIns,
        activeInternsNow: activeCheckIns,
        projectUpdatesToday: projectUpdatesCount,
        criticalAlertsCount: alertsCount,
        checkInRate,
        todayDate: today,
      },
      recentCheckIns,
      recentProjectUpdates,
      activityTrend: last7Days,
    });
  } catch (err: any) {
    console.error('Error fetching activity dashboard:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activity/logs - Central Log Viewer with filters, pagination, search
router.get('/logs', authenticate, async (req: Request, res: Response) => {
  try {
    const { category, severity, search, range, page = 1, limit = 50 } = req.query;

    const query: any = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    if (range) {
      const now = new Date();
      if (range === 'today') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        query.timestamp = { $gte: startOfDay };
      } else if (range === '24h') {
        query.timestamp = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
      } else if (range === '7d') {
        query.timestamp = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      }
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { summary: regex },
        { action: regex },
        { logId: regex },
        { 'actor.name': regex },
        { 'actor.id': regex },
        { 'target.title': regex },
        { 'target.id': regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum).lean(),
      ActivityLog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('Error fetching activity logs:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activity/checkins - List intern check-ins
router.get('/checkins', authenticate, async (req: Request, res: Response) => {
  try {
    const { date, status, internId, search } = req.query;
    const query: any = {};

    if (date && date !== 'all') {
      query.dateString = date;
    } else if (!date) {
      query.dateString = getTodayDateString();
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (internId) {
      query.internId = internId;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { internName: regex },
        { internId: regex },
        { projectTitle: regex },
        { focusToday: regex },
      ];
    }

    const checkIns = await InternCheckIn.find(query).sort({ checkInTime: -1 }).lean();

    return res.json({
      success: true,
      checkIns,
      date: query.dateString || 'all',
      count: checkIns.length,
    });
  } catch (err: any) {
    console.error('Error fetching check-ins:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activity/checkins/status/me - Get current intern's check-in status for today
router.get('/checkins/status/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'intern') {
      return res.status(403).json({ success: false, message: 'Only interns can check personal check-in status.' });
    }

    const today = getTodayDateString();
    const checkIn = await InternCheckIn.findOne({
      internId: req.user.id,
      dateString: today,
    }).sort({ checkInTime: -1 });

    return res.json({
      success: true,
      checkedIn: !!checkIn,
      checkIn: checkIn || null,
      isCheckedOut: checkIn ? checkIn.status === 'Checked Out' : false,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/activity/checkins - Intern creates daily check-in
router.post('/checkins', authenticate, async (req: Request, res: Response) => {
  try {
    const { focusToday, status, mode, projectId, blockers } = req.body;

    if (!focusToday || !focusToday.trim()) {
      return res.status(400).json({ success: false, message: 'Please specify your focus and tasks for today.' });
    }

    const today = getTodayDateString();
    const internId = req.user?.id;

    if (!internId) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const intern = await Intern.findOne({ internId });
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern profile not found.' });
    }

    // Check if already checked in today
    const existing = await InternCheckIn.findOne({ internId, dateString: today });
    if (existing && existing.status !== 'Checked Out') {
      // Update today's existing check-in
      existing.focusToday = focusToday.trim();
      existing.status = (status as CheckInStatus) || existing.status;
      existing.mode = (mode as WorkMode) || existing.mode;
      if (blockers !== undefined) existing.blockers = blockers;
      if (projectId) {
        existing.projectId = projectId;
        const p = await Project.findOne({ projectId });
        if (p) existing.projectTitle = p.title;
      }
      await existing.save();

      // Broadcast update
      const io = getIO();
      if (io) {
        io.emit('checkin_event', existing);
      }

      await logActivity({
        category: 'check_in',
        action: 'CHECK_IN_UPDATED',
        severity: 'info',
        actor: { id: intern.internId, name: intern.fullName, role: 'intern', avatar: intern.profileImage },
        target: { type: 'intern', id: intern.internId, title: intern.fullName },
        summary: `${intern.fullName} updated daily check-in notes`,
        details: { focusToday: existing.focusToday, status: existing.status, mode: existing.mode },
      });

      return res.json({
        success: true,
        message: 'Check-in details updated successfully.',
        checkIn: existing,
      });
    }

    // New check-in
    const count = await InternCheckIn.countDocuments();
    const checkInId = `CHK-${1000 + count + 1}`;

    let projectTitle = '';
    if (projectId) {
      const p = await Project.findOne({ projectId });
      if (p) projectTitle = p.title;
    }

    const newCheckIn = await InternCheckIn.create({
      checkInId,
      internId: intern.internId,
      internName: intern.fullName,
      internAvatar: intern.profileImage || '',
      department: intern.department || 'Engineering',
      projectId: projectId || '',
      projectTitle,
      status: (status as CheckInStatus) || 'Present',
      mode: (mode as WorkMode) || 'Remote',
      focusToday: focusToday.trim(),
      blockers: blockers || '',
      checkInTime: new Date(),
      dateString: today,
      adminAcknowledged: false,
    });

    // Broadcast check-in to admins
    const io = getIO();
    if (io) {
      io.emit('checkin_event', newCheckIn);
    }

    // Log in central log
    await logInternCheckInEvent(
      { id: intern.internId, name: intern.fullName, avatar: intern.profileImage },
      {
        checkInId: newCheckIn.checkInId,
        status: newCheckIn.status,
        mode: newCheckIn.mode,
        focusToday: newCheckIn.focusToday,
        projectTitle: newCheckIn.projectTitle,
      }
    );

    return res.status(201).json({
      success: true,
      message: `Checked in successfully for ${today}. Have a productive day!`,
      checkIn: newCheckIn,
    });
  } catch (err: any) {
    console.error('Error during intern check-in:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/activity/checkins/checkout - Intern checks out for the day
router.post('/checkins/checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const today = getTodayDateString();
    const internId = req.user?.id;

    if (!internId) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const checkIn = await InternCheckIn.findOne({
      internId,
      dateString: today,
      status: { $ne: 'Checked Out' },
    });

    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: 'No active check-in found for today to check out from.',
      });
    }

    const now = new Date();
    checkIn.checkOutTime = now;
    checkIn.status = 'Checked Out';
    
    // Calculate duration in minutes
    const diffMs = now.getTime() - new Date(checkIn.checkInTime).getTime();
    checkIn.durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    await checkIn.save();

    const io = getIO();
    if (io) {
      io.emit('checkin_event', checkIn);
    }

    await logInternCheckOutEvent(
      { id: checkIn.internId, name: checkIn.internName, avatar: checkIn.internAvatar },
      { checkInId: checkIn.checkInId, durationMinutes: checkIn.durationMinutes }
    );

    return res.json({
      success: true,
      message: `Checked out successfully. Logged ${Math.round(checkIn.durationMinutes / 60 * 10) / 10} hours for today.`,
      checkIn,
    });
  } catch (err: any) {
    console.error('Error during check-out:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/activity/checkins/admin-log - Admin records a check-in for an intern
router.post('/checkins/admin-log', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { internId, status, mode, focusToday, projectId, blockers, date } = req.body;

    if (!internId) {
      return res.status(400).json({ success: false, message: 'Intern selection is required.' });
    }

    const intern = await Intern.findOne({ internId: internId.toUpperCase() });
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    const targetDate = date || getTodayDateString();
    let projectTitle = '';
    if (projectId) {
      const p = await Project.findOne({ projectId });
      if (p) projectTitle = p.title;
    }

    const count = await InternCheckIn.countDocuments();
    const checkInId = `CHK-${1000 + count + 1}`;

    const checkIn = await InternCheckIn.create({
      checkInId,
      internId: intern.internId,
      internName: intern.fullName,
      internAvatar: intern.profileImage || '',
      department: intern.department || 'Engineering',
      projectId: projectId || '',
      projectTitle,
      status: (status as CheckInStatus) || 'Present',
      mode: (mode as WorkMode) || 'Office',
      focusToday: focusToday || 'Assigned standard organizational daily sprint tasks',
      blockers: blockers || '',
      checkInTime: new Date(),
      dateString: targetDate,
      adminAcknowledged: true,
      acknowledgedBy: req.user?.id,
      acknowledgedAt: new Date(),
    });

    const io = getIO();
    if (io) {
      io.emit('checkin_event', checkIn);
    }

    await logActivity({
      category: 'check_in',
      action: 'ADMIN_RECORDED_CHECK_IN',
      severity: 'info',
      actor: { id: req.user?.id || 'admin', name: 'Administrator', role: 'admin' },
      target: { type: 'intern', id: intern.internId, title: intern.fullName },
      summary: `Administrator recorded check-in for ${intern.fullName} (${checkIn.status})`,
      details: { checkInId: checkIn.checkInId, status: checkIn.status, date: targetDate },
    });

    return res.status(201).json({
      success: true,
      message: `Check-in recorded for ${intern.fullName}.`,
      checkIn,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/activity/checkins/:id/acknowledge - Admin acknowledges check-in
router.put('/checkins/:id/acknowledge', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkIn = await InternCheckIn.findOne(
      mongoose.isValidObjectId(id)
        ? { $or: [{ checkInId: id }, { _id: id }] }
        : { checkInId: id }
    );

    if (!checkIn) {
      return res.status(404).json({ success: false, message: 'Check-in not found.' });
    }

    checkIn.adminAcknowledged = true;
    checkIn.acknowledgedBy = req.user?.id;
    checkIn.acknowledgedAt = new Date();
    await checkIn.save();

    const io = getIO();
    if (io) {
      io.emit('checkin_event', checkIn);
    }

    await logActivity({
      category: 'check_in',
      action: 'CHECK_IN_ACKNOWLEDGED',
      severity: 'info',
      actor: { id: req.user?.id || 'admin', name: 'Administrator', role: 'admin' },
      target: { type: 'intern', id: checkIn.internId, title: checkIn.internName },
      summary: `Administrator acknowledged ${checkIn.internName}'s daily check-in`,
      details: { checkInId: checkIn.checkInId, focusToday: checkIn.focusToday },
    });

    return res.json({
      success: true,
      message: `Check-in for ${checkIn.internName} acknowledged.`,
      checkIn,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/activity/logs/clear - Clean logs older than specified days or retain latest 100
router.delete('/logs/clear', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { retainLatest = 50 } = req.body;
    const retainNum = parseInt(retainLatest as string, 10) || 50;

    const totalLogs = await ActivityLog.countDocuments();
    if (totalLogs <= retainNum) {
      return res.json({
        success: true,
        message: `Log count (${totalLogs}) is within the retention limit (${retainNum}). No records removed.`,
        deletedCount: 0,
      });
    }

    // Find the timestamp of the Nth latest log
    const cutoffLogs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .skip(retainNum)
      .limit(1)
      .lean();

    let deletedCount = 0;
    if (cutoffLogs.length > 0) {
      const cutoffTime = cutoffLogs[0].timestamp;
      const result = await ActivityLog.deleteMany({ timestamp: { $lte: cutoffTime } });
      deletedCount = result.deletedCount || 0;
    }

    await logActivity({
      category: 'system',
      action: 'LOGS_PRUNED',
      severity: 'warning',
      actor: { id: req.user?.id || 'admin', name: 'Administrator', role: 'admin' },
      summary: `Activity log archive pruned: ${deletedCount} older records cleared`,
      details: { retained: retainNum, removed: deletedCount },
    });

    return res.json({
      success: true,
      message: `Cleaned up ${deletedCount} older activity records. Retained latest ${retainNum} entries.`,
      deletedCount,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activity/export - Export logs as JSON or CSV
router.get('/export', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.query;
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(1000).lean();

    if (format === 'csv') {
      const headers = ['Log ID', 'Category', 'Action', 'Severity', 'Actor Name', 'Actor ID', 'Role', 'Target Title', 'Summary', 'Timestamp'];
      const rows = logs.map((l) => [
        `"${l.logId}"`,
        `"${l.category}"`,
        `"${l.action}"`,
        `"${l.severity}"`,
        `"${l.actor?.name?.replace(/"/g, '""') || ''}"`,
        `"${l.actor?.id || ''}"`,
        `"${l.actor?.role || ''}"`,
        `"${l.target?.title?.replace(/"/g, '""') || ''}"`,
        `"${l.summary?.replace(/"/g, '""') || ''}"`,
        `"${new Date(l.timestamp).toISOString()}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=phoenix_tech_activity_logs_${Date.now()}.csv`);
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=phoenix_tech_activity_logs_${Date.now()}.json`);
    return res.json({ exportedAt: new Date().toISOString(), totalLogs: logs.length, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
