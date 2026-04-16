// ── API Response types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  totalStock: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  isActive: boolean;
  createdAt: string;
}

export type ReservationStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type OrderStatus = 'CONFIRMED' | 'FULFILLED' | 'REFUNDED' | 'CANCELLED';

export interface Reservation {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  secondsRemaining?: number;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  reservationId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: OrderStatus;
  createdAt: string;
  product?: Product;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  _count?: { reservations: number; orders: number };
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface AuthTokens {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

// ── UI state types ────────────────────────────────────────────────────────────

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

export function initialAsync<T>(): AsyncState<T> {
  return { status: 'idle', data: null, error: null };
}
