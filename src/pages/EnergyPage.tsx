import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Zap, DollarSign, Filter, Layers } from 'lucide-react';
import { api } from '../services/api';
import { EnergyRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/common/KPICard';
import { DataTable, Column } from '../components/common/DataTable';
import { FormDialog } from '../components/common/FormDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

interface EnergyPageProps {
  selectedYear: string;
}

export const EnergyPage: React.FC<EnergyPageProps> = ({ selectedYear }) => {
  const { canEdit, isAuditor } = useAuth();
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalRecords: number;
    totalConsumptionKWh: number;
    totalCost: number;
    byType: Record<string, number>;
  }>({ totalRecords: 0, totalConsumptionKWh: 0, totalCost: 0, byType: {} });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<string>('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EnergyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnergyRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [facility, setFacility] = useState('Austin Tech Campus');
  const [energyType, setEnergyType] = useState<'Electricity' | 'Natural Gas' | 'Diesel' | 'Solar' | 'District Heating'>('Electricity');
  const [consumption, setConsumption] = useState<number>(45000);
  const [unit, setUnit] = useState<'kWh' | 'MWh' | 'Therms' | 'Gallons'>('kWh');
  const [cost, setCost] = useState<number>(5400);
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getEnergyRecords({
        energyType: selectedType || undefined,
        facility: selectedFacility || undefined,
        startDate: selectedYear ? `${selectedYear}-01-01` : undefined,
        endDate: selectedYear ? `${selectedYear}-12-31` : undefined
      });
      if (res.success) {
        setRecords(res.data);
        setSummary(res.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load energy records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedType, selectedFacility]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFacility('Austin Tech Campus');
    setEnergyType('Electricity');
    setConsumption(45000);
    setUnit('kWh');
    setCost(5400);
    setRecordDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rec: EnergyRecord) => {
    setEditingRecord(rec);
    setFacility(rec.facility);
    setEnergyType(rec.energyType);
    setConsumption(rec.consumption);
    setUnit(rec.unit);
    setCost(rec.cost);
    setRecordDate(new Date(rec.recordDate).toISOString().split('T')[0]);
    setNotes(rec.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (consumption <= 0) {
      setFormError('Consumption must be a positive number.');
      return;
    }
    if (cost < 0) {
      setFormError('Cost cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingRecord) {
        await api.updateEnergyRecord(editingRecord._id || editingRecord.id!, {
          facility,
          energyType,
          consumption,
          unit,
          cost,
          recordDate,
          notes
        });
      } else {
        await api.createEnergyRecord({
          facility,
          energyType,
          consumption,
          unit,
          cost,
          recordDate,
          notes
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
      await api.deleteEnergyRecord(deleteTarget._id || deleteTarget.id!);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<EnergyRecord>[] = [
    {
      header: 'Facility',
      accessorKey: 'facility',
      sortable: true,
      cell: (r) => (
        <div>
          <span className="font-semibold text-white block">{r.facility}</span>
          {r.notes && <span className="text-[11px] text-purple-300/70 block truncate max-w-xs">{r.notes}</span>}
        </div>
      )
    },
    {
      header: 'Energy Type',
      accessorKey: 'energyType',
      sortable: true,
      cell: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-200 border border-purple-500/30">
          {r.energyType}
        </span>
      )
    },
    {
      header: 'Consumption',
      accessorKey: 'consumption',
      align: 'right',
      sortable: true,
      cell: (r) => (
        <span className="font-bold text-cyan-300 font-mono">
          {r.consumption.toLocaleString()} <span className="text-slate-400 font-normal text-xs">{r.unit}</span>
        </span>
      )
    },
    {
      header: 'Cost (USD)',
      accessorKey: 'cost',
      align: 'right',
      sortable: true,
      cell: (r) => (
        <span className="font-bold text-emerald-400 font-mono">
          ${r.cost.toLocaleString()}
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
      header: 'Logged By',
      accessorKey: 'createdBy',
      cell: (r) => <span className="text-slate-400 text-[11px] font-mono">{r.createdBy}</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Normalized Energy"
          value={summary.totalConsumptionKWh}
          unit="kWh"
          icon={Zap}
          accentColor="mint"
          trend={{ value: '-8.4%', isPositive: true, label: 'vs last quarter' }}
          subtext="Filtered period aggregate"
        />
        <KPICard
          label="Total Energy Expenditure"
          value={`$${summary.totalCost.toLocaleString()}`}
          icon={DollarSign}
          accentColor="amber"
          trend={{ value: '-5.2%', isPositive: true, label: 'cost efficiency' }}
          subtext="Direct utility expenses"
        />
        <KPICard
          label="Logged Facilities & Sources"
          value={summary.totalRecords}
          unit="verified records"
          icon={Layers}
          accentColor="cyan"
          subtext="Stored in MongoDB EnergyRecords"
        />
      </div>

      {/* Main Records Table */}
      {isLoading ? (
        <LoadingState message="Loading energy records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          data={records}
          columns={columns}
          searchPlaceholder="Search facility, energy type or notes..."
          primaryAction={
            canEdit ? (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/25 bouncy-button"
              >
                <Plus className="w-4 h-4" />
                <span>Log Energy Record</span>
              </button>
            ) : undefined
          }
          secondaryFilter={
            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer transition-all"
              >
                <option value="" className="bg-[#181232] text-white">All Energy Types</option>
                <option value="Electricity" className="bg-[#181232] text-white">Electricity</option>
                <option value="Natural Gas" className="bg-[#181232] text-white">Natural Gas</option>
                <option value="Diesel" className="bg-[#181232] text-white">Diesel</option>
                <option value="Solar" className="bg-[#181232] text-white">Solar</option>
                <option value="District Heating" className="bg-[#181232] text-white">District Heating</option>
              </select>

              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer transition-all"
              >
                <option value="" className="bg-[#181232] text-white">All Facilities</option>
                <option value="Austin Tech Campus" className="bg-[#181232] text-white">Austin Tech Campus</option>
                <option value="Chicago Plant #2" className="bg-[#181232] text-white">Chicago Plant #2</option>
              </select>
            </div>
          }
        />
      )}

      {/* Form Dialog for Add/Edit */}
      <FormDialog
        isOpen={isFormOpen}
        title={editingRecord ? 'Edit Energy Record' : 'Log New Energy Record'}
        subtitle="Specify consumption, utility cost, facility, and verification date"
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        error={formError}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Facility Name</label>
            <input
              type="text"
              required
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Energy Type</label>
            <select
              value={energyType}
              onChange={(e) => setEnergyType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
            >
              <option value="Electricity" className="bg-[#181232] text-white">Electricity (Grid)</option>
              <option value="Natural Gas" className="bg-[#181232] text-white">Natural Gas</option>
              <option value="Diesel" className="bg-[#181232] text-white">Diesel Fuel</option>
              <option value="Solar" className="bg-[#181232] text-white">Solar On-site</option>
              <option value="District Heating" className="bg-[#181232] text-white">District Heating</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Consumption Value</label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={consumption}
              onChange={(e) => setConsumption(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
            >
              <option value="kWh" className="bg-[#181232] text-white">kWh (Kilowatt Hours)</option>
              <option value="MWh" className="bg-[#181232] text-white">MWh (Megawatt Hours)</option>
              <option value="Therms" className="bg-[#181232] text-white">Therms (Natural Gas)</option>
              <option value="Gallons" className="bg-[#181232] text-white">Gallons (Liquid Fuel)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Utility Cost (USD)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Record Date</label>
            <input
              type="date"
              required
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Meter ID</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Submeter B4 - Monthly billing verified"
            className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
          />
        </div>
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Energy Record"
        message={`Are you sure you want to delete the record for ${deleteTarget?.facility} (${deleteTarget?.consumption} ${deleteTarget?.unit})? This action will remove the record permanently from MongoDB.`}
        confirmLabel="Delete Record"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
