import mongoose, { Schema, Document } from 'mongoose';

// 1. User
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Auditor';
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Manager', 'Employee', 'Auditor'], default: 'Employee' },
  organizationId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// 2. Organization
export interface IOrganization extends Document {
  name: string;
  industry: string;
  location: string;
  reportingCurrency: string;
  reportingYear: number;
  createdAt: Date;
  updatedAt: Date;
}

export const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true, trim: true },
  industry: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  reportingCurrency: { type: String, default: 'USD' },
  reportingYear: { type: Number, default: 2026 },
}, { timestamps: true });

// 3. EnergyRecord
export interface IEnergyRecord extends Document {
  organizationId: string;
  facility: string;
  energyType: 'Electricity' | 'Natural Gas' | 'Diesel' | 'Solar' | 'District Heating';
  consumption: number; // in kWh or equivalent
  unit: 'kWh' | 'MWh' | 'Therms' | 'Gallons';
  cost: number;
  recordDate: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const EnergyRecordSchema = new Schema<IEnergyRecord>({
  organizationId: { type: String, required: true, index: true },
  facility: { type: String, required: true, trim: true, index: true },
  energyType: { 
    type: String, 
    enum: ['Electricity', 'Natural Gas', 'Diesel', 'Solar', 'District Heating'], 
    required: true,
    index: true 
  },
  consumption: { type: Number, required: true, min: [0, 'Consumption must be positive'] },
  unit: { type: String, default: 'kWh' },
  cost: { type: Number, required: true, min: [0, 'Cost must be positive'] },
  recordDate: { type: Date, required: true, index: true },
  notes: { type: String, trim: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 4. EmissionRecord
export interface IEmissionRecord extends Document {
  organizationId: string;
  source: string; // e.g. "Purchased Electricity", "Boilers & Furnaces", "Company Vehicles", "Business Flights"
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  activityValue: number;
  activityUnit: string; // e.g. "kWh", "therms", "liters", "passenger-km"
  emissionFactor: number; // kgCO2e per activityUnit
  emissionFactorSource: string; // e.g. "EPA GHG Hub 2024", "DEFRA 2024"
  emissionFactorVersion: string; // e.g. "v2024.1"
  emissionsKgCO2e: number;
  recordDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const EmissionRecordSchema = new Schema<IEmissionRecord>({
  organizationId: { type: String, required: true, index: true },
  source: { type: String, required: true, trim: true, index: true },
  scope: { type: String, enum: ['Scope 1', 'Scope 2', 'Scope 3'], required: true, index: true },
  activityValue: { type: Number, required: true, min: 0 },
  activityUnit: { type: String, required: true },
  emissionFactor: { type: Number, required: true, min: 0 },
  emissionFactorSource: { type: String, required: true },
  emissionFactorVersion: { type: String, required: true },
  emissionsKgCO2e: { type: Number, required: true, min: 0 },
  recordDate: { type: Date, required: true, index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 5. WasteRecord
export interface IWasteRecord extends Document {
  organizationId: string;
  wasteType: 'Paper & Cardboard' | 'Plastic' | 'Metals' | 'Electronic Waste' | 'Hazardous Chemical' | 'Organic / Compost' | 'General Residual';
  totalWasteKg: number;
  recycledWasteKg: number;
  disposedWasteKg: number;
  recordDate: Date;
  facility: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const WasteRecordSchema = new Schema<IWasteRecord>({
  organizationId: { type: String, required: true, index: true },
  wasteType: { 
    type: String, 
    enum: [
      'Paper & Cardboard', 
      'Plastic', 
      'Metals', 
      'Electronic Waste', 
      'Hazardous Chemical', 
      'Organic / Compost', 
      'General Residual'
    ], 
    required: true,
    index: true 
  },
  totalWasteKg: { type: Number, required: true, min: 0 },
  recycledWasteKg: { type: Number, required: true, min: 0 },
  disposedWasteKg: { type: Number, required: true, min: 0 },
  recordDate: { type: Date, required: true, index: true },
  facility: { type: String, required: true, trim: true, index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 6. ESGMetric
export interface IESGMetric extends Document {
  organizationId: string;
  reportingPeriod: string; // e.g. "2025-Q1", "2025-FullYear", "2026-Q1"
  environmentalScore: number; // 0-100
  socialScore: number; // 0-100
  governanceScore: number; // 0-100
  overallScore: number; // (E+S+G)/3
  methodologyVersion: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ESGMetricSchema = new Schema<IESGMetric>({
  organizationId: { type: String, required: true, index: true },
  reportingPeriod: { type: String, required: true, index: true },
  environmentalScore: { type: Number, required: true, min: 0, max: 100 },
  socialScore: { type: Number, required: true, min: 0, max: 100 },
  governanceScore: { type: Number, required: true, min: 0, max: 100 },
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  methodologyVersion: { type: String, default: 'EcoTrack ESG Index v1.0' },
  notes: { type: String, trim: true }
}, { timestamps: true });

// 7. SustainabilityGoal
export interface ISustainabilityGoal extends Document {
  organizationId: string;
  title: string;
  description: string;
  metricType: 'Energy Reduction' | 'Carbon Reduction' | 'Recycling Rate' | 'Renewable Share' | 'Water Efficiency';
  baselineValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  baselineDate: Date;
  targetDate: Date;
  status: 'In Progress' | 'Achieved' | 'At Risk' | 'Archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SustainabilityGoalSchema = new Schema<ISustainabilityGoal>({
  organizationId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  metricType: { 
    type: String, 
    enum: ['Energy Reduction', 'Carbon Reduction', 'Recycling Rate', 'Renewable Share', 'Water Efficiency'], 
    required: true 
  },
  baselineValue: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  targetValue: { type: Number, required: true },
  unit: { type: String, required: true },
  baselineDate: { type: Date, required: true },
  targetDate: { type: Date, required: true },
  status: { type: String, enum: ['In Progress', 'Achieved', 'At Risk', 'Archived'], default: 'In Progress' },
  createdBy: { type: String, required: true }
}, { timestamps: true });

// 8. Report
export interface IReport extends Document {
  organizationId: string;
  reportType: 'Annual Sustainability Report' | 'Carbon Emissions Report' | 'Energy Consumption Report' | 'ESG Performance Report' | 'Waste Management Report';
  reportingPeriod: string;
  generatedBy: string;
  generatedAt: Date;
  fileName: string;
  status: 'Completed' | 'Pending' | 'Failed';
  summary: {
    totalEnergyKWh?: number;
    totalEmissionsTCO2e?: number;
    recyclingRate?: number;
    overallESGScore?: number;
    activeGoalsCount?: number;
  };
  fileSize?: number;
  filePath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ReportSchema = new Schema<IReport>({
  organizationId: { type: String, required: true, index: true },
  reportType: { 
    type: String, 
    enum: [
      'Annual Sustainability Report', 
      'Carbon Emissions Report', 
      'Energy Consumption Report', 
      'ESG Performance Report', 
      'Waste Management Report'
    ], 
    required: true 
  },
  reportingPeriod: { type: String, required: true },
  generatedBy: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  fileName: { type: String, required: true },
  status: { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Completed' },
  summary: { type: Schema.Types.Mixed },
  fileSize: { type: Number },
  filePath: { type: String }
}, { timestamps: true });

// Register models safely with mongoose
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const OrganizationModel = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
export const EnergyRecordModel = mongoose.models.EnergyRecord || mongoose.model<IEnergyRecord>('EnergyRecord', EnergyRecordSchema);
export const EmissionRecordModel = mongoose.models.EmissionRecord || mongoose.model<IEmissionRecord>('EmissionRecord', EmissionRecordSchema);
export const WasteRecordModel = mongoose.models.WasteRecord || mongoose.model<IWasteRecord>('WasteRecord', WasteRecordSchema);
export const ESGMetricModel = mongoose.models.ESGMetric || mongoose.model<IESGMetric>('ESGMetric', ESGMetricSchema);
export const SustainabilityGoalModel = mongoose.models.SustainabilityGoal || mongoose.model<ISustainabilityGoal>('SustainabilityGoal', SustainabilityGoalSchema);
export const ReportModel = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
