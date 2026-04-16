import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Attach a unique ID to every request for correlation
  const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  const startAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startAt) / 1_000_000;

    metrics.increment('http_requests_total');
    metrics.observe('http_request_duration_ms', durationMs);

    const level =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](
      {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: durationMs.toFixed(2),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.userId,
      },
      `${req.method} ${req.path} ${res.statusCode}`
    );
  });

  next();
}
