import mongoose from 'mongoose';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

// Force Google public DNS so MongoDB SRV records resolve correctly
// even when the local ISP DNS does not support SRV lookups.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

export interface DatabaseStatus {
  connected: boolean;
  type: 'mongodb' | 'embedded';
  host?: string;
  databaseName?: string;
  error?: string;
  message: string;
}

let dbStatus: DatabaseStatus = {
  connected: false,
  type: 'embedded',
  message: 'Initializing database engine...'
};

// Store for embedded mode when MONGODB_URI is not connected yet
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

export interface MemoryStoreData {
  users: any[];
  organizations: any[];
  energyRecords: any[];
  emissionRecords: any[];
  wasteRecords: any[];
  esgMetrics: any[];
  sustainabilityGoals: any[];
  reports: any[];
}

let inMemoryStore: MemoryStoreData = {
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
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadStore(): MemoryStoreData {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryStore = JSON.parse(content);
    }
  } catch (err) {
    console.error('[DB] Failed to load local persistent DB file, starting fresh:', err);
  }
  return inMemoryStore;
}

export function saveStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save local persistent DB file:', err);
  }
}

export function getStore(): MemoryStoreData {
  return inMemoryStore;
}

export async function connectDatabase(customUri?: string): Promise<DatabaseStatus> {
  const uri = customUri || process.env.MONGODB_URI;

  if (uri && uri.trim() !== '' && !uri.includes('username:password')) {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }

      console.log(`[DB] Connecting to MongoDB at: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });

      const host = mongoose.connection.host;
      const databaseName = mongoose.connection.name;

      dbStatus = {
        connected: true,
        type: 'mongodb',
        host,
        databaseName,
        message: `Successfully connected to MongoDB (${databaseName || 'default'} on ${host})`
      };
      console.log(`[DB] ${dbStatus.message}`);
      return dbStatus;
    } catch (err: any) {
      console.warn(`[DB] MongoDB connection failed: ${err.message}. Falling back to embedded persistent database.`);
      loadStore();
      dbStatus = {
        connected: false,
        type: 'embedded',
        error: err.message,
        message: `MongoDB connection failed (${err.message}). Using embedded persistent storage. Configure MONGODB_URI in settings to connect MongoDB Atlas.`
      };
      return dbStatus;
    }
  } else {
    loadStore();
    dbStatus = {
      connected: false,
      type: 'embedded',
      message: 'MONGODB_URI not configured. Operating in development mode with embedded persistent database. You can connect MongoDB Atlas in Settings.'
    };
    console.log(`[DB] ${dbStatus.message}`);
    return dbStatus;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  if (mongoose.connection.readyState === 1) {
    return {
      connected: true,
      type: 'mongodb',
      host: mongoose.connection.host,
      databaseName: mongoose.connection.name,
      message: `Connected to MongoDB (${mongoose.connection.name})`
    };
  }
  return dbStatus;
}
