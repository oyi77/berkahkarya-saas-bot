<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# views

## Purpose
EJS templates served by Fastify for the admin dashboard and public web pages.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `admin/` | Admin dashboard templates (see `admin/AGENTS.md`) |
| `web/` | Public web pages (see `web/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Templates rendered via `reply.view()` in Fastify routes
- Admin templates require authentication
- Use `@fastify/view` with EJS engine

## Dependencies

### External
- `ejs` — template engine
- `@fastify/view` — Fastify view plugin

<!-- MANUAL: -->
