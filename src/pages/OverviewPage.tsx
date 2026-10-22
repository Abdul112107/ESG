import React, { useState, useEffect } from 'react';
import {
  Zap, CloudRain, Trash2, BarChart3, ArrowRight, Target, FileText,
  Trophy, Activity, Star, ShieldCheck, CheckCircle2, Sparkles,
  TrendingUp, MapPin, Building2, Flame, Award
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { api } from '../services/api';
import { DashboardOverview, TrendDataPoint } from '../types';
import { KPICard } from '../components/common/KPICard';
import { ChartCard } from '../components/common/ChartCard';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';
import { CHART_COLORS, GRID_PROPS, AXIS_TICK_STYLE, TOOLTIP_STYLE, SCOPE_COLORS } from '../utils/chartTheme';

interface OverviewPageProps {
  selectedYear: string;
  onNavigateTab: (tab: any) => void;
  onOpenReportGenerator: () => void;
}


export const OverviewPage: React.FC<OverviewPageProps> = ({
  selectedYear,
  onNavigateTab,
  onOpenReportGenerator
}) => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [emissionsBreakdown, setEmissionsBreakdown] = useState<{
    bySource: Array<{ name: string; value: number; scope: string }>;
    byScope: Array<{ name: string; value: number }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, trendsRes, emissionsRes] = await Promise.all([
        api.getDashboardOverview({ year: selectedYear }),
        api.getDashboardTrends({ year: selectedYear }),
        api.getEmissionsBySource({
          startDate: selectedYear ? `${selectedYear}-01-01` : undefined,
          endDate: selectedYear ? `${selectedYear}-12-31` : undefined
        })
      ]);

      if (overviewRes.success) setData(overviewRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (emissionsRes.success) setEmissionsBreakdown(emissionsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve overview metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedYear]);

  if (isLoading) {
    return <LoadingState message="Calculating enterprise ESG aggregations from database records..." />;
  }

  if (error || !data) {
    return <ErrorState message={error || 'No overview data available.'} onRetry={loadDashboard} />;
  }

  const { kpis, goals, recentActivity } = data;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ============================================================== */}
      {/* 1. DRIBBLE-INSPIRED "SPOTLIGHT HERO CARD" (Inspired by Image 1) */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl overflow-hidden glass-elevated border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        {/* Ambient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-950/20 to-pink-950/30 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[380px] h-[380px] bg-pink-600/12 rounded-full blur-3xl pointer-events-none" />
        {/* Top illuminated border line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center gap-6 justify-center">
            {/* Champion Card */}
            <div className="relative group shrink-0">
              <div className="w-32 h-44 sm:w-40 sm:h-52 rounded-2xl bg-gradient-to-tr from-orange-500 via-pink-600 to-purple-700 p-px shadow-2xl shadow-purple-900/60 transform group-hover:scale-105 transition-all duration-300">
                <div className="w-full h-full rounded-2xl bg-[#0f0822] flex flex-col items-center justify-between p-4 overflow-hidden relative">
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-purple-300">
                    <span>LEADER</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="relative my-auto flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/40 animate-pulse-glow">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-xs font-bold text-white mt-2 block tracking-tight">EcoVerde</span>
                    <span className="text-[10px] text-pink-300/80 font-mono">AAA Rated</span>
                  </div>
                  <div className="w-full py-1 rounded bg-white/10 text-center text-[10px] font-bold text-white uppercase tracking-wider">
                    Tier 1 Global
                  </div>
                </div>
              </div>
            </div>

            {/* ESG Score Ring — enhanced */}
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center shrink-0">
              {/* Spinning outer arc */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin-slow"
                style={{ borderTopColor: 'rgba(168,85,247,0.6)', borderRightColor: 'rgba(236,72,153,0.3)' }} />
              {/* Static rings */}
              <div className="absolute inset-2 rounded-full border border-purple-500/20" />
              <div className="absolute inset-5 rounded-full border border-dashed border-pink-500/20" />
              <div className="absolute inset-9 rounded-full border border-purple-400/15" />
              {/* Pulsing glow backdrop */}
              <div className="absolute inset-6 rounded-full animate-pulse-glow opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />

              {/* Central score */}
              <div className="text-center select-none z-10">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter block"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #f0abfc 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.6))',
                  }}>
                  {kpis.overallESGScore}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-purple-300/80 uppercase block -mt-1">
                  ESG Composite
                </span>
              </div>

              {/* Orbit labels — wired to live backend data */}
              <div className="absolute -top-1 px-2.5 py-0.5 rounded-full bg-black/40 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-md font-mono">
                Env: {kpis.environmentalScore}
              </div>
              <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-black/40 text-[10px] font-bold text-purple-300 border border-purple-500/30 backdrop-blur-md font-mono">
                Gov: {kpis.governanceScore}
              </div>
              <div className="absolute -left-4 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-bold text-sky-300 border border-sky-500/30 backdrop-blur-md font-mono">
                Soc: {kpis.socialScore}
              </div>
              <div className="absolute -right-4 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-bold text-amber-300 border border-amber-500/30 backdrop-blur-md font-mono">
                Waste: {kpis.wasteRecyclingRate}%
              </div>
            </div>
          </div>

          {/* Hero Right: Organization Header, Pill Cards & Specs */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300/80 uppercase tracking-widest">
                  Sample Data — EcoVerde Industrial Corp
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                EcoVerde Industrial Corp
              </h2>
              <p className="text-xs text-slate-300/80 mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-purple-400 inline" />
                <span>Advanced Manufacturing &amp; Clean Energy Solutions</span>
                <span>·</span>
                <span className="text-pink-300 font-medium">Liberty Deer Division</span>
              </p>
            </div>

            {/* 3 Floating Bouncy Stat Pill Cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Goals Card */}
              <div className="rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/30 bouncy-card flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-orange-100 uppercase tracking-wider">Targets</span>
                  <Trophy className="w-4 h-4 text-orange-200" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-none block">
                    {kpis.achievedGoalsCount + kpis.activeGoalsCount}
                  </span>
                  <span className="text-[10px] text-orange-100/80 mt-1 block font-medium">{kpis.achievedGoalsCount} Achieved</span>
                </div>
              </div>

              {/* Goals In Progress Card */}
              <div className="rounded-2xl p-3 sm:p-4 bg-white/10 border border-white/15 text-white backdrop-blur-md bouncy-card flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider">Active</span>
                  <Activity className="w-4 h-4 text-purple-300" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-none block text-purple-100">
                    {kpis.activeGoalsCount}
                  </span>
                  <span className="text-[10px] text-purple-200/80 mt-1 block font-medium">Goals In Progress</span>
                </div>
              </div>

              {/* ESG Score Card */}
              <div className="rounded-2xl p-3 sm:p-4 bg-[#1a1035] border border-purple-500/30 text-slate-900 shadow-2xl shadow-purple-500/20 bouncy-card flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ESG Score</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums leading-none block text-white">
                    {kpis.overallESGScore > 0 ? `${kpis.overallESGScore}` : '—'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1 block">/ 100 Composite</span>
                </div>
              </div>
            </div>

            {/* Quick Specs Grid (Height/Weight/Age equivalent) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Facilities</span>
                <span className="text-xs font-bold text-white font-mono">2 Active Plants</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Base Year</span>
                <span className="text-xs font-bold text-white font-mono">2024 Audit</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Currency</span>
                <span className="text-xs font-bold text-white font-mono">USD ($)</span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Country</span>
                <span className="text-xs font-bold text-white font-mono">USA / Global</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FOUR BIG BOUNCY ANIMATED KPI CARDS                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          label="Total Energy Consumption"
          value={kpis.totalEnergyKWh}
          unit="kWh"
          trend={{ value: '-6.4%', isPositive: true, label: 'efficiency' }}
          icon={Zap}
          accentColor="mint"
          badge={`$${kpis.totalEnergyCost.toLocaleString()}`}
          delay={0}
        />
        <KPICard
          label="Carbon Emissions"
          value={kpis.totalEmissionsTCO2e}
          unit="tCO2e"
          trend={{ value: '-8.1%', isPositive: true, label: 'abatement' }}
          icon={CloudRain}
          accentColor="cyan"
          badge="GHG Protocol"
          delay={100}
        />
        <KPICard
          label="Waste Diversion Rate"
          value={`${kpis.wasteRecyclingRate}%`}
          subtext={`${kpis.recycledWasteKg.toLocaleString()} kg recycled`}
          trend={{ value: '+4.2%', isPositive: true, label: 'diverted' }}
          icon={Trash2}
          accentColor="teal"
          badge="Zero-Waste"
          delay={200}
        />
        <KPICard
          label="Overall ESG Score"
          value={kpis.overallESGScore}
          unit="/ 100"
          trend={{ value: '+5.3 pts', isPositive: true, label: 'composite' }}
          icon={BarChart3}
          accentColor="violet"
          badge={`E:${kpis.environmentalScore} S:${kpis.socialScore} G:${kpis.governanceScore}`}
          delay={300}
        />
      </div>

      {/* ============================================================== */}
      {/* 3. CHARTS ROW: DUAL AXIS TRAJECTORY & EMISSIONS BY SCOPE       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Energy & Emissions Trajectory */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Monthly Energy & Carbon Trajectory"
            subtitle="Comparing normalized kilowatt-hours against metric tons CO2 equivalent"
            action={
              <button
                onClick={() => onNavigateTab('energy')}
                className="px-3 py-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all bouncy-button"
              >
                <span>View Energy Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
            footerNote="Verified operational data across Austin Tech Campus & Chicago Plant #2"
          >
            {trends.length === 0 ? (
              <p className="text-xs text-slate-400">No monthly records in selected period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <ComposedChart data={trends} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="month" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar yAxisId="left" dataKey="energyKWh" fill={CHART_COLORS.purple} radius={[6, 6, 0, 0]} name="Energy (kWh)" />
                  <Line yAxisId="right" type="monotone" dataKey="emissionsTCO2e" stroke={CHART_COLORS.mint} strokeWidth={3} dot={{ r: 4, fill: CHART_COLORS.mint }} activeDot={{ r: 6 }} name="Emissions (tCO2e)" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Carbon Emissions by Scope Donut */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Emissions by Scope"
            subtitle="Scope 1 Direct, Scope 2 Electricity, Scope 3 Travel"
            action={
              <button
                onClick={() => onNavigateTab('emissions')}
                className="text-xs font-semibold text-purple-300 hover:text-white"
              >
                Scope Data →
              </button>
            }
          >
            {!emissionsBreakdown?.byScope || emissionsBreakdown.byScope.length === 0 ? (
              <p className="text-xs text-slate-400">No emission breakdown data available.</p>
            ) : (
              <div className="w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={emissionsBreakdown.byScope}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {emissionsBreakdown.byScope.map((entry) => (
                        <Cell key={entry.name} fill={SCOPE_COLORS[entry.name] || CHART_COLORS.purple} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full space-y-2 pt-3 border-t border-white/[0.08] text-xs">
                  {emissionsBreakdown.byScope.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: SCOPE_COLORS[item.name] || '#8b5cf6' }}
                        />
                        <span className="text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono tabular-nums text-white font-bold">
                        {item.value} tCO2e
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. TARGETS MONITORING & "GAMES STATS" STYLE LOGS TABLE          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sustainability Goals (from FSD ProgressGoal) */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between bouncy-card border border-white/10 shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Active Sustainability Targets</h3>
                <p className="text-xs text-slate-400 mt-0.5">Calculated dynamically by direction formula</p>
              </div>
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-semibold text-pink-400 hover:text-pink-300 inline-flex items-center gap-1"
              >
                <span>All Targets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-xs text-slate-400">No active goals configured.</p>
              ) : (
                goals.map(goal => {
                  const p = (goal as any).progress;
                  const pct = p?.percentage ?? 0;
                  return (
                    <div key={goal._id || goal.id} className="space-y-2 py-2 border-b border-white/[0.05] last:border-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 truncate max-w-[210px]">{goal.title}</span>
                        <span className="font-mono tabular-nums font-extrabold text-white bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.08] rounded-full h-2.5 overflow-hidden p-[1px]">
                        <div
                          className={`h-full rounded-full transition-all animate-progress-sweep ${
                            pct >= 100
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                              : pct >= 60
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                              : 'bg-gradient-to-r from-orange-400 to-amber-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Current: {goal.currentValue} {goal.unit}</span>
                        <span>Target: {goal.targetValue} {goal.unit}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              {kpis.activeGoalsCount} In Progress · {kpis.achievedGoalsCount} Achieved
            </span>
            <button
              onClick={() => onNavigateTab('goals')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600/30 hover:bg-purple-600/50 rounded-xl border border-purple-500/30 transition-all bouncy-button"
            >
              Manage Commitments
            </button>
          </div>
        </div>

        {/* Floating "Games Stats" Style Activity Stream (Inspired by Image 1) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 flex flex-col justify-between bouncy-card border border-white/10 shadow-2xl">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">ESG Activity &amp; Record Stream</h3>
                <p className="text-xs text-slate-400 mt-0.5">Live database stream of recent energy, emissions and waste records</p>
              </div>
              <button
                onClick={onOpenReportGenerator}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full inline-flex items-center gap-1.5 transition-all bouncy-button shadow-lg shadow-purple-600/30 self-start sm:self-auto"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Official PDF</span>
              </button>
            </div>

            {/* Table Stream with Floating Glass Rows */}
            <div className="space-y-2.5">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No recent records available.</p>
              ) : (
                recentActivity.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-purple-500/30 flex items-center justify-between gap-4 transition-all duration-200 bouncy-card"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        {item.category === 'Energy' ? (
                          <Zap className="w-4 h-4 text-cyan-400" />
                        ) : item.category === 'Emissions' ? (
                          <CloudRain className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-orange-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{item.title}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="text-purple-300 font-medium">{item.category}</span>
                          <span>·</span>
                          <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-extrabold text-white block tabular-nums">
                          {item.value}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.createdBy}</span>
                      </div>
                      <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                        Logged
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MongoDB Real-Time Stream</span>
            </span>
            <span className="font-mono text-[11px] text-purple-300/80">ISO 14001 Audit Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
