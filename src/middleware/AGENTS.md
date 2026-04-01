<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# middleware

## Purpose
Telegraf middleware chain executed on every incoming update. Session management, user record creation, logging, rate limiting.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Middleware registration order |
| `session.ts` | Redis-backed sessions (24h TTL, key: `session:{userId}`) |
| `user.ts` | Ensures user DB record exists, creates on first contact |
| `logging.ts` | Request/response logging with correlation IDs |
| `rateLimit.ts` | Per-user rate limiting |

## For AI Agents

### Working In This Directory
- Middleware order matters — session loads before user middleware
- Session data structure: `SessionData` in `@/types`
- Redis key format: `session:{telegramUserId}`

## Dependencies

### Internal
- `@/config/redis`, `@/services/user.service`, `@/types`

### External
- `ioredis`, `telegraf`

<!-- MANUAL: -->
