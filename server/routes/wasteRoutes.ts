import { Router, Response } from 'express';
import { z } from 'zod';
import { dal } from '../db/dal';
import { requireAuth, requireRole, AuthenticatedRequest } from '../services/authService';
import { calculationService } from '../services/calculationService';

const router = Router();

const WasteRecordSchema = z.object({
  wasteType: z.enum([
    'Paper & Cardboard',
    'Plastic',
    'Metals',
    'Electronic Waste',
    'Hazardous Chemical',
    'Organic / Compost',
    'General Residual'
  ]),
  totalWasteKg: z.number().positive('Total waste must be greater than zero'),
  recycledWasteKg: z.number().min(0, 'Recycled waste cannot be negative'),
  disposedWasteKg: z.number().min(0, 'Disposed waste cannot be negative'),
  recordDate: z.string().min(1, 'Record date is required'),
  facility: z.string().min(2, 'Facility is required')
}).refine(data => (data.recycledWasteKg + data.disposedWasteKg) <= (data.totalWasteKg + 0.01), {
  message: 'Recycled waste plus disposed waste cannot exceed total waste generated.',
  path: ['recycledWasteKg']
});

// GET /api/waste
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { wasteType, facility, startDate, endDate } = req.query as Record<string, string>;
    const organizationId = req.user!.organizationId;

    const records = await dal.findWasteRecords({
      organizationId,
      wasteType: wasteType || undefined,
      facility: facility || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    const totalWasteKg = records.reduce((s, r) => s + (r.totalWasteKg || 0), 0);
    const recycledWasteKg = records.reduce((s, r) => s + (r.recycledWasteKg || 0), 0);
    const disposedWasteKg = records.reduce((s, r) => s + (r.disposedWasteKg || 0), 0);
    const recyclingRate = calculationService.calculateRecyclingRate(recycledWasteKg, totalWasteKg);

    // Grouping by waste type
    const byType: Record<string, { total: number; recycled: number; disposed: number }> = {};
    records.forEach(r => {
      if (!byType[r.wasteType]) {
        byType[r.wasteType] = { total: 0, recycled: 0, disposed: 0 };
      }
      byType[r.wasteType].total += r.totalWasteKg;
      byType[r.wasteType].recycled += r.recycledWasteKg;
      byType[r.wasteType].disposed += r.disposedWasteKg;
    });

    return res.json({
      success: true,
      data: records,
      summary: {
        totalRecords: records.length,
        totalWasteKg: Math.round(totalWasteKg * 10) / 10,
        recycledWasteKg: Math.round(recycledWasteKg * 10) / 10,
        disposedWasteKg: Math.round(disposedWasteKg * 10) / 10,
        recyclingRate,
        byType
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/waste/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await dal.findWasteRecordById(req.params.id, req.user!.organizationId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Waste record not found' });
    }
    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/waste (Admin, Manager, Employee)
router.post('/', requireAuth, requireRole(['Admin', 'Manager', 'Employee']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = WasteRecordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const newRecord = await dal.createWasteRecord({
      ...parseResult.data,
      organizationId: req.user!.organizationId,
      createdBy: req.user!.email
    });

    return res.status(201).json({ success: true, data: newRecord });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/waste/:id (Admin, Manager)
router.put('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await dal.findWasteRecordById(req.params.id, req.user!.organizationId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Waste record not found' });
    }

    const merged = { ...existing, ...req.body };
    const parseResult = WasteRecordSchema.safeParse(merged);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const updated = await dal.updateWasteRecord(req.params.id, req.user!.organizationId, parseResult.data);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/waste/:id (Admin, Manager)
router.delete('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await dal.deleteWasteRecord(req.params.id, req.user!.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Waste record not found' });
    }
    return res.json({ success: true, message: 'Record deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
