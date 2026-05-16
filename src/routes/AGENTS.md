<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# routes

## Purpose
Fastify HTTP route handlers for the admin dashboard, webhooks, health checks, and public web pages.

## Key Files

| File | Description |
|------|-------------|
| `admin.ts` | Admin dashboard + API endpoints. Auth: Basic auth, cookie `admin_token`, or `?token=` query param vs `ADMIN_PASSWORD` |
| `health.ts` | Health check endpoint for monitoring |
| `web.ts` | Public web app routes, landing page, user API (`/app`, `/api/user`) |

## For AI Agents

### Working In This Directory
- Admin auth uses 3 methods — all compare against `ADMIN_PASSWORD` env var
- Webhook routes validate `WEBHOOK_SECRET`
- Payment webhooks normalize through `PaymentService.handleNotification()`

### Testing Requirements
- Unit tests in `tests/unit/routes/`
- E2E tests in `tests/e2e/` and `tests/e2e/playwright/`

## Dependencies

### Internal
- `@/services/*`, `@/views/*`, `@/config/env`

### External
- `fastify`, `@fastify/view`

<!-- MANUAL: -->
