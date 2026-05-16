<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 -->

# Callback Query Handlers

Modular inline keyboard button press handlers split from the monolithic `callback.ts`. Each file handles a domain of button interactions.

## Purpose

Route callback queries (inline keyboard button clicks) to domain-specific handlers. Dispatched by data string prefix (e.g. `topup_*`, `preset_*`, `platform_*`).

## Key Files

| File | Purpose |
|---|
| `account.ts` | Topup (stars, crypto, bank transfers), subscriptions, account settings |
| `admin.ts` | Admin dashboard and permission checks |
| `clone.ts` | Video cloning and duplication flows |
| `creation.ts` | Video creation form steps (model, style, aspect ratio) |
| `image.ts` | Image generation and editing workflows |
| `navigation.ts` | Menu navigation and breadcrumb flows |
| `onboarding.ts` | First-time user onboarding steps |
| `payment.ts` | Payment method selection and processing |
| `prompts.ts` | Prompt template selection and custom prompt entry |
| `promptLibrary.ts` | Saved prompts, favoriting, deletion |
| `referral.ts` | Referral link sharing and reward claims |
| `settings.ts` | User preferences (language, notifications, theme) |
| `video.ts` | Video playback, sharing, deletion |
| `social.ts` | Social media integration (coming soon) |
| `generation.ts` | Video generation pipeline and progress tracking |

## Subdirectories

None.

## For AI Agents

**Export format:** Each file exports `handleXyzCallback(ctx: BotContext, data: string): Promise<boolean>`. Return `true` if handled, `false` to pass to next handler.

**Data prefix pattern:** Data string parsed by prefix (e.g. `data.startsWith("topup_")`). Extract numeric/string params from remainder.

**Inline keyboard buttons:** Buttons set `callback_data` to trigger handler (e.g. button with text "Topup" → `callback_data: "topup_menu"`).

**User session:** Access `ctx.session.state` and `ctx.session.stateData` to read/write form state.

**Answers:** Use `ctx.answerCbQuery()` for success/error notifications and `ctx.editMessageText()` to update button menus.

## Dependencies

- `@/types` — `BotContext`, `BotState` union
- `@/commands/*` — Command handlers (topup, subscription, etc.)
- `@/services/*` — Business logic (payment, video, user, etc.)
- `@/config/pricing` — Credit costs, package definitions
- `@/i18n/translations` — Localized messages via `t()` function

## Testing

Unit tests test individual handlers with mocked context and services. Integration tests verify button flows end-to-end.

<!-- MANUAL: -->
Each callback handler should validate inputs from the data string.
Return true only when the callback is fully handled.
Use answerCbQuery for user feedback on button clicks.
