import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationsApi } from '../api/reservations';
import { ApiError } from '../api/client';
import { useCountdown } from '../hooks/useCountdown';
import type { Reservation } from '../types';

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
        <Link to={`/drop/${reservation.productId}`}>
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
        <Link to={`/drop/${reservation.productId}`} className="btn btn-primary btn--sm">
          Checkout
        </Link>
      )}
    </div>
  );
}

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reservationsApi
      .list({ limit: 20, sortOrder: 'desc' })
      .then((res) => {
        setReservations(res.data ?? []);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load');
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="page reservations-page">
      <h1 className="page-title">My Reservations</h1>

      {isLoading && <p className="loading-text">Loading…</p>}

      {error && <p className="error-msg">{error}</p>}

      {!isLoading && reservations.length === 0 && (
        <div className="empty-state">
          <p>You have no reservations yet.</p>
          <Link to="/" className="btn btn-primary">Browse Drops</Link>
        </div>
      )}

      {reservations.length > 0 && (
        <div className="reservations-list">
          {reservations.map((r) => (
            <ReservationRow key={r.id} reservation={r} />
          ))}
        </div>
      )}
    </main>
  );
}
