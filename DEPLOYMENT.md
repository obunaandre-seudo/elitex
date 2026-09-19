# Deployment Prep

## What is already ready
- The frontend builds successfully with `npm run build`.
- The backend reads database URLs from `DATABASE_URL`, `DIRECT_URL`, and `DATABASE_URL_POOLER`.
- The backend now listens from `APP_PORT` and falls back to the platform `PORT` value.
- The frontend points at `NEXT_PUBLIC_API_URL`.

## Recommended hosting layout
- Frontend: Vercel or any static/Next host
- Backend: the existing Render backend service
- Database: the existing production PostgreSQL databases

## Backend environment variables
Set these in your backend host:
- `NODE_ENV=production`
- `APP_PORT=10000` if your host lets you choose a port, otherwise let the platform inject `PORT`
- `CLIENT_URL=https://your-frontend-domain.example`
- `DATABASE_URL=<existing production value in Render>`
- `DIRECT_URL=<existing production value in Render>`
- `DATABASE_URL_POOLER=<existing production value in Render>`
- `JWT_ACCESS_SECRET=<long random secret>`
- `JWT_REFRESH_SECRET=<different long random secret>`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=30d`
- `CJ_API_KEY=<optional>`
- `CJ_API_SECRET=<optional>`
- `DEFAULT_MARKUP_PERCENT=10`

Optional but recommended:
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX=200`
- payment keys only if you are charging customers yet
- SMTP credentials only if you want live emails

## Frontend environment variables
Set this in your frontend host:
- `NEXT_PUBLIC_API_URL=https://elitex-vwym.onrender.com/api`

## Build and start commands
Backend:
- install deps: `npm install`
- generate Prisma client: `npm run prisma:generate`
- build: `npm run build`
- start: `npm run start`

Do not run database migration, reset, seed, or sync commands against production.

Frontend:
- install deps: `npm install`
- build: `npm run build`
- start: `npm run start`

## Deployment order
1. Deploy the backend first.
2. Confirm the backend health endpoint returns `ok`.
3. Deploy the frontend with `NEXT_PUBLIC_API_URL` pointing at the backend.
4. Open the frontend and verify the catalog loads from the API.

## Notes
- If your host exposes only `PORT`, the backend will now use that automatically.
- If you deploy behind a new domain, update `CLIENT_URL` on the backend and `NEXT_PUBLIC_API_URL` on the frontend.
- The live adult-wellness catalog is already surfaced in the UI, including the dedicated `/adult-wellness` page.
