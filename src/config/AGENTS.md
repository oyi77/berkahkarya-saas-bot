<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# config

## Purpose
Runtime configuration constants and engine definitions. Static configs loaded at startup. Dynamic/admin-editable pricing is stored in DB via `PaymentSettingsService`.

## Key Files

| File | Description |
|------|-------------|
| `env.ts` | Environment variable loading and validation |
| `redis.ts` | Redis connection configuration |
| `database.ts` | Prisma database client setup |
| `queue.ts` | BullMQ queue definitions and connection |
| `pricing.ts` | Credit costs, package prices, subscription plans (1 Credit = 10 Units) |
| `packages.ts` | Credit package definitions |
| `free-trial.ts` | Free trial credit allocation |
| `providers.ts` | Video/image provider configurations |
| `hpas-engine.ts` | HPAS 7-scene video preset framework, `buildCustomPresetConfig()` |
| `video-engine-v3.ts` | V3 video engine settings |
| `image-engine.ts` | Image generation engine config |
| `prompt-engine.ts` | Prompt generation and optimization rules |
| `audio-subtitle-engine.ts` | Audio VO and subtitle config |
| `templates.ts` | Video template definitions |
| `styles.ts` | Visual style presets |
| `niches.ts` | Business niche/category definitions |
| `languages.ts` | Supported language configs |
| `professional-prompts.ts` | Curated professional prompt library |

## For AI Agents

### Working In This Directory
- Static configs — changes require rebuild/restart
- `pricing.ts` is runtime source of truth for credit/unit costs
- `hpas-engine.ts` defines 7-scene HPAS framework for video generation
- Use `env.ts` for all env var access

### Testing Requirements
- Unit tests in `tests/unit/config/`

## Dependencies

### External
- `@prisma/client`, `bullmq`, `ioredis`

<!-- MANUAL: -->
