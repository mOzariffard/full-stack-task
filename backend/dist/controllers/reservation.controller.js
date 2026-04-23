"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = void 0;
const reservation_service_1 = require("../services/reservation.service");
exports.ReservationController = {
    // POST /reserve
    async reserve(req, res, next) {
        try {
            const userId = req.user.userId;
            const reservation = await reservation_service_1.ReservationService.create(userId, req.body);
            res.status(201).json({ success: true, data: reservation });
        }
        catch (err) {
            next(err);
        }
    },
    // POST /checkout
    async checkout(req, res, next) {
        try {
            const userId = req.user.userId;
            const { reservationId } = req.body;
            const order = await reservation_service_1.ReservationService.checkout(userId, reservationId);
            res.status(201).json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    },
    // DELETE /reservations/:id
    async cancel(req, res, next) {
        try {
            const userId = req.user.userId;
            await reservation_service_1.ReservationService.cancel(userId, req.params.id);
            res.status(200).json({ success: true, data: { message: 'Reservation cancelled' } });
        }
        catch (err) {
            next(err);
        }
    },
    // GET /reservations
    async list(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await reservation_service_1.ReservationService.listForUser(userId, req.query);
            res.status(200).json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=reservation.controller.js.map