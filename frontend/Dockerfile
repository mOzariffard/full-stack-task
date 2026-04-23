FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit

COPY . .
RUN npm run build

# ── Production ────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy the static export to nginx's default public folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
