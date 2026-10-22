import { Router, Response } from 'express';
import { z } from 'zod';
import { dal } from '../db/dal';
import { requireAuth, requireRole, AuthenticatedRequest } from '../services/authService';

const router = Router();

const OrgUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  industry: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  reportingCurrency: z.string().min(1).optional(),
  reportingYear: z.number().int().min(2000).max(2100).optional()
});

// GET /api/organizations
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const org = await dal.findOrganizationById(req.user!.organizationId);
    return res.json({ success: true, data: org });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/organizations/:id
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.organizationId !== req.params.id && req.user!.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized to access this organization' });
    }
    const org = await dal.findOrganizationById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }
    return res.json({ success: true, data: org });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/organizations/:id (Admin only)
router.put('/:id', requireAuth, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.organizationId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify another organization' });
    }

    const parseResult = OrgUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const updated = await dal.updateOrganization(req.params.id, parseResult.data);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
