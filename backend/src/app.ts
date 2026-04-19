import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, staticLimiter } from './middleware/rateLimiter';
import routes from './routes';

export function createApp() {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────

  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────

  app.use(
    cors({
      origin: config.cors.origin.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      exposedHeaders: ['x-request-id'],
      credentials: true,
      maxAge: 86400, // 24h preflight cache
    })
  );

  // ── Body parsing & compression ──────────────────────────────────────────

  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // ── Request logging ─────────────────────────────────────────────────────

  app.use(requestLogger);

  // ── Rate limiting ────────────────────────────────────────────────────────

  app.use('/api', apiLimiter);

  // ── Routes ──────────────────────────────────────────────────────────────

  app.use('/api/v1', routes);

  // ── Serve frontend (production) ──────────────────────────────────────────

  if (config.isProduction) {
    // __dirname is backend/dist — frontend/dist is two levels up
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    // SPA fallback: send index.html for any non-API route
    app.get('*', staticLimiter, (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    // ── 404 handler (dev only — production serves SPA) ──────────────────

    app.use((_req, res) => {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Route not found' },
      });
    });
  }

  // ── Centralized error handler (MUST be last) ─────────────────────────────

  app.use(errorHandler);

  return app;
}
