import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import organizationRoutes from './routes/organizationRoutes';
import energyRoutes from './routes/energyRoutes';
import emissionRoutes from './routes/emissionRoutes';
import wasteRoutes from './routes/wasteRoutes';
import esgRoutes from './routes/esgRoutes';
import goalRoutes from './routes/goalRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import systemRoutes from './routes/systemRoutes';
import { connectDatabase } from './db/connection';
import { seedDatabase } from './seed/seedData';

dotenv.config();

export const app: Express = express();

// Security and middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// REST API Routes (mounted with and without /api prefix for seamless local and Vercel serverless execution)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/organizations', organizationRoutes);
app.use('/organizations', organizationRoutes);

app.use('/api/energy', energyRoutes);
app.use('/energy', energyRoutes);

app.use('/api/emissions', emissionRoutes);
app.use('/emissions', emissionRoutes);

app.use('/api/waste', wasteRoutes);
app.use('/waste', wasteRoutes);

app.use('/api/esg', esgRoutes);
app.use('/esg', esgRoutes);

app.use('/api/goals', goalRoutes);
app.use('/goals', goalRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/reports', reportRoutes);
app.use('/reports', reportRoutes);

app.use('/api', systemRoutes);
app.use('/', systemRoutes);

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

let isInitialized = false;

export async function initializeBackend() {
  if (isInitialized) return;
  isInitialized = true;
  console.log('[Server] Initializing EcoTrack ESG Backend...');
  await connectDatabase();
  await seedDatabase(false);
  console.log('[Server] Backend initialized.');
}
