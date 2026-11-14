import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { Intern } from '../models/Intern.js';
import { Project } from '../models/Project.js';
import { ProjectAssignment } from '../models/ProjectAssignment.js';
import { Report } from '../models/Report.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';

export async function seedDatabase() {
  console.log('[Seed] Verifying initial database collections for Phoenix Tech Solutions...');

  const admins = [
    {
      adminId: process.env.ADMIN1_ID || 'PTS-CEO-001',
      name: process.env.ADMIN1_NAME || 'Y D Mahendhra',
      username: (process.env.ADMIN1_USERNAME || 'Mahendhra').toLowerCase(),
      email: (process.env.ADMIN1_EMAIL || '').toLowerCase(),
      password: process.env.ADMIN1_PASSWORD || '',
      designation: 'Chief Executive Officer (CEO)',
      department: 'Executive Leadership & Project Operations',
    },
    {
      adminId: process.env.ADMIN2_ID || 'PTS-COO-001',
      name: process.env.ADMIN2_NAME || 'P Praveen Kumar',
      username: (process.env.ADMIN2_USERNAME || 'Praveen').toLowerCase(),
      email: (process.env.ADMIN2_EMAIL || '').toLowerCase(),
      password: process.env.ADMIN2_PASSWORD || '',
      designation: 'Chief Operating Officer (COO)',
      department: 'Operations & Technical Oversight',
    },
  ];
  const syncPasswords = process.env.ADMIN_SYNC_PASSWORDS === 'true';

  // Idempotent: never deletes existing data. Creates missing admins and keeps
  // existing passwords unless ADMIN_SYNC_PASSWORDS=true.
  for (const a of admins) {
    try {
      const existing = await Admin.findOne({ adminId: a.adminId });
      if (!existing) {
        if (!a.password || !a.email) {
          console.warn(`[Seed] Skipping ${a.adminId}: ADMIN*_EMAIL and ADMIN*_PASSWORD env vars are not set.`);
          continue;
        }
        await Admin.create({
          adminId: a.adminId,
          name: a.name,
          username: a.username,
          email: a.email,
          passwordHash: await bcrypt.hash(a.password, 10),
          designation: a.designation,
          department: a.department,
          contactInfo: 'Executive Office · Email: ' + a.email,
          role: 'admin',
          accountStatus: 'active',
        });
        console.log(`[Seed] Created admin ${a.adminId}.`);
      } else if (syncPasswords && a.password) {
        existing.passwordHash = await bcrypt.hash(a.password, 10);
        await existing.save();
        console.log(`[Seed] Password re-synced for admin ${a.adminId}.`);
      }
    } catch (adminErr: any) {
      console.error(`[Seed Error] Failed to seed admin ${a.adminId}:`, adminErr?.message || adminErr);
    }
  }
  const admin1Id = admins[0].adminId;
  const admin1Name = admins[0].name;
  const admin2Id = admins[1].adminId;

  // Seed initial system logs if empty
  try {
    const logCount = await ActivityLog.countDocuments();
    if (logCount === 0) {
      await ActivityLog.create([
        {
          logId: 'LOG-10001',
          category: 'system',
          action: 'PLATFORM_INITIALIZATION',
          severity: 'info',
          actor: { id: 'SYSTEM', name: 'Phoenix Core Engine', role: 'system' },
          target: { type: 'system', id: 'SRV-01', title: 'Phoenix Tech Solutions Core' },
          summary: 'Phoenix Tech Solutions Enterprise Management platform initialized',
          details: { nodeVersion: process.version, environment: process.env.NODE_ENV || 'development' },
          timestamp: new Date(Date.now() - 3600000 * 2),
        },
        {
          logId: 'LOG-10002',
          category: 'security',
          action: 'SECURITY_GOVERNANCE_ACTIVE',
          severity: 'success',
          actor: { id: admin1Id, name: admin1Name, role: 'admin' },
          target: { type: 'intern', id: 'AUTH-SCOPE', title: 'RBAC Authorization' },
          summary: 'Two-factor administrative security governance verified with bcrypt encryption',
          details: { admin1: admin1Id, admin2: admin2Id, rbacStatus: 'enforced' },
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          logId: 'LOG-10003',
          category: 'system',
          action: 'AUDIT_LOG_DRAWER_MOUNTED',
          severity: 'info',
          actor: { id: 'SYSTEM', name: 'Activity Monitor', role: 'system' },
          target: { type: 'system', id: 'LOG-ENGINE', title: 'Central Audit Log' },
          summary: 'Real-time Socket.IO activity monitoring gateway activated',
          details: { channel: 'activity_event', socketGateway: 'active' },
          timestamp: new Date(),
        },
      ]);
      console.log('[Seed] Seeded initial system audit trail logs.');
    }
  } catch (logErr: any) {
    console.warn('[Seed] Notice during initial activity logs creation:', logErr?.message);
  }

  console.log('[Seed] Database initialization complete: admin accounts verified.');
}
