import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Trash, Recycle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { WasteRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/common/KPICard';
import { DataTable, Column } from '../components/common/DataTable';
import { FormDialog } from '../components/common/FormDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

interface WastePageProps {
  selectedYear: string;
}

export const WastePage: React.FC<WastePageProps> = ({ selectedYear }) => {
  const { canEdit, isAuditor } = useAuth();
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalRecords: number;
    totalWasteKg: number;
    recycledWasteKg: number;
    disposedWasteKg: number;
    recyclingRate: number;
    byType: Record<string, any>;
  }>({ totalRecords: 0, totalWasteKg: 0, recycledWasteKg: 0, disposedWasteKg: 0, recyclingRate: 0, byType: {} });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WasteRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [facility, setFacility] = useState('Austin Tech Campus');
  const [wasteType, setWasteType] = useState<WasteRecord['wasteType']>('Paper & Cardboard');
  const [totalWasteKg, setTotalWasteKg] = useState<number>(3000);
  const [recycledWasteKg, setRecycledWasteKg] = useState<number>(2700);
  const [disposedWasteKg, setDisposedWasteKg] = useState<number>(300);
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getWasteRecords({
        wasteType: selectedType || undefined,
        facility: selectedFacility || undefined,
        startDate: selectedYear ? `${selectedYear}-01-01` : undefined,
        endDate: selectedYear ? `${selectedYear}-12-31` : undefined
      });
      if (res.success) {
        setRecords(res.data);
        setSummary(res.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load waste records.');
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
    setWasteType('Paper & Cardboard');
    setTotalWasteKg(3000);
    setRecycledWasteKg(2700);
    setDisposedWasteKg(300);
    setRecordDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rec: WasteRecord) => {
    setEditingRecord(rec);
    setFacility(rec.facility);
    setWasteType(rec.wasteType);
    setTotalWasteKg(rec.totalWasteKg);
    setRecycledWasteKg(rec.recycledWasteKg);
    setDisposedWasteKg(rec.disposedWasteKg);
    setRecordDate(new Date(rec.recordDate).toISOString().split('T')[0]);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWasteKg <= 0) {
      setFormError('Total waste must be greater than zero.');
      return;
    }
    if (recycledWasteKg < 0 || disposedWasteKg < 0) {
      setFormError('Recycled and disposed amounts cannot be negative.');
      return;
    }
    if (recycledWasteKg + disposedWasteKg > totalWasteKg + 0.01) {
      setFormError('Recycled waste plus disposed waste cannot exceed total waste generated.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingRecord) {
        await api.updateWasteRecord(editingRecord._id || editingRecord.id!, {
          facility,
          wasteType,
          totalWasteKg,
          recycledWasteKg,
          disposedWasteKg,
          recordDate
        });
      } else {
        await api.createWasteRecord({
          facility,
          wasteType,
          totalWasteKg,
          recycledWasteKg,
          disposedWasteKg,
          recordDate
        });
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save waste record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await api.deleteWasteRecord(deleteTarget._id || deleteTarget.id!);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedFormRate = totalWasteKg > 0 ? Math.round((recycledWasteKg / totalWasteKg) * 1000) / 10 : 0;

  const columns: Column<WasteRecord>[] = [
    {
      header: 'Waste Stream',
      accessorKey: 'wasteType',
      sortable: true,
      cell: (r) => (
        <div>
          <span className="font-semibold text-white block">{r.wasteType}</span>
          <span className="text-[11px] text-purple-300/70 block">{r.facility}</span>
        </div>
      )
    },
    {
      header: 'Total Waste',
      accessorKey: 'totalWasteKg',
      align: 'right',
      sortable: true,
      cell: (r) => (
        <span className="font-bold text-cyan-300 font-mono">
          {r.totalWasteKg.toLocaleString()} <span className="text-slate-400 font-normal text-xs">kg</span>
        </span>
      )
    },
    {
      header: 'Recycled',
      accessorKey: 'recycledWasteKg',
      align: 'right',
      sortable: true,
      cell: (r) => (
        <span className="text-emerald-400 font-bold font-mono">
          {r.recycledWasteKg.toLocaleString()} <span className="text-slate-400 font-normal text-xs">kg</span>
        </span>
      )
    },
    {
      header: 'Disposed',
      accessorKey: 'disposedWasteKg',
      align: 'right',
      sortable: true,
      cell: (r) => (
        <span className="text-rose-400 font-medium font-mono">
          {r.disposedWasteKg.toLocaleString()} <span className="text-slate-400 font-normal text-xs">kg</span>
        </span>
      )
    },
    {
      header: 'Diversion %',
      align: 'right',
      sortable: true,
      cell: (r) => {
        const rate = r.totalWasteKg > 0 ? Math.round((r.recycledWasteKg / r.totalWasteKg) * 1000) / 10 : 0;
        return (
          <span className="font-bold text-teal-300 font-mono text-xs px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30">
            {rate}%
          </span>
        );
      }
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
          label="Recycling Rate"
          value={`${summary.recyclingRate}%`}
          icon={Recycle}
          accentColor="teal"
          trend={{ value: '+4.2%', isPositive: true, label: 'calculated rate' }}
          badge="Formula: Recycled / Total * 100"
        />
        <KPICard
          label="Total Waste Generated"
          value={summary.totalWasteKg}
          unit="kg"
          icon={Trash}
          accentColor="cyan"
          trend={{ value: '-6.5%', isPositive: true, label: 'waste reduction' }}
          subtext="Total mass generated"
        />
        <KPICard
          label="Recycled & Diverted"
          value={summary.recycledWasteKg}
          unit="kg"
          icon={Recycle}
          accentColor="mint"
          trend={{ value: '+11.2%', isPositive: true, label: 'diverted' }}
          subtext="Kept out of landfill"
        />
        <KPICard
          label="Residual Disposed"
          value={summary.disposedWasteKg}
          unit="kg"
          accentColor="magenta"
          trend={{ value: '-18.4%', isPositive: true, label: 'landfill avoided' }}
          subtext="Sent to landfill/incineration"
        />
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingState message="Loading waste management logs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          data={records}
          columns={columns}
          searchPlaceholder="Search waste material, facility..."
          primaryAction={
            canEdit ? (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 hover:from-teal-400 hover:to-green-400 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-lg shadow-teal-500/25 bouncy-button"
              >
                <Plus className="w-4 h-4" />
                <span>Log Waste Stream</span>
              </button>
            ) : undefined
          }
          secondaryFilter={
            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer transition-all"
              >
                <option value="" className="bg-[#181232] text-white">All Waste Streams</option>
                <option value="Paper & Cardboard" className="bg-[#181232] text-white">Paper & Cardboard</option>
                <option value="Plastic" className="bg-[#181232] text-white">Plastic</option>
                <option value="Metals" className="bg-[#181232] text-white">Metals</option>
                <option value="Electronic Waste" className="bg-[#181232] text-white">Electronic Waste</option>
                <option value="Hazardous Chemical" className="bg-[#181232] text-white">Hazardous Chemical</option>
              </select>

              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer transition-all"
              >
                <option value="" className="bg-[#181232] text-white">All Facilities</option>
                <option value="Austin Tech Campus" className="bg-[#181232] text-white">Austin Tech Campus</option>
                <option value="Chicago Plant #2" className="bg-[#181232] text-white">Chicago Plant #2</option>
              </select>
            </div>
          }
        />
      )}

      {/* Form Dialog */}
      <FormDialog
        isOpen={isFormOpen}
        title={editingRecord ? 'Edit Waste Stream' : 'Log Waste & Diversion Data'}
        subtitle="Validate mass balance: Recycled + Disposed must not exceed Total Waste"
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        error={formError}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Facility</label>
            <input
              type="text"
              required
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Waste Stream Type</label>
            <select
              value={wasteType}
              onChange={(e) => setWasteType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60"
            >
              <option value="Paper & Cardboard" className="bg-[#181232] text-white">Paper & Cardboard</option>
              <option value="Plastic" className="bg-[#181232] text-white">Plastic Polymers</option>
              <option value="Metals" className="bg-[#181232] text-white">Metals & Aluminum Scraps</option>
              <option value="Electronic Waste" className="bg-[#181232] text-white">Electronic Waste (WEEE)</option>
              <option value="Hazardous Chemical" className="bg-[#181232] text-white">Hazardous Chemical Waste</option>
              <option value="Organic / Compost" className="bg-[#181232] text-white">Organic / Compost</option>
              <option value="General Residual" className="bg-[#181232] text-white">General Residual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Total Waste (kg)</label>
            <input
              type="number"
              step="any"
              min="0.1"
              required
              value={totalWasteKg}
              onChange={(e) => setTotalWasteKg(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Recycled Waste (kg)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={recycledWasteKg}
              onChange={(e) => setRecycledWasteKg(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Disposed to Landfill (kg)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={disposedWasteKg}
              onChange={(e) => setDisposedWasteKg(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Record Date</label>
            <input
              type="date"
              required
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/60"
            />
          </div>
        </div>

        {/* Live Recycling Rate Calculation Indicator */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900/40 to-emerald-900/30 border border-teal-500/30 text-xs text-white flex items-center justify-between shadow-lg">
          <div>
            <span className="font-bold text-teal-200 block">Calculated Diversion Rate:</span>
            <span className="text-[11px] text-teal-300/80 font-mono">
              ({recycledWasteKg} kg recycled / {totalWasteKg} kg total) × 100
            </span>
          </div>
          <span className="text-xl font-black font-mono text-emerald-400">
            {calculatedFormRate}%
          </span>
        </div>
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Waste Record"
        message={`Are you sure you want to delete the record for ${deleteTarget?.wasteType} (${deleteTarget?.totalWasteKg} kg)?`}
        confirmLabel="Delete Record"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
