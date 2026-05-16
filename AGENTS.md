<<<<<<< HEAD
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# openclaw-saas-bot

## Purpose
Telegram bot SaaS platform for AI-powered video generation. Built with TypeScript, Telegraf, Fastify, BullMQ, Prisma, and Redis. Users create short-form videos via a conversational bot interface with multi-provider AI generation, credit-based pricing, and an admin dashboard.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript config with `@/*` path alias to `src/*` |
| `Dockerfile` | Production container build |
| `docker-compose.yml` | Full stack: app, PostgreSQL, Redis, Prometheus, Grafana |
| `CLAUDE.md` | AI assistant instructions and project architecture guide |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code (see `src/AGENTS.md`) |
| `tests/` | Test suites (see `tests/AGENTS.md`) |
| `prisma/` | Database schema and migrations (see `prisma/AGENTS.md`) |
| `config/` | YAML reference configs (see `config/AGENTS.md`) |
| `scripts/` | DevOps scripts (see `scripts/AGENTS.md`) |
| `docs/` | Product documentation (see `docs/AGENTS.md`) |
| `monitoring/` | Prometheus + Grafana configs (see `monitoring/AGENTS.md`) |
=======
<!-- Generated: 2026-05-06 | Updated: 2026-05-06 -->

# 1AI Projects Workspace

## Purpose
Monorepo workspace containing 13+ independent projects under the 1AI / BerkahKarya ecosystem. Covers adtech, communication automation, eBook generation, finance/trading, proxy aggregation, SaaS platforms, social media management, and WhatsApp API services. Projects range from full-stack apps (FastAPI/Next.js, Express/React) to Python CLI tools and MCP servers.

## Key Files
| File | Description |
|------|-------------|
| `tradingbot.db` | SQLite database used by trading bot projects |
| `wolf-finance-skill.skill` | Skill definition for Wolf Finance trading agent |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `1ai-ebook/` | AI-powered eBook generation platform - Python backend, multi-provider AI, cover generation, job queues (see `1ai-ebook/AGENTS.md`) |
| `1ai-hub/` | Intelligence hub / orchestrator - Node.js/TypeScript API, client management, data models (see `1ai-hub/AGENTS.md`) |
| `1ai-phonefarm/` | Android device farm platform - FastAPI + Next.js, device management, crypto payments (see `1ai-phonefarm/AGENTS.md`) |
| `1ai-reach/` | Communication/outreach automation - Python backend, lead management, voice/sms/email blast, Next.js dashboard (see `1ai-reach/AGENTS.md`) |
| `1ai-social/` | Social media management platform - FastAPI, multi-tenant billing, API key auth, GDPR compliance (see `1ai-social/AGENTS.md`) |
| `1proxy/` | Proxy aggregation platform - FastAPI + Next.js 15, auto-scraping, Hunter Protocol, quality scoring (see `1proxy/AGENTS.md`) |
| `adforge/` | Ad management platform - Express + React/Vite, Meta/Google/TikTok ad APIs, AI generation (see `adforge/AGENTS.md`) |
| `berkahkarya-saas-bot/` | Telegram bot SaaS - Telegraf + Fastify + BullMQ, video generation, credit billing (see `berkahkarya-saas-bot/AGENTS.md`) |
| `joki-blast-engine/` | Multi-platform blast engine - Express + Next.js, WhatsApp/Telegram/Instagram/Twitter adapters (see `joki-blast-engine/AGENTS.md`) |
| `mirofish/` | Financial/trading platform - Python/FastAPI backend + Vite/React frontend (see `mirofish/AGENTS.md`) |
| `polyedge/` | Polytrade edge - complex frontend + backend, multiple documented modules (see `polyedge/AGENTS.md`) |
| `waha/` | WhatsApp HTTP API (WAHA) - NestJS, multi-engine (WEBJS/GOWS/NOWEB), Core+Plus tiers (see `waha/AGENTS.md`) |
| `waha-dashboard/` | WAHA management dashboard - Nuxt 3, session monitoring, settings UI (see `waha-dashboard/AGENTS.md`) |
>>>>>>> c9b42e7 (feat: wire postautomation into @1ai/platform-adapters)

## For AI Agents

### Working In This Directory
<<<<<<< HEAD
- Use `@/*` path alias for all src imports (e.g. `@/services/user.service`)
- Critical env vars: `BOT_TOKEN`, `DATABASE_URL`, `REDIS_URL`, `ADMIN_PASSWORD`, `WEBHOOK_URL`, `WEBHOOK_SECRET`
- For local dev with polling: `FORCE_POLLING=true` and delete Telegram webhook first

### Testing Requirements
- `npm test` — unit + integration (Jest)
- `npm run test:e2e` — end-to-end
- `npm run typecheck` — TypeScript type checking

### Common Patterns
- Redis-backed per-user sessions (24h TTL)
- BullMQ for async video generation jobs
- 9-tier provider fallback with circuit breaker
- Multiple payment gateways (Midtrans, Tripay, DuitKu, NOWPayments)

## Dependencies

### External
- `telegraf` — Telegram bot framework
- `fastify` — HTTP server
- `bullmq` / `ioredis` — Job queues and Redis
- `@prisma/client` — Database ORM
- `typescript` / `tsx` — Language and dev runner

<!-- MANUAL: -->
=======
- Each subdirectory is an **independent project** with its own tech stack, CI, and deployment
- Do NOT share dependencies between projects — each has its own `package.json` or `pyproject.toml`
- Projects may have their own CLAUDE.md/AGENTS.md with specific conventions
- Always `cd` into the target project before running commands
- Python projects use either `venv` or `uv` — check for `uv.lock` vs `requirements.txt`
- Node.js projects use `npm` unless `yarn.lock` or `bun.lock` is present

### Testing Requirements
- Each project has its own test suite — run from within the project directory
- No workspace-level test command exists

### Common Patterns
- **Backend**: FastAPI (Python) or Express/NestJS (Node.js)
- **Frontend**: Next.js, Nuxt, or Vite/React SPA
- **Database**: SQLite (most projects), PostgreSQL (berkahkarya-saas-bot), Supabase (1proxy)
- **Queue**: BullMQ + Redis (Node.js projects), Python threading (Python projects)
- **Auth**: JWT-based, API keys for programmatic access
- **Deployment**: Docker Compose + PM2, some with Railway/Supabase

## Dependencies

### Internal
- `waha/` is used by `joki-blast-engine/` for WhatsApp sending
- `1ai-reach/scripts/` uses `brain_client.py` connecting to `1ai-hub/`
- `berkahkarya-saas-bot/` and `joki-blast-engine/` share WAHA integration patterns
- `1proxy/` and `adforge/` are independent services

### External
- Python 3.11+ (1ai-ebook, 1ai-phonefarm, 1ai-reach, 1ai-social, mirofish)
- Node.js 18-22 (1ai-hub, 1proxy, adforge, berkahkarya-saas-bot, joki-blast-engine, waha)
- Docker + Docker Compose (most projects)
- Redis (1proxy, berkahkarya-saas-bot, joki-blast-engine)
- SQLite (1ai-phonefarm, adforge, joki-blast-engine, mirofish)
- PostgreSQL (berkahkarya-saas-bot, 1proxy)
- PM2 (multiple projects for process management)

<!-- MANUAL: Custom workspace notes can be added below -->
>>>>>>> c9b42e7 (feat: wire postautomation into @1ai/platform-adapters)
