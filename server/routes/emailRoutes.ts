import { Router, Request, Response } from 'express';
import { EmailLog } from '../models/EmailLog';
import { requireAdmin } from '../middleware/auth';
import { sendAssignmentEmail } from '../services/emailService';

const router = Router();

// GET /api/emails - get recent email logs (Admin only)
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await EmailLog.find().sort({ sentAt: -1 }).limit(100);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/emails/retry/:emailId - re-attempt delivery
router.post('/retry/:emailId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const log = await EmailLog.findOne({ emailId });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Email log not found.' });
    }

    const result = await sendAssignmentEmail({
      internName: log.recipientName,
      internId: log.internId,
      internEmail: log.recipientEmail,
      projectName: log.projectName,
      projectId: log.projectId,
      projectDescription: '',
      assignedDate: new Date(log.sentAt).toLocaleDateString(),
      deadline: 'Per project schedule',
      assignedBy: log.assignedBy,
    });

    log.deliveryAttempts += 1;
    log.status = result.status;
    if (result.error) log.errorDetails = result.error;
    await log.save();

    return res.json({ success: true, message: 'Email dispatch re-attempted.', log });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
