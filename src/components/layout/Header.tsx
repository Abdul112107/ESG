import React, { useState, useRef, useEffect } from 'react';
import { Database, ShieldCheck, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseStatus } from '../../types';
import { DateRangeFilter } from '../common/DateRangeFilter';
import { NavItemKey } from './Sidebar';

interface HeaderProps {
  pageTitle: string;
  currentTab?: NavItemKey;
  onTabChange?: (tab: NavItemKey) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  onOpenMobileMenu?: () => void;
  onOpenDbConfig: () => void;
  dbStatus: DatabaseStatus | null;
}

const QUICK_TABS: { key: NavItemKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'energy', label: 'Energy' },
  { key: 'emissions', label: 'Carbon' },
  { key: 'waste', label: 'Waste' },
  { key: 'esg', label: 'ESG Metrics' },
  { key: 'goals', label: 'Goals' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' }
];

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  currentTab,
  onTabChange,
  selectedYear,
  onYearChange,
  onOpenMobileMenu,
  onOpenDbConfig,
  dbStatus
}) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30" style={{
      background: 'linear-gradient(180deg, rgba(12,8,28,0.95) 0%, rgba(10,6,24,0.90) 100%)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      borderBottom: '1px solid rgba(139,92,246,0.15)',
      boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(139,92,246,0.10) inset',
    }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
      {/* Top row: brand + controls */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
              <span>{pageTitle}</span>
            </h1>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-purple-300/70 font-medium">
              <span>EcoTrack Enterprise</span>
              <span aria-hidden="true">·</span>
              <span>Cosmic ESG Platform</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Controls, DB Status & Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          <DateRangeFilter selectedYear={selectedYear} onYearChange={onYearChange} />

          {/* Database Status Button */}
          <button
            onClick={onOpenDbConfig}
            title="Click to view or configure MongoDB connection"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all bouncy-button shadow-sm ${
              dbStatus?.connected
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="truncate max-w-[130px]">
              {dbStatus?.connected ? 'MongoDB Live' : 'Dev DB (Local)'}
            </span>
          </button>


          {/* User Profile with Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 pl-2.5 border-l border-white/10 hover:bg-white/[0.04] rounded-xl py-1 pr-2 transition-all"
            >
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-purple-300/80 font-medium flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                  {user?.role || 'Admin'}
                </span>
              </div>

              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 text-white flex items-center justify-center text-xs font-black uppercase tracking-wider ring-2 ring-purple-500/40 shadow-lg shadow-purple-600/30">
                {user?.name ? user.name.charAt(0) : 'E'}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#1a1335]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-purple-900/40 py-2 animate-fade-in-up z-50">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-bold text-white">{user?.name || 'Administrator'}</p>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">{user?.email || 'admin@ecotrack.org'}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {user?.role || 'Admin'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onTabChange?.('settings');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <User className="w-4 h-4 text-purple-400" />
                    Profile & Settings
                  </button>
                </div>

                <div className="border-t border-white/[0.06] pt-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-b-2xl"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Navigation tabs — full width, evenly distributed */}
      {onTabChange && currentTab && (
        <div className="px-4 sm:px-6 pb-3">
          <div className="flex items-stretch gap-1 p-1.5 rounded-2xl" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(139,92,246,0.12)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
          }}>
            {QUICK_TABS.map((tab) => {
              const isActive = currentTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className="flex-1 text-center py-2.5 px-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap bouncy-button"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #db2777 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.45), 0 2px 8px rgba(219,39,119,0.20)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  } : {
                    color: '#94a3b8',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.target as HTMLElement).style.color = '#e2e8f0'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.target as HTMLElement).style.color = '#94a3b8'; (e.target as HTMLElement).style.background = ''; } }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
