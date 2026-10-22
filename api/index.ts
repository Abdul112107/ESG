import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, initializeBackend } from '../server/app';

let isReady = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isReady) {
      await initializeBackend();
      isReady = true;
    }
    return app(req as any, res as any);
  } catch (err: any) {
    console.error('[Vercel Serverless Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Serverless Error'
    });
  }
}
