import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { config } from '../config';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  metrics.increment('errors_total');

  // ── Operational errors (expected, safe to expose) ────────────────────────

  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      { err, requestId: req.headers['x-request-id'], path: req.path },
      `Operational error: ${err.message}`
    );

    const body: ErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // ── Prisma errors ────────────────────────────────────────────────────────

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn({ err, code: err.code }, 'Prisma known error');

    if (err.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Resource already exists' },
      });
      return;
    }

    if (err.code === 'P2025') {
      // Record not found
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn({ err }, 'Prisma validation error');
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid data provided' },
    });
    return;
  }

  // ── Unknown / programming errors ─────────────────────────────────────────
  // Never expose internal details in production

  logger.error(
    { err, stack: err.stack, path: req.path, method: req.method },
    'Unhandled error'
  );
  metrics.increment('unhandled_errors_total');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      ...(config.isProduction ? {} : { details: err.message }),
    },
  });
}
