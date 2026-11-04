import { Router, Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications - get notifications for current user/role
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    const filter: any = {};
    if (role === 'admin') {
      filter.$or = [{ recipientRole: 'admin' }, { recipientId: userId }];
    } else {
      filter.recipientId = userId;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, count: notifications.length, notifications });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/unread - count unread
router.get('/unread', authenticate, async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    const filter: any = { isRead: false };
    if (role === 'admin') {
      filter.$or = [{ recipientRole: 'admin' }, { recipientId: userId }];
    } else {
      filter.recipientId = userId;
    }

    const unreadCount = await Notification.countDocuments(filter);
    return res.json({ success: true, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read - mark single as read
router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { $or: [{ notificationId: req.params.id }, { _id: req.params.id }] },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.json({ success: true, notification: notif });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/read-all - mark all read
router.put('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    const filter: any = { isRead: false };
    if (role === 'admin') {
      filter.$or = [{ recipientRole: 'admin' }, { recipientId: userId }];
    } else {
      filter.recipientId = userId;
    }

    await Notification.updateMany(filter, { $set: { isRead: true } });
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
