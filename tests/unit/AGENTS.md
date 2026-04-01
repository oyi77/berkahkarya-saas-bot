<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# unit

## Purpose
Unit tests using Jest with ts-jest. Mock external dependencies. Follow patterns in `tests/setup-mocks.ts`.

## Key Files

| File | Description |
|------|-------------|
| `example.test.ts` | Example test template |
| `comprehensive.test.ts` | Comprehensive cross-cutting tests |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `commands/` | Command handler tests (see `commands/AGENTS.md`) |
| `services/` | Service layer tests (see `services/AGENTS.md`) |
| `routes/` | Route handler tests (see `routes/AGENTS.md`) |
| `config/` | Config module tests (see `config/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Run with `npm test` or `npx jest tests/unit/<file>`
- Use `tests/setup-mocks.ts` for consistent mock patterns
- Mock Prisma, Redis, BullMQ, and external APIs

<!-- MANUAL: -->
