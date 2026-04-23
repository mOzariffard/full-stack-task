"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../utils/metrics");
const config_1 = require("../config");
// ─────────────────────────────────────────────────────────────────────────────
// HOW RACE CONDITIONS ARE PREVENTED
//
// The critical section is: check available stock → deduct stock → create reservation.
// Two naive approaches that DON'T work at scale:
//   ❌ Read stock → check → update (read-modify-write gap = race condition)
//   ❌ Optimistic locking alone (retries under heavy load → thundering herd)
//
// Our approach: SELECT ... FOR UPDATE inside a serializable transaction.
//   1. BEGIN TRANSACTION (SERIALIZABLE)
//   2. SELECT * FROM products WHERE id = $1 FOR UPDATE
//      → This row-level lock blocks any concurrent transaction trying to
//        modify the same product row until we COMMIT or ROLLBACK.
//   3. Check: currentStock - reservedStock >= quantity
//   4. UPDATE products SET reservedStock = reservedStock + $quantity
//   5. INSERT INTO reservations (...)
//   6. INSERT INTO inventory_logs (...)
//   7. COMMIT
//
// Result: under 100 concurrent requests for 1 remaining item,
//   exactly 1 reservation succeeds; the rest get a StockError.
//   Stock never goes negative.
// ─────────────────────────────────────────────────────────────────────────────
const TTL = config_1.config.reservation.ttlMinutes;
function secondsRemaining(expiresAt) {
    return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}
