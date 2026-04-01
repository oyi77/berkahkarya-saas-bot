/**
 * E2E Test Setup
 *
 * Global Jest setup file — runs before every e2e test file.
 * Sets the env vars that route/service modules read at import time so
 * mock factories and the real modules agree on the same values.
 */

// These must be set BEFORE any module is imported (jest.mock factories are
// hoisted, but process.env mutations here run first).
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.JWT_SECRET = 'test-jwt-secret-for-e2e';
process.env.BOT_TOKEN = 'test-token:AAtest';
process.env.NODE_ENV = 'test';
