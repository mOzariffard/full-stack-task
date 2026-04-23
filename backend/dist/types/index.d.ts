import { ReservationStatus, OrderStatus, InventoryEvent } from '@prisma/client';
export { ReservationStatus, OrderStatus, InventoryEvent };
export interface PaginationQuery {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: Record<string, unknown>;
}
export interface AuthUser {
    userId: string;
    email: string;
}
export interface ProductDto {
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
    createdAt: Date;
}
export interface ReservationDto {
    id: string;
    userId: string;
    productId: string;
    quantity: number;
    status: ReservationStatus;
    expiresAt: Date;
    completedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    product?: ProductDto;
    secondsRemaining?: number;
}
export interface OrderDto {
    id: string;
    userId: string;
    productId: string;
    reservationId: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    status: OrderStatus;
    createdAt: Date;
    product?: ProductDto;
}
export interface ProductFilter {
    isActive?: boolean;
    minStock?: number;
    maxPrice?: number;
    search?: string;
}
export interface ReservationFilter {
    status?: ReservationStatus;
    userId?: string;
    productId?: string;
}
//# sourceMappingURL=index.d.ts.map