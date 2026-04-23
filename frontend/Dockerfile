FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Production ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

# Copy our custom server that correctly reads PORT from env
COPY --from=builder /app/server-start.js ./server-start.js

# Use custom server — reads PORT env var injected by Pxxl at runtime
CMD ["node", "server-start.js"]
