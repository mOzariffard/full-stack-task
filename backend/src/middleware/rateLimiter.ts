import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

const createLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message },
    },
    handler: (req, res, _next, options) => {
      metrics.increment('rate_limit_hits_total');
      logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
      res.status(options.statusCode).json(options.message);
    },
  });

// General API limiter
export const apiLimiter = createLimiter(
  config.rateLimit.windowMs,
  config.rateLimit.max,
  'Too many requests, please try again later'
);

// Strict limiter for auth endpoints
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many authentication attempts, please try again in 15 minutes'
);

// Strict limiter for reservation endpoint to prevent spam
export const reservationLimiter = createLimiter(
  60 * 1000, // 1 minute
  20,
  'Too many reservation attempts, please slow down'
);
