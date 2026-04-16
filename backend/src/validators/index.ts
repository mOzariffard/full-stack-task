import { z } from 'zod';
import { ReservationStatus } from '@prisma/client';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// ── Products ─────────────────────────────────────────────────────────────────

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  price: z.number().positive('Price must be positive'),
  imageUrl: z.string().url().optional(),
  totalStock: z.number().int().positive('Stock must be a positive integer'),
});

export const ProductFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'price', 'currentStock', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isActive: z.coerce.boolean().optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().max(100).optional(),
});

// ── Reservations ─────────────────────────────────────────────────────────────

export const CreateReservationSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1).max(10, 'Max 10 units per reservation'),
});

export const CheckoutSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
});

export const ReservationFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'expiresAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.nativeEnum(ReservationStatus).optional(),
});

// ── Params ───────────────────────────────────────────────────────────────────

export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type ProductFilterInput = z.infer<typeof ProductFilterSchema>;
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type ReservationFilterInput = z.infer<typeof ReservationFilterSchema>;
