<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# types

## Purpose
TypeScript type definitions for the entire application. Defines the session state machine, bot context, and video provider interfaces.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | `BotState` union (24+ states), `SessionData`, `BotContext`, `videoCreation` accumulator |
| `video-provider.ts` | Video provider interface types and response formats |

## For AI Agents

### Working In This Directory
- `BotState` is the union type for all session states — add new states here
- `SessionData` holds `state`, `stateData`, and `videoCreation`
- `BotContext` extends Telegraf context with session data
- Changes here affect handlers, commands, and middleware

<!-- MANUAL: -->
