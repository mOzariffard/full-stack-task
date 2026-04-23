"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const config_1 = require("./config");
const database_1 = require("./config/database");
const expiration_service_1 = require("./services/expiration.service");
const logger_1 = require("./utils/logger");
async function main() {
    await (0, database_1.connectDatabase)();
    const app = (0, app_1.createApp)();
    const server = app.listen(config_1.config.port, () => {
        logger_1.logger.info({ port: config_1.config.port, env: config_1.config.env }, `🚀 Server running on port ${config_1.config.port}`);
    });
    // Start background expiration job
    (0, expiration_service_1.startExpirationCron)();
    // ── Graceful shutdown ──────────────────────────────────────────────────
    const shutdown = async (signal) => {
        logger_1.logger.info({ signal }, 'Shutting down gracefully...');
        server.close(async () => {
            (0, expiration_service_1.stopExpirationCron)();
            await (0, database_1.disconnectDatabase)();
            logger_1.logger.info('Server closed. Goodbye.');
            process.exit(0);
        });
        // Force exit after 15 seconds
        setTimeout(() => process.exit(1), 15000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error({ reason }, 'Unhandled promise rejection');
    });
    process.on('uncaughtException', (err) => {
        logger_1.logger.fatal({ err }, 'Uncaught exception — shutting down');
        process.exit(1);
    });
}
main().catch((err) => {
    logger_1.logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
});
//# sourceMappingURL=index.js.map