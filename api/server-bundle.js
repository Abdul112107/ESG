import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// server/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// server/routes/authRoutes.ts
import { Router } from "express";
import { z } from "zod";

// server/db/dal.ts
import mongoose3 from "mongoose";

// server/models/schemas.ts
import mongoose, { Schema } from "mongoose";
var UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Manager", "Employee", "Auditor"], default: "Employee" },
  organizationId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
var OrganizationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  industry: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  reportingCurrency: { type: String, default: "USD" },
  reportingYear: { type: Number, default: 2026 }
}, { timestamps: true });
var EnergyRecordSchema = new Schema({
  organizationId: { type: String, required: true, index: true },
  facility: { type: String, required: true, trim: true, index: true },
  energyType: {
    type: String,
    enum: ["Electricity", "Natural Gas", "Diesel", "Solar", "District Heating"],
    required: true,
    index: true
  },
  consumption: { type: Number, required: true, min: [0, "Consumption must be positive"] },
  unit: { type: String, default: "kWh" },
  cost: { type: Number, required: true, min: [0, "Cost must be positive"] },
  recordDate: { type: Date, required: true, index: true },
  notes: { type: String, trim: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });
var EmissionRecordSchema = new Schema({
  organizationId: { type: String, required: true, index: true },
  source: { type: String, required: true, trim: true, index: true },
  scope: { type: String, enum: ["Scope 1", "Scope 2", "Scope 3"], required: true, index: true },
  activityValue: { type: Number, required: true, min: 0 },
  activityUnit: { type: String, required: true },
  emissionFactor: { type: Number, required: true, min: 0 },
  emissionFactorSource: { type: String, required: true },
  emissionFactorVersion: { type: String, required: true },
  emissionsKgCO2e: { type: Number, required: true, min: 0 },
  recordDate: { type: Date, required: true, index: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });
var WasteRecordSchema = new Schema({
  organizationId: { type: String, required: true, index: true },
  wasteType: {
    type: String,
    enum: [
      "Paper & Cardboard",
      "Plastic",
      "Metals",
      "Electronic Waste",
      "Hazardous Chemical",
      "Organic / Compost",
      "General Residual"
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
var ESGMetricSchema = new Schema({
  organizationId: { type: String, required: true, index: true },
  reportingPeriod: { type: String, required: true, index: true },
  environmentalScore: { type: Number, required: true, min: 0, max: 100 },
  socialScore: { type: Number, required: true, min: 0, max: 100 },
  governanceScore: { type: Number, required: true, min: 0, max: 100 },
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  methodologyVersion: { type: String, default: "EcoTrack ESG Index v1.0" },
  notes: { type: String, trim: true }
}, { timestamps: true });
var SustainabilityGoalSchema = new Schema({
  organizationId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  metricType: {
    type: String,
    enum: ["Energy Reduction", "Carbon Reduction", "Recycling Rate", "Renewable Share", "Water Efficiency"],
    required: true
  },
  baselineValue: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  targetValue: { type: Number, required: true },
  unit: { type: String, required: true },
  baselineDate: { type: Date, required: true },
  targetDate: { type: Date, required: true },
  status: { type: String, enum: ["In Progress", "Achieved", "At Risk", "Archived"], default: "In Progress" },
  createdBy: { type: String, required: true }
}, { timestamps: true });
var ReportSchema = new Schema({
  organizationId: { type: String, required: true, index: true },
  reportType: {
    type: String,
    enum: [
      "Annual Sustainability Report",
      "Carbon Emissions Report",
      "Energy Consumption Report",
      "ESG Performance Report",
      "Waste Management Report"
    ],
    required: true
  },
  reportingPeriod: { type: String, required: true },
  generatedBy: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  fileName: { type: String, required: true },
  status: { type: String, enum: ["Completed", "Pending", "Failed"], default: "Completed" },
  summary: { type: Schema.Types.Mixed },
  fileSize: { type: Number },
  filePath: { type: String }
}, { timestamps: true });
var UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
var OrganizationModel = mongoose.models.Organization || mongoose.model("Organization", OrganizationSchema);
var EnergyRecordModel = mongoose.models.EnergyRecord || mongoose.model("EnergyRecord", EnergyRecordSchema);
var EmissionRecordModel = mongoose.models.EmissionRecord || mongoose.model("EmissionRecord", EmissionRecordSchema);
var WasteRecordModel = mongoose.models.WasteRecord || mongoose.model("WasteRecord", WasteRecordSchema);
var ESGMetricModel = mongoose.models.ESGMetric || mongoose.model("ESGMetric", ESGMetricSchema);
var SustainabilityGoalModel = mongoose.models.SustainabilityGoal || mongoose.model("SustainabilityGoal", SustainabilityGoalSchema);
var ReportModel = mongoose.models.Report || mongoose.model("Report", ReportSchema);

// server/db/connection.ts
import mongoose2 from "mongoose";
import dns from "dns";
import fs from "fs";
import path from "path";
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    dns.setDefaultResultOrder("ipv4first");
  } catch (err) {
    console.warn("[DB] Custom DNS override skipped:", err);
  }
}
var dbStatus = {
  connected: false,
  type: "embedded",
  message: "Initializing database engine..."
};
var DATA_DIR = path.resolve(
  isServerless ? "/tmp" : process.cwd(),
  ".data"
);
var DB_FILE = path.resolve(DATA_DIR, "db.json");
var inMemoryStore = {
  users: [],
  organizations: [],
  energyRecords: [],
  emissionRecords: [],
  wasteRecords: [],
  esgMetrics: [],
  sustainabilityGoals: [],
  reports: []
};
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[DB] Could not create DATA_DIR:", err);
  }
}
function loadStore() {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      inMemoryStore = JSON.parse(content);
    }
  } catch (err) {
    console.error("[DB] Failed to load local persistent DB file, starting fresh:", err);
  }
  return inMemoryStore;
}
function saveStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryStore, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] Failed to save local persistent DB file:", err);
  }
}
function getStore() {
  return inMemoryStore;
}
async function connectDatabase(customUri) {
  const uri = customUri || process.env.MONGODB_URI;
  if (mongoose2.connection.readyState === 1) {
    dbStatus = {
      connected: true,
      type: "mongodb",
      host: mongoose2.connection.host,
      databaseName: mongoose2.connection.name,
      message: `Reusing active MongoDB connection (${mongoose2.connection.name || "default"} on ${mongoose2.connection.host})`
    };
    return dbStatus;
  }
  if (uri && uri.trim() !== "" && !uri.includes("username:password")) {
    try {
      console.log(`[DB] Connecting to MongoDB at: ${uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")}`);
      await mongoose2.connect(uri, {
        serverSelectionTimeoutMS: 5e3,
        connectTimeoutMS: 1e4
      });
      const host = mongoose2.connection.host;
      const databaseName = mongoose2.connection.name;
      dbStatus = {
        connected: true,
        type: "mongodb",
        host,
        databaseName,
        message: `Successfully connected to MongoDB (${databaseName || "default"} on ${host})`
      };
      console.log(`[DB] ${dbStatus.message}`);
      return dbStatus;
    } catch (err) {
      console.warn(`[DB] MongoDB connection failed: ${err.message}. Falling back to embedded persistent database.`);
      loadStore();
      dbStatus = {
        connected: false,
        type: "embedded",
        error: err.message,
        message: `MongoDB connection failed (${err.message}). Using embedded storage. Configure MONGODB_URI in settings to connect MongoDB Atlas.`
      };
      return dbStatus;
    }
  } else {
    loadStore();
    dbStatus = {
      connected: false,
      type: "embedded",
      message: "MONGODB_URI not configured. Operating in development mode with embedded persistent database. You can connect MongoDB Atlas in Settings."
    };
    console.log(`[DB] ${dbStatus.message}`);
    return dbStatus;
  }
}
function getDatabaseStatus() {
  if (mongoose2.connection.readyState === 1) {
    return {
      connected: true,
      type: "mongodb",
      host: mongoose2.connection.host,
      databaseName: mongoose2.connection.name,
      message: `Connected to MongoDB (${mongoose2.connection.name})`
    };
  }
  return dbStatus;
}

