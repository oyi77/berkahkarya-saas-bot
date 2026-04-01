<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# src

## Purpose
Application source code. Telegram bot with Fastify HTTP server, BullMQ job processing, multi-provider AI video generation pipeline, credit-based payment processing, and admin dashboard.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Entry point — bootstraps Telegraf bot, Fastify server, BullMQ workers, registers routes/handlers |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `commands/` | Bot slash command handlers (see `commands/AGENTS.md`) |
| `config/` | Runtime configuration constants and engines (see `config/AGENTS.md`) |
| `flows/` | Video generation orchestration (see `flows/AGENTS.md`) |
| `handlers/` | Telegram callback/message routing (see `handlers/AGENTS.md`) |
| `menus/` | Inline keyboard menu builders (see `menus/AGENTS.md`) |
| `middleware/` | Telegraf middleware chain (see `middleware/AGENTS.md`) |
| `routes/` | Fastify HTTP routes (see `routes/AGENTS.md`) |
| `services/` | Business logic layer — 41 services (see `services/AGENTS.md`) |
| `types/` | TypeScript type definitions (see `types/AGENTS.md`) |
| `utils/` | Utility functions (see `utils/AGENTS.md`) |
| `views/` | EJS templates for admin/web (see `views/AGENTS.md`) |
| `workers/` | BullMQ worker processes (see `workers/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Use `@/*` path alias for imports (maps to `src/*`)
- Session state machine: `BotState` union in `types/index.ts`
- State transitions happen in handlers via `ctx.session.state`
- `videoCreation` in session accumulates multi-step create form data

### Common Patterns
- Services encapsulate business logic, handlers stay thin
- Redis-backed sessions with 24h TTL
- BullMQ for async video generation jobs
- Circuit breaker pattern for provider fallback

## Dependencies

### External
- `telegraf` — Telegram bot framework
- `fastify` — HTTP server
- `bullmq` — Job queue processing
- `@prisma/client` — Database ORM
- `ioredis` — Redis client

<!-- MANUAL: -->
