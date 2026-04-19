'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { reservationsApi } from '../../src/api/reservations';
import { ApiError } from '../../src/api/client';
import { useCountdown } from '../../src/hooks/useCountdown';
import { useAuth } from '../../src/context/AuthContext';
import type { Reservation } from '../../src/types';

function ReservationRow({ reservation }: { reservation: Reservation }) {
  const { formattedTime, isExpired } = useCountdown(
    reservation.status === 'PENDING' ? reservation.expiresAt : null
  );

  const statusColors: Record<string, string> = {
    PENDING: isExpired ? 'status--expired' : 'status--pending',
    COMPLETED: 'status--completed',
    EXPIRED: 'status--expired',
    CANCELLED: 'status--cancelled',
  };

  return (
    <div className={`reservation-row ${statusColors[reservation.status]}`}>
      <div className="reservation-row__id">
        <span className="label">Reservation</span>
        <code>#{reservation.id.slice(0, 8)}</code>
      </div>
      <div className="reservation-row__product">
        <span className="label">Product</span>
        <Link href={`/drop/${reservation.productId}`}>
          {reservation.productId.slice(0, 8)}…
        </Link>
      </div>
      <div className="reservation-row__qty">
        <span className="label">Qty</span>
        {reservation.quantity}
      </div>
      <div className="reservation-row__status">
        <span className={`status-pill status-pill--${reservation.status.toLowerCase()}`}>
          {reservation.status === 'PENDING' && !isExpired
            ? `⏰ ${formattedTime}`
            : reservation.status}
        </span>
      </div>
      {reservation.status === 'PENDING' && !isExpired && (
        <Link href={`/drop/${reservation.productId}`} className="btn btn-primary btn--sm">
          Checkout
        </Link>
      )}
    </div>
  );
}

export default function MyReservationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchReservations = async () => {
      try {
        const data = await reservationsApi.list();
        setReservations(data.data || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [isAuthenticated]);

  if (isLoading) return <div className="loading-screen">Loading…</div>;
  if (!isAuthenticated) return <div>Please log in to view your reservations.</div>;

  return (
    <main className="page my-reservations-page">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Track your active reservations and complete checkouts.</p>
      </div>

      {loading && <div className="loading-state">Loading reservations…</div>}

      {error && (
        <div className="error-state">
          <p>😓 {error}</p>
        </div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <div className="empty-state">
          <p>You have no reservations yet.</p>
          <Link href="/" className="btn btn-primary">
            Browse Drops
          </Link>
        </div>
      )}

      {!loading && !error && reservations.length > 0 && (
        <div className="reservations-list">
          {reservations.map((reservation) => (
            <ReservationRow key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
    </main>
  );
}