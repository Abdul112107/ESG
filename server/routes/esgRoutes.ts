import { Router, Response } from 'express';
import { z } from 'zod';
import { dal } from '../db/dal';
import { requireAuth, requireRole, AuthenticatedRequest } from '../services/authService';
import { calculationService } from '../services/calculationService';

const router = Router();

const ESGMetricSchema = z.object({
  reportingPeriod: z.string().min(2, 'Reporting period is required (e.g. 2026-Q1)'),
  environmentalScore: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  socialScore: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  governanceScore: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  methodologyVersion: z.string().default('EcoTrack ESG Framework v2026.1'),
  notes: z.string().optional()
});

// GET /api/esg
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user!.organizationId;
    const metrics = await dal.findESGMetrics(organizationId);

    const latest = metrics[0] || null;
    const history = [...metrics].reverse(); // chronological for charting

    return res.json({
      success: true,
      data: metrics,
      latest,
      history,
      methodology: {
        formula: 'Overall ESG Score = (Environmental Score + Social Score + Governance Score) / 3',
        description: 'Transparent 3-pillar composite scoring model normalized on a 0-100 index.',
        version: latest?.methodologyVersion || 'EcoTrack ESG Framework v2026.1'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/esg (Admin, Manager)
router.post('/', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = ESGMetricSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const { environmentalScore, socialScore, governanceScore } = parseResult.data;
    const overallScore = calculationService.calculateOverallESG(environmentalScore, socialScore, governanceScore);

    const created = await dal.createESGMetric({
      ...parseResult.data,
      overallScore,
      organizationId: req.user!.organizationId
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/esg/:id (Admin, Manager)
router.put('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = ESGMetricSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const updated = await dal.updateESGMetric(req.params.id, req.user!.organizationId, parseResult.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'ESG record not found' });
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
