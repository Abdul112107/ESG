import mongoose from 'mongoose';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

// In serverless / AWS Lambda / Vercel, outbound UDP/TCP port 53 to custom DNS servers
// is blocked by VPC firewalls, and AWS provides its own internal resolver.
// Only set custom public DNS servers when running in local development.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

if (!isServerless) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    dns.setDefaultResultOrder('ipv4first');
  } catch (err) {
    console.warn('[DB] Custom DNS override skipped:', err);
  }
}

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
// On Vercel/Lambda, the only writable directory is /tmp
const DATA_DIR = path.resolve(
  isServerless ? '/tmp' : process.cwd(),
  '.data'
);
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
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[DB] Could not create DATA_DIR:', err);
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

  // In serverless warm containers, reuse existing active connection
  if (mongoose.connection.readyState === 1) {
    dbStatus = {
      connected: true,
      type: 'mongodb',
      host: mongoose.connection.host,
      databaseName: mongoose.connection.name,
      message: `Reusing active MongoDB connection (${mongoose.connection.name || 'default'} on ${mongoose.connection.host})`
    };
    return dbStatus;
  }

  if (uri && uri.trim() !== '' && !uri.includes('username:password')) {
    try {
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
        message: `MongoDB connection failed (${err.message}). Using embedded storage. Configure MONGODB_URI in settings to connect MongoDB Atlas.`
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
