"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
const config_1 = require("../config");
function errorHandler(err, req, res, _next) {
    metrics_1.metrics.increment('errors_total');
    // ── Operational errors (expected, safe to expose) ────────────────────────
    if (err instanceof errors_1.AppError && err.isOperational) {
        logger_1.logger.warn({ err, requestId: req.headers['x-request-id'], path: req.path }, `Operational error: ${err.message}`);
        const body = {
            success: false,
            error: { code: err.code, message: err.message },
        };
        res.status(err.statusCode).json(body);
        return;
    }
    // ── Prisma errors ────────────────────────────────────────────────────────
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        logger_1.logger.warn({ err, code: err.code }, 'Prisma known error');
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
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        logger_1.logger.warn({ err }, 'Prisma validation error');
        res.status(422).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid data provided' },
        });
        return;
    }
    // ── Unknown / programming errors ─────────────────────────────────────────
    // Never expose internal details in production
    logger_1.logger.error({ err, stack: err.stack, path: req.path, method: req.method }, 'Unhandled error');
    metrics_1.metrics.increment('unhandled_errors_total');
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            ...(config_1.config.isProduction ? {} : { details: err.message }),
        },
    });
}
//# sourceMappingURL=errorHandler.js.map