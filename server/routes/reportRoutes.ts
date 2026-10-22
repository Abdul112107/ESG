import { Router, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import { dal } from '../db/dal';
import { requireAuth, requireRole, AuthenticatedRequest } from '../services/authService';
import { pdfService } from '../services/pdfService';

const router = Router();

const GenerateReportSchema = z.object({
  reportType: z.enum([
    'Annual Sustainability Report',
    'Carbon Emissions Report',
    'Energy Consumption Report',
    'ESG Performance Report',
    'Waste Management Report'
  ]),
  reportingPeriod: z.string().min(2, 'Reporting period is required (e.g. 2025, 2026, 2026-Q1)'),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// GET /api/reports
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await dal.findReports(req.user!.organizationId);
    return res.json({
      success: true,
      data: reports
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reports/generate (Admin, Manager)
router.post('/generate', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = GenerateReportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const { reportType, reportingPeriod, startDate, endDate } = parseResult.data;

    const result = await pdfService.generateReport({
      organizationId: req.user!.organizationId,
      reportType,
      reportingPeriod,
      generatedBy: req.user!.email,
      startDate,
      endDate
    });

    return res.status(201).json({
      success: true,
      message: 'PDF report generated successfully',
      data: result
    });
  } catch (err: any) {
    console.error('Report generation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate report: ' + err.message });
  }
});

// GET /api/reports/:id/download
router.get('/:id/download', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await dal.findReportById(req.params.id, req.user!.organizationId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (!report.filePath || !fs.existsSync(report.filePath)) {
      // Re-generate if missing from temp folder
      const result = await pdfService.generateReport({
        organizationId: req.user!.organizationId,
        reportType: report.reportType,
        reportingPeriod: report.reportingPeriod,
        generatedBy: report.generatedBy
      });
      report.filePath = result.filePath;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);

    const fileStream = fs.createReadStream(report.filePath);
    fileStream.pipe(res);
  } catch (err: any) {
    console.error('Download error:', err);
    return res.status(500).json({ success: false, error: 'Download failed: ' + err.message });
  }
});

export default router;
