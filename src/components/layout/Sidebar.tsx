import React from 'react';
import {
  LayoutDashboard,
  Zap,
  CloudRain,
  Trash2,
  BarChart3,
  Target,
  FileText,
  Settings,
  Leaf,
  Users,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { UserRole } from '../../types';

export type NavItemKey =
  | 'overview'
  | 'energy'
  | 'emissions'
  | 'waste'
  | 'esg'
  | 'goals'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onTabChange: (tab: NavItemKey) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const navItems: Array<{ key: NavItemKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'energy', label: 'Energy Management', icon: Zap },
  { key: 'emissions', label: 'Carbon Emissions', icon: CloudRain },
  { key: 'waste', label: 'Waste Management', icon: Trash2 },
  { key: 'esg', label: 'ESG Metrics', icon: BarChart3 },
  { key: 'goals', label: 'Sustainability Goals', icon: Target },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpen,
  onCloseMobile
}) => {
  const { user, organization, logout, switchDemoRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block">EcoTrack</span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">ESG Platform</span>
            </div>
          </div>

          <div className="mt-3 px-2 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300 truncate">
            <span className="text-slate-400">Org:</span> {organization?.name || 'EcoVerde Industrial'}
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 grow overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Role Switcher & User Profile */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Quick Role Switcher for Test Reviewers */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-[11px] flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Role:</span>
                <span className="font-semibold text-white">{user?.role || 'Guest'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute bottom-full mb-1.5 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-700/60">
                  Switch Active Role:
                </div>
                {(['Admin', 'Manager', 'Employee', 'Auditor'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    onClick={async () => {
                      setRoleMenuOpen(false);
                      await switchDemoRole(r);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-700 transition-colors ${
                      user?.role === r ? 'text-emerald-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{r}</span>
                    <span className="text-[10px] text-slate-400">
                      {r === 'Admin' ? 'Full Access' : r === 'Auditor' ? 'Read-only' : 'Operational'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account Info */}
          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <div className="truncate pr-2">
              <span className="block font-medium text-white truncate text-[11px]">{user?.name || 'Authorized User'}</span>
              <span className="block text-[10px] text-slate-400 truncate">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
