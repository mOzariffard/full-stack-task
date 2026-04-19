'use client';

import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  expiresAt: string;
  onExpired?: () => void;
  totalSeconds?: number;
}

export function CountdownTimer({
  expiresAt,
  onExpired,
  totalSeconds = 300,
}: CountdownTimerProps) {
  const { formattedTime, secondsLeft, isExpired, progressPercent } = useCountdown(
    expiresAt,
    totalSeconds
  );

  // Notify parent on expiry
  if (isExpired && onExpired) {
    // Defer to avoid calling setState on parent during render
    setTimeout(onExpired, 0);
  }

  const urgency =
    secondsLeft === 0
      ? 'expired'
      : secondsLeft <= 30
      ? 'critical'
      : secondsLeft <= 60
      ? 'warning'
      : 'normal';

  // SVG ring parameters
  const RADIUS = 36;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressPercent / 100);

  const ringColor =
    urgency === 'expired'
      ? '#ef4444'
      : urgency === 'critical'
      ? '#ef4444'
      : urgency === 'warning'
      ? '#f97316'
      : '#10b981';

  return (
    <div className={`countdown-wrapper countdown-${urgency}`}>
      <div className="countdown-ring-container">
        <svg width="88" height="88" className="countdown-ring">
          {/* Background circle */}
          <circle cx="44" cy="44" r={RADIUS} stroke="#e5e7eb" strokeWidth="6" fill="none" />
          {/* Progress circle */}
          <circle
            cx="44"
            cy="44"
            r={RADIUS}
            stroke={ringColor}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={isExpired ? CIRCUMFERENCE : strokeDashoffset}
            transform="rotate(-90 44 44)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div className="countdown-time-overlay">
          <span className="countdown-digits">{isExpired ? '00:00' : formattedTime}</span>
        </div>
      </div>

      <div className="countdown-info">
        {isExpired ? (
          <p className="countdown-expired-msg">⏰ Reservation expired</p>
        ) : (
          <>
            <p className="countdown-label">
              {urgency === 'critical' || urgency === 'warning'
                ? '⚡ Hurry! Time running out'
                : '🛒 Reserved for you'}
            </p>
            <p className="countdown-sublabel">Complete checkout before time runs out</p>
          </>
        )}
      </div>
    </div>
  );
}
