# ⚡ DropSystem — Limited-Stock Product Drop System

A production-grade full-stack system for handling limited-inventory product drops with strong concurrency guarantees, real-time stock updates, and a slick countdown-timer UI.

---

## 🔗 Links

| Resource | URL |
|---|---|
| **Live App** | https://drop-system.pxxl.app |
| **API Base** | https://drop-system-api.onrender.com/api/v1 |
| **Health Check** | https://drop-system-api.onrender.com/api/v1/health |
| **Loom Walkthrough** | _(record and paste here)_ |

---

## 🏗 Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                            │
│                                                                   │
│  DropPage          useProduct          useReservation             │
│  (React/TS)   ←──  (poll 5s)    ←──   (localStorage)             │
│                         │                    │                    │
└─────────────────────────┼────────────────────┼────────────────────┘
                          │ HTTPS / REST        │
┌─────────────────────────▼────────────────────▼────────────────────┐
│                      EXPRESS API  (Node + TypeScript)             │
│                                                                   │
│  POST /api/v1/reserve        POST /api/v1/checkout               │
│       │                             │                             │
│  ReservationService ─────────────── ReservationService           │
│       │                             │                             │
│  ┌────▼─────────────────────────────▼────┐                        │
│  │   PostgreSQL TRANSACTION              │  ← Serializable        │
│  │   SELECT … FOR UPDATE  (row lock)     │    isolation           │
│  │   UPDATE products SET reservedStock   │                        │
│  │   INSERT INTO reservations            │                        │
│  │   INSERT INTO inventory_logs          │                        │
│  └───────────────────────────────────────┘                        │
│                                                                   │
│  node-cron (every 60s)                                            │
│  ─── finds PENDING WHERE expiresAt <= NOW                        │
│  ─── FOR UPDATE → mark EXPIRED, restore reservedStock            │
│                                                                   │
│  Middleware: Helmet | CORS | Rate-limit | JWT | Pino logging      │
└───────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│                    PostgreSQL 16                                  │
│  users | products | reservations | orders | inventory_logs        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🏃 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or Docker)

### 1. Clone & install

```bash
git clone https://github.com/your-org/drop-system.git
cd drop-system
npm install          # installs all workspaces
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
```

### 3. Database setup

```bash
cd backend
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts    # loads demo products and users
```

### 4. Run (development)

```bash
# from root
npm run dev
# Backend → http://localhost:4000
# Frontend → http://localhost:5173
```

### Or with Docker

```bash
docker compose up --build
```

---

## 🔐 API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/auth/register` | `{email, password, name}` | — |
| POST | `/auth/login` | `{email, password}` | — |
| GET | `/auth/profile` | — | ✅ |

### Products

| Method | Path | Query | Auth |
|--------|------|-------|------|
| GET | `/products` | `page,limit,sortBy,sortOrder,isActive,search` | — |
| GET | `/products/:id` | — | — |
| POST | `/products` | `{name,description,price,totalStock}` | ✅ |

### Reservations

| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/reserve` | `{productId, quantity}` | ✅ |
| POST | `/checkout` | `{reservationId}` | ✅ |
| GET | `/reservations` | `page,limit,status,sortOrder` | ✅ |
| DELETE | `/reservations/:id` | — | ✅ |

### Observability

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service + DB health |
| GET | `/metrics` | Request counts, durations, reservation gauges |

---

## 🧩 How Race Conditions Are Handled

This is the most critical design question. Here's exactly what we do:

### The Problem

```
Time →
User A: READ stock=1 ──────────────────── WRITE reservedStock=1 ✅
User B:      READ stock=1 ── WRITE reservedStock=1 ✅ ← OVERSELL!
```

Two users read `availableStock = 1` simultaneously, both pass the check, and both write — now `reservedStock = 2` with only 1 unit. **Stock goes negative.**

### Our Solution: `SELECT FOR UPDATE` Inside a Serializable Transaction

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Lock the product row — any other transaction trying to touch this row BLOCKS here
SELECT id, current_stock, reserved_stock
FROM products
WHERE id = $productId
FOR UPDATE;

-- Safe check (no concurrent write can happen between this and the UPDATE)
IF current_stock - reserved_stock < requested_quantity THEN
  RAISE EXCEPTION 'Insufficient stock';
END IF;

UPDATE products
  SET reserved_stock = reserved_stock + $quantity
  WHERE id = $productId;

INSERT INTO reservations (...);
INSERT INTO inventory_logs (...);

COMMIT;
```

