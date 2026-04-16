import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { useReservation } from '../hooks/useReservation';
import { useCountdown } from '../hooks/useCountdown';
import { useAuth } from '../context/AuthContext';
import { StockDisplay } from '../components/StockDisplay';
import { ReserveButton } from '../components/ReserveButton';
import { CountdownTimer } from '../components/CountdownTimer';
import { AuthModal } from '../components/AuthModal';

export function DropPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Product data (polled every 5s) ────────────────────────────────────────
  const {
    status: productStatus,
    data: product,
    error: productError,
  } = useProduct(productId ?? null);

  // ── Reservation state ─────────────────────────────────────────────────────
  const {
    reservation,
    order,
    reserveState,
    checkoutState,
    reserve,
    checkout,
    cancel,
    reset,
  } = useReservation(productId ?? null);

  // ── Countdown (only relevant while PENDING) ───────────────────────────────
  const { isExpired } = useCountdown(
    reservation?.status === 'PENDING' ? reservation.expiresAt : null
  );

  // If the user completes checkout, redirect to a success view after a delay
  useEffect(() => {
    if (order) {
      const t = setTimeout(() => navigate('/my-reservations'), 4000);
      return () => clearTimeout(t);
    }
  }, [order, navigate]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReserve = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (productId) reserve(productId, 1);
  };

  const handleReservationExpired = () => {
    // Nothing — ReserveButton reads `isExpired` directly
  };

  if (productStatus === 'loading') {
    return (
      <main className="page drop-page">
        <div className="drop-page__skeleton">
          <div className="skeleton skeleton--img" />
          <div className="skeleton skeleton--text" />
          <div className="skeleton skeleton--text skeleton--short" />
        </div>
      </main>
    );
  }

  if (productStatus === 'error' || !product) {
    return (
      <main className="page drop-page">
        <div className="error-state">
          <p>😓 {productError ?? 'Product not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Drops
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page drop-page">
      {showAuthModal && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <div className="drop-page__layout">
        {/* ── Left: Product image ───────────────────────────────────────── */}
        <div className="drop-page__image-col">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="drop-page__image"
            />
          ) : (
            <div className="drop-page__image-placeholder">🛒</div>
          )}

          {!product.isActive && (
            <div className="product-badge product-badge--inactive">
              Drop Ended
            </div>
          )}
        </div>

        {/* ── Right: Product details + reserve flow ─────────────────────── */}
        <div className="drop-page__info-col">
          <p className="drop-page__category">Limited Edition Drop</p>
          <h1 className="drop-page__name">{product.name}</h1>
          <p className="drop-page__price">${product.price}</p>
          <p className="drop-page__description">{product.description}</p>

          {/* Live stock indicator */}
          <StockDisplay
            availableStock={product.availableStock}
            totalStock={product.totalStock}
            isPolling
          />

          <div className="drop-page__divider" />

          {/* Countdown timer (shown only while reservation is PENDING) */}
          {reservation?.status === 'PENDING' && !isExpired && (
            <CountdownTimer
              expiresAt={reservation.expiresAt}
              onExpired={handleReservationExpired}
            />
          )}

          {/* Order success banner */}
          {order && (
            <div className="order-success-banner">
              <span className="order-success-icon">🎉</span>
              <div>
                <p className="order-success-title">Order #{order.id.slice(0, 8)} confirmed!</p>
                <p className="order-success-sub">
                  Total: ${order.totalPrice} · Redirecting…
                </p>
              </div>
            </div>
          )}

          {/* Reserve / checkout button */}
          {!order && (
            <ReserveButton
              availableStock={product.availableStock}
              reservation={reservation}
              isLoading={reserveState.status === 'loading'}
              error={reserveState.error}
              isExpired={isExpired}
              onReserve={handleReserve}
              onCheckout={checkout}
              onCancel={cancel}
              isCheckingOut={checkoutState.status === 'loading'}
              checkoutError={checkoutState.error}
            />
          )}

          {/* Network/race condition edge case messages */}
          {reserveState.status === 'error' && (
            <div className="edge-case-banner">
              {reserveState.error?.includes('INSUFFICIENT_STOCK') ||
              reserveState.error?.includes('stock') ? (
                <p>😢 Someone grabbed the last unit just before you. Check back soon!</p>
              ) : reserveState.error?.includes('DUPLICATE') ? (
                <p>ℹ️ You already have an active reservation for this item.</p>
              ) : reserveState.error?.includes('timeout') ||
                reserveState.error?.includes('Network') ? (
                <div>
                  <p>🌐 Network issue detected.</p>
                  <button className="btn-link" onClick={reset}>
                    Refresh and try again
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <div className="drop-page__trust-badges">
            <span>🔒 Secure checkout</span>
            <span>⏱ 5-min hold</span>
            <span>🚫 No duplicates</span>
          </div>
        </div>
      </div>
    </main>
  );
}
