"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const metrics_1 = require("../utils/metrics");
function authenticate(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        metrics_1.metrics.increment('auth_failures_total');
        next(new errors_1.UnauthorizedError('Bearer token required'));
        return;
    }
    const token = authHeader.slice(7);
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (err) {
        metrics_1.metrics.increment('auth_failures_total');
        next(err);
    }
}
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.slice(7);
    try {
        req.user = (0, jwt_1.verifyToken)(token);
    }
    catch {
        // Ignore invalid optional token
    }
    next();
}
//# sourceMappingURL=auth.js.map