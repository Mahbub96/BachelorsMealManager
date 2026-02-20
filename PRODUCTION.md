# Production Readiness Checklist

## Backend (BachelorMessManagerBackend)

- [ ] **Environment**: Copy `.env.example` to `.env` and set:
  - `NODE_ENV=production`
  - `MONGODB_URI` (or `MONGODB_URI_PROD`) – production database URL
  - `JWT_SECRET` – strong random secret (required; app validates this)
  - `JWT_REFRESH_SECRET` – strong random secret
  - `CORS_ORIGIN` – comma-separated allowed origins (e.g. your app URL)
- [ ] **Secrets**: Never commit `.env`. Ensure `JWT_SECRET` is not the default placeholder.
- [ ] **Config validation**: Backend calls `validateConfig()` on startup; it will fail if `MONGODB_URI` or `JWT_SECRET` is missing/invalid in production.
- [ ] **Logging**: Backend uses `utils/logger`; no raw `console` in controllers. Scripts (seed, reset, backup) may use `console` for CLI output.

## Client (bachelor-mess-client)

- [ ] **Environment**: Copy `.env.example` to `.env` and set:
  - `EXPO_PUBLIC_API_URL` – production API base URL (required in production; app throws if missing)
  - Optional: `EXPO_PUBLIC_ENV=production`, `EXPO_PUBLIC_DEBUG_ENABLED=false` to reduce log noise.
- [ ] **Logging**: App uses `utils/logger`; debug/info logs run only when not in production. Errors are sanitized (no tokens/passwords in logs).
- [ ] **API URL**: In production, `config.apiUrl` must come from `EXPO_PUBLIC_API_URL` (no localhost fallback).

## Critical flows (verified)

- **Meals**: Submit uses calendar date (timezone-safe); duplicate check is per user per day; future dates allowed; timestamps (`createdAt`/`updatedAt`) stored and shown.
- **Bazar**: Submit/list include timestamps; cards and details show "Added" time.
- **Auth**: JWT from backend; client sends token in headers; no secrets in client code.

## Before go-live

1. Run backend with `NODE_ENV=production` and valid `.env` at least once to confirm `validateConfig()` passes.
2. Run client build (e.g. EAS or `expo build`) with `EXPO_PUBLIC_API_URL` set to production API.
3. Test login, meal submit, bazar submit, and one admin flow on a staging/production build.
