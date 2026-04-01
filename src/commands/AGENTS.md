<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# commands

## Purpose
Telegram bot slash commands registered via `setupCommands(bot)` in `index.ts`. Each file exports a command handler.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Command registration — wires all commands to the bot |
| `start.ts` | `/start` — onboarding, deep link handling |
| `create.ts` | `/create` — begins the video creation flow |
| `profile.ts` | `/profile` — user profile and credit balance |
| `topup.ts` | `/topup` — credit purchase flow |
| `referral.ts` | `/referral` — referral program info and links |
| `subscription.ts` | `/subscription` — plan management |
| `videos.ts` | `/videos` — list generated videos |
| `help.ts` | `/help` — help and FAQ |
| `support.ts` | `/support` — customer support |
| `cancel.ts` | `/cancel` — cancel current operation |
| `settings.ts` | `/settings` — user preferences |
| `send.ts` | `/send` — send/share content |
| `grok.ts` | `/grok` — Grok AI chat |
| `ads.ts` | `/ads` — advertisement management |
| `prompts.ts` | `/prompts` — saved prompt management |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `admin/` | Admin-only commands (see `admin/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Register new commands in `index.ts`
- Use `@/services/*` for business logic, keep commands thin
- Commands access session via `ctx.session`

### Testing Requirements
- Unit tests in `tests/unit/commands/`

### Common Patterns
- `ctx.reply()` or `ctx.replyWithMarkdownV2()`
- State transitions via `ctx.session.state = ...`

## Dependencies

### Internal
- `@/services/user.service` — user operations
- `@/types` — BotContext, SessionData

### External
- `telegraf`

<!-- MANUAL: -->
