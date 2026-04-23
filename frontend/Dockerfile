FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit

COPY . .
RUN npm run build

# ── Production ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Use the fresh standalone build (not the committed one)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

# Next.js standalone server.js already reads PORT and HOSTNAME from env
CMD ["node", "server.js"]
