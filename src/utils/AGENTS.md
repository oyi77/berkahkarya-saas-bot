<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 | Updated: 2026-04-01 -->

# utils

## Purpose
Utility functions for Telegram message handling, error management, URL validation, and request correlation.

## Key Files

| File | Description |
|------|-------------|
| `safe-reply.ts` | Error-resilient Telegram message sending with retry |
| `telegram.ts` | Telegram API helper functions |
| `errors.ts` | Custom error classes and error formatting |
| `url-validator.ts` | URL validation and sanitization |
| `correlation.ts` | Request correlation ID generation for tracing |

## For AI Agents

### Working In This Directory
- Use `safeReply()` instead of raw `ctx.reply()` for error resilience
- `correlation.ts` provides request tracing across async operations

<!-- MANUAL: -->