**What this guarantees:**
- Only one transaction can hold the row lock at a time
- The read and write are atomic — no gap for concurrent modification
- Under 100 simultaneous requests for 1 item: exactly 1 succeeds, 99 get `StockError`
- Stock **never** goes negative (enforced by DB engine, not application code)

### Why not optimistic locking?

Optimistic locking (version field + retry on conflict) works but:
- Under high concurrency it generates a thundering-herd of retries
- Retry storms can amplify DB load right when you least want it
- `FOR UPDATE` is simpler and terminates immediately

---

## 📐 Schema Design Decisions

### `reservedStock` as a separate column

Instead of computing available stock from a join on reservations, we maintain `reservedStock` as a denormalized integer. This means:

- `availableStock = currentStock - reservedStock` — a simple arithmetic check, no subquery
- Under the row lock, incrementing it is a single atomic `UPDATE`
- On expiry/cancellation, we decrement it back — always inside a transaction

**Trade-off:** Must keep `reservedStock` consistent with actual `PENDING` reservation rows. The cron job + `expireSingle` transaction ensure this. Potential drift is bounded by the cron interval (60s).

### `InventoryLog` audit trail

Every stock mutation (reserve, expire, cancel, confirm) writes an immutable log row. This enables:
- Forensic debugging of stock discrepancies
- Compliance requirements
- Replay-ability for analytics

### `Reservation` unique constraint

```prisma
@@unique([userId, productId, status])
```

With `status = PENDING`, this prevents a user from having two simultaneous pending reservations for the same product — even if a race at the application layer slips through, the database rejects the duplicate insert.

---

## ⚠️ What Would Break at 10,000 Concurrent Users?

| Layer | Bottleneck | Impact |
|---|---|---|
| **DB row lock** | All requests for a hot product queue behind one lock. At 10k RPS, queue depth grows faster than transactions commit. | P99 latency → seconds. Lock timeouts (10s) start firing. |
| **Single Postgres** | ~500–1000 connections max. Connection pool exhaustion. | `503` errors |
| **In-memory metrics** | `MetricsCollector` is per-process. In multi-instance deploy, metrics are split. | Incomplete observability |
| **node-cron** | Runs in every instance — duplicate expiry attempts per reservation | Wasted work, but idempotent (harmless) |
| **localStorage** | Browser-side reservation state isn't synced across tabs | UX issue only |

---

## 📈 How to Scale It

### Immediate (handles ~5k concurrent):

1. **Connection pooling** — add PgBouncer in front of Postgres (pool_mode = transaction)
2. **Horizontal scaling** — deploy multiple backend instances behind a load balancer (sticky sessions not needed — all state is in DB)
3. **Redis for metrics** — replace in-memory `MetricsCollector` with Redis counters so all instances share one view
4. **Replace node-cron with BullMQ** — single worker processes expiry queue; other instances just enqueue

### Medium-scale (handles ~50k concurrent):

5. **Redis distributed lock** — instead of `SELECT FOR UPDATE`, use `SETNX` in Redis with a TTL as the mutex. Faster than a DB transaction for the lock check, but requires careful failure handling
6. **Read replicas** — route all `GET /products` reads to a replica so the primary only handles writes
7. **Postgres partitioning** — partition `inventory_logs` by month (it grows unboundedly)

### Large-scale (handles ~500k concurrent):

8. **Event sourcing** — replace the mutable `reservedStock` column with an append-only event stream. Current state is a projection. Eliminates row-lock contention entirely
9. **CQRS** — separate read and write models; the write model is the event log, the read model is a materialized view refreshed asynchronously
10. **Kafka** — reservation requests become events on a topic; a single-partition consumer serializes writes per product, eliminating lock contention at the DB level

---

## 🔒 Security

