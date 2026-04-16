import { useState, useEffect, useCallback, useRef } from 'react';
import { productsApi } from '../api/products';
import { ApiError } from '../api/client';
import type { Product, AsyncState } from '../types';
import { initialAsync } from '../types';

const POLL_INTERVAL_MS = 5_000;

interface UseProductResult extends AsyncState<Product> {
  refresh: () => Promise<void>;
}

/**
 * Fetches a single product and polls for stock updates every 5 seconds.
 * Stops polling when the component unmounts.
 */
export function useProduct(productId: string | null): UseProductResult {
  const [state, setState] = useState<AsyncState<Product>>(initialAsync<Product>());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async (silent = false) => {
    if (!productId) return;

    if (!silent) {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
    }

    try {
      const product = await productsApi.getById(productId);
      if (mountedRef.current) {
        setState({ status: 'success', data: product, error: null });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof ApiError ? err.message : 'Failed to load product';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, [productId]);

  // Initial fetch + polling setup
  useEffect(() => {
    mountedRef.current = true;

    if (!productId) return;

    fetch(false);

    pollRef.current = setInterval(() => {
      fetch(true); // silent = don't show loading spinner on poll
    }, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [productId, fetch]);

  return {
    ...state,
    refresh: () => fetch(false),
  };
}

/**
 * Fetches the products list (used on the drop list page).
 */
export function useProducts() {
  const [state, setState] = useState<AsyncState<Product[]>>(initialAsync<Product[]>());

  const fetchAll = useCallback(async () => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const result = await productsApi.list({ isActive: true, limit: 20 });
      setState({ status: 'success', data: result.data ?? [], error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load products';
      setState({ status: 'error', data: null, error: message });
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { ...state, refresh: fetchAll };
}
