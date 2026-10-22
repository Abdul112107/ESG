import { app, initializeBackend } from './server-bundle.js';

let initPromise = null;

function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeBackend().catch((err) => {
      console.error('[Serverless Init Error]', err);
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export default async function handler(req, res) {
  // If Vercel rewrote the path and placed the original request URL in x-matched-path, restore it
  const matchedPath = req.headers['x-matched-path'];
  if (matchedPath && typeof matchedPath === 'string') {
    // Preserve any query string
    const queryIndex = req.url.indexOf('?');
    const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
    req.url = matchedPath + queryString;
  }

  try {
    await ensureInitialized();

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
    console.error('[Serverless Error]', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Serverless Error'
      });
    }
  }
}
