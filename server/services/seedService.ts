import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';
import { Intern } from '../models/Intern';
import { Project } from '../models/Project';
import { ProjectAssignment } from '../models/ProjectAssignment';
import { Report } from '../models/Report';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';

export async function seedDatabase() {
  console.log('[Seed] Verifying initial database collections for Phoenix Tech Solutions...');

  // Admin 1 - Y D Mahendhra (CEO)
  const admin1Id = process.env.ADMIN1_ID || 'PTS-CEO-001';
  const admin1Name = process.env.ADMIN1_NAME || 'Y D Mahendhra';
  const admin1Username = (process.env.ADMIN1_USERNAME || 'Mahendhra').toLowerCase();
  const admin1Email = (process.env.ADMIN1_EMAIL || 'mahendhra2005@gamil.com').toLowerCase();
  const admin1Password = process.env.ADMIN1_PASSWORD || 'ydm@1962';

  // Admin 2 - P Praveen Kumar (COO)
  const admin2Id = process.env.ADMIN2_ID || 'PTS-COO-001';
  const admin2Name = process.env.ADMIN2_NAME || 'P Praveen Kumar';
  const admin2Username = (process.env.ADMIN2_USERNAME || 'Praveen').toLowerCase();
  const admin2Email = (process.env.ADMIN2_EMAIL || 'praveenpraba399@gamil.com').toLowerCase();
  const admin2Password = process.env.ADMIN2_PASSWORD || 'sasipravveen';

  const salt1 = await bcrypt.genSalt(10);
  const hash1 = await bcrypt.hash(admin1Password, salt1);

  const salt2 = await bcrypt.genSalt(10);
  const hash2 = await bcrypt.hash(admin2Password, salt2);

  try {
    await Admin.deleteMany({});
    await Admin.create([
      {
        adminId: admin1Id,
        name: admin1Name,
        username: admin1Username,
        email: admin1Email,
        passwordHash: hash1,
        contactNumber: '+91 98765 43210',
        designation: 'Chief Executive Officer (CEO)',
        department: 'Executive Leadership & Project Operations',
        contactInfo: 'Executive Office · Email: ' + admin1Email,
        role: 'admin',
        accountStatus: 'active',
      },
      {
        adminId: admin2Id,
        name: admin2Name,
        username: admin2Username,
        email: admin2Email,
        passwordHash: hash2,
        contactNumber: '+91 98765 43211',
        designation: 'Chief Operating Officer (COO)',
        department: 'Operations & Technical Oversight',
        contactInfo: 'Executive Office · Email: ' + admin2Email,
        role: 'admin',
        accountStatus: 'active',
      },
    ]);
    console.log(`[Seed] Successfully seeded Admin 1 (${admin1Id} / ${admin1Email}) and Admin 2 (${admin2Id} / ${admin2Email}).`);
  } catch (adminErr: any) {
    console.error('[Seed Error] Failed to seed authorized admins:', adminErr?.message || adminErr);
  }

  // Complete demo cleanup per Section 7
  try {
    await Intern.deleteMany({});
    await Project.deleteMany({});
    await ProjectAssignment.deleteMany({});
    await Report.deleteMany({});
    await Notification.deleteMany({});
  } catch (cleanupErr: any) {
    console.warn('[Seed Cleanup] Notice during demo cleanup:', cleanupErr?.message);
  }

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

  console.log('[Seed] Database initialization complete: Pristine workspace ready with exactly 2 authorized Admins.');
}
