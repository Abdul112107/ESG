let appInstance: any = null;
let initPromise: Promise<void> | null = null;

export default async function handler(req: any, res: any) {
  // Ultra-fast ping check to verify Vercel serverless execution
  if (req.url === '/api/ping' || req.url === '/ping') {
    return res.status(200).json({
      ok: true,
      env: process.env.NODE_ENV,
      hasMongoUri: Boolean(process.env.MONGODB_URI),
      time: new Date().toISOString()
    });
  }

  try {
    if (!appInstance) {
      console.log('[Serverless] Dynamically importing server/app...');
      let serverModule: any;
      try {
        serverModule = await import('../server/app');
      } catch (err1: any) {
        console.warn('[Serverless] Failed import ../server/app, trying with .ts/.js:', err1.message);
        try {
          serverModule = await import('../server/app.js');
        } catch (err2: any) {
          serverModule = await import('../server/app.ts');
        }
      }

      appInstance = serverModule.app;
      const initializeBackend = serverModule.initializeBackend;

      if (!initPromise && initializeBackend) {
        initPromise = initializeBackend();
      }
    }

    if (initPromise) {
      await initPromise;
    }

    return await new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      appInstance(req, res, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (err: any) {
    console.error('[Serverless Handler Crash]', err);
    return res.status(500).json({
      success: false,
      errorType: 'SERVERLESS_INVOCATION_ERROR',
      message: err.message || String(err),
      stack: err.stack
    });
  }
}
