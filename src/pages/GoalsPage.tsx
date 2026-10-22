import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../services/api';
import { SustainabilityGoal } from '../types';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/common/KPICard';
import { FormDialog } from '../components/common/FormDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

export const GoalsPage: React.FC = () => {
  const { canEdit } = useAuth();
  const [goals, setGoals] = useState<SustainabilityGoal[]>([]);
  const [summary, setSummary] = useState<{ total: number; active: number; achieved: number }>({
    total: 0,
    active: 0,
    achieved: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SustainabilityGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SustainabilityGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metricType, setMetricType] = useState<SustainabilityGoal['metricType']>('Energy Reduction');
  const [baselineValue, setBaselineValue] = useState<number>(50000);
  const [currentValue, setCurrentValue] = useState<number>(42000);
  const [targetValue, setTargetValue] = useState<number>(35000);
  const [unit, setUnit] = useState('kWh/mo');
  const [baselineDate, setBaselineDate] = useState('2024-01-01');
  const [targetDate, setTargetDate] = useState('2028-12-31');
  const [status, setStatus] = useState<SustainabilityGoal['status']>('In Progress');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getGoals();
      if (res.success) {
        setGoals(res.data);
        setSummary(res.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sustainability goals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setTitle('Water Stewardship & Effluent Reduction');
    setDescription('Reduce fresh industrial water intake across Chicago plant cooling towers by 25%.');
    setMetricType('Water Efficiency');
    setBaselineValue(12000);
    setCurrentValue(10500);
    setTargetValue(9000);
    setUnit('m3/mo');
    setBaselineDate('2024-01-01');
    setTargetDate('2027-12-31');
    setStatus('In Progress');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (g: SustainabilityGoal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description);
    setMetricType(g.metricType);
    setBaselineValue(g.baselineValue);
    setCurrentValue(g.currentValue);
    setTargetValue(g.targetValue);
    setUnit(g.unit);
    setBaselineDate(new Date(g.baselineDate).toISOString().split('T')[0]);
    setTargetDate(new Date(g.targetDate).toISOString().split('T')[0]);
    setStatus(g.status);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    if (baselineValue === targetValue) {
      setFormError('Baseline value and target value cannot be identical.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal._id || editingGoal.id!, {
          title,
          description,
          metricType,
          baselineValue,
          currentValue,
          targetValue,
          unit,
          baselineDate,
          targetDate,
          status
        });
      } else {
        await api.createGoal({
          title,
          description,
          metricType,
          baselineValue,
          currentValue,
          targetValue,
          unit,
          baselineDate,
          targetDate,
          status
        });
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await api.deleteGoal(deleteTarget._id || deleteTarget.id!);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Active Strategic Goals"
          value={summary.active}
          unit="targets"
          icon={Target}
          accentColor="violet"
          subtext="Under active corporate monitoring"
        />
        <KPICard
          label="Achieved Milestones"
          value={summary.achieved}
          unit="milestones"
          icon={CheckCircle2}
          accentColor="mint"
          subtext="Exceeded or completed targets"
        />
        <KPICard
          label="Total Defined Portfolio"
          value={summary.total}
          unit="strategic goals"
          icon={TrendingUp}
          accentColor="cyan"
          subtext="Stored in MongoDB SustainabilityGoals"
        />
      </div>

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Corporate Sustainability Commitments</h3>
          <p className="text-xs text-purple-300/80">Progress evaluated dynamically based on goal direction and verified logs</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 bouncy-button"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sustainability Target</span>
          </button>
        )}
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <LoadingState message="Calculating sustainability progress metrics..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : goals.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
          <p className="text-base font-bold text-white">No goals defined yet</p>
          <p className="text-xs text-slate-400 mt-1">Get started by defining your organization's first environmental target.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(g => {
            const isReduction = g.isReduction ?? (g.baselineValue > g.targetValue);
            const pct = g.progressPercentage ?? 0;
            const isExceeded = g.isExceeded || pct >= 100;

            return (
              <div
                key={g._id || g.id}
                className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-5 bouncy-card border border-white/10 hover:border-purple-500/40 hover:shadow-[0_15px_35px_rgba(168,85,247,0.15)] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30">
                          {isReduction ? <TrendingDown className="w-3.5 h-3.5 text-cyan-400" /> : <TrendingUp className="w-3.5 h-3.5 text-pink-400" />}
                          {g.metricType}
                        </span>
                        <span className="text-white/30">·</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-500/30">
                          {g.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white tracking-tight">{g.title}</h4>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-white/10 transition-colors bouncy-button"
                          title="Edit Goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(g)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors bouncy-button"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{g.description}</p>
                </div>

                {/* Progress Visualizer (FSD Enhanced) */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-purple-300/80 font-medium">Trajectory Progress</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      {isExceeded && (
                        <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">Target Met!</span>
                      )}
                      <span className="text-lg font-black text-pink-400">{pct}%</span>
                    </div>
                  </div>

                  {/* FSD Animated Gradient Progress Bar */}
                  <div className="w-full bg-white/[0.08] rounded-full h-3 overflow-hidden p-0.5 border border-white/10 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out shadow-lg ${
                        isExceeded
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/40'
                          : pct >= 60
                          ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 shadow-pink-500/40'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/40'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                    />
                  </div>

                  {/* Baseline / Current / Target Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1 text-center font-mono">
                    <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Baseline</span>
                      <span className="text-xs font-bold text-slate-300 tabular-nums">
                        {g.baselineValue} <span className="text-[10px] text-slate-400 font-normal">{g.unit}</span>
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/25">
                      <span className="text-[10px] text-purple-300 block uppercase font-medium">Current</span>
                      <span className="text-xs font-black text-cyan-300 tabular-nums">
                        {g.currentValue} <span className="text-[10px] text-cyan-400/80 font-normal">{g.unit}</span>
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                      <span className="text-[10px] text-emerald-300 block uppercase font-medium">Target</span>
                      <span className="text-xs font-black text-emerald-400 tabular-nums">
                        {g.targetValue} <span className="text-[10px] text-emerald-400/80 font-normal">{g.unit}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-300/60 pt-1 font-mono">
                    <span>Baseline: {new Date(g.baselineDate).toLocaleDateString()}</span>
                    <span>Deadline: {new Date(g.targetDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <FormDialog
        isOpen={isFormOpen}
        title={editingGoal ? 'Edit Sustainability Commitment' : 'Create New Target'}
        subtitle="Progress is dynamically calculated using direction formulas"
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        error={formError}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Commitment Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Metric Type</label>
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              >
                <option value="Energy Reduction" className="bg-[#181232] text-white">Energy Reduction</option>
                <option value="Carbon Reduction" className="bg-[#181232] text-white">Carbon Reduction</option>
                <option value="Recycling Rate" className="bg-[#181232] text-white">Recycling Rate</option>
                <option value="Renewable Share" className="bg-[#181232] text-white">Renewable Share</option>
                <option value="Water Efficiency" className="bg-[#181232] text-white">Water Efficiency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              >
                <option value="In Progress" className="bg-[#181232] text-white">In Progress</option>
                <option value="Achieved" className="bg-[#181232] text-white">Achieved</option>
                <option value="At Risk" className="bg-[#181232] text-white">At Risk</option>
                <option value="Archived" className="bg-[#181232] text-white">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Baseline Value</label>
              <input
                type="number"
                step="any"
                required
                value={baselineValue}
                onChange={(e) => setBaselineValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Logged Value</label>
              <input
                type="number"
                step="any"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Value</label>
              <input
                type="number"
                step="any"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measurement</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. kWh/mo, tCO2e, %"
                className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Baseline Date</label>
              <input
                type="date"
                required
                value={baselineDate}
                onChange={(e) => setBaselineDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Deadline</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
              />
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Sustainability Goal"
        message={`Are you sure you want to delete the goal "${deleteTarget?.title}"?`}
        confirmLabel="Delete Target"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
