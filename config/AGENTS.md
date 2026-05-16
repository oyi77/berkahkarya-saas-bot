<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# config

## Purpose
YAML reference configuration files for AI providers, database settings, payment gateways, and feature flags. These are documentation/reference configs — runtime configuration lives in `src/config/`.

## Key Files

| File | Description |
|------|-------------|
| `ai.yml` | AI provider settings and model configurations |
| `database.yml` | Database connection parameters |
| `payment.yml` | Payment gateway configurations |
| `features.yml` | Feature flag definitions |

## For AI Agents

### Working In This Directory
- These YAML files are reference configs, not directly loaded at runtime
- Runtime config is in `src/config/` as TypeScript modules

<!-- MANUAL: -->
