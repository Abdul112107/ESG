import React, { useState } from 'react';
import { Sparkles, Lock, Mail, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@ecotrack.org');
  const [password, setPassword] = useState('Admin@EcoTrack2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    setEmail(cred.email);
    setPassword(cred.pass);
  };

  return (
    <div className="min-h-screen bg-[#0d0a1c] bg-ambient-radial text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-7 relative z-10 animate-fade-in-up">
        {/* Brand Lockup */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 text-white shadow-xl shadow-purple-500/40 bouncy-card">
            <Sparkles className="w-7 h-7 animate-pulse-glow" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-200">
            Sign in to EcoTrack
          </h2>
          <p className="text-xs text-purple-300/80 font-medium">Enterprise ESG Sustainability & Carbon Accounting Platform</p>
        </div>

        {/* Main Glass Login Card */}
        <div className="glass-card rounded-3xl p-7 border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/[0.06] border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/[0.06] border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full transition-all disabled:opacity-50 shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 bouncy-button"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-5 border-t border-white/[0.08] space-y-2.5">
            <span className="text-[11px] font-bold text-purple-300/80 block uppercase tracking-wider text-center font-mono">
              ⚡ Quick 1-Click Role Switcher
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Admin')}
                className="p-2.5 text-left rounded-2xl bg-white/[0.04] hover:bg-purple-600/20 border border-white/10 hover:border-purple-400/40 text-xs transition-all bouncy-card"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                  <span className="font-bold text-white text-[11px]">Admin (Executive)</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-mono">Dr. Sarah Jenkins</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Manager')}
                className="p-2.5 text-left rounded-2xl bg-white/[0.04] hover:bg-purple-600/20 border border-white/10 hover:border-purple-400/40 text-xs transition-all bouncy-card"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="font-bold text-white text-[11px]">Manager (ESG Ops)</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-mono">Marcus Vance</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Employee')}
                className="p-2.5 text-left rounded-2xl bg-white/[0.04] hover:bg-purple-600/20 border border-white/10 hover:border-purple-400/40 text-xs transition-all bouncy-card"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="font-bold text-white text-[11px]">Employee (Data)</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-mono">Elena Rostova</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Auditor')}
                className="p-2.5 text-left rounded-2xl bg-white/[0.04] hover:bg-purple-600/20 border border-white/10 hover:border-purple-400/40 text-xs transition-all bouncy-card"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-white text-[11px]">Auditor (Audit Read)</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-mono">Arthur Sterling</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onSwitchToRegister}
              className="text-xs text-purple-300 hover:text-white font-medium transition-colors"
            >
              Don't have an account? <span className="underline decoration-pink-500 font-bold">Register new user</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
