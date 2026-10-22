import path from 'path';
import express from 'express';
import { app, initializeBackend } from './server/app';

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initializeBackend();

  // In production, serve the built Vite SPA from /dist
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));

  // Catch-all for React SPA client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`[EcoTrack] Server is running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[EcoTrack] Fatal startup error:', err);
  process.exit(1);
});
