import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, initializeBackend } from '../server/app';

let isReady = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isReady) {
      await initializeBackend();
      isReady = true;
    }

    // Ensure the request path has /api prefix for Express router alignment
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
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
