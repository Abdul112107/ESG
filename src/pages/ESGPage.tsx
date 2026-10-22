import React, { useState, useEffect } from 'react';
import { Plus, Edit2, BarChart3, ShieldCheck, HeartHandshake, Trees, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { ESGMetric } from '../types';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/common/KPICard';
import { ChartCard } from '../components/common/ChartCard';
import { FormDialog } from '../components/common/FormDialog';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';
import { CHART_COLORS, GRID_PROPS, AXIS_TICK_STYLE, TOOLTIP_STYLE } from '../utils/chartTheme';

export const ESGPage: React.FC = () => {
  const { canEdit, isAuditor } = useAuth();
  const [metrics, setMetrics] = useState<ESGMetric[]>([]);
  const [latest, setLatest] = useState<ESGMetric | null>(null);
  const [history, setHistory] = useState<ESGMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ESGMetric | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [reportingPeriod, setReportingPeriod] = useState('2026-Q2');
  const [environmentalScore, setEnvironmentalScore] = useState<number>(85);
  const [socialScore, setSocialScore] = useState<number>(80);
  const [governanceScore, setGovernanceScore] = useState<number>(90);
  const [notes, setNotes] = useState<string>('Evaluated using ISO 14001, GRI Standards and EcoTrack corporate scoring methodology');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getESGMetrics();
      if (res.success) {
        setMetrics(res.data);
        setLatest(res.latest);
        setHistory(res.history);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ESG metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setReportingPeriod('2026-Q2');
    setEnvironmentalScore(86);
    setSocialScore(82);
    setGovernanceScore(91);
    setNotes('Quarterly ESG evaluation update');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: ESGMetric) => {
    setEditingRecord(m);
    setReportingPeriod(m.reportingPeriod);
    setEnvironmentalScore(m.environmentalScore);
    setSocialScore(m.socialScore);
    setGovernanceScore(m.governanceScore);
    setNotes(m.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (environmentalScore < 0 || environmentalScore > 100 || socialScore < 0 || socialScore > 100 || governanceScore < 0 || governanceScore > 100) {
      setFormError('All category scores must be between 0 and 100.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingRecord) {
        await api.updateESGMetric(editingRecord._id || editingRecord.id!, {
          reportingPeriod,
          environmentalScore,
          socialScore,
          governanceScore,
          notes
        });
      } else {
        await api.createESGMetric({
          reportingPeriod,
          environmentalScore,
          socialScore,
          governanceScore,
          notes
        });
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save ESG metric.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewOverall = Math.round(((environmentalScore + socialScore + governanceScore) / 3) * 10) / 10;

  if (isLoading) {
    return <LoadingState message="Loading ESG performance indicators..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          label="Overall ESG Score"
          value={latest?.overallScore ?? 84.3}
          unit="/ 100"
          icon={BarChart3}
          accentColor="magenta"
          trend={{ value: '+5.3 pts', isPositive: true, label: 'composite index' }}
          badge="Formula: (E+S+G) / 3"
        />
        <KPICard
          label="Environmental Pillar"
          value={latest?.environmentalScore ?? 85}
          unit="/ 100"
          icon={Trees}
          accentColor="mint"
          subtext="Energy, GHG, waste circularity"
        />
        <KPICard
          label="Social Pillar"
          value={latest?.socialScore ?? 80}
          unit="/ 100"
          icon={HeartHandshake}
          accentColor="cyan"
          subtext="Ergonomics, DEI, training"
        />
        <KPICard
          label="Governance Pillar"
          value={latest?.governanceScore ?? 88}
          unit="/ 100"
          icon={ShieldCheck}
          accentColor="violet"
          subtext="Ethics, board oversight, risk"
        />
      </div>

      {/* Historical Trend Chart */}
      <ChartCard
        title="Historical ESG Pillar Index Trajectory"
        subtitle="Tracking quarterly performance progress across all three ESG pillars"
        action={
          canEdit ? (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 bouncy-button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Quarter Assessment</span>
            </button>
          ) : undefined
        }
        footerNote="Normalized on a 0-100 scale using verifiable operational and governance data"
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="reportingPeriod" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="environmentalScore" fill={CHART_COLORS.mint} name="Environmental (E)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="socialScore" fill={CHART_COLORS.cyan} name="Social (S)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="governanceScore" fill={CHART_COLORS.purple} name="Governance (G)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Evaluation Methodology & Criteria Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-5 space-y-3 bouncy-card border border-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <Trees className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Environmental Criteria</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Measures resource conservation, clean energy adoption, GHG emission intensity per unit output, and hazardous waste diversion.
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-1 list-none">
            <li className="flex items-center justify-between border-b border-white/[0.04] pb-1">
              <span className="text-slate-400">Energy Efficiency Index:</span>
              <span className="font-bold text-emerald-400 font-mono">88 / 100</span>
            </li>
            <li className="flex items-center justify-between border-b border-white/[0.04] pb-1">
              <span className="text-slate-400">Carbon Abatement:</span>
              <span className="font-bold text-emerald-400 font-mono">84 / 100</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-400">Waste Circularity:</span>
              <span className="font-bold text-emerald-400 font-mono">89 / 100</span>
            </li>
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-3 bouncy-card border border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Social Criteria</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluates occupational health and safety (OSHA compliant), workforce retention, continuous professional development, and community impact.
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-1 list-none">
            <li className="flex items-center justify-between border-b border-white/[0.04] pb-1">
              <span className="text-slate-400">Health & Safety Compliance:</span>
              <span className="font-bold text-cyan-400 font-mono">82 / 100</span>
            </li>
            <li className="flex items-center justify-between border-b border-white/[0.04] pb-1">
              <span className="text-slate-400">Training & Upskilling:</span>
              <span className="font-bold text-cyan-400 font-mono">78 / 100</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-400">Employee Retention Rate:</span>
              <span className="font-bold text-cyan-400 font-mono">80 / 100</span>
            </li>
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-3 bouncy-card border border-purple-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Governance Criteria</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Validates anti-corruption policies, whistleblower protection, board independence, supply chain transparency, and audit readiness.
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-1 list-none">
            <li className="flex items-center justify-between border-b border-white/[0.04] pb-1">
              <span className="text-slate-400">Compliance & Ethics:</span>
              <span className="font-bold text-purple-400 font-mono">92 / 100</span>
            </li>
            <li className="flex items-center justify-between border-b border-white/[0.04] pb-1">
              <span className="text-slate-400">Risk Management Matrix:</span>
              <span className="font-bold text-purple-400 font-mono">86 / 100</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-400">Third-party Audit Score:</span>
              <span className="font-bold text-purple-400 font-mono">90 / 100</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Historical Audit Table */}
      <div className="glass-card rounded-2xl p-5 border border-white/10 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-3">Audit Logs & Verification History</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-semibold text-purple-200 uppercase tracking-wider">
                <th className="py-3 px-4">Reporting Period</th>
                <th className="py-3 px-4 text-right">Environmental</th>
                <th className="py-3 px-4 text-right">Social</th>
                <th className="py-3 px-4 text-right">Governance</th>
                <th className="py-3 px-4 text-right">Overall Index</th>
                <th className="py-3 px-4">Methodology / Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {metrics.map(m => (
                <tr key={m._id || m.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{m.reportingPeriod}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-400 font-bold">{m.environmentalScore}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-cyan-400 font-bold">{m.socialScore}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-purple-300 font-bold">{m.governanceScore}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-black text-pink-400 text-sm">{m.overallScore}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{m.notes || m.methodologyVersion}</td>
                  <td className="py-3 px-4 text-right">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-white/10 transition-colors bouncy-button"
                        title="Edit score"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog */}
      <FormDialog
        isOpen={isFormOpen}
        title={editingRecord ? 'Edit ESG Period Assessment' : 'Log New ESG Evaluation'}
        subtitle="Documented formula: Overall Score = (E + S + G) / 3 on 0-100 scale"
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        error={formError}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reporting Period</label>
            <input
              type="text"
              required
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
              placeholder="e.g. 2026-Q2 or 2026-FullYear"
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Environmental Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={environmentalScore}
              onChange={(e) => setEnvironmentalScore(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Social Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={socialScore}
              onChange={(e) => setSocialScore(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Governance Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={governanceScore}
              onChange={(e) => setGovernanceScore(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Evaluation Methodology & Audit Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
          />
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/30 border border-purple-500/30 text-xs text-white flex items-center justify-between shadow-lg">
          <div>
            <span className="font-bold text-purple-200 block">Overall Composite ESG Score:</span>
            <span className="text-[11px] text-purple-300/80 font-mono">({environmentalScore} + {socialScore} + {governanceScore}) / 3</span>
          </div>
          <span className="text-xl font-black font-mono text-pink-400">{previewOverall} <span className="text-xs font-medium text-purple-200">/ 100</span></span>
        </div>
      </FormDialog>
    </div>
  );
};
