import { api } from './client';
import type { Product, PaginatedResponse } from '../types';

export interface ProductsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

function buildQuery(params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export const productsApi = {
  list(query: ProductsQuery = {}): Promise<PaginatedResponse<Product>> {
    return api.get<PaginatedResponse<Product>>(
      `/products${buildQuery(query as Record<string, unknown>)}`
    );
  },

  getById(id: string): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  },
};
