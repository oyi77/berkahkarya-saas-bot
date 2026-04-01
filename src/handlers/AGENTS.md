<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# handlers

## Purpose
Telegram update handlers for callback queries (inline button presses), free-text messages, and errors.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Handler registration |
| `callback.ts` | Callback query router (~3000 lines) — dispatches by `data` string prefix |
| `message.ts` | Free-text message router — dispatches by `ctx.session.state` (24+ BotState values) |
| `error.ts` | Global error handler |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `callbacks/` | Modular callback handlers by domain (see `callbacks/AGENTS.md`) |
| `messages/` | Message sub-handlers (see `messages/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `callback.ts` is very large — prefer adding new handlers in `callbacks/`
- State transitions: mutate `ctx.session.state` and `ctx.session.stateData`
- Use `safeReply()` from `@/utils/safe-reply`

### Common Patterns
- Callback data: `prefix_value` (e.g. `preset_cinematic`)
- Message routing: `switch(ctx.session.state)`

## Dependencies

### Internal
- `@/types` — BotState, BotContext, SessionData
- `@/services/*`, `@/flows/generate`, `@/utils/safe-reply`

### External
- `telegraf`

<!-- MANUAL: -->
