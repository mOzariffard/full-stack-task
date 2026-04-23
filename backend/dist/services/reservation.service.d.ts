import type { CreateReservationInput, ReservationFilterInput } from '../validators';
import type { ReservationDto, OrderDto, PaginatedResult } from '../types';
export declare const ReservationService: {
    create(userId: string, input: CreateReservationInput): Promise<ReservationDto>;
    checkout(userId: string, reservationId: string): Promise<OrderDto>;
    cancel(userId: string, reservationId: string): Promise<void>;
    listForUser(userId: string, filters: ReservationFilterInput): Promise<PaginatedResult<ReservationDto>>;
    expireSingle(reservationId: string): Promise<void>;
};
//# sourceMappingURL=reservation.service.d.ts.map