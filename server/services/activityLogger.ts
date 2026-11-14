import { ActivityLog, ActivityCategory, ActivitySeverity, IActivityLog } from '../models/ActivityLog.js';
import { getIO } from '../socket.js';

export interface LogEventOptions {
  category: ActivityCategory;
  action: string;
  severity?: ActivitySeverity;
  actor: {
    id: string;
    name: string;
    role: 'admin' | 'intern' | 'system';
    avatar?: string;
  };
  target?: {
    type: 'intern' | 'project' | 'report' | 'system';
    id: string;
    title: string;
  };
  summary: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logActivity(options: LogEventOptions): Promise<IActivityLog | null> {
  try {
    const count = await ActivityLog.countDocuments();
    const logId = `LOG-${10000 + count + 1}`;

    const logEntry = await ActivityLog.create({
      logId,
      category: options.category,
      action: options.action,
      severity: options.severity || 'info',
      actor: options.actor,
      target: options.target,
      summary: options.summary,
      details: options.details || {},
      ipAddress: options.ipAddress || '',
      timestamp: new Date(),
    });

    // Real-time broadcast over Socket.IO
    const io = getIO();
    if (io) {
      io.emit('activity_event', {
        logId: logEntry.logId,
        category: logEntry.category,
        action: logEntry.action,
        severity: logEntry.severity,
        actor: logEntry.actor,
        target: logEntry.target,
        summary: logEntry.summary,
        details: logEntry.details,
        timestamp: logEntry.timestamp,
      });
    }

    return logEntry;
  } catch (err: any) {
    console.error('[ActivityLogger] Error recording activity:', err?.message || err);
    return null;
  }
}

export async function logProjectUpdate(
  actor: { id: string; name: string; role: 'admin' | 'intern'; avatar?: string },
  project: { id: string; title: string },
  action: string,
  summary: string,
  details?: Record<string, any>
) {
  return logActivity({
    category: 'project_update',
    action,
    severity: 'info',
    actor,
    target: {
      type: 'project',
      id: project.id,
      title: project.title,
    },
    summary,
    details,
  });
}

export async function logInternCheckInEvent(
  intern: { id: string; name: string; avatar?: string },
  checkIn: { checkInId: string; status: string; mode: string; focusToday: string; projectTitle?: string }
) {
  return logActivity({
    category: 'check_in',
    action: 'INTERN_CHECK_IN',
    severity: 'success',
    actor: {
      id: intern.id,
      name: intern.name,
      role: 'intern',
      avatar: intern.avatar,
    },
    target: {
      type: 'intern',
      id: intern.id,
      title: intern.name,
    },
    summary: `${intern.name} checked in (${checkIn.status} · ${checkIn.mode})`,
    details: {
      checkInId: checkIn.checkInId,
      status: checkIn.status,
      mode: checkIn.mode,
      focusToday: checkIn.focusToday,
      projectTitle: checkIn.projectTitle || 'General Internship Focus',
    },
  });
}

export async function logInternCheckOutEvent(
  intern: { id: string; name: string; avatar?: string },
  checkIn: { checkInId: string; durationMinutes?: number }
) {
  return logActivity({
    category: 'check_in',
    action: 'INTERN_CHECK_OUT',
    severity: 'info',
    actor: {
      id: intern.id,
      name: intern.name,
      role: 'intern',
      avatar: intern.avatar,
    },
    target: {
      type: 'intern',
      id: intern.id,
      title: intern.name,
    },
    summary: `${intern.name} checked out for the day (${checkIn.durationMinutes || 0} mins logged)`,
    details: {
      checkInId: checkIn.checkInId,
      durationMinutes: checkIn.durationMinutes || 0,
    },
  });
}
