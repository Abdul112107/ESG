import { Router, Response } from 'express';
import { z } from 'zod';
import { dal } from '../db/dal';
import { requireAuth, requireRole, AuthenticatedRequest } from '../services/authService';
import { calculationService } from '../services/calculationService';

const router = Router();

const EnergyRecordSchema = z.object({
  facility: z.string().min(2, 'Facility name must be at least 2 characters'),
  energyType: z.enum(['Electricity', 'Natural Gas', 'Diesel', 'Solar', 'District Heating']),
  consumption: z.number().positive('Consumption must be a positive number'),
  unit: z.enum(['kWh', 'MWh', 'Therms', 'Gallons']).default('kWh'),
  cost: z.number().min(0, 'Cost must be non-negative'),
  recordDate: z.string().min(1, 'Record date is required'),
  notes: z.string().optional()
});

// GET /api/energy
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { energyType, facility, startDate, endDate } = req.query as Record<string, string>;
    const organizationId = req.user!.organizationId;

    const records = await dal.findEnergyRecords({
      organizationId,
      energyType: energyType || undefined,
      facility: facility || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    // Compute aggregated summary from filtered records
    const totalConsumptionKWh = records.reduce((sum, r) => sum + calculationService.toStandardKWh(r.consumption, r.unit), 0);
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

    // Group by energy type
    const byType: Record<string, number> = {};
    records.forEach(r => {
      byType[r.energyType] = (byType[r.energyType] || 0) + calculationService.toStandardKWh(r.consumption, r.unit);
    });

    return res.json({
      success: true,
      data: records,
      summary: {
        totalRecords: records.length,
        totalConsumptionKWh: Math.round(totalConsumptionKWh * 10) / 10,
        totalCost: Math.round(totalCost * 100) / 100,
        byType
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/energy/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await dal.findEnergyRecordById(req.params.id, req.user!.organizationId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Energy record not found' });
    }
    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/energy (Admin, Manager, Employee)
router.post('/', requireAuth, requireRole(['Admin', 'Manager', 'Employee']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = EnergyRecordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const newRecord = await dal.createEnergyRecord({
      ...parseResult.data,
      organizationId: req.user!.organizationId,
      createdBy: req.user!.email
    });

    return res.status(201).json({ success: true, data: newRecord });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/energy/:id (Admin, Manager)
router.put('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = EnergyRecordSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const updated = await dal.updateEnergyRecord(req.params.id, req.user!.organizationId, parseResult.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Energy record not found or unauthorized' });
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/energy/:id (Admin, Manager)
router.delete('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await dal.deleteEnergyRecord(req.params.id, req.user!.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Energy record not found' });
    }
    return res.json({ success: true, message: 'Record deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
