"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const config_1 = require("./config");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const routes_1 = __importDefault(require("./routes"));
function createApp() {
    const app = (0, express_1.default)();
    // ── Security headers ────────────────────────────────────────────────────
    app.use((0, helmet_1.default)());
    // ── CORS ────────────────────────────────────────────────────────────────
    app.use((0, cors_1.default)({
        origin: config_1.config.cors.origin.split(',').map((o) => o.trim()),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
        exposedHeaders: ['x-request-id'],
        credentials: true,
        maxAge: 86400, // 24h preflight cache
    }));
    // ── Body parsing & compression ──────────────────────────────────────────
    app.use((0, compression_1.default)());
    app.use(express_1.default.json({ limit: '10kb' }));
    app.use(express_1.default.urlencoded({ extended: false, limit: '10kb' }));
    // ── Request logging ─────────────────────────────────────────────────────
    app.use(requestLogger_1.requestLogger);
    // ── Rate limiting ────────────────────────────────────────────────────────
    app.use('/api', rateLimiter_1.apiLimiter);
    // ── Routes ──────────────────────────────────────────────────────────────
    app.use('/api/v1', routes_1.default);
    // ── 404 handler ─────────────────────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Route not found' },
        });
    });
    // ── Centralized error handler (MUST be last) ─────────────────────────────
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map