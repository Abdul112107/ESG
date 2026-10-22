import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';
import { DatabaseStatus } from '../../types';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  onStatusUpdated: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  status,
  onStatusUpdated
}) => {
  const [uri, setUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uri.trim()) return;

    setIsConnecting(true);
    setFeedback(null);
    try {
      const res = await api.connectMongo(uri.trim());
      setFeedback({ type: 'success', message: res.message || 'Successfully connected to MongoDB!' });
      onStatusUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to connect to MongoDB.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSeed = async (reset: boolean = false) => {
    setIsSeeding(true);
    setFeedback(null);
    try {
      const res = await api.seedDb(reset);
      setFeedback({ type: 'success', message: res.message || 'Sample database records populated.' });
      onStatusUpdated();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to seed records.' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#171131] rounded-3xl border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-2xl shadow-md shadow-purple-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">MongoDB Database Configuration</h3>
              <p className="text-xs text-purple-300/80">Mongoose ODM integration & persistent database storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              status?.connected
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {status?.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold block text-sm">
                  {status?.connected
                    ? `Live MongoDB Connected (${status.databaseName || 'ecotrack'})`
                    : 'Operating in Development Mode (Embedded Persistent Store)'}
                </span>
                <p className="text-xs opacity-90">{status?.message}</p>
                {status?.host && (
                  <p className="font-mono text-[11px] opacity-80">Host: {status.host}</p>
                )}
              </div>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Connect MongoDB Form */}
          <form onSubmit={handleConnect} className="space-y-3.5">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
              Connect to MongoDB Atlas or Local MongoDB:
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                value={uri}
                onChange={e => setUri(e.target.value)}
                placeholder="mongodb+srv://<user>:<password>@cluster.mongodb.net/ecotrack"
                className="w-full px-4 py-2.5 text-xs font-mono bg-white/[0.06] border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400"
              />
              <p className="text-[11px] text-slate-400">
                You can also configure this permanently in <code className="bg-white/10 px-1.5 py-0.5 rounded text-purple-300">.env</code> as <code className="text-purple-300">MONGODB_URI</code>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isConnecting || !uri.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full disabled:opacity-50 transition-all bouncy-button shadow-lg shadow-purple-600/30"
              >
                {isConnecting ? 'Testing Connection...' : 'Connect MongoDB'}
              </button>
              <button
                type="button"
                onClick={() => handleSeed(true)}
                disabled={isSeeding}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-white/[0.06] border border-white/10 rounded-full hover:bg-white/[0.1] hover:text-white transition-all flex items-center gap-2 bouncy-button"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>Reset & Seed 12-Month Demo Data</span>
              </button>
            </div>
          </form>

          {/* Setup Guide */}
          <div className="pt-4 border-t border-white/[0.08] space-y-2 text-xs text-slate-300">
            <span className="font-bold text-white block">How to configure MongoDB Atlas (Free in 2 min):</span>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
              <li>Sign in at <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noreferrer" className="text-pink-400 underline inline-flex items-center gap-0.5 font-semibold">mongodb.com/atlas <ExternalLink className="w-3 h-3" /></a> and create a free M0 cluster.</li>
              <li>Under Database Access, create a user with "Read and write to any database".</li>
              <li>Under Network Access, add IP Address 0.0.0.0/0 (Allow access from anywhere).</li>
              <li>Click Connect → Drivers → Copy the connection string. Replace password and paste above.</li>
            </ol>
          </div>
        </div>

        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 bg-white/[0.06] border border-white/10 rounded-full hover:bg-white/[0.1] hover:text-white transition-all bouncy-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
