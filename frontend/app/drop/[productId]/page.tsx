'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProduct } from '../../../src/hooks/useProduct';
import { useReservation } from '../../../src/hooks/useReservation';
import { useCountdown } from '../../../src/hooks/useCountdown';
import { useAuth } from '../../../src/context/AuthContext';
import { StockDisplay } from '../../../src/components/StockDisplay';
import { ReserveButton } from '../../../src/components/ReserveButton';
import { CountdownTimer } from '../../../src/components/CountdownTimer';
import { AuthModal } from '../../../src/components/AuthModal';

interface DropPageProps {
  productId: string;
}

function DropPage({ productId }: DropPageProps) {
  const router = useRouter();
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
      const t = setTimeout(() => router.push('/my-reservations'), 4000);
      return () => clearTimeout(t);
    }
  }, [order, router]);

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
          <button className="btn btn-primary" onClick={() => router.push('/')}>
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

          {/* Reserve button */}
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
        </div>
      </div>
    </main>
  );
}

export default function DropDetailPage({ params }: { params: { productId: string } }) {
  return <DropPage productId={params.productId} />;
}