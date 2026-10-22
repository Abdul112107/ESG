import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DatabaseConfigModal } from './components/common/DatabaseConfigModal';
import { OverviewPage } from './pages/OverviewPage';
import { EnergyPage } from './pages/EnergyPage';
import { EmissionsPage } from './pages/EmissionsPage';
import { WastePage } from './pages/WastePage';
import { ESGPage } from './pages/ESGPage';
import { GoalsPage } from './pages/GoalsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { api } from './services/api';
import { DatabaseStatus } from './types';

const TAB_TITLES: Record<NavItemKey, string> = {
  overview: 'Executive Sustainability Overview',
  energy: 'Energy Management & Utility Costs',
  emissions: 'Greenhouse Gas Carbon Emissions',
  waste: 'Waste Diversion & Circularity',
  esg: 'ESG Pillar Performance Index',
  goals: 'Sustainability Goals & Targets',
  reports: 'Sustainability Reports & PDF Exports',
  settings: 'System & Organization Settings'
};

const MainDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // MongoDB status modal
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  const fetchDbStatus = async () => {
    try {
      const res = await api.getDbStatus();
      if (res.success) {
        setDbStatus(res.data);
      }
    } catch (err) {
      console.warn('Failed to retrieve database status:', err);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  return (
    <div className="min-h-screen bg-[#07051a] text-slate-100 bg-ambient-radial flex flex-col selection:bg-purple-500 selection:text-white relative overflow-x-hidden">
      {/* ── Ambient drifting glow blobs (fixed behind everything) ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px] animate-drift" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[100px] animate-drift-slow" />
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-pink-700/12 blur-[110px] animate-drift-reverse" />
        <div className="absolute bottom-1/4 -right-20 w-[350px] h-[350px] rounded-full bg-cyan-600/10 blur-[90px] animate-drift" style={{ animationDelay: '-8s' }} />
        {/* Dot-grid texture */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.06) 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />
      </div>
      {/* Main Viewport */}
      <div className="relative z-10 flex flex-col flex-1">
      <Header
        pageTitle={TAB_TITLES[currentTab]}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        onOpenDbConfig={() => setIsDbModalOpen(true)}
        dbStatus={dbStatus}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <OverviewPage
              selectedYear={selectedYear}
              onNavigateTab={setCurrentTab}
              onOpenReportGenerator={() => setCurrentTab('reports')}
            />
          )}

          {currentTab === 'energy' && (
            <EnergyPage selectedYear={selectedYear} />
          )}

          {currentTab === 'emissions' && (
            <EmissionsPage selectedYear={selectedYear} />
          )}

          {currentTab === 'waste' && (
            <WastePage selectedYear={selectedYear} />
          )}

          {currentTab === 'esg' && (
            <ESGPage />
          )}

          {currentTab === 'goals' && (
            <GoalsPage />
          )}

          {currentTab === 'reports' && (
            <ReportsPage />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              onOpenDbConfig={() => setIsDbModalOpen(true)}
              dbStatus={dbStatus}
              onRefreshDbStatus={fetchDbStatus}
            />
          )}
        </main>

      {/* Database Connection & Seed Config Dialog */}
      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
        onStatusUpdated={fetchDbStatus}
      />
      </div>{/* end z-10 wrapper */}
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">Initializing EcoTrack session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  return <MainDashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
