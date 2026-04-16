import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { ReservationService } from './reservation.service';

// ─────────────────────────────────────────────────────────────────────────────
// EXPIRATION BACKGROUND TASK
//
// Runs every 60 seconds to clean up expired reservations.
// Each expiry restores the reserved stock so other users can claim it.
//
// Why a cron and not a DB trigger?
//   - Keeps business logic in application code (testable, observable)
//   - Allows structured logging and metrics per expiry event
//   - Database triggers are harder to debug and version-control
//
// Production-scale alternative: use pg_cron or a dedicated job queue
//   (BullMQ with Redis) for distributed reliability.
// ─────────────────────────────────────────────────────────────────────────────

async function expireReservations(): Promise<void> {
  const now = new Date();

  // Batch-fetch all expired pending reservations
  const expired = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    select: { id: true, productId: true, quantity: true, userId: true },
    take: 500, // Safety cap per run
  });

  if (expired.length === 0) return;

  logger.info({ count: expired.length }, 'Expiring reservations...');

  let successCount = 0;
  let errorCount = 0;

  for (const reservation of expired) {
    try {
      await ReservationService.expireSingle(reservation.id);
      successCount++;
      metrics.increment('reservations_expired_total');
      logger.debug(
        { reservationId: reservation.id, productId: reservation.productId },
        'Reservation expired'
      );
    } catch (err) {
      errorCount++;
      logger.error(
        { err, reservationId: reservation.id },
        'Failed to expire reservation'
      );
    }
  }

  // Update active reservation gauge
  const activeCount = await prisma.reservation.count({ where: { status: 'PENDING' } });
  metrics.setGauge('active_reservations', activeCount);

  logger.info(
    { successCount, errorCount, activeCount },
    'Expiration sweep complete'
  );
}

let cronTask: ReturnType<typeof cron.schedule> | null = null;

export function startExpirationCron(): void {
  if (cronTask) return; // Already running

  // Run every minute
  cronTask = cron.schedule('* * * * *', async () => {
    try {
      await expireReservations();
    } catch (err) {
      logger.error({ err }, 'Expiration cron job failed');
    }
  });

  logger.info('⏰ Expiration cron started (every 60s)');
}

export function stopExpirationCron(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('Expiration cron stopped');
  }
}

// Allow manual trigger for testing
export { expireReservations };
