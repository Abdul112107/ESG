import React, { useState } from 'react';
import { Leaf, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Manager');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      setError('Password must include uppercase, lowercase, number, and special symbol.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register(name, email, password, role);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
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
            <Leaf className="w-7 h-7 animate-pulse-glow" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-200">
            Create EcoTrack Account
          </h2>
          <p className="text-xs text-purple-300/80 font-medium">Enterprise ESG Sustainability & Carbon Accounting Platform</p>
        </div>

        {/* Main Glass Register Card */}
        <div className="glass-card rounded-3xl p-7 border border-purple-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/[0.06] border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane.doe@company.com"
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
                  placeholder="Minimum 8 chars, uppercase, number, symbol"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/[0.06] border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all shadow-inner"
                />
              </div>
              <p className="text-[10px] text-purple-300/70 mt-1">
                Must contain: 8+ characters, uppercase, lowercase, number, and special character.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Requested Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#181232] border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="Admin" className="bg-[#181232] text-white">Admin (Full system and user authority)</option>
                <option value="Manager" className="bg-[#181232] text-white">Manager (Manage sustainability records & reports)</option>
                <option value="Employee" className="bg-[#181232] text-white">Employee (Operational data logging)</option>
                <option value="Auditor" className="bg-[#181232] text-white">Auditor (Read-only compliance audit)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full transition-all disabled:opacity-50 shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 bouncy-button"
            >
              <span>{isLoading ? 'Creating Account...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onSwitchToLogin}
              className="text-xs text-purple-300 hover:text-white font-medium transition-colors"
            >
              Already have an account? <span className="text-pink-400 font-bold underline">Sign in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
