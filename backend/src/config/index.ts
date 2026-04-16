import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RESERVATION_TTL_MINUTES: z.string().transform(Number).default('5'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const isTest = parsed.data.NODE_ENV === 'test';
const databaseUrl = parsed.data.DATABASE_URL || (isTest ? 'postgresql://test:test@localhost:5432/test' : '');
const jwtSecret = parsed.data.JWT_SECRET || (isTest ? 'test-secret-key-at-least-32-characters-long-for-tests' : '');

if (!isTest && (!databaseUrl || !jwtSecret)) {
  console.error('❌ DATABASE_URL and JWT_SECRET are required in non-test environments');
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: databaseUrl,
  jwt: {
    secret: jwtSecret,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },
  reservation: {
    ttlMinutes: parsed.data.RESERVATION_TTL_MINUTES,
  },
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    max: parsed.data.RATE_LIMIT_MAX,
  },
  cors: {
    origin: parsed.data.CORS_ORIGIN,
  },
  logLevel: parsed.data.LOG_LEVEL,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: isTest,
} as const;