- **No hardcoded secrets** — all config via env vars, validated on startup
- **JWT auth** — HS256, 7-day expiry, checked on every protected route
- **bcrypt** — `cost=12` for password hashing; constant-time comparison to prevent timing attacks
- **Rate limiting** — 100 req/min global, 10/15min on auth, 20/min on `/reserve`
- **Input validation** — every request parsed through Zod schemas; no raw user data reaches services
- **Helmet** — sets 11 HTTP security headers (CSP, HSTS, etc.)
- **CORS** — explicit allowed-origin list from env var
- **Body size limit** — 10kb max request body

---

## 🧪 Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Coverage

| Suite | What's tested |
|---|---|
| `reservation.test.ts` | Create, checkout, cancel, duplicate prevention, wrong-user access |
| `concurrency.test.ts` | 50 and 100 simultaneous requests; exactly N succeed for N stock |
| `expiration.test.ts` | Cron sweep, idempotency, partial-failure resilience |
| `useCountdown.test.ts` | Tick accuracy, expiry detection, reset on new date, progress % |
| `apiErrors.test.ts` | Network error, timeout, 401/409, success=false on 200, token handling |
| `ReserveButton.test.ts` | All 12 button states: idle, loading, pending, checkout, expired, sold-out |

---

## 🗂 Project Structure

```
drop-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Data model
│   │   └── seed.ts            # Demo data
│   ├── src/
│   │   ├── config/            # Env validation, DB singleton
│   │   ├── controllers/       # Thin HTTP handlers
│   │   ├── middleware/        # Auth, validation, error handler, rate-limit, logging
│   │   ├── routes/            # All routes in one file
│   │   ├── services/          # Business logic (reservation, product, auth, expiration)
│   │   ├── types/             # Shared TypeScript interfaces
│   │   ├── utils/             # Logger, errors, JWT, metrics
│   │   ├── validators/        # Zod schemas
│   │   ├── app.ts             # Express app factory
│   │   └── index.ts           # Entry point + graceful shutdown
│   └── tests/
│       ├── reservation.test.ts
│       ├── concurrency.test.ts
│       └── expiration.test.ts
│
└── frontend/
    ├── src/
    │   ├── api/               # Typed API layer (client, products, reservations, auth)
    │   ├── components/        # Reusable UI (ProductCard, ReserveButton, Countdown, etc.)
    │   ├── context/           # AuthContext
    │   ├── hooks/             # useProduct, useReservation, useCountdown
    │   ├── pages/             # DropListPage, DropPage, MyReservationsPage
    │   ├── styles/            # Global CSS with design tokens
    │   ├── tests/             # Component + hook + API tests
    │   ├── types/             # Strict TypeScript types (no `any`)
    │   ├── App.tsx            # Routing
    │   └── main.tsx           # Entry point
    └── index.html
```

---

## 🚀 Deployment on Render

### Backend (Web Service)

1. **Build Command:** `npm install && npx prisma generate && npm run build`
2. **Start Command:** `npx prisma migrate deploy && node dist/index.js`
3. **Environment Variables:** Copy from `.env.example`
4. **Add-on:** Attach a Render PostgreSQL database → copy the connection string to `DATABASE_URL`

### Frontend (Static Site)

1. **Build Command:** `npm install && npm run build`
2. **Publish Directory:** `dist`
3. **Add redirect rule:** `/* → /index.html (200)` for React Router

### Keep-Alive (Prevent Render Downtime)

Render free tier spins down after inactivity. Add a cron ping to the health endpoint:

```bash
# External cron (cron-job.org or UptimeRobot)
GET https://drop-system-api.onrender.com/api/v1/health
# Every 10 minutes
```

---

## 📜 Trade-offs Summary

| Decision | What We Chose | What We Gave Up |
|---|---|---|
| Lock strategy | `SELECT FOR UPDATE` | Higher throughput via optimistic locking |
| Expiry | Cron job in-process | Distributed reliability (BullMQ) |
| Metrics | In-memory | Cross-instance aggregation |
| Auth | JWT (stateless) | Instant token revocation |
| Stock model | Denormalized `reservedStock` | Slightly more complex update logic |
| DB | PostgreSQL only | Horizontal write sharding |

---

*Built with Node.js · TypeScript · Prisma · PostgreSQL · React · Vite*
