<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-01 -->

# Telegram Bot E2E Tests

Python/pytest tests for live Telegram bot interactions using Telethon client library.

## Purpose

Test actual Telegram bot behavior by sending real messages/callbacks through Telegram API. Verify bot responses, state transitions, and side effects (credits, videos, etc.).

## Key Files

| File | Purpose |
|---|---|
| conftest.py | Pytest fixtures and setup |
| test_commands.py | Test bot commands |
| test_create_flow.py | Video creation workflow |
| test_onboarding.py | First-time user flow |
| test_payment_flow.py | Payment workflows |
| test_prompts_flow.py | Prompt template selection |
| test_referral.py | Referral system |
| test_settings_flow.py | User settings |
| test_webapp_endpoints.py | Web app endpoints |

## Subdirectories

None.

## For AI Agents

**Telethon setup:** conftest.py initializes Telethon client with test account credentials.

**Bot interaction:** Use client to send messages and receive responses.

**Assertions:** Verify bot replies and database state changes.

**Async/await:** All Telethon operations are async.

**Cleanup:** Fixtures should delete test users and data after tests.

## Dependencies

- Python 3.8+
- Telethon library
- pytest
- Live bot instance

## Testing

Set environment variables and run pytest tests/e2e/bot/.

<!-- MANUAL: -->
Bot e2e tests require live infrastructure.
Telethon sessions persist; clean up test accounts.
Be mindful of Telegram API rate limits.
