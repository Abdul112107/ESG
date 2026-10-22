import { Router, Response } from 'express';
import { dal } from '../db/dal';
import { requireAuth, AuthenticatedRequest } from '../services/authService';
import { calculationService } from '../services/calculationService';

const router = Router();

// GET /api/dashboard/overview
router.get('/overview', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, year } = req.query as Record<string, string>;
    const organizationId = req.user!.organizationId;

    let computedStartDate = startDate;
    let computedEndDate = endDate;

    if (year && !startDate && !endDate) {
      computedStartDate = `${year}-01-01`;
      computedEndDate = `${year}-12-31T23:59:59`;
    }

    const [energyRecords, emissionRecords, wasteRecords, esgMetrics, rawGoals] = await Promise.all([
      dal.findEnergyRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findEmissionRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findWasteRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findESGMetrics(organizationId),
      dal.findGoals(organizationId)
    ]);

    // 1. Total Energy (kWh)
    const totalEnergyKWh = energyRecords.reduce((sum, r) => sum + calculationService.toStandardKWh(r.consumption, r.unit), 0);
    const totalEnergyCost = energyRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

    // 2. Total Carbon Emissions (tCO2e)
    const totalEmissionsKg = emissionRecords.reduce((sum, r) => sum + (r.emissionsKgCO2e || 0), 0);
    const totalEmissionsTCO2e = Math.round((totalEmissionsKg / 1000) * 100) / 100;

    // 3. Waste Recycling Rate (%)
    const totalWasteKg = wasteRecords.reduce((s, r) => s + (r.totalWasteKg || 0), 0);
    const recycledWasteKg = wasteRecords.reduce((s, r) => s + (r.recycledWasteKg || 0), 0);
    const recyclingRate = calculationService.calculateRecyclingRate(recycledWasteKg, totalWasteKg);

    // 4. Overall ESG Score — uses latest stored metric; returns 0-values if none exist so UI shows "no data"
    const latestESG = esgMetrics[0] || {
      environmentalScore: 0,
      socialScore: 0,
      governanceScore: 0,
      overallScore: 0
    };

    // 5. Goals summary
    const goalsWithProgress = rawGoals.map(g => ({
      ...g,
      progress: calculationService.calculateGoalProgress(g.metricType, g.baselineValue, g.currentValue, g.targetValue)
    }));

    // 6. Recent activity stream (combining recent records across categories)
    const recentActivity = [
      ...energyRecords.slice(0, 5).map(r => ({
        id: r._id || r.id,
        category: 'Energy',
        title: `${r.energyType} at ${r.facility}`,
        value: `${r.consumption.toLocaleString()} ${r.unit}`,
        date: r.recordDate,
        createdBy: r.createdBy
      })),
      ...emissionRecords.slice(0, 5).map(r => ({
        id: r._id || r.id,
        category: 'Emissions',
        title: `${r.source} (${r.scope})`,
        value: `${(r.emissionsKgCO2e / 1000).toFixed(2)} tCO2e`,
        date: r.recordDate,
        createdBy: r.createdBy
      })),
      ...wasteRecords.slice(0, 5).map(r => ({
        id: r._id || r.id,
        category: 'Waste',
        title: `${r.wasteType} at ${r.facility}`,
        value: `${r.recycledWasteKg.toLocaleString()} / ${r.totalWasteKg.toLocaleString()} kg recycled`,
        date: r.recordDate,
        createdBy: r.createdBy
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    return res.json({
      success: true,
      data: {
        kpis: {
          totalEnergyKWh: Math.round(totalEnergyKWh),
          totalEnergyCost: Math.round(totalEnergyCost),
          totalEmissionsTCO2e,
          wasteRecyclingRate: recyclingRate,
          totalWasteKg: Math.round(totalWasteKg),
          recycledWasteKg: Math.round(recycledWasteKg),
          overallESGScore: latestESG.overallScore,
          environmentalScore: latestESG.environmentalScore,
          socialScore: latestESG.socialScore,
          governanceScore: latestESG.governanceScore,
          activeGoalsCount: rawGoals.filter(g => g.status === 'In Progress').length,
          achievedGoalsCount: rawGoals.filter(g => g.status === 'Achieved').length
        },
        goals: goalsWithProgress.slice(0, 4),
        recentActivity
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dashboard/trends
router.get('/trends', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, year } = req.query as Record<string, string>;
    const organizationId = req.user!.organizationId;

    let computedStartDate = startDate;
    let computedEndDate = endDate;

    if (year && !startDate && !endDate) {
      computedStartDate = `${year}-01-01`;
      computedEndDate = `${year}-12-31T23:59:59`;
    }

    const [energyRecords, emissionRecords] = await Promise.all([
      dal.findEnergyRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findEmissionRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate })
    ]);

    // Aggregate monthly data
    const monthMap: Record<string, { month: string; energyKWh: number; emissionsTCO2e: number; cost: number; rawDate: Date }> = {};

    energyRecords.forEach(r => {
      const d = new Date(r.recordDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) {
        monthMap[key] = { month: monthLabel, energyKWh: 0, emissionsTCO2e: 0, cost: 0, rawDate: d };
      }
      monthMap[key].energyKWh += calculationService.toStandardKWh(r.consumption, r.unit);
      monthMap[key].cost += r.cost || 0;
    });

    emissionRecords.forEach(r => {
      const d = new Date(r.recordDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) {
        monthMap[key] = { month: monthLabel, energyKWh: 0, emissionsTCO2e: 0, cost: 0, rawDate: d };
      }
      monthMap[key].emissionsTCO2e += (r.emissionsKgCO2e || 0) / 1000;
    });

    const series = Object.keys(monthMap).sort().map(k => ({
      month: monthMap[k].month,
      key: k,
      energyKWh: Math.round(monthMap[k].energyKWh),
      emissionsTCO2e: Math.round(monthMap[k].emissionsTCO2e * 100) / 100,
      cost: Math.round(monthMap[k].cost)
    }));

    return res.json({
      success: true,
      data: series
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dashboard/emissions-by-source
router.get('/emissions-by-source', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const organizationId = req.user!.organizationId;

    const records = await dal.findEmissionRecords({ organizationId, startDate, endDate });

    // Group by source
    const sourceMap: Record<string, { name: string; value: number; scope: string }> = {};
    const scopeMap: Record<string, number> = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };

    records.forEach(r => {
      const tCO2e = (r.emissionsKgCO2e || 0) / 1000;
      if (!sourceMap[r.source]) {
        sourceMap[r.source] = { name: r.source, value: 0, scope: r.scope };
      }
      sourceMap[r.source].value += tCO2e;
      scopeMap[r.scope] = (scopeMap[r.scope] || 0) + tCO2e;
    });

    const bySource = Object.values(sourceMap).map(s => ({
      name: s.name,
      value: Math.round(s.value * 100) / 100,
      scope: s.scope
    })).sort((a, b) => b.value - a.value);

    const byScope = Object.entries(scopeMap).map(([scope, val]) => ({
      name: scope,
      value: Math.round(val * 100) / 100
    }));

    return res.json({
      success: true,
      data: {
        bySource,
        byScope
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
