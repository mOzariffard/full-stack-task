FROM node:20-alpine AS base
WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
# Set dummy environment variables for Prisma generation during build
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" JWT_SECRET="dummy-secret-key-at-least-32-characters-long" npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Copy production deps
COPY --from=builder /app/node_modules ./node_modules
# Copy compiled output
COPY --from=builder /app/dist ./dist
# Copy prisma schema + generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

EXPOSE 4000

# Keep as root for migrations and node_modules access during startup
# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
