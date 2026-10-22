import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getDatabaseStatus, connectDatabase } from '../db/connection';
import { seedDatabase } from '../seed/seedData';

const router = Router();

// GET /api or /
router.get('/', (_req: Request, res: Response) => {
  const db = getDatabaseStatus();
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EcoTrack ESG Platform API',
    version: '1.0.0',
    database: db
  });
});

// GET /api/health
router.get('/health', (_req: Request, res: Response) => {
  const db = getDatabaseStatus();
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'EcoTrack ESG Platform API',
    version: '1.0.0',
    database: db
  });
});

// GET /api/db-status
router.get('/db-status', (_req: Request, res: Response) => {
  const db = getDatabaseStatus();
  return res.json({
    success: true,
    data: db
  });
});

// POST /api/db/connect - configure MongoDB Atlas or local MongoDB URI live
router.post('/db/connect', async (req: Request, res: Response) => {
  try {
    const { mongoUri } = req.body;
    if (!mongoUri || typeof mongoUri !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid MongoDB URI string is required' });
    }

    const result = await connectDatabase(mongoUri);
    if (result.connected) {
      // Run seed if newly connected database is empty
      await seedDatabase(false);
      return res.json({
        success: true,
        message: 'Successfully connected to MongoDB Atlas and verified schemas',
        data: result
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to connect to specified MongoDB URI',
        data: result
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/db/seed - trigger safe seed or reset
router.post('/db/seed', async (req: Request, res: Response) => {
  try {
    const { forceReset } = req.body;
    const result = await seedDatabase(Boolean(forceReset));
    return res.json({
      success: true,
      message: result.message,
      seeded: result.seeded
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/download-zip - download full project source code as a zip file
router.get('/download-zip', (_req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), 'public', 'ecotrack-project.zip');
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ success: false, error: 'Project zip file not found. Please wait a moment while it generates.' });
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="ecotrack-esg-platform.zip"');
  const stream = fs.createReadStream(zipPath);
  stream.pipe(res);
});

export default router;
