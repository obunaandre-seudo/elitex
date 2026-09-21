# Elite X Shop

A full-stack e-commerce platform: customers shop entirely through Elite X Shop,
while products, prices, and inventory sync into the Premium Collection with a
transparent 35% markup applied automatically.

```
elite-x-shop/
├── backend/     Node.js + Express + TypeScript + Prisma + PostgreSQL API
└── frontend/    Next.js 14 + React + TypeScript + Tailwind + Framer Motion
```

---

## What's real vs. what you need to plug in

This is a genuine, working full-stack app — not a static mockup. Auth,
the database, cart/checkout logic, pricing, and the admin dashboard all
function end-to-end locally. Three categories of third-party integration
need **your own** credentials before they're fully live:

| Integration | Status without your keys | To go live |
|---|---|---|
| **Premium Collection sync** | Falls back to a bundled mock catalog (6 sample products) so sync, pricing, and the admin catalog UI all work immediately | Add collection API credentials to `backend/.env` when going live |
| **Payments** (Paystack) | Orders are created with a Paystack checkout session | Add `PAYSTACK_SECRET_KEY` to `backend/.env` |
| **Email** (Nodemailer) | Emails are logged to the console instead of sent | Add real SMTP credentials (e.g. from Mailtrap, Postmark, SES) to `backend/.env` |

Everything else — auth, database schema, product/cart/order APIs, the
customer UI, and the admin dashboard — is fully built and runs as-is.

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local install, or Docker)

### 1. Database

```bash
# Option A: local Postgres — create a database
createdb elitexshop

# Option B: Docker
docker run --name elite-x-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=elitexshop -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env — at minimum set DATABASE_URL to match your Postgres instance
npm install
npm run prisma:migrate      # creates all tables
npm run prisma:seed         # creates an admin account + default 35% markup setting
npm run dev                 # starts the API on http://localhost:4000
```

Seeded admin login: `admin@elitexshop.com` / `AdminPass123` — **change this
password after first login.**

Once the backend is running, sign in as the admin and trigger a sync from
**Admin Dashboard → Product Sync → Run Sync** to populate the shop with the
mock Premium Collection catalog (or a real one, once your API keys are set).

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # starts the app on http://localhost:3000
```

Open http://localhost:3000 — you'll land on the sign-in screen. Register a
new account (check your backend console for the verification link, since
email is unconfigured by default), verify it, then sign in.

---

## Project Structure

### Backend (`backend/`)
- `prisma/schema.prisma` — full normalized schema (users, products, orders,
  payments, coupons, audit logs, Premium Collection sync logs, etc.)
- `src/utils/cjdropshipping.ts` — Premium Collection adapter with automatic mock-catalog
  fallback; this is the file to extend once you have live API access
- `src/utils/payments.ts` — Paystack checkout session creation
- `src/controllers/`, `src/routes/` — REST API, organized by domain
- `src/middleware/` — JWT auth, role checks, rate limiting, validation,
  centralized error handling

### Frontend (`frontend/`)
- `src/app/` — Next.js App Router pages (auth screens, shop, cart, checkout,
  orders, profile, admin dashboard, legal pages, etc.)
- `src/components/` — shared UI (Navbar, ProductCard, Logo, etc.)
- `src/store/` — Zustand stores (auth session, cart badge count)
- `src/lib/api.ts` — Axios client with automatic access-token refresh

---

## Security notes
- Passwords are hashed with bcrypt; access/refresh JWTs are short-lived and
  stored in httpOnly cookies
- Rate limiting is applied globally and more tightly on auth endpoints
- All admin routes require both authentication and the `ADMIN` role
- Error responses never leak stack traces or internal details

## Deployment
- **Frontend**: deploy `frontend/` to Vercel — set `NEXT_PUBLIC_API_URL` to
  `https://elitex-vwym.onrender.com/api`
- **Backend**: use the existing Render backend service and preserve the existing
  production database environment variables
