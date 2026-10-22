export type UserRole = 'Admin' | 'Manager' | 'Employee' | 'Auditor';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  _id?: string;
  id?: string;
  name: string;
  industry: string;
  location: string;
  reportingCurrency: string;
  reportingYear: number;
}

export interface EnergyRecord {
  _id?: string;
  id?: string;
  organizationId: string;
  facility: string;
  energyType: 'Electricity' | 'Natural Gas' | 'Diesel' | 'Solar' | 'District Heating';
  consumption: number;
  unit: 'kWh' | 'MWh' | 'Therms' | 'Gallons';
  cost: number;
  recordDate: string;
  notes?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmissionRecord {
  _id?: string;
  id?: string;
  organizationId: string;
  source: string;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  activityValue: number;
  activityUnit: string;
  emissionFactor: number;
  emissionFactorSource: string;
  emissionFactorVersion: string;
  emissionsKgCO2e: number;
  recordDate: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmissionFactor {
  id: string;
  sourceName: string;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  factor: number;
  unit: string;
  sourceAuthority: string;
  version: string;
  description: string;
}

export interface WasteRecord {
  _id?: string;
  id?: string;
  organizationId: string;
  wasteType: 'Paper & Cardboard' | 'Plastic' | 'Metals' | 'Electronic Waste' | 'Hazardous Chemical' | 'Organic / Compost' | 'General Residual';
  totalWasteKg: number;
  recycledWasteKg: number;
  disposedWasteKg: number;
  recordDate: string;
  facility: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ESGMetric {
  _id?: string;
  id?: string;
  organizationId: string;
  reportingPeriod: string;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  overallScore: number;
  methodologyVersion: string;
  notes?: string;
  createdAt?: string;
}

export interface SustainabilityGoal {
  _id?: string;
  id?: string;
  organizationId: string;
  title: string;
  description: string;
  metricType: 'Energy Reduction' | 'Carbon Reduction' | 'Recycling Rate' | 'Renewable Share' | 'Water Efficiency';
  baselineValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  baselineDate: string;
  targetDate: string;
  status: 'In Progress' | 'Achieved' | 'At Risk' | 'Archived';
  progressPercentage?: number;
  rawProgressPercentage?: number;
  isExceeded?: boolean;
  isReduction?: boolean;
  remainingToTarget?: number;
  createdBy: string;
}

export interface Report {
  _id?: string;
  id?: string;
  organizationId: string;
  reportType: 'Annual Sustainability Report' | 'Carbon Emissions Report' | 'Energy Consumption Report' | 'ESG Performance Report' | 'Waste Management Report';
  reportingPeriod: string;
  generatedBy: string;
  generatedAt: string;
  fileName: string;
  status: 'Completed' | 'Pending' | 'Failed';
  summary?: {
    totalEnergyKWh?: number;
    totalEnergyCost?: number;
    totalEmissionsTCO2e?: number;
    scope1TCO2e?: number;
    scope2TCO2e?: number;
    scope3TCO2e?: number;
    totalWasteKg?: number;
    recyclingRate?: number;
    overallESGScore?: number;
    activeGoalsCount?: number;
  };
  fileSize?: number;
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'mongodb' | 'embedded';
  host?: string;
  databaseName?: string;
  error?: string;
  message: string;
}

export interface DashboardOverview {
  kpis: {
    totalEnergyKWh: number;
    totalEnergyCost: number;
    totalEmissionsTCO2e: number;
    wasteRecyclingRate: number;
    totalWasteKg: number;
    recycledWasteKg: number;
    overallESGScore: number;
    environmentalScore: number;
    socialScore: number;
    governanceScore: number;
    activeGoalsCount: number;
    achievedGoalsCount: number;
  };
  goals: SustainabilityGoal[];
  recentActivity: Array<{
    id: string;
    category: string;
    title: string;
    value: string;
    date: string;
    createdBy: string;
  }>;
}

export interface TrendDataPoint {
  month: string;
  key: string;
  energyKWh: number;
  emissionsTCO2e: number;
  cost: number;
}
