import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReserveButton } from '../components/ReserveButton';
import type { Reservation } from '../types';

const noop = vi.fn();

const pendingReservation: Reservation = {
  id: 'res-1',
  userId: 'user-1',
  productId: 'prod-1',
  quantity: 1,
  status: 'PENDING',
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  completedAt: null,
  cancelledAt: null,
  createdAt: new Date().toISOString(),
};

const completedReservation: Reservation = {
  ...pendingReservation,
  status: 'COMPLETED',
  completedAt: new Date().toISOString(),
};

function renderBtn(overrides: Partial<Parameters<typeof ReserveButton>[0]> = {}) {
  const props = {
    availableStock: 10,
    reservation: null,
    isLoading: false,
    error: null,
    isExpired: false,
    onReserve: noop,
    onCheckout: noop,
    onCancel: noop,
    isCheckingOut: false,
    checkoutError: null,
    ...overrides,
  };
  return render(<ReserveButton {...props} />);
}

describe('ReserveButton', () => {
  it('shows "Reserve Now" when no reservation and stock available', () => {
    renderBtn();
    expect(screen.getByRole('button', { name: /Reserve Now/i })).toBeInTheDocument();
  });

  it('shows "Sold Out" when stock is 0 and no reservation', () => {
    renderBtn({ availableStock: 0 });
    expect(screen.getByRole('button', { name: /Sold Out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sold Out/i })).toBeDisabled();
  });

  it('calls onReserve when Reserve Now is clicked', () => {
    const onReserve = vi.fn();
    renderBtn({ onReserve });
    fireEvent.click(screen.getByRole('button', { name: /Reserve Now/i }));
    expect(onReserve).toHaveBeenCalledTimes(1);
  });

  it('shows loading state while reserving', () => {
    renderBtn({ isLoading: true });
    expect(screen.getByText(/Reserving/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows error message when reserve fails', () => {
    renderBtn({ error: 'No stock left' });
    expect(screen.getByText('No stock left')).toBeInTheDocument();
  });

  it('shows checkout button when pending reservation exists', () => {
    renderBtn({ reservation: pendingReservation });
    expect(screen.getByRole('button', { name: /Complete Checkout/i })).toBeInTheDocument();
  });

  it('calls onCheckout when checkout button clicked', () => {
    const onCheckout = vi.fn();
    renderBtn({ reservation: pendingReservation, onCheckout });
    fireEvent.click(screen.getByRole('button', { name: /Complete Checkout/i }));
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it('shows "Processing…" while checking out', () => {
    renderBtn({ reservation: pendingReservation, isCheckingOut: true });
    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
  });

  it('shows checkout error message', () => {
    renderBtn({
      reservation: pendingReservation,
      checkoutError: 'Payment failed',
    });
    expect(screen.getByText('Payment failed')).toBeInTheDocument();
  });

  it('shows "release reservation" cancel link when pending', () => {
    renderBtn({ reservation: pendingReservation });
    expect(screen.getByText(/Release reservation/i)).toBeInTheDocument();
  });

  it('calls onCancel when release link is clicked', () => {
    const onCancel = vi.fn();
    renderBtn({ reservation: pendingReservation, onCancel });
    fireEvent.click(screen.getByText(/Release reservation/i));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows order confirmed state when reservation is COMPLETED', () => {
    renderBtn({ reservation: completedReservation });
    expect(screen.getByText(/Order Confirmed/i)).toBeInTheDocument();
  });

  it('shows expired message and re-reserve when isExpired=true', () => {
    renderBtn({
      reservation: pendingReservation,
      isExpired: true,
    });
    expect(screen.getByText(/Your reservation expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reserve Again/i })).toBeInTheDocument();
  });

  it('disables Reserve button during loading', () => {
    renderBtn({ isLoading: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onReserve when sold out', () => {
    const onReserve = vi.fn();
    renderBtn({ availableStock: 0, onReserve });
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onReserve).not.toHaveBeenCalled();
  });
});
