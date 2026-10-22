let appInstance = null;
let initializeBackendFn = null;
let initPromise = null;

async function getApp() {
  if (!appInstance) {
    const mod = await import('./server-bundle.js');
    appInstance = mod.app;
    initializeBackendFn = mod.initializeBackend;
  }
  return { app: appInstance, initializeBackend: initializeBackendFn };
}

export default async function handler(req, res) {
  try {
    const { app, initializeBackend } = await getApp();

    if (!initPromise) {
      initPromise = initializeBackend().catch((err) => {
        console.error('[Serverless Backend Init Error]', err);
        initPromise = null;
        throw err;
      });
    }
    await initPromise;

    const matchedPath = req.headers['x-matched-path'];
    if (matchedPath && typeof matchedPath === 'string') {
      const queryIndex = req.url.indexOf('?');
      const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
      req.url = matchedPath + queryString;
    }

    return await new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    console.error('[Serverless Handler Error]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        success: false,
        error: err.message || 'Internal Serverless Error',
        stack: err.stack
      }));
    }
  }
}
