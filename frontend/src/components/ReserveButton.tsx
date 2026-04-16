import type { Reservation } from '../types';

interface ReserveButtonProps {
  availableStock: number;
  reservation: Reservation | null;
  isLoading: boolean;
  error: string | null;
  isExpired: boolean;
  onReserve: () => void;
  onCheckout: () => void;
  onCancel: () => void;
  isCheckingOut: boolean;
  checkoutError: string | null;
}

export function ReserveButton({
  availableStock,
  reservation,
  isLoading,
  error,
  isExpired,
  onReserve,
  onCheckout,
  onCancel,
  isCheckingOut,
  checkoutError,
}: ReserveButtonProps) {
  const soldOut = availableStock === 0;
  const hasPendingReservation = reservation?.status === 'PENDING' && !isExpired;
  const isCompleted = reservation?.status === 'COMPLETED';

  // ── Sold out ────────────────────────────────────────────────────────────────
  if (soldOut && !hasPendingReservation && !isCompleted) {
    return (
      <div className="reserve-btn-wrapper">
        <button className="btn btn-disabled" disabled>
          😔 Sold Out
        </button>
        <p className="btn-subtext">All units have been reserved or sold</p>
      </div>
    );
  }

  // ── Completed ───────────────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="reserve-btn-wrapper">
        <div className="checkout-success">
          <span className="success-icon">✅</span>
          <div>
            <p className="success-title">Order Confirmed!</p>
            <p className="success-sub">Check your email for details.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Has pending reservation ─────────────────────────────────────────────────
  if (hasPendingReservation) {
    return (
      <div className="reserve-btn-wrapper">
        <button
          className="btn btn-checkout"
          onClick={onCheckout}
          disabled={isCheckingOut}
        >
          {isCheckingOut ? (
            <>
              <span className="spinner" /> Processing…
            </>
          ) : (
            '💳 Complete Checkout'
          )}
        </button>
        <button className="btn-link" onClick={onCancel}>
          Release reservation
        </button>
        {checkoutError && <p className="error-msg">{checkoutError}</p>}
      </div>
    );
  }

  // ── Expired ─────────────────────────────────────────────────────────────────
  if (isExpired && reservation) {
    return (
      <div className="reserve-btn-wrapper">
        <p className="expired-msg">⏰ Your reservation expired</p>
        <button
          className="btn btn-primary"
          onClick={onReserve}
          disabled={soldOut || isLoading}
        >
          Reserve Again
        </button>
        {error && <p className="error-msg">{error}</p>}
      </div>
    );
  }

  // ── Default: reserve ────────────────────────────────────────────────────────
  return (
    <div className="reserve-btn-wrapper">
      <button
        className="btn btn-primary"
        onClick={onReserve}
        disabled={soldOut || isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner" /> Reserving…
          </>
        ) : (
          '⚡ Reserve Now'
        )}
      </button>
      {error && <p className="error-msg">{error}</p>}
      <p className="btn-subtext">Free 5-minute hold — no card required</p>
    </div>
  );
}
