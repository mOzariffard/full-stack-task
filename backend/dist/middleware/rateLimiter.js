"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
const createLimiter = (windowMs, max, message) => (0, express_rate_limit_1.default)({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message },
    },
    handler: (req, res, _next, options) => {
        metrics_1.metrics.increment('rate_limit_hits_total');
        logger_1.logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
        res.status(options.statusCode).json(options.message);
    },
});
// General API limiter
exports.apiLimiter = createLimiter(config_1.config.rateLimit.windowMs, config_1.config.rateLimit.max, 'Too many requests, please try again later');
// Strict limiter for auth endpoints
exports.authLimiter = createLimiter(15 * 60 * 1000, // 15 minutes
10, 'Too many authentication attempts, please try again in 15 minutes');
// Strict limiter for reservation endpoint to prevent spam
exports.reservationLimiter = createLimiter(60 * 1000, // 1 minute
20, 'Too many reservation attempts, please slow down');
//# sourceMappingURL=rateLimiter.js.map