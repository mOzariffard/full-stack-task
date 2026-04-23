export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code: string;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class StockError extends AppError {
    constructor(message?: string);
}
export declare class ReservationExpiredError extends AppError {
    constructor();
}
export declare class DuplicateReservationError extends AppError {
    constructor();
}
//# sourceMappingURL=errors.d.ts.map