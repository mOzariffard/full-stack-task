import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/reservation.service';

export const ReservationController = {
  // POST /reserve
  async reserve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const reservation = await ReservationService.create(userId, req.body);
      res.status(201).json({ success: true, data: reservation });
    } catch (err) {
      next(err);
    }
  },

  // POST /checkout
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { reservationId } = req.body;
      const order = await ReservationService.checkout(userId, reservationId);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /reservations/:id
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await ReservationService.cancel(userId, req.params.id);
      res.status(200).json({ success: true, data: { message: 'Reservation cancelled' } });
    } catch (err) {
      next(err);
    }
  },

  // GET /reservations
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await ReservationService.listForUser(userId, req.query as never);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
