<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# tests

## Purpose
Test suites covering unit, integration, and end-to-end tests. Jest with ts-jest for TypeScript, Playwright for browser, Telethon (Python) for live Telegram bot tests.

## Key Files

| File | Description |
|------|-------------|
| `setup-env.ts` | Test environment variable setup |
| `setup-mocks.ts` | Shared mock definitions for unit tests |
| `fixtures/index.ts` | Test fixture data |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `unit/` | Unit tests with mocked dependencies (see `unit/AGENTS.md`) |
| `e2e/` | End-to-end tests (see `e2e/AGENTS.md`) |
| `fixtures/` | Test fixture data |
| `admin/` | Admin-specific test suites |
| `integration/` | Integration tests |

## For AI Agents

### Working In This Directory
- `npm test` runs unit + integration
- `npm run test:e2e` runs e2e (requires running server)
- Use patterns from `setup-mocks.ts` for consistent mocking
- New services need tests in `unit/services/`, new commands in `unit/commands/`

<!-- MANUAL: -->
