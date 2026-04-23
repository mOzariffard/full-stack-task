"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateReservationError = exports.ReservationExpiredError = exports.StockError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 422, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class StockError extends AppError {
    constructor(message = 'Insufficient stock') {
        super(message, 409, 'INSUFFICIENT_STOCK');
    }
}
exports.StockError = StockError;
class ReservationExpiredError extends AppError {
    constructor() {
        super('Reservation has expired', 410, 'RESERVATION_EXPIRED');
    }
}
exports.ReservationExpiredError = ReservationExpiredError;
class DuplicateReservationError extends AppError {
    constructor() {
        super('You already have an active reservation for this product', 409, 'DUPLICATE_RESERVATION');
    }
}
exports.DuplicateReservationError = DuplicateReservationError;
//# sourceMappingURL=errors.js.map