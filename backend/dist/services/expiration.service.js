"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExpirationCron = startExpirationCron;
exports.stopExpirationCron = stopExpirationCron;
exports.expireReservations = expireReservations;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
const reservation_service_1 = require("./reservation.service");
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
async function expireReservations() {
    const now = new Date();
    // Batch-fetch all expired pending reservations
    const expired = await database_1.prisma.reservation.findMany({
        where: {
            status: 'PENDING',
            expiresAt: { lte: now },
        },
        select: { id: true, productId: true, quantity: true, userId: true },
        take: 500, // Safety cap per run
    });
    if (expired.length === 0)
        return;
    logger_1.logger.info({ count: expired.length }, 'Expiring reservations...');
    let successCount = 0;
    let errorCount = 0;
    for (const reservation of expired) {
        try {
            await reservation_service_1.ReservationService.expireSingle(reservation.id);
            successCount++;
            metrics_1.metrics.increment('reservations_expired_total');
            logger_1.logger.debug({ reservationId: reservation.id, productId: reservation.productId }, 'Reservation expired');
        }
        catch (err) {
            errorCount++;
            logger_1.logger.error({ err, reservationId: reservation.id }, 'Failed to expire reservation');
        }
    }
    // Update active reservation gauge
    const activeCount = await database_1.prisma.reservation.count({ where: { status: 'PENDING' } });
    metrics_1.metrics.setGauge('active_reservations', activeCount);
    logger_1.logger.info({ successCount, errorCount, activeCount }, 'Expiration sweep complete');
}
let cronTask = null;
function startExpirationCron() {
    if (cronTask)
        return; // Already running
    // Run every minute
    cronTask = node_cron_1.default.schedule('* * * * *', async () => {
        try {
            await expireReservations();
        }
        catch (err) {
            logger_1.logger.error({ err }, 'Expiration cron job failed');
        }
    });
    logger_1.logger.info('⏰ Expiration cron started (every 60s)');
}
function stopExpirationCron() {
    if (cronTask) {
        cronTask.stop();
        cronTask = null;
        logger_1.logger.info('Expiration cron stopped');
    }
}
//# sourceMappingURL=expiration.service.js.map