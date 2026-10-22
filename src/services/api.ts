import {
  User,
  Organization,
  EnergyRecord,
  EmissionRecord,
  EmissionFactor,
  WasteRecord,
  ESGMetric,
  SustainabilityGoal,
  Report,
  DashboardOverview,
  TrendDataPoint,
  DatabaseStatus
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ecotrack_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMsg = data?.error || res.statusText || 'Request failed';
    throw new ApiError(errorMsg, res.status);
  }

  return data;
}

// Strip undefined/null values so URLSearchParams never sends "undefined" as a string
function cleanParams(params?: Record<string, any>): string {
  if (!params) return '';
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(filtered).toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; token: string; user: User }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  async register(data: { name: string; email: string; password: string; role?: string }): Promise<{ success: boolean; token: string; user: User }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getMe(): Promise<{ success: boolean; user: User; organization: Organization }> {
    return request('/auth/me');
  },

  // Organizations
  async getOrganization(): Promise<{ success: boolean; data: Organization }> {
    return request('/organizations');
  },

  async updateOrganization(id: string, data: Partial<Organization>): Promise<{ success: boolean; data: Organization }> {
    return request(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Dashboard
  async getDashboardOverview(params?: { startDate?: string; endDate?: string; year?: string }): Promise<{ success: boolean; data: DashboardOverview }> {
    return request(`/dashboard/overview${cleanParams(params)}`);
  },

  async getDashboardTrends(params?: { startDate?: string; endDate?: string; year?: string }): Promise<{ success: boolean; data: TrendDataPoint[] }> {
    return request(`/dashboard/trends${cleanParams(params)}`);
  },

  async getEmissionsBySource(params?: { startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    data: {
      bySource: Array<{ name: string; value: number; scope: string }>;
      byScope: Array<{ name: string; value: number }>;
    };
  }> {
    return request(`/dashboard/emissions-by-source${cleanParams(params)}`);
  },

  // Energy Records
  async getEnergyRecords(params?: { energyType?: string; facility?: string; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    data: EnergyRecord[];
    summary: { totalRecords: number; totalConsumptionKWh: number; totalCost: number; byType: Record<string, number> };
  }> {
    return request(`/energy${cleanParams(params)}`);
  },

  async createEnergyRecord(data: Partial<EnergyRecord>): Promise<{ success: boolean; data: EnergyRecord }> {
    return request('/energy', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateEnergyRecord(id: string, data: Partial<EnergyRecord>): Promise<{ success: boolean; data: EnergyRecord }> {
    return request(`/energy/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteEnergyRecord(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/energy/${id}`, {
      method: 'DELETE'
    });
  },

  // Emission Records
  async getEmissionRecords(params?: { scope?: string; source?: string; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    data: EmissionRecord[];
    summary: { totalRecords: number; totalEmissionsKg: number; totalEmissionsTCO2e: number; byScope: Record<string, number> };
  }> {
    return request(`/emissions${cleanParams(params)}`);
  },

  async getEmissionFactors(): Promise<{ success: boolean; data: EmissionFactor[] }> {
    return request('/emissions/factors');
  },

  async createEmissionRecord(data: Partial<EmissionRecord>): Promise<{ success: boolean; data: EmissionRecord }> {
    return request('/emissions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateEmissionRecord(id: string, data: Partial<EmissionRecord>): Promise<{ success: boolean; data: EmissionRecord }> {
    return request(`/emissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteEmissionRecord(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/emissions/${id}`, {
      method: 'DELETE'
    });
  },

  // Waste Records
  async getWasteRecords(params?: { wasteType?: string; facility?: string; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    data: WasteRecord[];
    summary: { totalRecords: number; totalWasteKg: number; recycledWasteKg: number; disposedWasteKg: number; recyclingRate: number; byType: Record<string, any> };
  }> {
    return request(`/waste${cleanParams(params)}`);
  },

  async createWasteRecord(data: Partial<WasteRecord>): Promise<{ success: boolean; data: WasteRecord }> {
    return request('/waste', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateWasteRecord(id: string, data: Partial<WasteRecord>): Promise<{ success: boolean; data: WasteRecord }> {
    return request(`/waste/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteWasteRecord(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/waste/${id}`, {
      method: 'DELETE'
    });
  },

  // ESG Metrics
  async getESGMetrics(): Promise<{
    success: boolean;
    data: ESGMetric[];
    latest: ESGMetric | null;
    history: ESGMetric[];
    methodology: { formula: string; description: string; version: string };
  }> {
    return request('/esg');
  },

  async createESGMetric(data: Partial<ESGMetric>): Promise<{ success: boolean; data: ESGMetric }> {
    return request('/esg', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateESGMetric(id: string, data: Partial<ESGMetric>): Promise<{ success: boolean; data: ESGMetric }> {
    return request(`/esg/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Sustainability Goals
  async getGoals(): Promise<{
    success: boolean;
    data: SustainabilityGoal[];
    summary: { total: number; active: number; achieved: number };
  }> {
    return request('/goals');
  },

  async createGoal(data: Partial<SustainabilityGoal>): Promise<{ success: boolean; data: SustainabilityGoal }> {
    return request('/goals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateGoal(id: string, data: Partial<SustainabilityGoal>): Promise<{ success: boolean; data: SustainabilityGoal }> {
    return request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteGoal(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/goals/${id}`, {
      method: 'DELETE'
    });
  },

  // Reports
  async getReports(): Promise<{ success: boolean; data: Report[] }> {
    return request('/reports');
  },

  async generateReport(params: { reportType: string; reportingPeriod: string; startDate?: string; endDate?: string }): Promise<{
    success: boolean;
    message: string;
    data: { reportId: string; fileName: string; summary: any };
  }> {
    return request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  getReportDownloadUrl(reportId: string): string {
    return `${API_BASE}/reports/${reportId}/download`;
  },

  // System
  async getDbStatus(): Promise<{ success: boolean; data: DatabaseStatus }> {
    return request('/db-status');
  },

  async connectMongo(mongoUri: string): Promise<{ success: boolean; message: string; data: DatabaseStatus }> {
    return request('/db/connect', {
      method: 'POST',
      body: JSON.stringify({ mongoUri })
    });
  },

  async seedDb(forceReset: boolean = false): Promise<{ success: boolean; message: string }> {
    return request('/db/seed', {
      method: 'POST',
      body: JSON.stringify({ forceReset })
    });
  }
};
