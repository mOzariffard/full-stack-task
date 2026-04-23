interface Counter {
    value: number;
}
interface Gauge {
    value: number;
}
declare class MetricsCollector {
    private counters;
    private gauges;
    private histograms;
    private startTime;
    increment(name: string, amount?: number): void;
    setGauge(name: string, value: number): void;
    observe(name: string, value: number): void;
    getSnapshot(): {
        uptime_seconds: number;
        counters: {
            [k: string]: Counter;
        };
        gauges: {
            [k: string]: Gauge;
        };
        histograms: {
            [k: string]: {
                count: number;
                sum: number;
                avg: number;
                buckets: Record<string, number>;
            };
        };
    };
}
export declare const metrics: MetricsCollector;
export {};
//# sourceMappingURL=metrics.d.ts.map