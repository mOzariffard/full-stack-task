interface Counter {
  value: number;
}

interface Gauge {
  value: number;
}

interface Histogram {
  count: number;
  sum: number;
  buckets: Record<string, number>;
}

class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private startTime = Date.now();

  // ── Counters ────────────────────────────────────────────────────────────────

  increment(name: string, amount = 1): void {
    const existing = this.counters.get(name) ?? { value: 0 };
    existing.value += amount;
    this.counters.set(name, existing);
  }

  // ── Gauges ──────────────────────────────────────────────────────────────────

  setGauge(name: string, value: number): void {
    this.gauges.set(name, { value });
  }

  // ── Histograms ──────────────────────────────────────────────────────────────

  observe(name: string, value: number): void {
    const BUCKETS = [10, 50, 100, 200, 500, 1000, 2000, 5000];
    const existing = this.histograms.get(name) ?? {
      count: 0,
      sum: 0,
      buckets: Object.fromEntries([...BUCKETS.map((b) => [`le_${b}`, 0]), ['le_inf', 0]]),
    };

    existing.count++;
    existing.sum += value;

    for (const bucket of BUCKETS) {
      if (value <= bucket) {
        existing.buckets[`le_${bucket}`]++;
      }
    }
    existing.buckets['le_inf']++;

    this.histograms.set(name, existing);
  }

  // ── Snapshot ────────────────────────────────────────────────────────────────

  getSnapshot() {
    return {
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        [...this.histograms.entries()].map(([k, v]) => [
          k,
          {
            count: v.count,
            sum: v.sum,
            avg: v.count > 0 ? v.sum / v.count : 0,
            buckets: v.buckets,
          },
        ])
      ),
    };
  }
}

export const metrics = new MetricsCollector();

// Pre-register known metrics
metrics.increment('http_requests_total', 0);
metrics.increment('reservations_created_total', 0);
metrics.increment('reservations_expired_total', 0);
metrics.increment('orders_created_total', 0);
metrics.increment('auth_failures_total', 0);
metrics.setGauge('active_reservations', 0);
