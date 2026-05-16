<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 -->

# Admin Commands

Telegram bot commands restricted to admin users. Admin IDs sourced from `ADMIN_TELEGRAM_IDS` environment variable.

## Purpose

Admin-only commands for platform management: granting credits, broadcasting messages, configuring payment gateways, and monitoring system health.

## Key Files

| File | Purpose |
|---|
| `grantCredits.ts` | `/grant_credits` command — Grant credits to users with audit log |
| `broadcast.ts` | `/broadcast` command — Send message to all active users |
| `paymentSettings.ts` | `/payment_settings` command — Enable/disable payment gateways, configure live/sandbox modes |
| `systemStatus.ts` | `/status` command — Check bot health, queue depth, database connection, cache status |

## Subdirectories

None.

## For AI Agents

**Entry point:** Each command handler exports an async function named `admin<CommandName>Command(ctx: BotContext)`.

**Admin check:** All handlers call `isAdmin(ctx.from?.id)` first — rejects non-admin users with permission denied message.

**Error handling:** Commands use `logger.error()` for failures and `ctx.reply()` to notify user of result.

**State:** Commands do not mutate `ctx.session.state`. They read from services (UserService, PaymentSettingsService, etc.) directly.

## Dependencies

- `@/services/user.service` — User lookup and credit mutations
- `@/services/payment-settings.service` — Payment gateway CRUD
- `@/config/env` — `ADMIN_TELEGRAM_IDS` for authorization
- `@/utils/logger` — Audit logging
- Prisma ORM for direct database access

## Testing

Unit tests in `tests/unit/commands/admin/`. Mock UserService, PaymentSettingsService, and logger. Test admin check, argument validation, and success/failure cases.

<!-- MANUAL: -->
Admin commands must check authorization before any action.
All admin actions should be logged for audit trail.
