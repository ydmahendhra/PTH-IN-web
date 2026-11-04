import { Router, Request, Response } from 'express';
import { getReportingCalendar, getMonthWeeks } from '../services/calendarService';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/reporting/months - get dynamic calendar for the current/target year
router.get('/months', authenticate, (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const calendar = getReportingCalendar(year);
    return res.json({ success: true, year, calendar });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reporting/weeks/:year/:month - get calculated weekly periods for selected month
router.get('/weeks/:year/:month', authenticate, (req: Request, res: Response) => {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month); // 1 - 12

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Invalid year or month parameter (1-12).' });
    }

    const weeks = getMonthWeeks(year, month);
    return res.json({ success: true, year, month, weeksCount: weeks.length, weeks });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
