"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const createPrismaClient = () => {
    return new client_1.PrismaClient({
        log: config_1.config.isProduction
            ? ['error']
            : [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ],
    });
};
exports.prisma = global.__prisma ?? createPrismaClient();
if (!config_1.config.isProduction) {
    global.__prisma = exports.prisma;
    exports.prisma.$on('query', (e) => {
        const query = e;
        if (query.duration > 200) {
            logger_1.logger.warn({ query: query.query, duration: query.duration }, 'Slow query detected');
        }
    });
}
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('✅ Database connected');
    }
    catch (err) {
        logger_1.logger.error({ err }, '❌ Database connection failed');
        process.exit(1);
    }
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
    logger_1.logger.info('Database disconnected');
}
//# sourceMappingURL=database.js.map