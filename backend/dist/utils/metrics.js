"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
class MetricsCollector {
    constructor() {
        this.counters = new Map();
        this.gauges = new Map();
        this.histograms = new Map();
        this.startTime = Date.now();
    }
    // ── Counters ────────────────────────────────────────────────────────────────
    increment(name, amount = 1) {
        const existing = this.counters.get(name) ?? { value: 0 };
        existing.value += amount;
        this.counters.set(name, existing);
    }
    // ── Gauges ──────────────────────────────────────────────────────────────────
    setGauge(name, value) {
        this.gauges.set(name, { value });
    }
    // ── Histograms ──────────────────────────────────────────────────────────────
    observe(name, value) {
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
            histograms: Object.fromEntries([...this.histograms.entries()].map(([k, v]) => [
                k,
                {
                    count: v.count,
                    sum: v.sum,
                    avg: v.count > 0 ? v.sum / v.count : 0,
                    buckets: v.buckets,
                },
            ])),
        };
    }
}
exports.metrics = new MetricsCollector();
// Pre-register known metrics
exports.metrics.increment('http_requests_total', 0);
exports.metrics.increment('reservations_created_total', 0);
exports.metrics.increment('reservations_expired_total', 0);
exports.metrics.increment('orders_created_total', 0);
exports.metrics.increment('auth_failures_total', 0);
exports.metrics.setGauge('active_reservations', 0);
//# sourceMappingURL=metrics.js.map