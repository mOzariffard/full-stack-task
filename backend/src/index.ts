import 'dotenv/config';
import { createApp } from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startExpirationCron, stopExpirationCron } from './services/expiration.service';
import { logger } from './utils/logger';

async function main() {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.env },
      `🚀 Server running on port ${config.port}`
    );
  });

  // Start background expiration job
  startExpirationCron();

  // ── Graceful shutdown ──────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully...');

    server.close(async () => {
      stopExpirationCron();
      await disconnectDatabase();
      logger.info('Server closed. Goodbye.');
      process.exit(0);
    });

    // Force exit after 15 seconds
    setTimeout(() => process.exit(1), 15_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