// server/db/dal.ts
function isMongooseConnected() {
  return mongoose3.connection.readyState === 1;
}
function generateId() {
  return Math.floor(Date.now() / 1e3).toString(16) + "xxxxxxxxxxxxxxxx".replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
}
var dal = {
  // Organizations
  async findOrganizationById(id) {
    if (isMongooseConnected()) {
      return OrganizationModel.findById(id).lean();
    }
    const store = getStore();
    return store.organizations.find((o) => o._id === id || o.id === id) || null;
  },
  async getFirstOrganization() {
    if (isMongooseConnected()) {
      return OrganizationModel.findOne().lean();
    }
    const store = getStore();
    return store.organizations[0] || null;
  },
  async createOrganization(data) {
    if (isMongooseConnected()) {
      const doc = new OrganizationModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newOrg = {
      _id: generateId(),
      ...data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.organizations.push(newOrg);
    saveStore();
    return newOrg;
  },
  async updateOrganization(id, data) {
    if (isMongooseConnected()) {
      return OrganizationModel.findByIdAndUpdate(id, { ...data, updatedAt: /* @__PURE__ */ new Date() }, { new: true }).lean();
    }
    const store = getStore();
    const index = store.organizations.findIndex((o) => o._id === id || o.id === id);
    if (index === -1) return null;
    store.organizations[index] = { ...store.organizations[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    saveStore();
    return store.organizations[index];
  },
  // Users
  async findUserByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (isMongooseConnected()) {
      return UserModel.findOne({ email: cleanEmail }).lean();
    }
    const store = getStore();
    return store.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },
  async findUserById(id) {
    if (isMongooseConnected()) {
      return UserModel.findById(id).select("-passwordHash").lean();
    }
    const store = getStore();
    const user = store.users.find((u) => u._id === id || u.id === id);
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  },
  async createUser(data) {
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.users.push(newUser);
    saveStore();
    return newUser;
  },
  async updateUser(id, data) {
    if (isMongooseConnected()) {
      return UserModel.findByIdAndUpdate(id, { ...data, updatedAt: /* @__PURE__ */ new Date() }, { new: true }).select("-passwordHash").lean();
    }
    const store = getStore();
    const index = store.users.findIndex((u) => u._id === id || u.id === id);
    if (index === -1) return null;
    store.users[index] = { ...store.users[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    saveStore();
    const { passwordHash, ...rest } = store.users[index];
    return rest;
  },
  // Energy Records
  async findEnergyRecords(filter) {
    if (isMongooseConnected()) {
      const query = { organizationId: filter.organizationId };
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
    return store.energyRecords.filter((r) => {
      if (r.organizationId !== filter.organizationId) return false;
      if (filter.energyType && r.energyType !== filter.energyType) return false;
      if (filter.facility && r.facility !== filter.facility) return false;
      if (filter.startDate && new Date(r.recordDate) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(r.recordDate) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  },
  async findEnergyRecordById(id, organizationId) {
    if (isMongooseConnected()) {
      return EnergyRecordModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.energyRecords.find((r) => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },
  async createEnergyRecord(data) {
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.energyRecords.unshift(newRecord);
    saveStore();
    return newRecord;
  },
  async updateEnergyRecord(id, organizationId, data) {
    if (isMongooseConnected()) {
      return EnergyRecordModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: /* @__PURE__ */ new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.energyRecords.findIndex((r) => (r._id === id || r.id === id) && r.organizationId === organizationId);
    if (index === -1) return null;
    store.energyRecords[index] = { ...store.energyRecords[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    saveStore();
    return store.energyRecords[index];
  },
  async deleteEnergyRecord(id, organizationId) {
    if (isMongooseConnected()) {
      const result = await EnergyRecordModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.energyRecords.length;
    store.energyRecords = store.energyRecords.filter((r) => !((r._id === id || r.id === id) && r.organizationId === organizationId));
    saveStore();
    return store.energyRecords.length < before;
  },
  // Emission Records
  async findEmissionRecords(filter) {
    if (isMongooseConnected()) {
      const query = { organizationId: filter.organizationId };
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
    return store.emissionRecords.filter((r) => {
      if (r.organizationId !== filter.organizationId) return false;
      if (filter.scope && r.scope !== filter.scope) return false;
      if (filter.source && r.source !== filter.source) return false;
      if (filter.startDate && new Date(r.recordDate) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(r.recordDate) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  },
  async findEmissionRecordById(id, organizationId) {
    if (isMongooseConnected()) {
      return EmissionRecordModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.emissionRecords.find((r) => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },
  async createEmissionRecord(data) {
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.emissionRecords.unshift(newRecord);
    saveStore();
    return newRecord;
  },
  async updateEmissionRecord(id, organizationId, data) {
    if (isMongooseConnected()) {
      return EmissionRecordModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: /* @__PURE__ */ new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.emissionRecords.findIndex((r) => (r._id === id || r.id === id) && r.organizationId === organizationId);
    if (index === -1) return null;
    store.emissionRecords[index] = { ...store.emissionRecords[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    saveStore();
    return store.emissionRecords[index];
  },
  async deleteEmissionRecord(id, organizationId) {
    if (isMongooseConnected()) {
      const result = await EmissionRecordModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.emissionRecords.length;
    store.emissionRecords = store.emissionRecords.filter((r) => !((r._id === id || r.id === id) && r.organizationId === organizationId));
    saveStore();
    return store.emissionRecords.length < before;
  },
  // Waste Records
  async findWasteRecords(filter) {
    if (isMongooseConnected()) {
      const query = { organizationId: filter.organizationId };
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
    return store.wasteRecords.filter((r) => {
      if (r.organizationId !== filter.organizationId) return false;
      if (filter.wasteType && r.wasteType !== filter.wasteType) return false;
      if (filter.facility && r.facility !== filter.facility) return false;
      if (filter.startDate && new Date(r.recordDate) < new Date(filter.startDate)) return false;
      if (filter.endDate && new Date(r.recordDate) > new Date(filter.endDate)) return false;
      return true;
    }).sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
  },
  async findWasteRecordById(id, organizationId) {
    if (isMongooseConnected()) {
      return WasteRecordModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.wasteRecords.find((r) => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },
  async createWasteRecord(data) {
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.wasteRecords.unshift(newRecord);
    saveStore();
    return newRecord;
  },
  async updateWasteRecord(id, organizationId, data) {
    if (isMongooseConnected()) {
      return WasteRecordModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: /* @__PURE__ */ new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.wasteRecords.findIndex((r) => (r._id === id || r.id === id) && r.organizationId === organizationId);
    if (index === -1) return null;
    store.wasteRecords[index] = { ...store.wasteRecords[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    saveStore();
    return store.wasteRecords[index];
  },
  async deleteWasteRecord(id, organizationId) {
    if (isMongooseConnected()) {
      const result = await WasteRecordModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.wasteRecords.length;
    store.wasteRecords = store.wasteRecords.filter((r) => !((r._id === id || r.id === id) && r.organizationId === organizationId));
    saveStore();
    return store.wasteRecords.length < before;
  },
  // ESG Metrics
  async findESGMetrics(organizationId) {
    if (isMongooseConnected()) {
      return ESGMetricModel.find({ organizationId }).sort({ createdAt: -1 }).lean();
    }
    const store = getStore();
    return store.esgMetrics.filter((m) => m.organizationId === organizationId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async createESGMetric(data) {
    const overallScore = Math.round((data.environmentalScore + data.socialScore + data.governanceScore) / 3 * 10) / 10;
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.esgMetrics.unshift(newMetric);
    saveStore();
    return newMetric;
  },
  async updateESGMetric(id, organizationId, data) {
    const overallScore = data.environmentalScore !== void 0 && data.socialScore !== void 0 && data.governanceScore !== void 0 ? Math.round((data.environmentalScore + data.socialScore + data.governanceScore) / 3 * 10) / 10 : void 0;
    const updateData = overallScore !== void 0 ? { ...data, overallScore } : data;
    if (isMongooseConnected()) {
      return ESGMetricModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...updateData, updatedAt: /* @__PURE__ */ new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.esgMetrics.findIndex((m) => (m._id === id || m.id === id) && m.organizationId === organizationId);
    if (index === -1) return null;
    store.esgMetrics[index] = { ...store.esgMetrics[index], ...updateData, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    saveStore();
    return store.esgMetrics[index];
  },
  // Sustainability Goals
  async findGoals(organizationId) {
    if (isMongooseConnected()) {
      return SustainabilityGoalModel.find({ organizationId }).sort({ targetDate: 1 }).lean();
    }
    const store = getStore();
    return store.sustainabilityGoals.filter((g) => g.organizationId === organizationId).sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  },
  async findGoalById(id, organizationId) {
    if (isMongooseConnected()) {
      return SustainabilityGoalModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.sustainabilityGoals.find((g) => (g._id === id || g.id === id) && g.organizationId === organizationId) || null;
  },
  async createGoal(data) {
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
      status: data.status || "In Progress",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.sustainabilityGoals.push(newGoal);
    saveStore();
    return newGoal;
  },
  async updateGoal(id, organizationId, data) {
    if (isMongooseConnected()) {
      return SustainabilityGoalModel.findOneAndUpdate(
        { _id: id, organizationId },
        { ...data, updatedAt: /* @__PURE__ */ new Date() },
        { new: true }
      ).lean();
    }
    const store = getStore();
    const index = store.sustainabilityGoals.findIndex((g) => (g._id === id || g.id === id) && g.organizationId === organizationId);
    if (index === -1) return null;
    store.sustainabilityGoals[index] = { ...store.sustainabilityGoals[index], ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    saveStore();
    return store.sustainabilityGoals[index];
  },
  async deleteGoal(id, organizationId) {
    if (isMongooseConnected()) {
      const result = await SustainabilityGoalModel.findOneAndDelete({ _id: id, organizationId });
      return !!result;
    }
    const store = getStore();
    const before = store.sustainabilityGoals.length;
    store.sustainabilityGoals = store.sustainabilityGoals.filter((g) => !((g._id === id || g.id === id) && g.organizationId === organizationId));
    saveStore();
    return store.sustainabilityGoals.length < before;
  },
  // Reports
  async findReports(organizationId) {
    if (isMongooseConnected()) {
      return ReportModel.find({ organizationId }).sort({ generatedAt: -1 }).lean();
    }
    const store = getStore();
    return store.reports.filter((r) => r.organizationId === organizationId).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  },
  async findReportById(id, organizationId) {
    if (isMongooseConnected()) {
      return ReportModel.findOne({ _id: id, organizationId }).lean();
    }
    const store = getStore();
    return store.reports.find((r) => (r._id === id || r.id === id) && r.organizationId === organizationId) || null;
  },
  async createReport(data) {
    if (isMongooseConnected()) {
      const doc = new ReportModel(data);
      const saved = await doc.save();
      return saved.toObject();
    }
    const store = getStore();
    const newReport = {
      _id: generateId(),
      ...data,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    store.reports.unshift(newReport);
    saveStore();
    return newReport;
  }
};

// server/services/authService.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "ecotrack-jwt-secret-key-prod-2026";
var JWT_EXPIRES_IN = "7d";
var authService = {
  validatePassword(password) {
    if (!password || password.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters long." };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one uppercase letter." };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one lowercase letter." };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one number." };
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return { isValid: false, error: "Password must contain at least one special character (e.g. !@#$%^&*)." };
    }
    return { isValid: true };
  },
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
};
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentication required. No token provided." });
  }
  const token = authHeader.split(" ")[1];
  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: "Invalid or expired authentication token." });
  }
  req.user = payload;
  next();
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`
      });
    }
    next();
  };
}

// server/routes/authRoutes.ts
var router = Router();
var RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["Admin", "Manager", "Employee", "Auditor"]).optional().default("Employee"),
  organizationId: z.string().optional()
});
var LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
router.post("/register", async (req, res) => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || "Validation error"
      });
    }
    const { name, email, password, role, organizationId } = parseResult.data;
    const pwdCheck = authService.validatePassword(password);
    if (!pwdCheck.isValid) {
      return res.status(400).json({ success: false, error: pwdCheck.error });
    }
    const existing = await dal.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: "A user with this email address already exists." });
    }
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId) {
      const defaultOrg = await dal.getFirstOrganization();
      resolvedOrgId = defaultOrg?._id || "default-org";
    }
    const passwordHash = await authService.hashPassword(password);
    const newUser = await dal.createUser({
      name,
      email,
      passwordHash,
      role,
      organizationId: resolvedOrgId,
      isActive: true
    });
    const token = authService.generateToken({
      userId: newUser._id || newUser.id,
      email: newUser.email,
      role: newUser.role,
      organizationId: newUser.organizationId
    });
    const { passwordHash: _, ...userSafe } = newUser;
    return res.status(201).json({
      success: true,
      token,
      user: userSafe
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ success: false, error: "Registration failed: " + err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const { email, password } = parseResult.data;
    const user = await dal.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, error: "Account has been deactivated. Please contact your administrator." });
    }
    const isMatch = await authService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }
    const token = authService.generateToken({
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    });
    const { passwordHash: _, ...userSafe } = user;
    return res.json({
      success: true,
      token,
      user: userSafe
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Login error: " + err.message });
  }
});
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await dal.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User profile not found." });
    }
    const org = await dal.findOrganizationById(user.organizationId);
    return res.json({
      success: true,
      user,
      organization: org
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var authRoutes_default = router;

// server/routes/organizationRoutes.ts
import { Router as Router2 } from "express";
import { z as z2 } from "zod";
var router2 = Router2();
var OrgUpdateSchema = z2.object({
  name: z2.string().min(2).optional(),
  industry: z2.string().min(2).optional(),
  location: z2.string().min(2).optional(),
  reportingCurrency: z2.string().min(1).optional(),
  reportingYear: z2.number().int().min(2e3).max(2100).optional()
});
router2.get("/", requireAuth, async (req, res) => {
  try {
    const org = await dal.findOrganizationById(req.user.organizationId);
    return res.json({ success: true, data: org });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router2.get("/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.organizationId !== req.params.id && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, error: "Unauthorized to access this organization" });
    }
    const org = await dal.findOrganizationById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }
    return res.json({ success: true, data: org });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router2.put("/:id", requireAuth, requireRole(["Admin"]), async (req, res) => {
  try {
    if (req.user.organizationId !== req.params.id) {
      return res.status(403).json({ success: false, error: "Unauthorized to modify another organization" });
    }
    const parseResult = OrgUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const updated = await dal.updateOrganization(req.params.id, parseResult.data);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var organizationRoutes_default = router2;

// server/routes/energyRoutes.ts
import { Router as Router3 } from "express";
import { z as z3 } from "zod";

// server/services/calculationService.ts
var OFFICIAL_EMISSION_FACTORS = [
  {
    id: "grid-elec-us",
    sourceName: "Purchased Electricity (Grid Average)",
    scope: "Scope 2",
    factor: 0.386,
    unit: "kWh",
    sourceAuthority: "EPA eGRID 2024",
    version: "v2024.1",
    description: "US national average grid emission factor per kilowatt-hour"
  },
  {
    id: "nat-gas-therm",
    sourceName: "Natural Gas (Stationary Combustion)",
    scope: "Scope 1",
    factor: 5.3,
    unit: "Therms",
    sourceAuthority: "EPA GHG Emission Factors Hub",
    version: "v2024.1",
    description: "Direct combustion of natural gas for facility heating"
  },
  {
    id: "diesel-fleet",
    sourceName: "Fleet Diesel (Mobile Combustion)",
    scope: "Scope 1",
    factor: 10.21,
    unit: "Gallons",
    sourceAuthority: "EPA GHG Emission Factors Hub",
    version: "v2024.1",
    description: "Direct fleet vehicle combustion per gallon of diesel"
  },
  {
    id: "air-travel-short",
    sourceName: "Commercial Flights (Short Haul)",
    scope: "Scope 3",
    factor: 0.245,
    unit: "passenger-km",
    sourceAuthority: "UK DEFRA / DESNZ",
    version: "v2024.1",
    description: "Business travel passenger-kilometer flights under 500 km"
  },
  {
    id: "air-travel-long",
    sourceName: "Commercial Flights (Long Haul)",
    scope: "Scope 3",
    factor: 0.15,
    unit: "passenger-km",
    sourceAuthority: "UK DEFRA / DESNZ",
    version: "v2024.1",
    description: "Business travel passenger-kilometer flights over 500 km"
  },
  {
    id: "mfg-feedstock",
    sourceName: "Industrial Processing Materials",
    scope: "Scope 3",
    factor: 1.82,
    unit: "kg",
    sourceAuthority: "IEA Industrial GHG Guide",
    version: "v2024.2",
    description: "Emissions associated with raw plastic and aluminum supply chain"
  }
];
var calculationService = {
  // Convert various energy units to standardized kWh for aggregate KPIs
  toStandardKWh(consumption, unit) {
    switch (unit) {
      case "MWh":
        return consumption * 1e3;
      case "Therms":
        return consumption * 29.3001;
      case "Gallons":
        return consumption * 40.7;
      // ~40.7 kWh per gallon of diesel
      case "kWh":
      default:
        return consumption;
    }
  },
  // Calculate carbon emissions in kgCO2e and tCO2e
  calculateEmissions(activityValue, emissionFactor) {
    const kgCO2e = Math.round(activityValue * emissionFactor * 100) / 100;
    const tCO2e = Math.round(kgCO2e / 1e3 * 1e3) / 1e3;
    return { kgCO2e, tCO2e };
  },
  // Calculate waste recycling rate
  calculateRecyclingRate(recycledKg, totalKg) {
    if (!totalKg || totalKg <= 0) return 0;
    const rate = recycledKg / totalKg * 100;
    return Math.round(rate * 10) / 10;
  },
  // Calculate overall ESG score
  calculateOverallESG(envScore, socialScore, govScore) {
    const raw = (envScore + socialScore + govScore) / 3;
    return Math.round(raw * 10) / 10;
  },
  // Calculate Goal Progress based on direction (reduction vs increase)
  calculateGoalProgress(metricType, baselineValue, currentValue, targetValue) {
    const isReduction = metricType.toLowerCase().includes("reduction") || baselineValue > targetValue;
    if (baselineValue === targetValue) {
      return {
        percentage: 100,
        rawPercentage: 100,
        isExceeded: false,
        isReduction,
        remaining: 0
      };
    }
    let rawPercentage = 0;
    let remaining = 0;
    if (isReduction) {
      const totalReductionNeeded = baselineValue - targetValue;
      const reductionAchieved = baselineValue - currentValue;
      rawPercentage = reductionAchieved / totalReductionNeeded * 100;
      remaining = Math.max(0, currentValue - targetValue);
    } else {
      const totalIncreaseNeeded = targetValue - baselineValue;
      const increaseAchieved = currentValue - baselineValue;
      rawPercentage = increaseAchieved / totalIncreaseNeeded * 100;
      remaining = Math.max(0, targetValue - currentValue);
    }
    const isExceeded = rawPercentage > 100;
    const clampedPercentage = Math.min(100, Math.max(0, Math.round(rawPercentage * 10) / 10));
    return {
      percentage: clampedPercentage,
      rawPercentage: Math.round(rawPercentage * 10) / 10,
      isExceeded,
      isReduction,
      remaining: Math.round(remaining * 10) / 10
    };
  }
};

// server/routes/energyRoutes.ts
var router3 = Router3();
var EnergyRecordSchema2 = z3.object({
  facility: z3.string().min(2, "Facility name must be at least 2 characters"),
  energyType: z3.enum(["Electricity", "Natural Gas", "Diesel", "Solar", "District Heating"]),
  consumption: z3.number().positive("Consumption must be a positive number"),
  unit: z3.enum(["kWh", "MWh", "Therms", "Gallons"]).default("kWh"),
  cost: z3.number().min(0, "Cost must be non-negative"),
  recordDate: z3.string().min(1, "Record date is required"),
  notes: z3.string().optional()
});
router3.get("/", requireAuth, async (req, res) => {
  try {
    const { energyType, facility, startDate, endDate } = req.query;
    const organizationId = req.user.organizationId;
    const records = await dal.findEnergyRecords({
      organizationId,
      energyType: energyType || void 0,
      facility: facility || void 0,
      startDate: startDate || void 0,
      endDate: endDate || void 0
    });
    const totalConsumptionKWh = records.reduce((sum, r) => sum + calculationService.toStandardKWh(r.consumption, r.unit), 0);
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const byType = {};
    records.forEach((r) => {
      byType[r.energyType] = (byType[r.energyType] || 0) + calculationService.toStandardKWh(r.consumption, r.unit);
    });
    return res.json({
      success: true,
      data: records,
      summary: {
        totalRecords: records.length,
        totalConsumptionKWh: Math.round(totalConsumptionKWh * 10) / 10,
        totalCost: Math.round(totalCost * 100) / 100,
        byType
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router3.get("/:id", requireAuth, async (req, res) => {
  try {
    const record = await dal.findEnergyRecordById(req.params.id, req.user.organizationId);
    if (!record) {
      return res.status(404).json({ success: false, error: "Energy record not found" });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router3.post("/", requireAuth, requireRole(["Admin", "Manager", "Employee"]), async (req, res) => {
  try {
    const parseResult = EnergyRecordSchema2.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const newRecord = await dal.createEnergyRecord({
      ...parseResult.data,
      organizationId: req.user.organizationId,
      createdBy: req.user.email
    });
    return res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router3.put("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const parseResult = EnergyRecordSchema2.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const updated = await dal.updateEnergyRecord(req.params.id, req.user.organizationId, parseResult.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Energy record not found or unauthorized" });
    }
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router3.delete("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const success = await dal.deleteEnergyRecord(req.params.id, req.user.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: "Energy record not found" });
    }
    return res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var energyRoutes_default = router3;

// server/routes/emissionRoutes.ts
import { Router as Router4 } from "express";
import { z as z4 } from "zod";
var router4 = Router4();
var EmissionRecordSchema2 = z4.object({
  source: z4.string().min(2, "Source name is required"),
  scope: z4.enum(["Scope 1", "Scope 2", "Scope 3"]),
  activityValue: z4.number().positive("Activity value must be greater than zero"),
  activityUnit: z4.string().min(1, "Activity unit is required"),
  emissionFactor: z4.number().positive("Emission factor must be positive"),
  emissionFactorSource: z4.string().min(1, "Emission factor source is required"),
  emissionFactorVersion: z4.string().default("v2024.1"),
  recordDate: z4.string().min(1, "Record date is required")
});
router4.get("/factors", requireAuth, (_req, res) => {
  return res.json({
    success: true,
    data: OFFICIAL_EMISSION_FACTORS
  });
});
router4.get("/", requireAuth, async (req, res) => {
  try {
    const { scope, source, startDate, endDate } = req.query;
    const organizationId = req.user.organizationId;
    const records = await dal.findEmissionRecords({
      organizationId,
      scope: scope || void 0,
      source: source || void 0,
      startDate: startDate || void 0,
      endDate: endDate || void 0
    });
    const totalEmissionsKg = records.reduce((sum, r) => sum + (r.emissionsKgCO2e || 0), 0);
    const totalEmissionsTCO2e = Math.round(totalEmissionsKg / 1e3 * 1e3) / 1e3;
    const byScope = {
      "Scope 1": Math.round(records.filter((r) => r.scope === "Scope 1").reduce((s, r) => s + r.emissionsKgCO2e, 0) / 1e3 * 100) / 100,
      "Scope 2": Math.round(records.filter((r) => r.scope === "Scope 2").reduce((s, r) => s + r.emissionsKgCO2e, 0) / 1e3 * 100) / 100,
      "Scope 3": Math.round(records.filter((r) => r.scope === "Scope 3").reduce((s, r) => s + r.emissionsKgCO2e, 0) / 1e3 * 100) / 100
    };
    return res.json({
      success: true,
      data: records,
      summary: {
        totalRecords: records.length,
        totalEmissionsKg: Math.round(totalEmissionsKg * 10) / 10,
        totalEmissionsTCO2e,
        byScope
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router4.get("/:id", requireAuth, async (req, res) => {
  try {
    const record = await dal.findEmissionRecordById(req.params.id, req.user.organizationId);
    if (!record) {
      return res.status(404).json({ success: false, error: "Emission record not found" });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router4.post("/", requireAuth, requireRole(["Admin", "Manager", "Employee"]), async (req, res) => {
  try {
    const parseResult = EmissionRecordSchema2.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const { activityValue, emissionFactor } = parseResult.data;
    const { kgCO2e } = calculationService.calculateEmissions(activityValue, emissionFactor);
    const newRecord = await dal.createEmissionRecord({
      ...parseResult.data,
      emissionsKgCO2e: kgCO2e,
      organizationId: req.user.organizationId,
      createdBy: req.user.email
    });
    return res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router4.put("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const parseResult = EmissionRecordSchema2.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const existing = await dal.findEmissionRecordById(req.params.id, req.user.organizationId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Emission record not found" });
    }
    const activityValue = parseResult.data.activityValue ?? existing.activityValue;
    const emissionFactor = parseResult.data.emissionFactor ?? existing.emissionFactor;
    const { kgCO2e } = calculationService.calculateEmissions(activityValue, emissionFactor);
    const updated = await dal.updateEmissionRecord(req.params.id, req.user.organizationId, {
      ...parseResult.data,
      emissionsKgCO2e: kgCO2e
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router4.delete("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const success = await dal.deleteEmissionRecord(req.params.id, req.user.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: "Emission record not found" });
    }
    return res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var emissionRoutes_default = router4;

// server/routes/wasteRoutes.ts
import { Router as Router5 } from "express";
import { z as z5 } from "zod";
var router5 = Router5();
var WasteRecordSchema2 = z5.object({
  wasteType: z5.enum([
    "Paper & Cardboard",
    "Plastic",
    "Metals",
    "Electronic Waste",
    "Hazardous Chemical",
    "Organic / Compost",
    "General Residual"
  ]),
  totalWasteKg: z5.number().positive("Total waste must be greater than zero"),
  recycledWasteKg: z5.number().min(0, "Recycled waste cannot be negative"),
  disposedWasteKg: z5.number().min(0, "Disposed waste cannot be negative"),
  recordDate: z5.string().min(1, "Record date is required"),
  facility: z5.string().min(2, "Facility is required")
}).refine((data) => data.recycledWasteKg + data.disposedWasteKg <= data.totalWasteKg + 0.01, {
  message: "Recycled waste plus disposed waste cannot exceed total waste generated.",
  path: ["recycledWasteKg"]
});
router5.get("/", requireAuth, async (req, res) => {
  try {
    const { wasteType, facility, startDate, endDate } = req.query;
    const organizationId = req.user.organizationId;
    const records = await dal.findWasteRecords({
      organizationId,
      wasteType: wasteType || void 0,
      facility: facility || void 0,
      startDate: startDate || void 0,
      endDate: endDate || void 0
    });
    const totalWasteKg = records.reduce((s, r) => s + (r.totalWasteKg || 0), 0);
    const recycledWasteKg = records.reduce((s, r) => s + (r.recycledWasteKg || 0), 0);
    const disposedWasteKg = records.reduce((s, r) => s + (r.disposedWasteKg || 0), 0);
    const recyclingRate = calculationService.calculateRecyclingRate(recycledWasteKg, totalWasteKg);
    const byType = {};
    records.forEach((r) => {
      if (!byType[r.wasteType]) {
        byType[r.wasteType] = { total: 0, recycled: 0, disposed: 0 };
      }
      byType[r.wasteType].total += r.totalWasteKg;
      byType[r.wasteType].recycled += r.recycledWasteKg;
      byType[r.wasteType].disposed += r.disposedWasteKg;
    });
    return res.json({
      success: true,
      data: records,
      summary: {
        totalRecords: records.length,
        totalWasteKg: Math.round(totalWasteKg * 10) / 10,
        recycledWasteKg: Math.round(recycledWasteKg * 10) / 10,
        disposedWasteKg: Math.round(disposedWasteKg * 10) / 10,
        recyclingRate,
        byType
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router5.get("/:id", requireAuth, async (req, res) => {
  try {
    const record = await dal.findWasteRecordById(req.params.id, req.user.organizationId);
    if (!record) {
      return res.status(404).json({ success: false, error: "Waste record not found" });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router5.post("/", requireAuth, requireRole(["Admin", "Manager", "Employee"]), async (req, res) => {
  try {
    const parseResult = WasteRecordSchema2.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const newRecord = await dal.createWasteRecord({
      ...parseResult.data,
      organizationId: req.user.organizationId,
      createdBy: req.user.email
    });
    return res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router5.put("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const existing = await dal.findWasteRecordById(req.params.id, req.user.organizationId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Waste record not found" });
    }
    const merged = { ...existing, ...req.body };
    const parseResult = WasteRecordSchema2.safeParse(merged);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const updated = await dal.updateWasteRecord(req.params.id, req.user.organizationId, parseResult.data);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router5.delete("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const success = await dal.deleteWasteRecord(req.params.id, req.user.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: "Waste record not found" });
    }
    return res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var wasteRoutes_default = router5;

// server/routes/esgRoutes.ts
import { Router as Router6 } from "express";
import { z as z6 } from "zod";
var router6 = Router6();
var ESGMetricSchema2 = z6.object({
  reportingPeriod: z6.string().min(2, "Reporting period is required (e.g. 2026-Q1)"),
  environmentalScore: z6.number().min(0).max(100, "Score must be between 0 and 100"),
  socialScore: z6.number().min(0).max(100, "Score must be between 0 and 100"),
  governanceScore: z6.number().min(0).max(100, "Score must be between 0 and 100"),
  methodologyVersion: z6.string().default("EcoTrack ESG Framework v2026.1"),
  notes: z6.string().optional()
});
router6.get("/", requireAuth, async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const metrics = await dal.findESGMetrics(organizationId);
    const latest = metrics[0] || null;
    const history = [...metrics].reverse();
    return res.json({
      success: true,
      data: metrics,
      latest,
      history,
      methodology: {
        formula: "Overall ESG Score = (Environmental Score + Social Score + Governance Score) / 3",
        description: "Transparent 3-pillar composite scoring model normalized on a 0-100 index.",
        version: latest?.methodologyVersion || "EcoTrack ESG Framework v2026.1"
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router6.post("/", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const parseResult = ESGMetricSchema2.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const { environmentalScore, socialScore, governanceScore } = parseResult.data;
    const overallScore = calculationService.calculateOverallESG(environmentalScore, socialScore, governanceScore);
    const created = await dal.createESGMetric({
      ...parseResult.data,
      overallScore,
      organizationId: req.user.organizationId
    });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router6.put("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const parseResult = ESGMetricSchema2.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const updated = await dal.updateESGMetric(req.params.id, req.user.organizationId, parseResult.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: "ESG record not found" });
    }
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var esgRoutes_default = router6;

// server/routes/goalRoutes.ts
import { Router as Router7 } from "express";
import { z as z7 } from "zod";
var router7 = Router7();
var GoalSchema = z7.object({
  title: z7.string().min(3, "Goal title is required"),
  description: z7.string().min(5, "Description is required"),
  metricType: z7.enum(["Energy Reduction", "Carbon Reduction", "Recycling Rate", "Renewable Share", "Water Efficiency"]),
  baselineValue: z7.number(),
  currentValue: z7.number(),
  targetValue: z7.number(),
  unit: z7.string().min(1, "Unit is required"),
  baselineDate: z7.string().min(1, "Baseline date is required"),
  targetDate: z7.string().min(1, "Target date is required"),
  status: z7.enum(["In Progress", "Achieved", "At Risk", "Archived"]).default("In Progress")
});
router7.get("/", requireAuth, async (req, res) => {
  try {
    const goals = await dal.findGoals(req.user.organizationId);
    const augmentedGoals = goals.map((g) => {
      const progress = calculationService.calculateGoalProgress(
        g.metricType,
        g.baselineValue,
        g.currentValue,
        g.targetValue
      );
      return {
        ...g,
        progressPercentage: progress.percentage,
        rawProgressPercentage: progress.rawPercentage,
        isExceeded: progress.isExceeded,
        isReduction: progress.isReduction,
        remainingToTarget: progress.remaining
      };
    });
    const activeGoals = augmentedGoals.filter((g) => g.status === "In Progress");
    const achievedGoals = augmentedGoals.filter((g) => g.status === "Achieved" || g.isExceeded);
    return res.json({
      success: true,
      data: augmentedGoals,
      summary: {
        total: goals.length,
        active: activeGoals.length,
        achieved: achievedGoals.length
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router7.post("/", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const parseResult = GoalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const created = await dal.createGoal({
      ...parseResult.data,
      organizationId: req.user.organizationId,
      createdBy: req.user.email
    });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router7.put("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const parseResult = GoalSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const updated = await dal.updateGoal(req.params.id, req.user.organizationId, parseResult.data);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Sustainability goal not found" });
    }
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router7.delete("/:id", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const success = await dal.deleteGoal(req.params.id, req.user.organizationId);
    if (!success) {
      return res.status(404).json({ success: false, error: "Goal not found" });
    }
    return res.json({ success: true, message: "Goal deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var goalRoutes_default = router7;

// server/routes/dashboardRoutes.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.get("/overview", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;
    const organizationId = req.user.organizationId;
    let computedStartDate = startDate;
    let computedEndDate = endDate;
    if (year && !startDate && !endDate) {
      computedStartDate = `${year}-01-01`;
      computedEndDate = `${year}-12-31T23:59:59`;
    }
    const [energyRecords, emissionRecords, wasteRecords, esgMetrics, rawGoals] = await Promise.all([
      dal.findEnergyRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findEmissionRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findWasteRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findESGMetrics(organizationId),
      dal.findGoals(organizationId)
    ]);
    const totalEnergyKWh = energyRecords.reduce((sum, r) => sum + calculationService.toStandardKWh(r.consumption, r.unit), 0);
    const totalEnergyCost = energyRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalEmissionsKg = emissionRecords.reduce((sum, r) => sum + (r.emissionsKgCO2e || 0), 0);
    const totalEmissionsTCO2e = Math.round(totalEmissionsKg / 1e3 * 100) / 100;
    const totalWasteKg = wasteRecords.reduce((s, r) => s + (r.totalWasteKg || 0), 0);
    const recycledWasteKg = wasteRecords.reduce((s, r) => s + (r.recycledWasteKg || 0), 0);
    const recyclingRate = calculationService.calculateRecyclingRate(recycledWasteKg, totalWasteKg);
    const latestESG = esgMetrics[0] || {
      environmentalScore: 0,
      socialScore: 0,
      governanceScore: 0,
      overallScore: 0
    };
    const goalsWithProgress = rawGoals.map((g) => ({
      ...g,
      progress: calculationService.calculateGoalProgress(g.metricType, g.baselineValue, g.currentValue, g.targetValue)
    }));
    const recentActivity = [
      ...energyRecords.slice(0, 5).map((r) => ({
        id: r._id || r.id,
        category: "Energy",
        title: `${r.energyType} at ${r.facility}`,
        value: `${r.consumption.toLocaleString()} ${r.unit}`,
        date: r.recordDate,
        createdBy: r.createdBy
      })),
      ...emissionRecords.slice(0, 5).map((r) => ({
        id: r._id || r.id,
        category: "Emissions",
        title: `${r.source} (${r.scope})`,
        value: `${(r.emissionsKgCO2e / 1e3).toFixed(2)} tCO2e`,
        date: r.recordDate,
        createdBy: r.createdBy
      })),
      ...wasteRecords.slice(0, 5).map((r) => ({
        id: r._id || r.id,
        category: "Waste",
        title: `${r.wasteType} at ${r.facility}`,
        value: `${r.recycledWasteKg.toLocaleString()} / ${r.totalWasteKg.toLocaleString()} kg recycled`,
        date: r.recordDate,
        createdBy: r.createdBy
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    return res.json({
      success: true,
      data: {
        kpis: {
          totalEnergyKWh: Math.round(totalEnergyKWh),
          totalEnergyCost: Math.round(totalEnergyCost),
          totalEmissionsTCO2e,
          wasteRecyclingRate: recyclingRate,
          totalWasteKg: Math.round(totalWasteKg),
          recycledWasteKg: Math.round(recycledWasteKg),
          overallESGScore: latestESG.overallScore,
          environmentalScore: latestESG.environmentalScore,
          socialScore: latestESG.socialScore,
          governanceScore: latestESG.governanceScore,
          activeGoalsCount: rawGoals.filter((g) => g.status === "In Progress").length,
          achievedGoalsCount: rawGoals.filter((g) => g.status === "Achieved").length
        },
        goals: goalsWithProgress.slice(0, 4),
        recentActivity
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router8.get("/trends", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;
    const organizationId = req.user.organizationId;
    let computedStartDate = startDate;
    let computedEndDate = endDate;
    if (year && !startDate && !endDate) {
      computedStartDate = `${year}-01-01`;
      computedEndDate = `${year}-12-31T23:59:59`;
    }
    const [energyRecords, emissionRecords] = await Promise.all([
      dal.findEnergyRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate }),
      dal.findEmissionRecords({ organizationId, startDate: computedStartDate, endDate: computedEndDate })
    ]);
    const monthMap = {};
    energyRecords.forEach((r) => {
      const d = new Date(r.recordDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (!monthMap[key]) {
        monthMap[key] = { month: monthLabel, energyKWh: 0, emissionsTCO2e: 0, cost: 0, rawDate: d };
      }
      monthMap[key].energyKWh += calculationService.toStandardKWh(r.consumption, r.unit);
      monthMap[key].cost += r.cost || 0;
    });
    emissionRecords.forEach((r) => {
      const d = new Date(r.recordDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (!monthMap[key]) {
        monthMap[key] = { month: monthLabel, energyKWh: 0, emissionsTCO2e: 0, cost: 0, rawDate: d };
      }
      monthMap[key].emissionsTCO2e += (r.emissionsKgCO2e || 0) / 1e3;
    });
    const series = Object.keys(monthMap).sort().map((k) => ({
      month: monthMap[k].month,
      key: k,
      energyKWh: Math.round(monthMap[k].energyKWh),
      emissionsTCO2e: Math.round(monthMap[k].emissionsTCO2e * 100) / 100,
      cost: Math.round(monthMap[k].cost)
    }));
    return res.json({
      success: true,
      data: series
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router8.get("/emissions-by-source", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const organizationId = req.user.organizationId;
    const records = await dal.findEmissionRecords({ organizationId, startDate, endDate });
    const sourceMap = {};
    const scopeMap = { "Scope 1": 0, "Scope 2": 0, "Scope 3": 0 };
    records.forEach((r) => {
      const tCO2e = (r.emissionsKgCO2e || 0) / 1e3;
      if (!sourceMap[r.source]) {
        sourceMap[r.source] = { name: r.source, value: 0, scope: r.scope };
      }
      sourceMap[r.source].value += tCO2e;
      scopeMap[r.scope] = (scopeMap[r.scope] || 0) + tCO2e;
    });
    const bySource = Object.values(sourceMap).map((s) => ({
      name: s.name,
      value: Math.round(s.value * 100) / 100,
      scope: s.scope
    })).sort((a, b) => b.value - a.value);
    const byScope = Object.entries(scopeMap).map(([scope, val]) => ({
      name: scope,
      value: Math.round(val * 100) / 100
    }));
    return res.json({
      success: true,
      data: {
        bySource,
        byScope
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
var dashboardRoutes_default = router8;

// server/routes/reportRoutes.ts
import { Router as Router9 } from "express";
import { z as z8 } from "zod";
import fs3 from "fs";

// server/services/pdfService.ts
import fs2 from "fs";
import path2 from "path";
var isServerless2 = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var REPORTS_DIR = path2.resolve(
  isServerless2 ? "/tmp" : process.cwd(),
  ".data",
  "reports"
);
function ensureReportsDir() {
  try {
    if (!fs2.existsSync(REPORTS_DIR)) {
      fs2.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[PDF] Could not create reports directory:", err);
  }
}
var pdfService = {
  async generateReport(params) {
    ensureReportsDir();
    const org = await dal.findOrganizationById(params.organizationId);
    const orgName = org?.name || "EcoVerde Global Corp";
    const currency = org?.reportingCurrency || "USD";
    const [energyRecords, emissionRecords, wasteRecords, esgMetrics, goals] = await Promise.all([
      dal.findEnergyRecords({ organizationId: params.organizationId, startDate: params.startDate, endDate: params.endDate }),
      dal.findEmissionRecords({ organizationId: params.organizationId, startDate: params.startDate, endDate: params.endDate }),
      dal.findWasteRecords({ organizationId: params.organizationId, startDate: params.startDate, endDate: params.endDate }),
      dal.findESGMetrics(params.organizationId),
      dal.findGoals(params.organizationId)
    ]);
    const totalEnergyKWh = energyRecords.reduce((sum, r) => sum + calculationService.toStandardKWh(r.consumption, r.unit), 0);
    const totalEnergyCost = energyRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalEmissionsKg = emissionRecords.reduce((sum, r) => sum + (r.emissionsKgCO2e || 0), 0);
    const totalEmissionsTCO2e = Math.round(totalEmissionsKg / 1e3 * 100) / 100;
    const scope1Kg = emissionRecords.filter((r) => r.scope === "Scope 1").reduce((s, r) => s + r.emissionsKgCO2e, 0);
    const scope2Kg = emissionRecords.filter((r) => r.scope === "Scope 2").reduce((s, r) => s + r.emissionsKgCO2e, 0);
    const scope3Kg = emissionRecords.filter((r) => r.scope === "Scope 3").reduce((s, r) => s + r.emissionsKgCO2e, 0);
    const totalWasteKg = wasteRecords.reduce((s, r) => s + (r.totalWasteKg || 0), 0);
    const recycledWasteKg = wasteRecords.reduce((s, r) => s + (r.recycledWasteKg || 0), 0);
    const disposedWasteKg = wasteRecords.reduce((s, r) => s + (r.disposedWasteKg || 0), 0);
    const recyclingRate = calculationService.calculateRecyclingRate(recycledWasteKg, totalWasteKg);
    const latestESG = esgMetrics[0] || {
      environmentalScore: 0,
      socialScore: 0,
      governanceScore: 0,
      overallScore: 0,
      methodologyVersion: "EcoTrack ESG Index v1.0"
    };
    const summary = {
      totalEnergyKWh: Math.round(totalEnergyKWh),
      totalEnergyCost: Math.round(totalEnergyCost),
      totalEmissionsTCO2e,
      scope1TCO2e: Math.round(scope1Kg / 1e3 * 100) / 100,
      scope2TCO2e: Math.round(scope2Kg / 1e3 * 100) / 100,
      scope3TCO2e: Math.round(scope3Kg / 1e3 * 100) / 100,
      totalWasteKg: Math.round(totalWasteKg),
      recyclingRate,
      overallESGScore: latestESG.overallScore,
      activeGoalsCount: goals.filter((g) => g.status === "In Progress").length
    };
    const timestamp = Date.now();
    const safeType = params.reportType.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const fileName = `${safeType}_${params.reportingPeriod}_${timestamp}.pdf`;
    const filePath = path2.resolve(REPORTS_DIR, fileName);
    const { default: PDFDocument } = await import("pdfkit");
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const stream = fs2.createWriteStream(filePath);
      doc.pipe(stream);
      doc.rect(40, 40, 515, 60).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(18).text("ECOTRACK SUSTAINABILITY REPORT", 55, 52, { characterSpacing: 1 });
      doc.fontSize(10).fillColor("#10b981").text(params.reportType.toUpperCase(), 55, 75);
      doc.fillColor("#94a3b8").fontSize(9).text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { dateStyle: "medium" })} | Period: ${params.reportingPeriod}`, 280, 75, { align: "right" });
      doc.moveDown(4);
      doc.fillColor("#0f172a").fontSize(14).text(orgName, 40, 115);
      doc.fillColor("#64748b").fontSize(9).text(`Industry: ${org?.industry || "Manufacturing"}  \xB7  Location: ${org?.location || "Global Operations"}  \xB7  Currency: ${currency}`, 40, 133);
      doc.moveTo(40, 150).lineTo(555, 150).strokeColor("#e2e8f0").lineWidth(1).stroke();
      doc.fillColor("#0f172a").fontSize(11).text("EXECUTIVE SUSTAINABILITY SUMMARY", 40, 165);
      const boxY = 185;
      const boxW = 120;
      const boxH = 50;
      doc.rect(40, boxY, boxW, boxH).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#64748b").fontSize(8).text("TOTAL ENERGY", 50, boxY + 8);
      doc.fillColor("#0f172a").fontSize(13).text(`${summary.totalEnergyKWh.toLocaleString()} kWh`, 50, boxY + 22);
      doc.rect(170, boxY, boxW, boxH).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#64748b").fontSize(8).text("CARBON EMISSIONS", 180, boxY + 8);
      doc.fillColor("#0f172a").fontSize(13).text(`${summary.totalEmissionsTCO2e} tCO2e`, 180, boxY + 22);
      doc.rect(300, boxY, boxW, boxH).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#64748b").fontSize(8).text("RECYCLING RATE", 310, boxY + 8);
      doc.fillColor("#0f172a").fontSize(13).text(`${summary.recyclingRate}%`, 310, boxY + 22);
      doc.rect(430, boxY, boxW, boxH).fillAndStroke("#f8fafc", "#cbd5e1");
      doc.fillColor("#64748b").fontSize(8).text("OVERALL ESG SCORE", 440, boxY + 8);
      doc.fillColor("#0f172a").fontSize(13).text(`${summary.overallESGScore} / 100`, 440, boxY + 22);
      let currentY = 250;
      if (["Annual Sustainability Report", "Carbon Emissions Report"].includes(params.reportType)) {
        doc.fillColor("#0f172a").fontSize(11).text("1. GREENHOUSE GAS EMISSIONS BY SCOPE", 40, currentY);
        currentY += 16;
        doc.fillColor("#475569").fontSize(9).text("Measured in metric tons of carbon dioxide equivalent (tCO2e) adhering to the GHG Protocol Corporate Standard:", 40, currentY);
        currentY += 16;
        doc.rect(40, currentY, 515, 20).fill("#f1f5f9");
        doc.fillColor("#334155").fontSize(8).text("GHG SCOPE", 50, currentY + 6);
        doc.text("DESCRIPTION", 140, currentY + 6);
        doc.text("RECORDS", 360, currentY + 6);
        doc.text("EMISSIONS (tCO2e)", 440, currentY + 6, { align: "right" });
        currentY += 22;
        const scopeRows = [
          { scope: "Scope 1 (Direct)", desc: "Natural gas combustion, vehicle fleet fuel", count: emissionRecords.filter((r) => r.scope === "Scope 1").length, t: summary.scope1TCO2e },
          { scope: "Scope 2 (Indirect)", desc: "Purchased electricity and steam", count: emissionRecords.filter((r) => r.scope === "Scope 2").length, t: summary.scope2TCO2e },
          { scope: "Scope 3 (Value Chain)", desc: "Business travel, logistics & procurement", count: emissionRecords.filter((r) => r.scope === "Scope 3").length, t: summary.scope3TCO2e }
        ];
        for (const row of scopeRows) {
          doc.fillColor("#1e293b").fontSize(8).text(row.scope, 50, currentY);
          doc.fillColor("#64748b").text(row.desc, 140, currentY);
          doc.text(String(row.count), 370, currentY);
          doc.fillColor("#0f172a").text(`${row.t.toFixed(2)} tCO2e`, 440, currentY, { align: "right" });
          currentY += 16;
        }
        doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor("#e2e8f0").stroke();
        currentY += 18;
      }
      if (["Annual Sustainability Report", "Energy Consumption Report"].includes(params.reportType)) {
        doc.fillColor("#0f172a").fontSize(11).text("2. ENERGY CONSUMPTION & EXPENDITURE", 40, currentY);
        currentY += 16;
        doc.rect(40, currentY, 515, 20).fill("#f1f5f9");
        doc.fillColor("#334155").fontSize(8).text("ENERGY TYPE", 50, currentY + 6);
        doc.text("FACILITY", 160, currentY + 6);
        doc.text("CONSUMPTION", 310, currentY + 6);
        doc.text(`COST (${currency})`, 440, currentY + 6, { align: "right" });
        currentY += 22;
        const sampleRecords = energyRecords.slice(0, 5);
        for (const rec of sampleRecords) {
          doc.fillColor("#1e293b").fontSize(8).text(rec.energyType, 50, currentY);
          doc.fillColor("#64748b").text(rec.facility, 160, currentY);
          doc.text(`${rec.consumption.toLocaleString()} ${rec.unit}`, 310, currentY);
          doc.fillColor("#0f172a").text(`$${rec.cost.toLocaleString()}`, 440, currentY, { align: "right" });
          currentY += 15;
        }
        if (energyRecords.length > 5) {
          doc.fillColor("#94a3b8").fontSize(8).text(`... and ${energyRecords.length - 5} additional logged records`, 50, currentY);
          currentY += 14;
        }
        currentY += 10;
      }
      if (["Annual Sustainability Report", "Waste Management Report"].includes(params.reportType)) {
        doc.fillColor("#0f172a").fontSize(11).text("3. WASTE DIVERSION & CIRCULARITY", 40, currentY);
        currentY += 16;
        doc.fillColor("#475569").fontSize(8).text(
          `Total waste logged: ${summary.totalWasteKg.toLocaleString()} kg | Recycled: ${Math.round(recycledWasteKg).toLocaleString()} kg | Disposed to Landfill: ${Math.round(disposedWasteKg).toLocaleString()} kg | Achieved Diversion Rate: ${summary.recyclingRate}%`,
          40,
          currentY
        );
        currentY += 24;
      }
      if (["Annual Sustainability Report", "ESG Performance Report"].includes(params.reportType)) {
        doc.fillColor("#0f172a").fontSize(11).text("4. ESG PILLARS & ACTIVE TARGET PROGRESS", 40, currentY);
        currentY += 16;
        doc.fillColor("#475569").fontSize(8).text(
          `Environmental Pillar: ${latestESG.environmentalScore}/100  \xB7  Social Pillar: ${latestESG.socialScore}/100  \xB7  Governance Pillar: ${latestESG.governanceScore}/100  \xB7  Overall: ${latestESG.overallScore}/100 (${latestESG.methodologyVersion})`,
          40,
          currentY
        );
        currentY += 16;
        for (const g of goals.slice(0, 3)) {
          const progress = calculationService.calculateGoalProgress(g.metricType, g.baselineValue, g.currentValue, g.targetValue);
          doc.fillColor("#1e293b").fontSize(8).text(`\u2022 ${g.title}: ${progress.percentage}% progress (${g.currentValue} ${g.unit} / Target: ${g.targetValue} ${g.unit})`, 50, currentY);
          currentY += 14;
        }
      }
      doc.moveDown(2);
      const footerY = 740;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor("#e2e8f0").stroke();
      doc.fillColor("#94a3b8").fontSize(7).text(
        "Methodology: Emissions calculated using EPA GHG Hub 2024 & UK DEFRA conversion factors (kgCO2e = Activity \xD7 Factor). Energy converted to standardized kWh. Waste diversion: (Recycled / Total) \xD7 100. This report was generated automatically by EcoTrack ESG Platform.",
        40,
        footerY + 10,
        { width: 515, align: "justify" }
      );
      doc.end();
      stream.on("finish", () => resolve());
      stream.on("error", (err) => reject(err));
    });
    const fileStat = fs2.statSync(filePath);
    const reportRecord = await dal.createReport({
      organizationId: params.organizationId,
      reportType: params.reportType,
      reportingPeriod: params.reportingPeriod,
      generatedBy: params.generatedBy,
      fileName,
      status: "Completed",
      summary,
      fileSize: fileStat.size,
      filePath
    });
    return {
      reportId: reportRecord._id || reportRecord.id,
      filePath,
      fileName,
      summary
    };
  }
};

// server/routes/reportRoutes.ts
var router9 = Router9();
var GenerateReportSchema = z8.object({
  reportType: z8.enum([
    "Annual Sustainability Report",
    "Carbon Emissions Report",
    "Energy Consumption Report",
    "ESG Performance Report",
    "Waste Management Report"
  ]),
  reportingPeriod: z8.string().min(2, "Reporting period is required (e.g. 2025, 2026, 2026-Q1)"),
  startDate: z8.string().optional(),
  endDate: z8.string().optional()
});
router9.get("/", requireAuth, async (req, res) => {
  try {
    const reports = await dal.findReports(req.user.organizationId);
    return res.json({
      success: true,
      data: reports
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router9.post("/generate", requireAuth, requireRole(["Admin", "Manager"]), async (req, res) => {
  try {
    const parseResult = GenerateReportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation error" });
    }
    const { reportType, reportingPeriod, startDate, endDate } = parseResult.data;
    const result = await pdfService.generateReport({
      organizationId: req.user.organizationId,
      reportType,
      reportingPeriod,
      generatedBy: req.user.email,
      startDate,
      endDate
    });
    return res.status(201).json({
      success: true,
      message: "PDF report generated successfully",
      data: result
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return res.status(500).json({ success: false, error: "Failed to generate report: " + err.message });
  }
});
router9.get("/:id/download", requireAuth, async (req, res) => {
  try {
    const report = await dal.findReportById(req.params.id, req.user.organizationId);
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    if (!report.filePath || !fs3.existsSync(report.filePath)) {
      const result = await pdfService.generateReport({
        organizationId: req.user.organizationId,
        reportType: report.reportType,
        reportingPeriod: report.reportingPeriod,
        generatedBy: report.generatedBy
      });
      report.filePath = result.filePath;
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${report.fileName}"`);
    const fileStream = fs3.createReadStream(report.filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({ success: false, error: "Download failed: " + err.message });
  }
});
var reportRoutes_default = router9;

// server/routes/systemRoutes.ts
import { Router as Router10 } from "express";
import fs4 from "fs";
import path3 from "path";

// server/seed/seedData.ts
import bcrypt2 from "bcryptjs";
async function seedDatabase(forceReset = false) {
  const existingOrg = await dal.getFirstOrganization();
  if (existingOrg && !forceReset) {
    console.log("[Seed] Database already contains records. Skipping idempotent seed.");
    return { seeded: false, message: "Database already initialized." };
  }
  console.log("[Seed] Initializing database with realistic ESG development records...");
  let org = await dal.getFirstOrganization();
  if (!org) {
    org = await dal.createOrganization({
      name: "EcoVerde Industrial Solutions Corp",
      industry: "Advanced Manufacturing & Precision Engineering",
      location: "North American Operations (Austin & Chicago Facilities)",
      reportingCurrency: "USD",
      reportingYear: 2026
    });
  }
  const orgId = org._id || org.id || "ecoverde-org-2026";
  const salt = await bcrypt2.genSalt(10);
  const defaultPassword = "Admin@EcoTrack2026!";
  const passwordHash = await bcrypt2.hash(defaultPassword, salt);
  const usersToSeed = [
    {
      name: "Dr. Sarah Jenkins",
      email: "admin@ecotrack.org",
      passwordHash: await bcrypt2.hash("Admin@EcoTrack2026!", salt),
      role: "Admin",
      organizationId: orgId,
      isActive: true
    },
    {
      name: "Marcus Vance",
      email: "manager@ecotrack.org",
      passwordHash: await bcrypt2.hash("Manager@EcoTrack2026!", salt),
      role: "Manager",
      organizationId: orgId,
      isActive: true
    },
    {
      name: "Elena Rostova",
      email: "employee@ecotrack.org",
      passwordHash: await bcrypt2.hash("Employee@EcoTrack2026!", salt),
      role: "Employee",
      organizationId: orgId,
      isActive: true
    },
    {
      name: "Arthur Sterling (CPA, ESG Auditor)",
      email: "auditor@ecotrack.org",
      passwordHash: await bcrypt2.hash("Auditor@EcoTrack2026!", salt),
      role: "Auditor",
      organizationId: orgId,
      isActive: true
    }
  ];
  for (const u of usersToSeed) {
    const existing = await dal.findUserByEmail(u.email);
    if (!existing) {
      await dal.createUser(u);
    }
  }
  const months = [
    { year: 2025, month: 0, label: "Jan 2025", baseElec: 48e3, baseGas: 3200 },
    { year: 2025, month: 1, label: "Feb 2025", baseElec: 46500, baseGas: 3400 },
    { year: 2025, month: 2, label: "Mar 2025", baseElec: 44e3, baseGas: 2800 },
    { year: 2025, month: 3, label: "Apr 2025", baseElec: 41e3, baseGas: 1900 },
    { year: 2025, month: 4, label: "May 2025", baseElec: 43500, baseGas: 1200 },
    { year: 2025, month: 5, label: "Jun 2025", baseElec: 52e3, baseGas: 800 },
    { year: 2025, month: 6, label: "Jul 2025", baseElec: 56e3, baseGas: 700 },
    { year: 2025, month: 7, label: "Aug 2025", baseElec: 54500, baseGas: 750 },
    { year: 2025, month: 8, label: "Sep 2025", baseElec: 47e3, baseGas: 1100 },
    { year: 2025, month: 9, label: "Oct 2025", baseElec: 42e3, baseGas: 1800 },
    { year: 2025, month: 10, label: "Nov 2025", baseElec: 45e3, baseGas: 2600 },
    { year: 2025, month: 11, label: "Dec 2025", baseElec: 49e3, baseGas: 3300 },
    { year: 2026, month: 0, label: "Jan 2026", baseElec: 44500, baseGas: 3e3 },
    { year: 2026, month: 1, label: "Feb 2026", baseElec: 43e3, baseGas: 2900 },
    { year: 2026, month: 2, label: "Mar 2026", baseElec: 40500, baseGas: 2300 }
  ];
  for (const m of months) {
    const recordDate = new Date(m.year, m.month, 15).toISOString();
    await dal.createEnergyRecord({
      organizationId: orgId,
      facility: "Austin Tech Campus",
      energyType: "Electricity",
      consumption: m.baseElec,
      unit: "kWh",
      cost: Math.round(m.baseElec * 0.125),
      recordDate,
      notes: `Grid power consumption for ${m.label} - Austin Tech Campus`,
      createdBy: "manager@ecotrack.org"
    });
    await dal.createEnergyRecord({
      organizationId: orgId,
      facility: "Chicago Plant #2",
      energyType: "Natural Gas",
      consumption: m.baseGas,
      unit: "Therms",
      cost: Math.round(m.baseGas * 1.15),
      recordDate,
      notes: `Facility heating & boiler fuel for ${m.label}`,
      createdBy: "manager@ecotrack.org"
    });
    await dal.createEnergyRecord({
      organizationId: orgId,
      facility: "Austin Tech Campus",
      energyType: "Solar",
      consumption: Math.round(m.baseElec * 0.22),
      unit: "kWh",
      cost: 0,
      recordDate,
      notes: `Rooftop PV solar generation (${m.label})`,
      createdBy: "manager@ecotrack.org"
    });
  }
  const elecFactor = OFFICIAL_EMISSION_FACTORS.find((f) => f.id === "grid-elec-us");
  const gasFactor = OFFICIAL_EMISSION_FACTORS.find((f) => f.id === "nat-gas-therm");
  const fleetFactor = OFFICIAL_EMISSION_FACTORS.find((f) => f.id === "diesel-fleet");
  const airFactor = OFFICIAL_EMISSION_FACTORS.find((f) => f.id === "air-travel-long");
  for (const m of months) {
    const recordDate = new Date(m.year, m.month, 15).toISOString();
    const elecEmissionsKg = Math.round(m.baseElec * elecFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: "Purchased Electricity (Grid)",
      scope: "Scope 2",
      activityValue: m.baseElec,
      activityUnit: elecFactor.unit,
      emissionFactor: elecFactor.factor,
      emissionFactorSource: elecFactor.sourceAuthority,
      emissionFactorVersion: elecFactor.version,
      emissionsKgCO2e: elecEmissionsKg,
      recordDate,
      createdBy: "manager@ecotrack.org"
    });
    const gasEmissionsKg = Math.round(m.baseGas * gasFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: "Stationary Boilers & Heating",
      scope: "Scope 1",
      activityValue: m.baseGas,
      activityUnit: gasFactor.unit,
      emissionFactor: gasFactor.factor,
      emissionFactorSource: gasFactor.sourceAuthority,
      emissionFactorVersion: gasFactor.version,
      emissionsKgCO2e: gasEmissionsKg,
      recordDate,
      createdBy: "manager@ecotrack.org"
    });
    const fleetGallons = Math.round(450 + m.month % 4 * 35);
    const fleetEmissionsKg = Math.round(fleetGallons * fleetFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: "Distribution Fleet Diesel",
      scope: "Scope 1",
      activityValue: fleetGallons,
      activityUnit: fleetFactor.unit,
      emissionFactor: fleetFactor.factor,
      emissionFactorSource: fleetFactor.sourceAuthority,
      emissionFactorVersion: fleetFactor.version,
      emissionsKgCO2e: fleetEmissionsKg,
      recordDate,
      createdBy: "manager@ecotrack.org"
    });
    const pkm = Math.round(8500 + m.month % 3 * 1200);
    const flightEmissionsKg = Math.round(pkm * airFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: "Business Flight Travel",
      scope: "Scope 3",
      activityValue: pkm,
      activityUnit: airFactor.unit,
      emissionFactor: airFactor.factor,
      emissionFactorSource: airFactor.sourceAuthority,
      emissionFactorVersion: airFactor.version,
      emissionsKgCO2e: flightEmissionsKg,
      recordDate,
      createdBy: "manager@ecotrack.org"
    });
  }
  const wasteCategories = [
    "Paper & Cardboard",
    "Plastic",
    "Metals",
    "Electronic Waste",
    "Hazardous Chemical"
  ];
  for (const m of months.slice(-8)) {
    const recordDate = new Date(m.year, m.month, 20).toISOString();
    await dal.createWasteRecord({
      organizationId: orgId,
      wasteType: "Paper & Cardboard",
      totalWasteKg: 3400,
      recycledWasteKg: 3100,
      disposedWasteKg: 300,
      recordDate,
      facility: "Austin Tech Campus",
      createdBy: "manager@ecotrack.org"
    });
    await dal.createWasteRecord({
      organizationId: orgId,
      wasteType: "Plastic",
      totalWasteKg: 1850,
      recycledWasteKg: 1420,
      disposedWasteKg: 430,
      recordDate,
      facility: "Chicago Plant #2",
      createdBy: "manager@ecotrack.org"
    });
    await dal.createWasteRecord({
      organizationId: orgId,
      wasteType: "Metals",
      totalWasteKg: 2900,
      recycledWasteKg: 2750,
      disposedWasteKg: 150,
      recordDate,
      facility: "Chicago Plant #2",
      createdBy: "manager@ecotrack.org"
    });
  }
  const esgPeriods = [
    { period: "2024-FullYear", env: 72, soc: 70, gov: 79, notes: "Baseline ESG audit conducted by Third-Party auditor." },
    { period: "2025-Q1", env: 76, soc: 74, gov: 82, notes: "Initiated ISO 50001 energy efficiency protocols." },
    { period: "2025-Q2", env: 79, soc: 75, gov: 84, notes: "Expanded workplace diversity & ergonomics program." },
    { period: "2025-Q3", env: 82, soc: 78, gov: 85, notes: "Installed rooftop solar arrays at Austin HQ." },
    { period: "2025-Q4", env: 85, soc: 80, gov: 88, notes: "Zero-waste packaging milestone achieved in warehouse." },
    { period: "2026-Q1", env: 88, soc: 83, gov: 90, notes: "Current quarter ESG index review." }
  ];
  for (const ep of esgPeriods) {
    await dal.createESGMetric({
      organizationId: orgId,
      reportingPeriod: ep.period,
      environmentalScore: ep.env,
      socialScore: ep.soc,
      governanceScore: ep.gov,
      methodologyVersion: "EcoTrack Corporate ESG Standard v2026.1",
      notes: ep.notes
    });
  }
  const goalsToSeed = [
    {
      title: "30% Facility Electricity Reduction by 2028",
      description: "Upgrade building automation, retrofit LED fixtures, and optimize HVAC chiller scheduling across all active plants.",
      metricType: "Energy Reduction",
      baselineValue: 58e3,
      currentValue: 43e3,
      targetValue: 40600,
      unit: "kWh/mo",
      baselineDate: (/* @__PURE__ */ new Date("2024-01-01")).toISOString(),
      targetDate: (/* @__PURE__ */ new Date("2028-12-31")).toISOString(),
      status: "In Progress",
      createdBy: "admin@ecotrack.org"
    },
    {
      title: "Net-Zero Scope 2 Grid Emissions",
      description: "Contract with 100% certified renewable energy power purchase agreements (PPAs) and install on-site solar battery storage.",
      metricType: "Carbon Reduction",
      baselineValue: 24.5,
      currentValue: 16.6,
      targetValue: 0,
      unit: "tCO2e/mo",
      baselineDate: (/* @__PURE__ */ new Date("2024-01-01")).toISOString(),
      targetDate: (/* @__PURE__ */ new Date("2030-06-30")).toISOString(),
      status: "In Progress",
      createdBy: "admin@ecotrack.org"
    },
    {
      title: "Achieve 90% Industrial Waste Diversion",
      description: "Eliminate single-use plastics from packing lines and recycle 100% of aluminum scraps and cardboard.",
      metricType: "Recycling Rate",
      baselineValue: 62,
      currentValue: 88.5,
      targetValue: 90,
      unit: "%",
      baselineDate: (/* @__PURE__ */ new Date("2024-01-01")).toISOString(),
      targetDate: (/* @__PURE__ */ new Date("2026-12-31")).toISOString(),
      status: "In Progress",
      createdBy: "admin@ecotrack.org"
    },
    {
      title: "Renewable Power Share Elevation",
      description: "Increase local on-site solar generation share to 35% of total facility load.",
      metricType: "Renewable Share",
      baselineValue: 8,
      currentValue: 22,
      targetValue: 35,
      unit: "%",
      baselineDate: (/* @__PURE__ */ new Date("2024-06-01")).toISOString(),
      targetDate: (/* @__PURE__ */ new Date("2027-06-30")).toISOString(),
      status: "In Progress",
      createdBy: "manager@ecotrack.org"
    }
  ];
  for (const g of goalsToSeed) {
    await dal.createGoal({
      ...g,
      organizationId: orgId
    });
  }
  console.log("[Seed] Database successfully seeded with 12+ months of records and 4 role accounts.");
  return { seeded: true, message: "Database successfully seeded." };
}

// server/routes/systemRoutes.ts
var router10 = Router10();
router10.get("/", (_req, res) => {
  const db = getDatabaseStatus();
  return res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "EcoTrack ESG Platform API",
    version: "1.0.0",
    database: db
  });
});
router10.get("/health", (_req, res) => {
  const db = getDatabaseStatus();
  return res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "EcoTrack ESG Platform API",
    version: "1.0.0",
    database: db
  });
});
router10.get("/db-status", (_req, res) => {
  const db = getDatabaseStatus();
  return res.json({
    success: true,
    data: db
  });
});
router10.post("/db/connect", async (req, res) => {
  try {
    const { mongoUri } = req.body;
    if (!mongoUri || typeof mongoUri !== "string") {
      return res.status(400).json({ success: false, error: "Valid MongoDB URI string is required" });
    }
    const result = await connectDatabase(mongoUri);
    if (result.connected) {
      await seedDatabase(false);
      return res.json({
        success: true,
        message: "Successfully connected to MongoDB Atlas and verified schemas",
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to connect to specified MongoDB URI",
        data: result
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router10.post("/db/seed", async (req, res) => {
  try {
    const { forceReset } = req.body;
    const result = await seedDatabase(Boolean(forceReset));
    return res.json({
      success: true,
      message: result.message,
      seeded: result.seeded
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router10.get("/download-zip", (_req, res) => {
  const zipPath = path3.resolve(process.cwd(), "public", "ecotrack-project.zip");
  if (!fs4.existsSync(zipPath)) {
    return res.status(404).json({ success: false, error: "Project zip file not found. Please wait a moment while it generates." });
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="ecotrack-esg-platform.zip"');
  const stream = fs4.createReadStream(zipPath);
  stream.pipe(res);
});
var systemRoutes_default = router10;

// server/app.ts
dotenv.config();
var app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes_default);
app.use("/auth", authRoutes_default);
app.use("/api/organizations", organizationRoutes_default);
app.use("/organizations", organizationRoutes_default);
app.use("/api/energy", energyRoutes_default);
app.use("/energy", energyRoutes_default);
app.use("/api/emissions", emissionRoutes_default);
app.use("/emissions", emissionRoutes_default);
app.use("/api/waste", wasteRoutes_default);
app.use("/waste", wasteRoutes_default);
app.use("/api/esg", esgRoutes_default);
app.use("/esg", esgRoutes_default);
app.use("/api/goals", goalRoutes_default);
app.use("/goals", goalRoutes_default);
app.use("/api/dashboard", dashboardRoutes_default);
app.use("/dashboard", dashboardRoutes_default);
app.use("/api/reports", reportRoutes_default);
app.use("/reports", reportRoutes_default);
app.use("/api", systemRoutes_default);
app.use("/", systemRoutes_default);
app.use((err, _req, res, _next) => {
  console.error("[API Error]", err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});
var isInitialized = false;
async function initializeBackend() {
  if (isInitialized) return;
  isInitialized = true;
  console.log("[Server] Initializing EcoTrack ESG Backend...");
  await connectDatabase();
  await seedDatabase(false);
  console.log("[Server] Backend initialized.");
}
export {
  app,
  initializeBackend
};
