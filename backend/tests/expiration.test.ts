import { expireReservations } from '../src/services/expiration.service';

jest.mock('../src/config/database', () => ({
  prisma: {
    reservation: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../src/services/reservation.service', () => ({
  ReservationService: {
    expireSingle: jest.fn(),
  },
}));

import { prisma } from '../src/config/database';
import { ReservationService } from '../src/services/reservation.service';

const mockFindMany = prisma.reservation.findMany as jest.Mock;
const mockCount = prisma.reservation.count as jest.Mock;
const mockExpireSingle = ReservationService.expireSingle as jest.Mock;

describe('ExpirationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCount.mockResolvedValue(0);
  });

  it('does nothing when no expired reservations exist', async () => {
    mockFindMany.mockResolvedValue([]);
    await expireReservations();
    expect(mockExpireSingle).not.toHaveBeenCalled();
  });

  it('expires all found reservations', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'r1', productId: 'p1', quantity: 1, userId: 'u1' },
      { id: 'r2', productId: 'p1', quantity: 2, userId: 'u2' },
      { id: 'r3', productId: 'p2', quantity: 1, userId: 'u3' },
    ]);
    mockExpireSingle.mockResolvedValue(undefined);

    await expireReservations();

    expect(mockExpireSingle).toHaveBeenCalledTimes(3);
    expect(mockExpireSingle).toHaveBeenCalledWith('r1');
    expect(mockExpireSingle).toHaveBeenCalledWith('r2');
    expect(mockExpireSingle).toHaveBeenCalledWith('r3');
  });

  it('continues processing even if one expiry fails', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'r1', productId: 'p1', quantity: 1, userId: 'u1' },
      { id: 'r2', productId: 'p1', quantity: 1, userId: 'u2' },
    ]);

    mockExpireSingle
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce(undefined);

    // Should not throw even when one fails
    await expect(expireReservations()).resolves.not.toThrow();
    expect(mockExpireSingle).toHaveBeenCalledTimes(2);
  });

  it('passes the correct reservation IDs to expireSingle', async () => {
    const reservations = Array.from({ length: 10 }, (_, i) => ({
      id: `res-${i}`,
      productId: `prod-${i % 3}`,
      quantity: 1,
      userId: `user-${i}`,
    }));

    mockFindMany.mockResolvedValue(reservations);
    mockExpireSingle.mockResolvedValue(undefined);

    await expireReservations();

    const calledIds = mockExpireSingle.mock.calls.map((c: unknown[]) => c[0]);
    expect(calledIds).toEqual(reservations.map((r) => r.id));
  });
});
