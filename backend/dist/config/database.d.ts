import { PrismaClient } from '@prisma/client';
declare const createPrismaClient: () => PrismaClient<{
    log: "error"[] | ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "error";
    } | {
        emit: "event";
        level: "warn";
    })[];
}, "warn" | "error" | "query", import("@prisma/client/runtime/library").DefaultArgs>;
declare global {
    var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}
export declare const prisma: ReturnType<typeof createPrismaClient>;
export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
export {};
//# sourceMappingURL=database.d.ts.map