import React, { useState, useEffect } from 'react';
import { Settings, Building, Database, Shield, BookOpen, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Download, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DatabaseStatus, EmissionFactor } from '../types';

interface SettingsPageProps {
  onOpenDbConfig: () => void;
  dbStatus: DatabaseStatus | null;
  onRefreshDbStatus: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenDbConfig,
  dbStatus,
  onRefreshDbStatus
}) => {
  const { user, organization, isAdmin, refreshProfile } = useAuth();
  const [factors, setFactors] = useState<EmissionFactor[]>([]);

  // Organization edit state
  const [orgName, setOrgName] = useState(organization?.name || 'EcoVerde Industrial Solutions Corp');
  const [industry, setIndustry] = useState(organization?.industry || 'Advanced Manufacturing');
  const [location, setLocation] = useState(organization?.location || 'Austin HQ & Chicago Plant');
  const [currency, setCurrency] = useState(organization?.reportingCurrency || 'USD');
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgFeedback, setOrgFeedback] = useState<string | null>(null);

  // MongoDB connection string input
  const [mongoUri, setMongoUri] = useState('');
  const [isConnectingMongo, setIsConnectingMongo] = useState(false);
  const [mongoFeedback, setMongoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setIndustry(organization.industry);
      setLocation(organization.location);
      setCurrency(organization.reportingCurrency);
    }
  }, [organization]);

  useEffect(() => {
    api.getEmissionFactors().then(res => {
      if (res.success) setFactors(res.data);
    }).catch(console.error);
  }, []);

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSavingOrg(true);
    setOrgFeedback(null);
    try {
      await api.updateOrganization(organization?._id || organization?.id || 'default-org', {
        name: orgName,
        industry,
        location,
        reportingCurrency: currency
      });
      await refreshProfile();
      setOrgFeedback('Organization settings successfully updated.');
    } catch (err: any) {
      setOrgFeedback('Failed to update organization: ' + err.message);
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUri.trim()) return;
    setIsConnectingMongo(true);
    setMongoFeedback(null);
    try {
      const res = await api.connectMongo(mongoUri.trim());
      setMongoFeedback({ type: 'success', message: res.message || 'Successfully connected to MongoDB!' });
      onRefreshDbStatus();
    } catch (err: any) {
      setMongoFeedback({ type: 'error', message: err.message || 'Failed to connect to MongoDB.' });
    } finally {
      setIsConnectingMongo(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* User Profile Card */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl bouncy-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Current User Profile & Role Permissions</h3>
            <p className="text-xs text-purple-300/80">Security credentials and role-based access control (RBAC)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-white/[0.04] rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">Full Name</span>
            <span className="text-xs font-bold text-white">{user?.name}</span>
          </div>

          <div className="p-3.5 bg-white/[0.04] rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">Email Address</span>
            <span className="text-xs font-bold text-cyan-300 font-mono">{user?.email}</span>
          </div>

          <div className="p-3.5 bg-purple-500/10 rounded-2xl border border-purple-500/25">
            <span className="text-[11px] text-purple-300 block uppercase font-medium">Assigned System Role</span>
            <span className="text-xs font-black text-pink-400">{user?.role}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400 leading-relaxed">
          <span className="font-bold text-purple-200">Role Capabilities: </span>
          {user?.role === 'Admin' && 'Full administrative authority (CRUD records, manage organizations, create users, configure database).'}
          {user?.role === 'Manager' && 'Sustainability operational management (CRUD records, run calculations, export reports).'}
          {user?.role === 'Employee' && 'Operational data entry (log energy, emissions, and waste metrics).'}
          {user?.role === 'Auditor' && 'Read-only independent audit compliance access across all verified records and reports.'}
        </div>
      </div>

      {/* Database Connection & Diagnostics */}
      <div className="glass-card rounded-3xl p-6 space-y-5 border border-white/10 shadow-xl bouncy-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">MongoDB Database Status</h3>
              <p className="text-xs text-purple-300/80">Mongoose ODM integration & persistent database storage</p>
            </div>
          </div>

          <button
            onClick={onOpenDbConfig}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-xl transition-all bouncy-button"
          >
            Configure Connection
          </button>
        </div>

        {/* Status Indicator Banner */}
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed ${
            dbStatus?.connected
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {dbStatus?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold text-white block">
                {dbStatus?.connected
                  ? `Live MongoDB Connected (${dbStatus.databaseName || 'ecotrack'})`
                  : 'Operating in Development Mode (Embedded Persistent Store)'}
              </span>
              <p className="text-[11px] opacity-90">{dbStatus?.message}</p>
              {dbStatus?.host && (
                <p className="font-mono text-[10px] text-cyan-300">Connected host: {dbStatus.host}</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Connect MongoDB Atlas input */}
        <form onSubmit={handleConnectMongo} className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-300">
            Connect MongoDB Atlas URI:
          </label>
          <div className="flex gap-2.5">
            <input
              type="text"
              value={mongoUri}
              onChange={e => setMongoUri(e.target.value)}
              placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecotrack"
              className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
            <button
              type="submit"
              disabled={isConnectingMongo || !mongoUri.trim()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all disabled:opacity-50 shrink-0 bouncy-button shadow-lg shadow-purple-600/30"
            >
              {isConnectingMongo ? 'Connecting...' : 'Connect Atlas'}
            </button>
          </div>
          {mongoFeedback && (
            <p className={`text-xs ${mongoFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {mongoFeedback.message}
            </p>
          )}
        </form>
      </div>

      {/* Organization Settings */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl bouncy-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Organization Preferences</h3>
            <p className="text-xs text-purple-300/80">Corporate entity parameters and sustainability reporting defaults</p>
          </div>
        </div>

        {orgFeedback && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
            {orgFeedback}
          </div>
        )}

        <form onSubmit={handleSaveOrganization} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Sector</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Operating Facilities / Locations</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reporting Currency</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingOrg}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-600/30 bouncy-button"
              >
                {isSavingOrg ? 'Saving Changes...' : 'Save Organization Details'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Official Emission Factors Reference */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl bouncy-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Documented Emission Factors Library</h3>
            <p className="text-xs text-purple-300/80">Official conversion factors referenced during calculations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-semibold text-purple-200 uppercase tracking-wider">
                <th className="py-3 px-4">Emission Source</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4 text-right">Factor (kgCO2e)</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Authority</th>
                <th className="py-3 px-4">Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono text-slate-300">
              {factors.map(f => (
                <tr key={f.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-white">{f.sourceName}</td>
                  <td className="py-3 px-4 font-sans font-semibold text-emerald-400">{f.scope}</td>
                  <td className="py-3 px-4 text-right font-black text-cyan-300">{f.factor}</td>
                  <td className="py-3 px-4">{f.unit}</td>
                  <td className="py-3 px-4 font-sans text-slate-400">{f.sourceAuthority}</td>
                  <td className="py-3 px-4 text-purple-300/70">{f.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Source Code Archive */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl bouncy-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Project Source Code ZIP Archive</h3>
              <p className="text-xs text-purple-300/80">Download the complete codebase including Mongoose models, Express REST API, React UI, seed scripts, and documentation</p>
            </div>
          </div>

          <a
            href="/api/download-zip"
            download="ecotrack-esg-platform.zip"
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl inline-flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-purple-600/30 bouncy-button"
          >
            <Download className="w-4 h-4" />
            <span>Download Project ZIP</span>
          </a>
        </div>
      </div>
    </div>
  );
};
