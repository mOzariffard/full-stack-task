import { useState, useEffect, useRef } from 'react';

export interface CountdownResult {
  secondsLeft: number;
  isExpired: boolean;
  formattedTime: string;
  progressPercent: number;
}

/**
 * Counts down from an expiry timestamp to zero.
 * Re-renders every second. Stops automatically when expired.
 *
 * @param expiresAt  ISO string or Date of expiry
 * @param totalSeconds  Total duration to calculate progress % (default 300 = 5 min)
 */
export function useCountdown(
  expiresAt: string | Date | null,
  totalSeconds = 300
): CountdownResult {
  const getSecondsLeft = () => {
    if (!expiresAt) return 0;
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(getSecondsLeft);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }

    // Immediate sync
    setSecondsLeft(getSecondsLeft());

    intervalRef.current = setInterval(() => {
      const s = getSecondsLeft();
      setSecondsLeft(s);
      if (s === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  return {
    secondsLeft,
    isExpired: secondsLeft === 0,
    formattedTime,
    progressPercent,
  };
}
