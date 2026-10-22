import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, initializeBackend } from '../server/app';

let initPromise: Promise<void> | null = null;

function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeBackend().catch(err => {
      console.error('[Vercel Backend Init Failed]', err);
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureInitialized();

    return await new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      app(req as any, res as any, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (err: any) {
    console.error('[Vercel Serverless Error]', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Serverless Error'
      });
    }
  }
}
