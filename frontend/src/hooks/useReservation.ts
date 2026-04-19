'use client';

import { useState, useCallback, useEffect } from 'react';
import { reservationsApi } from '../api/reservations';
import { ApiError } from '../api/client';
import type { Reservation, Order, AsyncState } from '../types';
import { initialAsync } from '../types';

const RESERVATION_STORAGE_KEY = 'drop_system_reservations';

// ── Persistence helpers ───────────────────────────────────────────────────────

function loadStoredReservation(productId: string): Reservation | null {
  try {
    const raw = localStorage.getItem(RESERVATION_STORAGE_KEY);
    if (!raw) return null;
    const map: Record<string, Reservation> = JSON.parse(raw);
    const r = map[productId];
    if (!r) return null;

    // Remove if it's expired / not pending
    if (r.status !== 'PENDING' || new Date(r.expiresAt) <= new Date()) {
      removeStoredReservation(productId);
      return null;
    }
    return r;
  } catch {
    return null;
  }
}

function saveStoredReservation(productId: string, reservation: Reservation): void {
  try {
    const raw = localStorage.getItem(RESERVATION_STORAGE_KEY);
    const map: Record<string, Reservation> = raw ? JSON.parse(raw) : {};
    map[productId] = reservation;
    localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

function removeStoredReservation(productId: string): void {
  try {
    const raw = localStorage.getItem(RESERVATION_STORAGE_KEY);
    if (!raw) return;
    const map: Record<string, Reservation> = JSON.parse(raw);
    delete map[productId];
    localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* noop */
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseReservationResult {
  reservation: Reservation | null;
  order: Order | null;
  reserveState: AsyncState<Reservation>;
  checkoutState: AsyncState<Order>;
  reserve: (productId: string, quantity?: number) => Promise<void>;
  checkout: () => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => void;
}

export function useReservation(productId: string | null): UseReservationResult {
  const [reservation, setReservation] = useState<Reservation | null>(() =>
    productId ? loadStoredReservation(productId) : null
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [reserveState, setReserveState] = useState<AsyncState<Reservation>>(
    initialAsync<Reservation>()
  );
  const [checkoutState, setCheckoutState] = useState<AsyncState<Order>>(
    initialAsync<Order>()
  );

  // Sync reservation from storage when productId changes
  useEffect(() => {
    if (productId) {
      const stored = loadStoredReservation(productId);
      setReservation(stored);
    } else {
      setReservation(null);
    }
  }, [productId]);

  // ── reserve ────────────────────────────────────────────────────────────────

  const reserve = useCallback(
    async (pid: string, quantity = 1) => {
      setReserveState({ status: 'loading', data: null, error: null });
      try {
        const newReservation = await reservationsApi.create(pid, quantity);
        setReservation(newReservation);
        saveStoredReservation(pid, newReservation);
        setReserveState({ status: 'success', data: newReservation, error: null });
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to create reservation';
        setReserveState({ status: 'error', data: null, error: message });
      }
    },
    []
  );

  // ── checkout ───────────────────────────────────────────────────────────────

  const checkout = useCallback(async () => {
    if (!reservation) return;

    setCheckoutState({ status: 'loading', data: null, error: null });
    try {
      const newOrder = await reservationsApi.checkout(reservation.id);
      setOrder(newOrder);
      setReservation((prev) =>
        prev ? { ...prev, status: 'COMPLETED', completedAt: new Date().toISOString() } : null
      );
      if (productId) removeStoredReservation(productId);
      setCheckoutState({ status: 'success', data: newOrder, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Checkout failed';
      setCheckoutState({ status: 'error', data: null, error: message });
    }
  }, [reservation, productId]);

  // ── cancel ─────────────────────────────────────────────────────────────────

  const cancel = useCallback(async () => {
    if (!reservation) return;
    try {
      await reservationsApi.cancel(reservation.id);
      if (productId) removeStoredReservation(productId);
      setReservation(null);
      setReserveState(initialAsync<Reservation>());
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to cancel';
      setReserveState((prev) => ({ ...prev, error: message }));
    }
  }, [reservation, productId]);

  // ── reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    if (productId) removeStoredReservation(productId);
    setReservation(null);
    setOrder(null);
    setReserveState(initialAsync<Reservation>());
    setCheckoutState(initialAsync<Order>());
  }, [productId]);

  return {
    reservation,
    order,
    reserveState,
    checkoutState,
    reserve,
    checkout,
    cancel,
    reset,
  };
}
