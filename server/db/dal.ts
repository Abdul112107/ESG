import mongoose from 'mongoose';
import {
  UserModel,
  OrganizationModel,
  EnergyRecordModel,
  EmissionRecordModel,
  WasteRecordModel,
  ESGMetricModel,
  SustainabilityGoalModel,
  ReportModel,
} from '../models/schemas';
import { getStore, saveStore } from './connection';

function isMongooseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function generateId(): string {
  // 24-char hex string compatible with MongoDB ObjectId
  return Math.floor(Date.now() / 1000).toString(16) + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
}

export const dal = {
  // Organizations
  async findOrganizationById(id: string) {
    if (isMongooseConnected()) {
      return OrganizationModel.findById(id).lean();
    }
    const store = getStore();
    return store.organizations.find(o => o._id === id || o.id === id) || null;
  },

  async getFirstOrganization() {
    if (isMongooseConnected()) {
      return OrganizationModel.findOne().lean();
    }
    const store = getStore();
    return store.organizations[0] || null;
  },

  async createOrganization(data: any) {
    if (isMongooseConnected()) {
      const doc = new OrganizationModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newOrg = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.organizations.push(newOrg);
    saveStore();
    return newOrg;
  },

  async updateOrganization(id: string, data: any) {
    if (isMongooseConnected()) {
      return OrganizationModel.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true }).lean();
    }
    const store = getStore();
    const index = store.organizations.findIndex(o => o._id === id || o.id === id);
    if (index === -1) return null;
    store.organizations[index] = { ...store.organizations[index], ...data, updatedAt: new Date().toISOString() };
    saveStore();
    return store.organizations[index];
  },

  // Users
  async findUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongooseConnected()) {
      return UserModel.findOne({ email: cleanEmail }).lean();
    }
    const store = getStore();
    return store.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findUserById(id: string) {
    if (isMongooseConnected()) {
      return UserModel.findById(id).select('-passwordHash').lean();
    }
    const store = getStore();
    const user = store.users.find(u => u._id === id || u.id === id);
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  },

  async createUser(data: any) {
    if (isMongooseConnected()) {
      const doc = new UserModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newUser = {
      _id: generateId(),
      ...data,
      email: data.email.toLowerCase().trim(),
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.users.push(newUser);
    saveStore();
    return newUser;
  },

  async updateUser(id: string, data: any) {
    if (isMongooseConnected()) {
      return UserModel.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true }).select('-passwordHash').lean();
    }
    const store = getStore();
    const index = store.users.findIndex(u => u._id === id || u.id === id);
    if (index === -1) return null;
    store.users[index] = { ...store.users[index], ...data, updatedAt: new Date().toISOString() };
    saveStore();
    const { passwordHash, ...rest } = store.users[index];
    return rest;
  },

  // Energy Records
  async findEnergyRecords(filter: { organizationId: string; energyType?: string; facility?: string; startDate?: string; endDate?: string }) {
    if (isMongooseConnected()) {
      const query: any = { organizationId: filter.organizationId };
      if (filter.energyType) query.energyType = filter.energyType;
      if (filter.facility) query.facility = filter.facility;
      if (filter.startDate || filter.endDate) {
        query.recordDate = {};
        if (filter.startDate) query.recordDate.$gte = new Date(filter.startDate);
        if (filter.endDate) query.recordDate.$lte = new Date(filter.endDate);
      }
      return EnergyRecordModel.find(query).sort({ recordDate: -1 }).lean();
    }
    const store = getStore();
    return store.energyRecords.filter(r => {
      if (r.organizationId !== filter.organizationId) return false;
      if (filter.energyType && r.energyType !== filter.energyType) return false;
      if (filter.facility && r.facility !== filter.facility) return false;
      if (filter.startDate && new Date(r.recordDate) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(r.recordDate) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  },

  async findEnergyRecordById(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      return EnergyRecordModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.energyRecords.find(r => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },

  async createEnergyRecord(data: any) {
    if (isMongooseConnected()) {
      const doc = new EnergyRecordModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newRecord = {
      _id: generateId(),
      ...data,
      recordDate: new Date(data.recordDate).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.energyRecords.unshift(newRecord);
    saveStore();
    return newRecord;
  },

  async updateEnergyRecord(id: string, organizationId: string, data: any) {
    if (isMongooseConnected()) {
      return EnergyRecordModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.energyRecords.findIndex(r => (r._id === id || r.id === id) && r.organizationId === organizationId);
    if (index === -1) return null;
    store.energyRecords[index] = { ...store.energyRecords[index], ...data, updatedAt: new Date().toISOString() };
    saveStore();
    return store.energyRecords[index];
  },

  async deleteEnergyRecord(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      const result = await EnergyRecordModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.energyRecords.length;
    store.energyRecords = store.energyRecords.filter(r => !((r._id === id || r.id === id) && r.organizationId === organizationId));
    saveStore();
    return store.energyRecords.length < before;
  },

  // Emission Records
  async findEmissionRecords(filter: { organizationId: string; scope?: string; source?: string; startDate?: string; endDate?: string }) {
    if (isMongooseConnected()) {
      const query: any = { organizationId: filter.organizationId };
      if (filter.scope) query.scope = filter.scope;
      if (filter.source) query.source = filter.source;
      if (filter.startDate || filter.endDate) {
        query.recordDate = {};
        if (filter.startDate) query.recordDate.$gte = new Date(filter.startDate);
        if (filter.endDate) query.recordDate.$lte = new Date(filter.endDate);
      }
      return EmissionRecordModel.find(query).sort({ recordDate: -1 }).lean();
    }
    const store = getStore();
    return store.emissionRecords.filter(r => {
      if (r.organizationId !== filter.organizationId) return false;
      if (filter.scope && r.scope !== filter.scope) return false;
      if (filter.source && r.source !== filter.source) return false;
      if (filter.startDate && new Date(r.recordDate) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(r.recordDate) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  },

  async findEmissionRecordById(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      return EmissionRecordModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.emissionRecords.find(r => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },

  async createEmissionRecord(data: any) {
    if (isMongooseConnected()) {
      const doc = new EmissionRecordModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newRecord = {
      _id: generateId(),
      ...data,
      recordDate: new Date(data.recordDate).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.emissionRecords.unshift(newRecord);
    saveStore();
    return newRecord;
  },

  async updateEmissionRecord(id: string, organizationId: string, data: any) {
    if (isMongooseConnected()) {
      return EmissionRecordModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.emissionRecords.findIndex(r => (r._id === id || r.id === id) && r.organizationId === organizationId);
    if (index === -1) return null;
    store.emissionRecords[index] = { ...store.emissionRecords[index], ...data, updatedAt: new Date().toISOString() };
    saveStore();
    return store.emissionRecords[index];
  },

  async deleteEmissionRecord(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      const result = await EmissionRecordModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.emissionRecords.length;
    store.emissionRecords = store.emissionRecords.filter(r => !((r._id === id || r.id === id) && r.organizationId === organizationId));
    saveStore();
    return store.emissionRecords.length < before;
  },

  // Waste Records
  async findWasteRecords(filter: { organizationId: string; wasteType?: string; facility?: string; startDate?: string; endDate?: string }) {
    if (isMongooseConnected()) {
      const query: any = { organizationId: filter.organizationId };
      if (filter.wasteType) query.wasteType = filter.wasteType;
      if (filter.facility) query.facility = filter.facility;
      if (filter.startDate || filter.endDate) {
        query.recordDate = {};
        if (filter.startDate) query.recordDate.$gte = new Date(filter.startDate);
        if (filter.endDate) query.recordDate.$lte = new Date(filter.endDate);
      }
      return WasteRecordModel.find(query).sort({ recordDate: -1 }).lean();
    }
    const store = getStore();
    return store.wasteRecords.filter(r => {
      if (r.organizationId !== filter.organizationId) return false;
      if (filter.wasteType && r.wasteType !== filter.wasteType) return false;
      if (filter.facility && r.facility !== filter.facility) return false;
      if (filter.startDate && new Date(r.recordDate) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(r.recordDate) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  },

  async findWasteRecordById(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      return WasteRecordModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.wasteRecords.find(r => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },

  async createWasteRecord(data: any) {
    if (isMongooseConnected()) {
      const doc = new WasteRecordModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newRecord = {
      _id: generateId(),
      ...data,
      recordDate: new Date(data.recordDate).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.wasteRecords.unshift(newRecord);
    saveStore();
    return newRecord;
  },

  async updateWasteRecord(id: string, organizationId: string, data: any) {
    if (isMongooseConnected()) {
      return WasteRecordModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.wasteRecords.findIndex(r => (r._id === id || r.id === id) && r.organizationId === organizationId);
    if (index === -1) return null;
    store.wasteRecords[index] = { ...store.wasteRecords[index], ...data, updatedAt: new Date().toISOString() };
    saveStore();
    return store.wasteRecords[index];
  },

  async deleteWasteRecord(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      const result = await WasteRecordModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.wasteRecords.length;
    store.wasteRecords = store.wasteRecords.filter(r => !((r._id === id || r.id === id) && r.organizationId === organizationId));
    saveStore();
    return store.wasteRecords.length < before;
  },

  // ESG Metrics
  async findESGMetrics(organizationId: string) {
    if (isMongooseConnected()) {
      return ESGMetricModel.find({ organizationId }).sort({ createdAt: -1 }).lean();
    }
    const store = getStore();
    return store.esgMetrics.filter(m => m.organizationId === organizationId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createESGMetric(data: any) {
    const overallScore = Math.round(((data.environmentalScore + data.socialScore + data.governanceScore) / 3) * 10) / 10;
    const fullData = { ...data, overallScore };
    if (isMongooseConnected()) {
      const doc = new ESGMetricModel(fullData);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newMetric = {
      _id: generateId(),
      ...fullData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.esgMetrics.unshift(newMetric);
    saveStore();
    return newMetric;
  },

  async updateESGMetric(id: string, organizationId: string, data: any) {
    const overallScore = data.environmentalScore !== undefined && data.socialScore !== undefined && data.governanceScore !== undefined
      ? Math.round(((data.environmentalScore + data.socialScore + data.governanceScore) / 3) * 10) / 10
      : undefined;
    const updateData = overallScore !== undefined ? { ...data, overallScore } : data;

    if (isMongooseConnected()) {
      return ESGMetricModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.esgMetrics.findIndex(m => (m._id === id || m.id === id) && m.organizationId === organizationId);
    if (index === -1) return null;
    store.esgMetrics[index] = { ...store.esgMetrics[index], ...updateData, updatedAt: new Date().toISOString() };
    saveStore();
    return store.esgMetrics[index];
  },

  // Sustainability Goals
  async findGoals(organizationId: string) {
    if (isMongooseConnected()) {
      return SustainabilityGoalModel.find({ organizationId }).sort({ targetDate: 1 }).lean();
    }
    const store = getStore();
    return store.sustainabilityGoals.filter(g => g.organizationId === organizationId).sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  },

  async findGoalById(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      return SustainabilityGoalModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.sustainabilityGoals.find(g => (g._id === id || g.id === id) && g.organizationId === organizationId) || null;
  },

  async createGoal(data: any) {
    if (isMongooseConnected()) {
      const doc = new SustainabilityGoalModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newGoal = {
      _id: generateId(),
      ...data,
      baselineDate: new Date(data.baselineDate).toISOString(),
      targetDate: new Date(data.targetDate).toISOString(),
      status: data.status || 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.sustainabilityGoals.push(newGoal);
    saveStore();
    return newGoal;
  },

  async updateGoal(id: string, organizationId: string, data: any) {
    if (isMongooseConnected()) {
      return SustainabilityGoalModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.sustainabilityGoals.findIndex(g => (g._id === id || g.id === id) && g.organizationId === organizationId);
    if (index === -1) return null;
    store.sustainabilityGoals[index] = { ...store.sustainabilityGoals[index], ...data, updatedAt: new Date().toISOString() };
    saveStore();
    return store.sustainabilityGoals[index];
  },

  async deleteGoal(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      const result = await SustainabilityGoalModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.sustainabilityGoals.length;
    store.sustainabilityGoals = store.sustainabilityGoals.filter(g => !((g._id === id || g.id === id) && g.organizationId === organizationId));
    saveStore();
    return store.sustainabilityGoals.length < before;
  },

  // Reports
  async findReports(organizationId: string) {
    if (isMongooseConnected()) {
      return ReportModel.find({ organizationId }).sort({ generatedAt: -1 }).lean();
    }
    const store = getStore();
    return store.reports.filter(r => r.organizationId === organizationId).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  },

  async findReportById(id: string, organizationId: string) {
    if (isMongooseConnected()) {
      return ReportModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.reports.find(r => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },

  async createReport(data: any) {
    if (isMongooseConnected()) {
      const doc = new ReportModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newReport = {
      _id: generateId(),
      ...data,
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.reports.unshift(newReport);
    saveStore();
    return newReport;
  }
};
