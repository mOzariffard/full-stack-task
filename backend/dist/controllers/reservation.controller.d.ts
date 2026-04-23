import { Request, Response, NextFunction } from 'express';
export declare const ReservationController: {
    reserve(req: Request, res: Response, next: NextFunction): Promise<void>;
    checkout(req: Request, res: Response, next: NextFunction): Promise<void>;
    cancel(req: Request, res: Response, next: NextFunction): Promise<void>;
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=reservation.controller.d.ts.map