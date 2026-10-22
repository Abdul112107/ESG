import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, CheckCircle2, AlertCircle, FileCheck, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { Report } from '../types';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/common/KPICard';
import { FormDialog } from '../components/common/FormDialog';
import { LoadingState, ErrorState } from '../components/common/FeedbackStates';

export const ReportsPage: React.FC = () => {
  const { canEdit, organization } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState<Report['reportType']>('Annual Sustainability Report');
  const [reportingPeriod, setReportingPeriod] = useState('2026-FullYear');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getReports();
      if (res.success) {
        setReports(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load report history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await api.generateReport({
        reportType,
        reportingPeriod
      });

      if (res.success) {
        setIsModalOpen(false);
        setDownloadSuccessMessage(`Generated ${reportType} (${reportingPeriod}). Click download to view the PDF.`);
        await loadReports();
      }
    } catch (err: any) {
      setGenError(err.message || 'Report generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (reportId: string, fileName: string) => {
    const url = api.getReportDownloadUrl(reportId);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Generated PDF Documents"
          value={reports.length}
          unit="verified reports"
          icon={FileText}
          accentColor="violet"
          subtext="Server-side compiled with PDFKit"
        />
        <KPICard
          label="Reporting Organization"
          value={organization?.name || 'EcoVerde Industrial'}
          icon={FileCheck}
          accentColor="cyan"
          subtext={`Currency: ${organization?.reportingCurrency || 'USD'}`}
        />
        <KPICard
          label="Compliance Framework"
          value="ISO 14064"
          icon={Calendar}
          accentColor="mint"
          subtext="GHG Protocol Corporate Standard"
        />
      </div>

      {/* Success Notification Banner */}
      {downloadSuccessMessage && (
        <div className="p-4 rounded-2xl glass-card border border-emerald-500/40 bg-emerald-500/15 text-xs text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
          <button
            onClick={() => setDownloadSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Official Sustainability Reports Repository</h3>
          <p className="text-xs text-purple-300/80">
            Real server-compiled PDF reports backed by database records and calculation algorithms
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setGenError(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30 bouncy-button shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New PDF Report</span>
          </button>
        )}
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <LoadingState message="Retrieving generated reports archive..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReports} />
      ) : reports.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mx-auto mb-3.5 border border-purple-500/30">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white">No reports generated yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Generate New PDF Report" to compile a formal sustainability report with KPI summaries, carbon breakdowns, and audit tables.
          </p>
          {canEdit && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl transition-all shadow-lg shadow-purple-600/30 bouncy-button"
            >
              Generate First Report
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-semibold text-purple-200 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Report Type</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Generated Date</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Summary KPIs</th>
                  <th className="py-3.5 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-200">
                {reports.map((rep) => {
                  const s = rep.summary;
                  return (
                    <tr key={rep._id || rep.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{rep.reportType}</span>
                            <span className="text-[10px] text-purple-300/70 font-mono">{rep.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-cyan-300">{rep.reportingPeriod}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(rep.generatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{rep.generatedBy}</td>
                      <td className="py-3.5 px-4">
                        {s ? (
                          <div className="flex items-center gap-2 text-[11px] font-mono text-pink-300">
                            {s.totalEnergyKWh != null && <span>{s.totalEnergyKWh.toLocaleString()} kWh</span>}
                            {s.totalEmissionsTCO2e != null && <span>· {s.totalEmissionsTCO2e} tCO2e</span>}
                            {s.recyclingRate != null && <span>· {s.recyclingRate}% recycling</span>}
                          </div>
                        ) : (
                          <span className="text-slate-500">Complete summary</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDownload(rep._id || rep.id!, rep.fileName)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-white/[0.06] hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/40 rounded-xl inline-flex items-center gap-1.5 transition-all bouncy-button shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Download PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generation Form Dialog */}
      <FormDialog
        isOpen={isModalOpen}
        title="Generate Official Sustainability PDF Report"
        subtitle="The backend retrieves database records, applies calculations, and builds a verified PDF document"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleGenerate}
        submitLabel="Compile & Save Report"
        isLoading={isGenerating}
        error={genError}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#181232] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            >
              <option value="Annual Sustainability Report" className="bg-[#181232] text-white">Annual Sustainability Report (Comprehensive Executive Suite)</option>
              <option value="Carbon Emissions Report" className="bg-[#181232] text-white">Carbon Emissions Report (Scopes 1, 2, 3 GHG Inventory)</option>
              <option value="Energy Consumption Report" className="bg-[#181232] text-white">Energy Consumption Report (Fuel, Electricity & Cost Analysis)</option>
              <option value="ESG Performance Report" className="bg-[#181232] text-white">ESG Performance Report (Environmental, Social & Governance Index)</option>
              <option value="Waste Management Report" className="bg-[#181232] text-white">Waste Management Report (Circularity & Landfill Diversion)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Reporting Period</label>
            <input
              type="text"
              required
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
              placeholder="e.g. 2026, 2025, 2026-Q1"
              className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 space-y-1.5 shadow-inner">
            <span className="font-bold text-purple-200 block">Report Specifications:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Adheres strictly to ISO 14064 & GHG Protocol Corporate Accounting standards.</li>
              <li>Calculates identical metrics to the live dashboard for total parity.</li>
              <li>Generates an immutable audit timestamp and stores metadata in MongoDB.</li>
            </ul>
          </div>
        </div>
      </FormDialog>
    </div>
  );
};
