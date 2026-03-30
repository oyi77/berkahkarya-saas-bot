# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                  # tsx watch (hot-reload)
PORT=3333 FORCE_POLLING=true NODE_ENV=development npx tsx src/index.ts  # polling mode (no webhook)

# Build & typecheck
npm run build                # tsc
npm run typecheck            # tsc --noEmit (no output, fast check)

# Lint & format
npm run lint
npm run lint:fix
npm run format

# Tests
npm test                     # jest (unit + integration)
npm run test:watch
npm run test:coverage
npm run test:e2e             # jest.e2e.config.js (tests/e2e/)

# Single test file
npx jest tests/unit/services/user.service.test.ts

# Database
npm run migrate:dev          # prisma migrate dev
npm run db:generate          # prisma generate (after schema changes)
npm run db:studio            # Prisma Studio GUI
npm run db:seed
```

## Architecture

### Entry point & bootstrap
`src/index.ts` — Initializes Telegraf bot, Fastify HTTP server, BullMQ workers, and registers all routes/handlers. In production (`NODE_ENV=production`, `WEBHOOK_URL` set), sets Telegram webhook to `${WEBHOOK_URL}/webhook/telegram` with `WEBHOOK_SECRET` validation. Falls back to polling if `FORCE_POLLING=true`.

### Routing layers
1. **Commands** (`src/commands/`) — `/create`, `/topup`, `/profile`, `/referral`, `/videos`, etc. Registered via `setupCommands(bot)`.
2. **Callback handler** (`src/handlers/callback.ts`) — Single large file routing all inline keyboard button clicks. Dispatches by `data` string prefix (e.g. `preset_*`, `platform_*`, `referral_*`).
3. **Message handler** (`src/handlers/message.ts`) — Routes free-text input based on `session.state`. State machine has 24+ states (see `BotState` union in `src/types/index.ts`).
4. **HTTP routes** (`src/routes/`) — Fastify routes for webhooks (`/webhook/telegram`, `/webhook/midtrans`, etc.), admin dashboard (`/admin/*`, `/api/*`), and web app (`/app`, `/api/user`, etc.).

### Session state machine
Redis-backed per-user sessions (`session:{userId}`, 24h TTL). `SessionData` in `src/types/index.ts` holds `state: BotState`, `stateData`, and `videoCreation` (multi-step form accumulator). State transitions happen in callback/message handlers by mutating `ctx.session.state`.

### Video generation pipeline
1. User completes create flow → `executeGeneration()` in `src/flows/generate.ts`
2. Job enqueued to BullMQ `video-generation` queue
3. `VideoGenerationWorker` (`src/workers/video-generation.worker.ts`) processes job
4. **9-tier provider fallback** via circuit breaker: BytePlus → XAI → LaoZhang → EvoLink → Hypereal → SiliconFlow → Fal.ai → Kie.ai → Remotion
5. On success: upload to S3/R2, notify user via Telegram
6. On failure: `UserService.refundCredits()` + user notification

Provider configuration lives in `src/config/hpas-engine.ts` (HPAS = Hook-Problem-Agitate-Solution 7-scene framework) and `src/config/providers.ts`.

### Pricing
- **Static** (used at runtime): `src/config/pricing.ts` — `PACKAGES`, `SUBSCRIPTION_PLANS`, `UNIT_COSTS` (1 Credit = 10 Units)
- **Dynamic** (admin-editable via dashboard): `PricingConfig` DB table, read via `PaymentSettingsService.getPricingConfig()` with 60s cache
- If the DB pricing table is empty, use the admin dashboard "Seed Default Pricing Data" button at `/admin/settings`

### Admin dashboard
Fastify-served EJS at `/admin/dashboard` (analytics.ejs). Auth: Basic auth header, cookie `admin_token`, or `?token=` query param — all compared against `ADMIN_PASSWORD` env var. Key API endpoints in `src/routes/admin.ts`.

### Payment flow
Multiple gateways (Midtrans, Tripay, DuitKu, NOWPayments). All webhooks normalize through `PaymentService.handleNotification()`. Gateway enabled/disabled state stored in `PaymentSettings` DB table via `PaymentSettingsService`.

### Path alias
`@/*` → `src/*` (configured in tsconfig.json and jest config). Use `@/services/user.service` not relative paths.

## Key files

| File | Purpose |
|---|---|
| `src/types/index.ts` | `BotState` union, `SessionData`, `BotContext` |
| `src/config/pricing.ts` | Credit costs, package prices, subscription plans |
| `src/config/hpas-engine.ts` | HPAS video presets, `buildCustomPresetConfig()` |
| `src/handlers/callback.ts` | All inline button routing (~3000 lines) |
| `src/routes/admin.ts` | All admin API endpoints and dashboard routes |
| `src/services/payment-settings.service.ts` | Gateway enable/disable, dynamic pricing CRUD |
| `prisma/schema.prisma` | Full DB schema |

## Environment

Critical vars: `BOT_TOKEN`, `DATABASE_URL`, `REDIS_URL`, `ADMIN_PASSWORD`, `WEBHOOK_URL`, `WEBHOOK_SECRET`.

For local dev with polling: set `FORCE_POLLING=true` and delete the Telegram webhook first:
```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook"
```

If the production webhook returns 401, ensure the Telegram webhook was registered with the same `WEBHOOK_SECRET` value as the env var on the server. Re-register with:
```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${WEBHOOK_URL}/webhook/telegram&secret_token=${WEBHOOK_SECRET}"
```
