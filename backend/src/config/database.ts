import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

const createPrismaClient = () => {
  return new PrismaClient({
    log: config.isProduction
      ? ['error']
      : [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
  });
};

// Singleton pattern to avoid multiple connections in dev (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

export const prisma: ReturnType<typeof createPrismaClient> =
  global.__prisma ?? createPrismaClient();

if (!config.isProduction) {
  global.__prisma = prisma;

  (prisma as unknown as { $on: (event: string, cb: (e: unknown) => void) => void }).$on(
    'query',
    (e: unknown) => {
      const query = e as { query: string; duration: number };
      if (query.duration > 200) {
        logger.warn({ query: query.query, duration: query.duration }, 'Slow query detected');
      }
    }
  );
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error({ err }, '❌ Database connection failed');
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
