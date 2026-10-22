import { Router, Response } from 'express';
import { z } from 'zod';
import { dal } from '../db/dal';
import { requireAuth, requireRole, AuthenticatedRequest } from '../services/authService';
import { calculationService, OFFICIAL_EMISSION_FACTORS } from '../services/calculationService';

const router = Router();

const EmissionRecordSchema = z.object({
  source: z.string().min(2, 'Source name is required'),
  scope: z.enum(['Scope 1', 'Scope 2', 'Scope 3']),
  activityValue: z.number().positive('Activity value must be greater than zero'),
  activityUnit: z.string().min(1, 'Activity unit is required'),
  emissionFactor: z.number().positive('Emission factor must be positive'),
  emissionFactorSource: z.string().min(1, 'Emission factor source is required'),
  emissionFactorVersion: z.string().default('v2024.1'),
  recordDate: z.string().min(1, 'Record date is required')
});

// GET /api/emissions/factors - returns documented emission factor library
router.get('/factors', requireAuth, (_req, res: Response) => {
  return res.json({
    success: true,
    data: OFFICIAL_EMISSION_FACTORS
  });
});

// GET /api/emissions
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scope, source, startDate, endDate } = req.query as Record<string, string>;
    const organizationId = req.user!.organizationId;

    const records = await dal.findEmissionRecords({
      organizationId,
      scope: scope || undefined,
      source: source || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    const totalEmissionsKg = records.reduce((sum, r) => sum + (r.emissionsKgCO2e || 0), 0);
    const totalEmissionsTCO2e = Math.round((totalEmissionsKg / 1000) * 1000) / 1000;

    // By scope breakdown
    const byScope = {
      'Scope 1': Math.round(records.filter(r => r.scope === 'Scope 1').reduce((s, r) => s + r.emissionsKgCO2e, 0) / 1000 * 100) / 100,
      'Scope 2': Math.round(records.filter(r => r.scope === 'Scope 2').reduce((s, r) => s + r.emissionsKgCO2e, 0) / 1000 * 100) / 100,
      'Scope 3': Math.round(records.filter(r => r.scope === 'Scope 3').reduce((s, r) => s + r.emissionsKgCO2e, 0) / 1000 * 100) / 100,
    };

    return res.json({
      success: true,
      data: records,
      summary: {
        totalRecords: records.length,
        totalEmissionsKg: Math.round(totalEmissionsKg * 10) / 10,
        totalEmissionsTCO2e,
        byScope
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/emissions/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await dal.findEmissionRecordById(req.params.id, req.user!.organizationId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Emission record not found' });
    }
    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/emissions (Admin, Manager, Employee)
router.post('/', requireAuth, requireRole(['Admin', 'Manager', 'Employee']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = EmissionRecordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const { activityValue, emissionFactor } = parseResult.data;
    // Strict backend calculation: Emissions (kgCO2e) = Activity Data × Emission Factor
    const { kgCO2e } = calculationService.calculateEmissions(activityValue, emissionFactor);

    const newRecord = await dal.createEmissionRecord({
      ...parseResult.data,
      emissionsKgCO2e: kgCO2e,
      organizationId: req.user!.organizationId,
      createdBy: req.user!.email
    });

    return res.status(201).json({ success: true, data: newRecord });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/emissions/:id (Admin, Manager)
router.put('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = EmissionRecordSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const existing = await dal.findEmissionRecordById(req.params.id, req.user!.organizationId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Emission record not found' });
    }

    const activityValue = parseResult.data.activityValue ?? existing.activityValue;
    const emissionFactor = parseResult.data.emissionFactor ?? existing.emissionFactor;
    const { kgCO2e } = calculationService.calculateEmissions(activityValue, emissionFactor);

    const updated = await dal.updateEmissionRecord(req.params.id, req.user!.organizationId, {
      ...parseResult.data,
      emissionsKgCO2e: kgCO2e
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/emissions/:id (Admin, Manager)
router.delete('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await dal.deleteEmissionRecord(req.params.id, req.user!.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Emission record not found' });
    }
    return res.json({ success: true, message: 'Record deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
