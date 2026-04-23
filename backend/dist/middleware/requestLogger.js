"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
function requestLogger(req, res, next) {
    // Attach a unique ID to every request for correlation
    const requestId = req.headers['x-request-id'] ?? (0, uuid_1.v4)();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    const startAt = process.hrtime.bigint();
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startAt) / 1000000;
        metrics_1.metrics.increment('http_requests_total');
        metrics_1.metrics.observe('http_request_duration_ms', durationMs);
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger[level]({
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: durationMs.toFixed(2),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: req.user?.userId,
        }, `${req.method} ${req.path} ${res.statusCode}`);
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map