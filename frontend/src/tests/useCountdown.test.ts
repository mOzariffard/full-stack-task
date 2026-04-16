import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCountdown } from '../hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns correct initial seconds remaining', () => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { result } = renderHook(() => useCountdown(expiresAt));

    expect(result.current.secondsLeft).toBeGreaterThanOrEqual(299);
    expect(result.current.secondsLeft).toBeLessThanOrEqual(300);
    expect(result.current.isExpired).toBe(false);
  });

  it('formats time correctly as MM:SS', () => {
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000 + 33 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expiresAt));

    // Should be "04:33" (approximately)
    expect(result.current.formattedTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it('ticks down by 1 each second', () => {
    const expiresAt = new Date(Date.now() + 10 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expiresAt));

    const initial = result.current.secondsLeft;

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsLeft).toBe(initial - 3);
  });

  it('sets isExpired to true when time runs out', () => {
    const expiresAt = new Date(Date.now() + 2 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expiresAt));

    expect(result.current.isExpired).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isExpired).toBe(true);
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.formattedTime).toBe('00:00');
  });

  it('returns zero seconds when expiresAt is in the past', () => {
    const expiresAt = new Date(Date.now() - 60 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expiresAt));

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('returns zero when expiresAt is null', () => {
    const { result } = renderHook(() => useCountdown(null));

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe('00:00');
  });

  it('calculates progressPercent correctly', () => {
    const TOTAL = 300;
    const expiresAt = new Date(Date.now() + 150 * 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expiresAt, TOTAL));

    // ~50% of total remaining
    expect(result.current.progressPercent).toBeGreaterThan(48);
    expect(result.current.progressPercent).toBeLessThan(52);
  });

  it('progressPercent reaches 0 when expired', () => {
    const expiresAt = new Date(Date.now() + 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expiresAt, 300));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.progressPercent).toBe(0);
  });

  it('stops ticking after expiry (no further setState calls)', () => {
    const expiresAt = new Date(Date.now() + 1000).toISOString();
    const { result } = renderHook(() => useCountdown(expiresAt));

    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.secondsLeft).toBe(0);

    // Advance further — should stay at 0
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsLeft).toBe(0);
  });

  it('resets when expiresAt changes to a new future date', () => {
    const first = new Date(Date.now() + 10 * 1000).toISOString();
    const { result, rerender } = renderHook(
      ({ expiresAt }: { expiresAt: string }) => useCountdown(expiresAt),
      { initialProps: { expiresAt: first } }
    );

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsLeft).toBeLessThan(10);

    // Change to a fresh 5-minute expiry
    const fresh = new Date(Date.now() + 300 * 1000).toISOString();
    rerender({ expiresAt: fresh });

    expect(result.current.secondsLeft).toBeGreaterThanOrEqual(299);
  });
});
