import { api } from './client';
import type { Reservation, Order, PaginatedResponse } from '../types';

export interface ReservationsQuery {
  page?: number;
  limit?: number;
  status?: string;
  sortOrder?: 'asc' | 'desc';
}

function buildQuery(params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export const reservationsApi = {
  create(productId: string, quantity: number): Promise<Reservation> {
    return api.post<Reservation>('/reserve', { productId, quantity });
  },

  checkout(reservationId: string): Promise<Order> {
    return api.post<Order>('/checkout', { reservationId });
  },

  cancel(reservationId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/reservations/${reservationId}`);
  },

  list(query: ReservationsQuery = {}): Promise<PaginatedResponse<Reservation>> {
    return api.get<PaginatedResponse<Reservation>>(
      `/reservations${buildQuery(query as Record<string, unknown>)}`
    );
  },
};
