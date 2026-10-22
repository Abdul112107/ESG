import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  canEdit: boolean;
  isAuditor: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; title: string }> = {
  Admin: { email: 'admin@ecotrack.org', pass: 'Admin@EcoTrack2026!', title: 'Dr. Sarah Jenkins (Admin)' },
  Manager: { email: 'manager@ecotrack.org', pass: 'Manager@EcoTrack2026!', title: 'Marcus Vance (ESG Manager)' },
  Employee: { email: 'employee@ecotrack.org', pass: 'Employee@EcoTrack2026!', title: 'Elena Rostova (Sustainability Specialist)' },
  Auditor: { email: 'auditor@ecotrack.org', pass: 'Auditor@EcoTrack2026!', title: 'Arthur Sterling (CPA Auditor)' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('ecotrack_token');
    if (!token) {
      setUser(null);
      setOrganization(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setOrganization(res.organization || null);
      } else {
        localStorage.removeItem('ecotrack_token');
        setUser(null);
        setOrganization(null);
      }
    } catch (err) {
      console.warn('Failed to restore user session:', err);
      localStorage.removeItem('ecotrack_token');
      setUser(null);
      setOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.token) {
        localStorage.setItem('ecotrack_token', res.token);
        setUser(res.user);
        const meRes = await api.getMe();
        if (meRes.organization) setOrganization(meRes.organization);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, email, password, role });
      if (res.token) {
        localStorage.setItem('ecotrack_token', res.token);
        setUser(res.user);
        const meRes = await api.getMe();
        if (meRes.organization) setOrganization(meRes.organization);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ecotrack_token');
    setUser(null);
    setOrganization(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Admin' || user?.role === 'Manager';
  const canEdit = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Employee';
  const isAuditor = user?.role === 'Auditor';

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        isAdmin,
        isManager,
        canEdit,
        isAuditor,
        refreshProfile: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
