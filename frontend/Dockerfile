FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./

# --legacy-peer-deps avoids peer conflicts
# --ignore-scripts skips postinstall hooks that can fail in CI
# audit=false stops npm from blocking the build over vulnerability warnings
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .
RUN npm run build

# ── Production ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

CMD node server.js