exports.ReservationService = {
    // ── Create reservation ──────────────────────────────────────────────────
    async create(userId, input) {
        const { productId, quantity } = input;
        // Check for existing active reservation BEFORE entering the transaction
        // (cheaper early-exit for duplicate prevention)
        const existingActive = await database_1.prisma.reservation.findFirst({
            where: { userId, productId, status: client_1.ReservationStatus.PENDING },
        });
        if (existingActive) {
            if (existingActive.expiresAt > new Date()) {
                throw new errors_1.DuplicateReservationError();
            }
            // It exists but is expired (cron hasn't cleaned it yet) — clean it up
            await exports.ReservationService.expireSingle(existingActive.id);
        }
        // ── SERIALIZABLE TRANSACTION with row-level lock ──────────────────────
        const reservation = await database_1.prisma.$transaction(async (tx) => {
            // Lock the product row — blocks concurrent reservations for this product
            const products = await tx.$queryRaw `
          SELECT id, current_stock, reserved_stock, is_active
          FROM products
          WHERE id = ${productId}
          FOR UPDATE
        `;
            const product = products[0];
            if (!product)
                throw new errors_1.NotFoundError('Product');
            if (!product.is_active)
                throw new errors_1.ConflictError('Product is not available');
            const available = product.current_stock - product.reserved_stock;
            if (available < quantity) {
                throw new errors_1.StockError(`Only ${available} unit(s) available (requested ${quantity})`);
            }
            const stockBefore = product.reserved_stock;
            const stockAfter = product.reserved_stock + quantity;
            // Deduct reserved stock
            await tx.product.update({
                where: { id: productId },
                data: { reservedStock: { increment: quantity } },
            });
            const expiresAt = new Date(Date.now() + TTL * 60 * 1000);
            // Create reservation
            const newReservation = await tx.reservation.create({
                data: { userId, productId, quantity, expiresAt },
                include: { product: true },
            });
            // Write audit log
            await tx.inventoryLog.create({
                data: {
                    productId,
                    eventType: 'RESERVED',
                    quantityDelta: -quantity,
                    stockBefore,
                    stockAfter,
                    reservationId: newReservation.id,
                    note: `Reserved ${quantity} unit(s) by user ${userId}`,
                },
            });
            return newReservation;
        }, {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000, // 10-second transaction timeout
        });
        metrics_1.metrics.increment('reservations_created_total');
        logger_1.logger.info({ reservationId: reservation.id, userId, productId, quantity }, 'Reservation created');
        return {
            id: reservation.id,
            userId: reservation.userId,
            productId: reservation.productId,
            quantity: reservation.quantity,
            status: reservation.status,
            expiresAt: reservation.expiresAt,
            completedAt: reservation.completedAt,
            cancelledAt: reservation.cancelledAt,
            createdAt: reservation.createdAt,
            secondsRemaining: secondsRemaining(reservation.expiresAt),
        };
    },
    // ── Checkout ─────────────────────────────────────────────────────────────
    async checkout(userId, reservationId) {
        const order = await database_1.prisma.$transaction(async (tx) => {
            // Lock the reservation row
            const reservations = await tx.$queryRaw `
          SELECT id, user_id, product_id, quantity, status, expires_at
          FROM reservations
          WHERE id = ${reservationId}
          FOR UPDATE
        `;
            const reservation = reservations[0];
            if (!reservation)
                throw new errors_1.NotFoundError('Reservation');
            if (reservation.user_id !== userId)
                throw new errors_1.NotFoundError('Reservation');
            if (reservation.status !== 'PENDING') {
                throw new errors_1.ConflictError(`Reservation is already ${reservation.status.toLowerCase()}`);
            }
            if (new Date(reservation.expires_at) <= new Date()) {
                throw new errors_1.ReservationExpiredError();
            }
            // Lock and read product price
            const products = await tx.$queryRaw `
          SELECT id, price::text, current_stock, reserved_stock
          FROM products
          WHERE id = ${reservation.product_id}
          FOR UPDATE
        `;
            const product = products[0];
            if (!product)
                throw new errors_1.NotFoundError('Product');
            const unitPrice = parseFloat(product.price);
            const totalPrice = unitPrice * reservation.quantity;
            const stockBefore = product.current_stock;
            const stockAfter = product.current_stock - reservation.quantity;
            // Mark reservation completed
            await tx.reservation.update({
                where: { id: reservationId },
                data: { status: 'COMPLETED', completedAt: new Date() },
            });
            // Permanently deduct stock + release the reserved hold
            await tx.product.update({
                where: { id: reservation.product_id },
                data: {
                    currentStock: { decrement: reservation.quantity },
                    reservedStock: { decrement: reservation.quantity },
                },
            });
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    productId: reservation.product_id,
                    reservationId,
                    quantity: reservation.quantity,
                    unitPrice,
                    totalPrice,
                },
                include: { product: true },
            });
            // Audit log
            await tx.inventoryLog.create({
                data: {
                    productId: reservation.product_id,
                    eventType: 'ORDER_CONFIRMED',
                    quantityDelta: -reservation.quantity,
                    stockBefore,
                    stockAfter,
                    reservationId,
                    orderId: newOrder.id,
                    note: `Order confirmed for user ${userId}`,
                },
            });
            return newOrder;
        }, {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000,
        });
        metrics_1.metrics.increment('orders_created_total');
        logger_1.logger.info({ orderId: order.id, userId, reservationId }, 'Order created');
        return {
            id: order.id,
            userId: order.userId,
            productId: order.productId,
            reservationId: order.reservationId,
            quantity: order.quantity,
            unitPrice: order.unitPrice.toFixed(2),
            totalPrice: order.totalPrice.toFixed(2),
            status: order.status,
            createdAt: order.createdAt,
        };
    },
    // ── Cancel reservation ───────────────────────────────────────────────────
    async cancel(userId, reservationId) {
        await database_1.prisma.$transaction(async (tx) => {
            const reservations = await tx.$queryRaw `
          SELECT id, user_id, product_id, quantity, status
          FROM reservations WHERE id = ${reservationId} FOR UPDATE
        `;
            const r = reservations[0];
            if (!r)
                throw new errors_1.NotFoundError('Reservation');
            if (r.user_id !== userId)
                throw new errors_1.NotFoundError('Reservation');
            if (r.status !== 'PENDING')
                throw new errors_1.ConflictError('Only PENDING reservations can be cancelled');
            await tx.reservation.update({
                where: { id: reservationId },
                data: { status: 'CANCELLED', cancelledAt: new Date() },
            });
            const products = await tx.$queryRaw `
          SELECT reserved_stock FROM products WHERE id = ${r.product_id} FOR UPDATE
        `;
            await tx.product.update({
                where: { id: r.product_id },
                data: { reservedStock: { decrement: r.quantity } },
            });
            await tx.inventoryLog.create({
                data: {
                    productId: r.product_id,
                    eventType: 'RESERVATION_CANCELLED',
                    quantityDelta: r.quantity,
                    stockBefore: products[0]?.reserved_stock ?? 0,
                    stockAfter: Math.max(0, (products[0]?.reserved_stock ?? 0) - r.quantity),
                    reservationId,
                    note: `Reservation cancelled by user ${userId}`,
                },
            });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        logger_1.logger.info({ reservationId, userId }, 'Reservation cancelled');
    },
    // ── List user reservations ───────────────────────────────────────────────
    async listForUser(userId, filters) {
        const { page, limit, sortBy, sortOrder, status } = filters;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(status && { status }),
        };
        const [reservations, total] = await database_1.prisma.$transaction([
            database_1.prisma.reservation.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
                include: { product: true },
            }),
            database_1.prisma.reservation.count({ where }),
        ]);
        return {
            data: reservations.map((r) => ({
                id: r.id,
                userId: r.userId,
                productId: r.productId,
                quantity: r.quantity,
                status: r.status,
                expiresAt: r.expiresAt,
                completedAt: r.completedAt,
                cancelledAt: r.cancelledAt,
                createdAt: r.createdAt,
                secondsRemaining: r.status === 'PENDING' ? secondsRemaining(r.expiresAt) : 0,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    },
    // ── Expire single reservation (used by cron) ────────────────────────────
    async expireSingle(reservationId) {
        await database_1.prisma.$transaction(async (tx) => {
            const reservations = await tx.$queryRaw `
        SELECT id, product_id, quantity, status
        FROM reservations WHERE id = ${reservationId} FOR UPDATE
      `;
            const r = reservations[0];
            if (!r || r.status !== 'PENDING')
                return;
            await tx.reservation.update({
                where: { id: reservationId },
                data: { status: 'EXPIRED' },
            });
            const products = await tx.$queryRaw `
        SELECT reserved_stock FROM products WHERE id = ${r.product_id} FOR UPDATE
      `;
            await tx.product.update({
                where: { id: r.product_id },
                data: { reservedStock: { decrement: r.quantity } },
            });
            await tx.inventoryLog.create({
                data: {
                    productId: r.product_id,
                    eventType: 'RESERVATION_EXPIRED',
                    quantityDelta: r.quantity,
                    stockBefore: products[0]?.reserved_stock ?? 0,
                    stockAfter: Math.max(0, (products[0]?.reserved_stock ?? 0) - r.quantity),
                    reservationId,
                    note: `Reservation expired automatically`,
                },
            });
        });
    },
};
//# sourceMappingURL=reservation.service.js.map