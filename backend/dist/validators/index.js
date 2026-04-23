"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidParamSchema = exports.ReservationFilterSchema = exports.CheckoutSchema = exports.CreateReservationSchema = exports.ProductFilterSchema = exports.CreateProductSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// ── Auth ─────────────────────────────────────────────────────────────────────
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// ── Products ─────────────────────────────────────────────────────────────────
exports.CreateProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(200),
    description: zod_1.z.string().min(10).max(2000),
    price: zod_1.z.number().positive('Price must be positive'),
    imageUrl: zod_1.z.string().url().optional(),
    totalStock: zod_1.z.number().int().positive('Stock must be a positive integer'),
});
exports.ProductFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    sortBy: zod_1.z.enum(['name', 'price', 'currentStock', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    isActive: zod_1.z.coerce.boolean().optional(),
    minStock: zod_1.z.coerce.number().int().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().positive().optional(),
    search: zod_1.z.string().max(100).optional(),
});
// ── Reservations ─────────────────────────────────────────────────────────────
exports.CreateReservationSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid product ID'),
    quantity: zod_1.z.number().int().min(1).max(10, 'Max 10 units per reservation'),
});
exports.CheckoutSchema = zod_1.z.object({
    reservationId: zod_1.z.string().uuid('Invalid reservation ID'),
});
exports.ReservationFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    sortBy: zod_1.z.enum(['createdAt', 'expiresAt', 'status']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    status: zod_1.z.nativeEnum(client_1.ReservationStatus).optional(),
});
// ── Params ───────────────────────────────────────────────────────────────────
exports.UuidParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid ID format'),
});
//# sourceMappingURL=index.js.map