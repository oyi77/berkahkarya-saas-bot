<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# e2e

## Purpose
End-to-end tests. Jest-based tests hit real endpoints. Playwright tests for browser-based admin/web. Telethon (Python) tests for live Telegram bot interaction.

## Key Files

| File | Description |
|------|-------------|
| `setup.e2e.ts` | E2E test environment setup |
| `health.e2e.test.ts` | Health endpoint test |
| `web-api.e2e.test.ts` | Web API endpoint tests |
| `webhook.e2e.test.ts` | Webhook endpoint tests |
| `admin-api.e2e.test.ts` | Admin API tests |
| `admin-auth.e2e.test.ts` | Admin authentication tests |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `playwright/` | Browser-based tests (see `playwright/AGENTS.md`) |
| `bot/` | Live Telegram bot tests via Telethon (see `bot/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Run with `npm run test:e2e` (requires running server)
- Playwright tests need `npx playwright test`
- Bot tests need Python + Telethon credentials

<!-- MANUAL: -->
