<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# menus

## Purpose
Telegram inline keyboard menu builders for the main menu and navigation flows.

## Key Files

| File | Description |
|------|-------------|
| `main.ts` | Main menu keyboard builder and navigation helpers |

## For AI Agents

### Working In This Directory
- Menus return `InlineKeyboardMarkup` objects
- Callback data strings must match patterns in `handlers/callback.ts`

## Dependencies

### Internal
- `@/types`, `@/config/pricing`

### External
- `telegraf` — `Markup.inlineKeyboard()`

<!-- MANUAL: -->
