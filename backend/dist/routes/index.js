"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const product_controller_1 = require("../controllers/product.controller");
const reservation_controller_1 = require("../controllers/reservation.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const rateLimiter_1 = require("../middleware/rateLimiter");
const metrics_1 = require("../utils/metrics");
const database_1 = require("../config/database");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                service: 'drop-system',
            },
        });
    }
    catch {
        res.status(503).json({
            success: false,
            data: { status: 'unhealthy', timestamp: new Date().toISOString() },
        });
    }
});
// ── Metrics ───────────────────────────────────────────────────────────────────
router.get('/metrics', (_req, res) => {
    res.status(200).json({ success: true, data: metrics_1.metrics.getSnapshot() });
});
// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/register', rateLimiter_1.authLimiter, (0, validate_1.validate)(validators_1.RegisterSchema), auth_controller_1.AuthController.register);
router.post('/auth/login', rateLimiter_1.authLimiter, (0, validate_1.validate)(validators_1.LoginSchema), auth_controller_1.AuthController.login);
router.get('/auth/profile', auth_1.authenticate, auth_controller_1.AuthController.profile);
// ── Products ──────────────────────────────────────────────────────────────────
router.get('/products', (0, validate_1.validate)(validators_1.ProductFilterSchema, 'query'), product_controller_1.ProductController.list);
router.get('/products/:id', (0, validate_1.validate)(validators_1.UuidParamSchema, 'params'), product_controller_1.ProductController.getById);
router.post('/products', auth_1.authenticate, (0, validate_1.validate)(validators_1.CreateProductSchema), product_controller_1.ProductController.create);
// ── Reservations ──────────────────────────────────────────────────────────────
router.post('/reserve', auth_1.authenticate, rateLimiter_1.reservationLimiter, (0, validate_1.validate)(validators_1.CreateReservationSchema), reservation_controller_1.ReservationController.reserve);
router.post('/checkout', auth_1.authenticate, (0, validate_1.validate)(validators_1.CheckoutSchema), reservation_controller_1.ReservationController.checkout);
router.get('/reservations', auth_1.authenticate, (0, validate_1.validate)(validators_1.ReservationFilterSchema, 'query'), reservation_controller_1.ReservationController.list);
router.delete('/reservations/:id', auth_1.authenticate, (0, validate_1.validate)(validators_1.UuidParamSchema, 'params'), reservation_controller_1.ReservationController.cancel);
exports.default = router;
//# sourceMappingURL=index.js.map