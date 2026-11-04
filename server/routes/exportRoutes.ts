import { Router, Request, Response } from 'express';
import {
  generateInternsExcel,
  generateProjectsExcel,
  generateAssignmentsExcel,
  generateWeeklyReportsExcel,
  generateMonthlyReportsExcel,
} from '../services/excelService';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Helper to send Excel buffer with proper MIME and attachment headers
function sendExcelResponse(res: Response, buffer: Buffer, filename: string) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  return res.send(buffer);
}

// GET /api/export/interns
router.get('/interns', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const buffer = await generateInternsExcel();
    return sendExcelResponse(res, buffer, `Phoenix_Tech_Interns_Directory_${Date.now()}.xlsx`);
  } catch (err: any) {
    console.error('Export interns error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate interns Excel file.' });
  }
});

// GET /api/export/projects
router.get('/projects', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const buffer = await generateProjectsExcel();
    return sendExcelResponse(res, buffer, `Phoenix_Tech_Projects_Overview_${Date.now()}.xlsx`);
  } catch (err: any) {
    console.error('Export projects error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate projects Excel file.' });
  }
});

// GET /api/export/assignments
router.get('/assignments', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const buffer = await generateAssignmentsExcel();
    return sendExcelResponse(res, buffer, `Phoenix_Tech_Project_Assignments_${Date.now()}.xlsx`);
  } catch (err: any) {
    console.error('Export assignments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate assignments Excel file.' });
  }
});

// GET /api/export/weekly-reports
router.get('/weekly-reports', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const buffer = await generateWeeklyReportsExcel();
    return sendExcelResponse(res, buffer, `Phoenix_Tech_Weekly_Reports_${Date.now()}.xlsx`);
  } catch (err: any) {
    console.error('Export weekly reports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate weekly reports Excel file.' });
  }
});

// GET /api/export/reports (alias for weekly-reports)
router.get('/reports', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const buffer = await generateWeeklyReportsExcel();
    return sendExcelResponse(res, buffer, `Phoenix_Tech_Reports_${Date.now()}.xlsx`);
  } catch (err: any) {
    console.error('Export reports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate reports Excel file.' });
  }
});

// GET /api/export/monthly-reports
router.get('/monthly-reports', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const buffer = await generateMonthlyReportsExcel();
    return sendExcelResponse(res, buffer, `Phoenix_Tech_Monthly_Reports_Summary_${Date.now()}.xlsx`);
  } catch (err: any) {
    console.error('Export monthly reports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate monthly reports Excel file.' });
  }
});

export default router;
