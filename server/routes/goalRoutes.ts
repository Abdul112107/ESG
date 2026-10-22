import { Router, Response } from 'express';
import { z } from 'zod';
import { dal } from '../db/dal';
import { requireAuth, requireRole, AuthenticatedRequest } from '../services/authService';
import { calculationService } from '../services/calculationService';

const router = Router();

const GoalSchema = z.object({
  title: z.string().min(3, 'Goal title is required'),
  description: z.string().min(5, 'Description is required'),
  metricType: z.enum(['Energy Reduction', 'Carbon Reduction', 'Recycling Rate', 'Renewable Share', 'Water Efficiency']),
  baselineValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string().min(1, 'Unit is required'),
  baselineDate: z.string().min(1, 'Baseline date is required'),
  targetDate: z.string().min(1, 'Target date is required'),
  status: z.enum(['In Progress', 'Achieved', 'At Risk', 'Archived']).default('In Progress')
});

// GET /api/goals
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goals = await dal.findGoals(req.user!.organizationId);

    // Augment goals with calculated progress metrics
    const augmentedGoals = goals.map(g => {
      const progress = calculationService.calculateGoalProgress(
        g.metricType,
        g.baselineValue,
        g.currentValue,
        g.targetValue
      );
      return {
        ...g,
        progressPercentage: progress.percentage,
        rawProgressPercentage: progress.rawPercentage,
        isExceeded: progress.isExceeded,
        isReduction: progress.isReduction,
        remainingToTarget: progress.remaining
      };
    });

    const activeGoals = augmentedGoals.filter(g => g.status === 'In Progress');
    const achievedGoals = augmentedGoals.filter(g => g.status === 'Achieved' || g.isExceeded);

    return res.json({
      success: true,
      data: augmentedGoals,
      summary: {
        total: goals.length,
        active: activeGoals.length,
        achieved: achievedGoals.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/goals (Admin, Manager)
router.post('/', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = GoalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const created = await dal.createGoal({
      ...parseResult.data,
      organizationId: req.user!.organizationId,
      createdBy: req.user!.email
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/goals/:id (Admin, Manager)
router.put('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = GoalSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || 'Validation error' });
    }

    const updated = await dal.updateGoal(req.params.id, req.user!.organizationId, parseResult.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Sustainability goal not found' });
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/goals/:id (Admin, Manager)
router.delete('/:id', requireAuth, requireRole(['Admin', 'Manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = await dal.deleteGoal(req.params.id, req.user!.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    return res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
