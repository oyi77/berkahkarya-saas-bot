<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 -->

# Admin Dashboard Templates

EJS templates for the admin control panel. Served by Fastify at `/admin/dashboard` and sub-routes.

## Purpose

Render HTML dashboards for platform admins to monitor analytics, manage users, configure pricing, and adjust system settings.

## Key Files

| File | Purpose |
|---|
| `login.ejs` | Admin login form — Basic auth fallback UI |
| `analytics.ejs` | Main dashboard — User count, revenue, video generation stats, queue depth |
| `prompts.ejs` | Prompt template management — CRUD, enable/disable, preview |
| `pricing.ejs` | Dynamic pricing configuration — Edit credit costs, package prices, subscription plans |
| `users.ejs` | User management — Search, view details, grant credits, suspend accounts |
| `config.ejs` | System configuration — Payment gateway enable/disable, feature flags |

## Subdirectories

None.

## For AI Agents

**Template structure:** EJS files use `<