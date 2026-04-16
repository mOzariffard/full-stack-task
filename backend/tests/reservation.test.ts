/**
 * Tests for reservation service logic
 * Uses mocked Prisma client for isolation
 */

import { ReservationService } from '../src/services/reservation.service';
import { StockError, DuplicateReservationError, ReservationExpiredError } from '../src/utils/errors';

// ── Minimal Prisma mock ──────────────────────────────────────────────────────

const mockTx = {
  $queryRaw: jest.fn(),
  product: { update: jest.fn() },
  reservation: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  inventoryLog: { create: jest.fn() },
  order: { create: jest.fn() },
};

jest.mock('../src/config/database', () => ({
  prisma: {
    $transaction: jest.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    reservation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    product: { update: jest.fn() },
  },
}));

import { prisma } from '../src/config/database';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<{
  current_stock: number;
  reserved_stock: number;
  is_active: boolean;
}> = {}) {
  return {
    id: 'prod-1',
    current_stock: 10,
    reserved_stock: 0,
    is_active: true,
    ...overrides,
  };
}

function makePendingReservation(overrides: Partial<{
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  status: string;
  expires_at: Date;
}> = {}) {
  return {
    id: 'res-1',
    user_id: 'user-1',
    product_id: 'prod-1',
    quantity: 1,
    status: 'PENDING',
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ReservationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue(null);
  });

  // ── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a reservation when stock is available', async () => {
      mockTx.$queryRaw
        .mockResolvedValueOnce([makeProduct()]);
      mockTx.product.update.mockResolvedValue({});
      mockTx.reservation.create.mockResolvedValue({
        id: 'res-1',
        userId: 'user-1',
        productId: 'prod-1',
        quantity: 2,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
        product: makeProduct(),
      });
      mockTx.inventoryLog.create.mockResolvedValue({});

      const result = await ReservationService.create('user-1', {
        productId: 'prod-1',
        quantity: 2,
      });

      expect(result.status).toBe('PENDING');
      expect(result.quantity).toBe(2);
      expect(result.secondsRemaining).toBeGreaterThan(0);
    });

    it('throws StockError when available stock is insufficient', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        makeProduct({ current_stock: 2, reserved_stock: 2 }),
      ]);

      await expect(
        ReservationService.create('user-1', { productId: 'prod-1', quantity: 1 })
      ).rejects.toThrow(StockError);
    });

    it('throws StockError when product is inactive', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        makeProduct({ is_active: false }),
      ]);

      await expect(
        ReservationService.create('user-1', { productId: 'prod-1', quantity: 1 })
      ).rejects.toThrow();
    });

    it('throws DuplicateReservationError when active reservation exists', async () => {
      (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-res',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // still valid
        status: 'PENDING',
      });

      await expect(
        ReservationService.create('user-1', { productId: 'prod-1', quantity: 1 })
      ).rejects.toThrow(DuplicateReservationError);
    });

    it('allows re-reservation after existing one is expired', async () => {
      (mockPrisma.reservation.findFirst as jest.Mock).mockResolvedValue({
        id: 'old-res',
        expiresAt: new Date(Date.now() - 1000), // already expired
        status: 'PENDING',
      });

      // expireSingle will be called — mock its transaction
      mockTx.$queryRaw
        .mockResolvedValueOnce([{ id: 'old-res', product_id: 'prod-1', quantity: 1, status: 'PENDING' }])
        .mockResolvedValueOnce([{ reserved_stock: 1 }])
        .mockResolvedValueOnce([makeProduct()]);
      mockTx.reservation.update.mockResolvedValue({});
      mockTx.product.update.mockResolvedValue({});
      mockTx.inventoryLog.create.mockResolvedValue({});
      mockTx.reservation.create.mockResolvedValue({
        id: 'res-new',
        userId: 'user-1',
        productId: 'prod-1',
        quantity: 1,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        completedAt: null,
        cancelledAt: null,
        createdAt: new Date(),
      });

      const result = await ReservationService.create('user-1', {
        productId: 'prod-1',
        quantity: 1,
      });

      expect(result.id).toBe('res-new');
    });
  });

  // ── checkout ─────────────────────────────────────────────────────────────

  describe('checkout', () => {
    it('completes checkout and creates order', async () => {
      mockTx.$queryRaw
        .mockResolvedValueOnce([makePendingReservation()])
        .mockResolvedValueOnce([{ id: 'prod-1', price: '99.99', current_stock: 9, reserved_stock: 1 }]);
      mockTx.reservation.update.mockResolvedValue({});
      mockTx.product.update.mockResolvedValue({});
      mockTx.order.create.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        productId: 'prod-1',
        reservationId: 'res-1',
        quantity: 1,
        unitPrice: { toFixed: () => '99.99' },
        totalPrice: { toFixed: () => '99.99' },
        status: 'CONFIRMED',
        createdAt: new Date(),
      });
      mockTx.inventoryLog.create.mockResolvedValue({});

      const order = await ReservationService.checkout('user-1', 'res-1');

      expect(order.status).toBe('CONFIRMED');
      expect(order.reservationId).toBe('res-1');
    });

    it('throws ReservationExpiredError on expired reservation', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        makePendingReservation({ expires_at: new Date(Date.now() - 1000) }),
      ]);

      await expect(
        ReservationService.checkout('user-1', 'res-1')
      ).rejects.toThrow(ReservationExpiredError);
    });

    it('throws on wrong user attempting checkout', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        makePendingReservation({ user_id: 'other-user' }),
      ]);

      await expect(
        ReservationService.checkout('user-1', 'res-1')
      ).rejects.toThrow();
    });
  });

  // ── expireSingle ─────────────────────────────────────────────────────────

  describe('expireSingle', () => {
    it('expires a PENDING reservation and restores stock', async () => {
      mockTx.$queryRaw
        .mockResolvedValueOnce([{ id: 'res-1', product_id: 'prod-1', quantity: 2, status: 'PENDING' }])
        .mockResolvedValueOnce([{ reserved_stock: 2 }]);
      mockTx.reservation.update.mockResolvedValue({});
      mockTx.product.update.mockResolvedValue({});
      mockTx.inventoryLog.create.mockResolvedValue({});

      await expect(ReservationService.expireSingle('res-1')).resolves.not.toThrow();
      expect(mockTx.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'EXPIRED' },
      });
    });

    it('is idempotent — does nothing if reservation is already expired', async () => {
      mockTx.$queryRaw.mockResolvedValueOnce([
        { id: 'res-1', product_id: 'prod-1', quantity: 1, status: 'EXPIRED' },
      ]);

      await ReservationService.expireSingle('res-1');
      expect(mockTx.reservation.update).not.toHaveBeenCalled();
    });
  });
});
