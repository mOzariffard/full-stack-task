import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ProductController } from '../controllers/product.controller';
import { ReservationController } from '../controllers/reservation.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter, reservationLimiter } from '../middleware/rateLimiter';
import { metrics } from '../utils/metrics';
import { prisma } from '../config/database';
import {
  RegisterSchema,
  LoginSchema,
  CreateProductSchema,
  ProductFilterSchema,
  CreateReservationSchema,
  CheckoutSchema,
  ReservationFilterSchema,
  UuidParamSchema,
} from '../validators';

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────────

router.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'drop-system',
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      data: { status: 'unhealthy', timestamp: new Date().toISOString() },
    });
  }
});

// ── Metrics ───────────────────────────────────────────────────────────────────

router.get('/metrics', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: metrics.getSnapshot() });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post('/auth/register', authLimiter, validate(RegisterSchema), AuthController.register);
router.post('/auth/login', authLimiter, validate(LoginSchema), AuthController.login);
router.get('/auth/profile', authenticate, AuthController.profile);

// ── Products ──────────────────────────────────────────────────────────────────

router.get('/products', validate(ProductFilterSchema, 'query'), ProductController.list);
router.get('/products/:id', validate(UuidParamSchema, 'params'), ProductController.getById);
router.post(
  '/products',
  authenticate,
  validate(CreateProductSchema),
  ProductController.create
);

// ── Reservations ──────────────────────────────────────────────────────────────

router.post(
  '/reserve',
  authenticate,
  reservationLimiter,
  validate(CreateReservationSchema),
  ReservationController.reserve
);

router.post(
  '/checkout',
  authenticate,
  validate(CheckoutSchema),
  ReservationController.checkout
);

router.get(
  '/reservations',
  authenticate,
  validate(ReservationFilterSchema, 'query'),
  ReservationController.list
);

router.delete(
  '/reservations/:id',
  authenticate,
  validate(UuidParamSchema, 'params'),
  ReservationController.cancel
);

export default router;
