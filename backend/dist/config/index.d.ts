export declare const config: {
    readonly env: "development" | "production" | "test";
    readonly port: number;
    readonly databaseUrl: string;
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
    };
    readonly reservation: {
        readonly ttlMinutes: number;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly max: number;
    };
    readonly cors: {
        readonly origin: string;
    };
    readonly logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    readonly isProduction: boolean;
    readonly isTest: boolean;
};
//# sourceMappingURL=index.d.ts.map