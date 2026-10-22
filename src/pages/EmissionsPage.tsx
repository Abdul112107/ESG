import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CloudRain, Calculator, Info } from 'lucide-react';
import { api } from '../services/api';
import { EmissionRecord, EmissionFactor } from '../types';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/common/KPICard';
import { DataTable, Column } from '../components/common/DataTable';
import { FormDialog } from '../components/common/FormDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

interface EmissionsPageProps {
  selectedYear: string;
}

export const EmissionsPage: React.FC<EmissionsPageProps> = ({ selectedYear }) => {
  const { canEdit, isAuditor } = useAuth();
  const [records, setRecords] = useState<EmissionRecord[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [summary, setSummary] = useState<{
    totalRecords: number;
    totalEmissionsKg: number;
    totalEmissionsTCO2e: number;
    byScope: Record<string, number>;
  }>({ totalRecords: 0, totalEmissionsKg: 0, totalEmissionsTCO2e: 0, byScope: {} });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedScope, setSelectedScope] = useState<string>('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmissionRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmissionRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [source, setSource] = useState('Purchased Electricity (Grid)');
  const [scope, setScope] = useState<'Scope 1' | 'Scope 2' | 'Scope 3'>('Scope 2');
  const [activityValue, setActivityValue] = useState<number>(45000);
  const [activityUnit, setActivityUnit] = useState<string>('kWh');
  const [emissionFactor, setEmissionFactor] = useState<number>(0.386);
  const [factorSource, setFactorSource] = useState<string>('EPA eGRID 2024');
  const [factorVersion, setFactorVersion] = useState<string>('v2024.1');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recRes, factorRes] = await Promise.all([
        api.getEmissionRecords({
          scope: selectedScope || undefined,
          startDate: selectedYear ? `${selectedYear}-01-01` : undefined,
          endDate: selectedYear ? `${selectedYear}-12-31` : undefined
        }),
        api.getEmissionFactors()
      ]);

      if (recRes.success) {
        setRecords(recRes.data);
        setSummary(recRes.summary);
      }
      if (factorRes.success) {
        setFactors(factorRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load emission records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedScope]);

  // When user picks a preset factor, auto-fill unit, factor, source, and version
  const handleSelectFactorPreset = (factorId: string) => {
    const selected = factors.find(f => f.id === factorId);
    if (selected) {
      setSource(selected.sourceName);
      setScope(selected.scope);
      setActivityUnit(selected.unit);
      setEmissionFactor(selected.factor);
      setFactorSource(selected.sourceAuthority);
      setFactorVersion(selected.version);
    }
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    if (factors.length > 0) {
      handleSelectFactorPreset(factors[0].id);
    } else {
      setSource('Purchased Electricity (Grid)');
      setScope('Scope 2');
      setActivityUnit('kWh');
      setEmissionFactor(0.386);
      setFactorSource('EPA eGRID 2024');
      setFactorVersion('v2024.1');
    }
    setActivityValue(45000);
    setRecordDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rec: EmissionRecord) => {
    setEditingRecord(rec);
    setSource(rec.source);
    setScope(rec.scope);
    setActivityValue(rec.activityValue);
    setActivityUnit(rec.activityUnit);
    setEmissionFactor(rec.emissionFactor);
    setFactorSource(rec.emissionFactorSource);
    setFactorVersion(rec.emissionFactorVersion);
    setRecordDate(new Date(rec.recordDate).toISOString().split('T')[0]);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activityValue <= 0) {
      setFormError('Activity data must be greater than zero.');
      return;
    }
    if (emissionFactor <= 0) {
      setFormError('Emission factor must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingRecord) {
        await api.updateEmissionRecord(editingRecord._id || editingRecord.id!, {
          source,
          scope,
          activityValue,
          activityUnit,
          emissionFactor,
          emissionFactorSource: factorSource,
          emissionFactorVersion: factorVersion,
          recordDate
        });
      } else {
        await api.createEmissionRecord({
          source,
          scope,
          activityValue,
          activityUnit,
          emissionFactor,
          emissionFactorSource: factorSource,
          emissionFactorVersion: factorVersion,
          recordDate
        });
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await api.deleteEmissionRecord(deleteTarget._id || deleteTarget.id!);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real-time formula preview
  const previewKgCO2e = Math.round(activityValue * emissionFactor * 100) / 100;
  const previewTCO2e = Math.round((previewKgCO2e / 1000) * 1000) / 1000;

  const columns: Column<EmissionRecord>[] = [
    {
      header: 'Source / Activity',
      accessorKey: 'source',
      sortable: true,
      cell: (r) => (
        <div>
          <span className="font-semibold text-white block">{r.source}</span>
          <span className="text-[11px] text-cyan-300/80 block font-mono">
            {r.activityValue.toLocaleString()} {r.activityUnit} × {r.emissionFactor} kgCO2e
          </span>
        </div>
      )
    },
    {
      header: 'Scope',
      accessorKey: 'scope',
      sortable: true,
      cell: (r) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            r.scope === 'Scope 1'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : r.scope === 'Scope 2'
              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}
        >
          {r.scope}
        </span>
      )
    },
    {
      header: 'Emissions (tCO2e)',
      accessorKey: 'emissionsKgCO2e',
      align: 'right',
      sortable: true,
      cell: (r) => (
        <span className="font-bold text-pink-300 font-mono tabular-nums text-sm">
          {(r.emissionsKgCO2e / 1000).toFixed(2)}{' '}
          <span className="text-slate-400 font-normal text-xs">tCO2e</span>
        </span>
      )
    },
    {
      header: 'Emission Factor Source',
      accessorKey: 'emissionFactorSource',
      cell: (r) => (
        <span className="text-slate-400 text-[11px]">
          {r.emissionFactorSource} ({r.emissionFactorVersion})
        </span>
      )
    },
    {
      header: 'Record Date',
      accessorKey: 'recordDate',
      align: 'center',
      sortable: true,
      cell: (r) => (
        <span className="text-slate-300 text-xs">
          {new Date(r.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <button
              onClick={() => handleOpenEdit(r)}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 rounded-lg transition-colors bouncy-button"
              title="Edit record"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setDeleteTarget(r)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors bouncy-button"
              title="Delete record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isAuditor && <span className="text-[11px] text-purple-300/60 font-medium">Audited</span>}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          label="Total Carbon Footprint"
          value={summary.totalEmissionsTCO2e}
          unit="tCO2e"
          icon={CloudRain}
          accentColor="cyan"
          trend={{ value: '-12.3%', isPositive: true, label: 'abatement progress' }}
          subtext="Comprehensive GHG inventory"
        />
        <KPICard
          label="Scope 1 Direct"
          value={summary.byScope['Scope 1'] || 0}
          unit="tCO2e"
          accentColor="mint"
          trend={{ value: '-4.1%', isPositive: true, label: 'fleet efficiency' }}
          subtext="Stationary & fleet fuel"
        />
        <KPICard
          label="Scope 2 Indirect"
          value={summary.byScope['Scope 2'] || 0}
          unit="tCO2e"
          accentColor="violet"
          trend={{ value: '-14.8%', isPositive: true, label: 'clean grid power' }}
          subtext="Purchased grid power"
        />
        <KPICard
          label="Scope 3 Value Chain"
          value={summary.byScope['Scope 3'] || 0}
          unit="tCO2e"
          accentColor="amber"
          trend={{ value: '-2.0%', isPositive: true, label: 'supply chain' }}
          subtext="Business flights & supply"
        />
      </div>

      {/* Main Records Table */}
      {isLoading ? (
        <LoadingState message="Calculating greenhouse gas emission records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          data={records}
          columns={columns}
          searchPlaceholder="Search emissions source or factor..."
          primaryAction={
            canEdit ? (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:to-rose-400 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 bouncy-button"
              >
                <Plus className="w-4 h-4" />
                <span>Calculate & Log Emission</span>
              </button>
            ) : undefined
          }
          secondaryFilter={
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer transition-all"
            >
              <option value="" className="bg-[#181232] text-white">All Scopes</option>
              <option value="Scope 1" className="bg-[#181232] text-white">Scope 1 (Direct)</option>
              <option value="Scope 2" className="bg-[#181232] text-white">Scope 2 (Electricity)</option>
              <option value="Scope 3" className="bg-[#181232] text-white">Scope 3 (Value Chain)</option>
            </select>
          }
        />
      )}

      {/* Form Dialog */}
      <FormDialog
        isOpen={isFormOpen}
        title={editingRecord ? 'Edit Emission Record' : 'Calculate & Log Carbon Emission'}
        subtitle="Backend formula computes emissions: Activity × Emission Factor (kgCO2e)"
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        error={formError}
      >
        {/* Presets Selector */}
        {!editingRecord && factors.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 shadow-inner">
            <label className="block text-xs font-semibold text-purple-300">
              Select Official Emission Factor Preset:
            </label>
            <select
              onChange={(e) => handleSelectFactorPreset(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              {factors.map(f => (
                <option key={f.id} value={f.id} className="bg-[#181232] text-white">
                  [{f.scope}] {f.sourceName} — {f.factor} kgCO2e/{f.unit} ({f.sourceAuthority})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Emission Source Name</label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">GHG Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            >
              <option value="Scope 1" className="bg-[#181232] text-white">Scope 1 (Direct Operations)</option>
              <option value="Scope 2" className="bg-[#181232] text-white">Scope 2 (Purchased Electricity)</option>
              <option value="Scope 3" className="bg-[#181232] text-white">Scope 3 (Value Chain / Travel)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Activity Data Value</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={activityValue}
              onChange={(e) => setActivityValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Activity Unit</label>
            <input
              type="text"
              required
              value={activityUnit}
              onChange={(e) => setActivityUnit(e.target.value)}
              placeholder="e.g. kWh, Therms, Gallons, pkm"
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Emission Factor (kgCO2e / unit)</label>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              value={emissionFactor}
              onChange={(e) => setEmissionFactor(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Record Date</label>
            <input
              type="date"
              required
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Factor Source Authority</label>
            <input
              type="text"
              required
              value={factorSource}
              onChange={(e) => setFactorSource(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dataset Version</label>
            <input
              type="text"
              required
              value={factorVersion}
              onChange={(e) => setFactorVersion(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>
        </div>

        {/* Real-time Calculation Formula Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/30 border border-purple-500/30 text-xs text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-purple-200 block">Calculated Result:</span>
              <span className="text-[11px] font-mono text-cyan-300">
                {activityValue.toLocaleString()} {activityUnit} × {emissionFactor} = {previewKgCO2e.toLocaleString()} kgCO2e
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-pink-400 font-mono block">
              {previewTCO2e} <span className="text-xs font-medium text-purple-200">tCO2e</span>
            </span>
            <span className="text-[10px] text-purple-300/70">Verified MongoDB Record</span>
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Emission Record"
        message={`Are you sure you want to delete the record for ${deleteTarget?.source} (${(deleteTarget?.emissionsKgCO2e || 0) / 1000} tCO2e)?`}
        confirmLabel="Delete Record"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
