interface StockDisplayProps {
  availableStock: number;
  totalStock: number;
  isPolling?: boolean;
}

export function StockDisplay({ availableStock, totalStock, isPolling }: StockDisplayProps) {
  const pct = totalStock > 0 ? (availableStock / totalStock) * 100 : 0;

  const barColor =
    pct === 0
      ? 'bg-red-500'
      : pct <= 20
      ? 'bg-orange-500'
      : pct <= 50
      ? 'bg-yellow-500'
      : 'bg-emerald-500';

  const textColor =
    pct === 0
      ? 'text-red-600'
      : pct <= 20
      ? 'text-orange-600'
      : pct <= 50
      ? 'text-yellow-700'
      : 'text-emerald-700';

  const label =
    pct === 0
      ? 'Sold out'
      : pct <= 10
      ? 'Almost gone!'
      : pct <= 30
      ? 'Low stock'
      : 'In stock';

  return (
    <div className="stock-display">
      <div className="stock-header">
        <span className={`stock-label ${textColor}`}>{label}</span>
        <span className="stock-count">
          {availableStock} / {totalStock} available
          {isPolling && (
            <span className="live-badge" title="Updates every 5 seconds">
              ● LIVE
            </span>
          )}
        </span>
      </div>

      <div className="stock-bar-track">
        <div
          className={`stock-bar-fill ${barColor}`}
          style={{ width: `${Math.max(2, pct)}%` }}
          role="progressbar"
          aria-valuenow={availableStock}
          aria-valuemin={0}
          aria-valuemax={totalStock}
        />
      </div>

      {pct > 0 && pct <= 20 && (
        <p className="stock-urgency">
          🔥 Only {availableStock} left — grab yours before it's gone!
        </p>
      )}
    </div>
  );
}
