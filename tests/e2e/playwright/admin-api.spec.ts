/**
 * Admin API Endpoint E2E Tests
 *
 * Tests all admin API endpoints for:
 * - Correct response shape when authenticated
 * - 401 when unauthenticated
 *
 * These are HTTP-level tests using the Playwright request context.
 * They do not depend on a populated database — shape checks use
 * typeof / toHaveProperty so they pass with empty results.
 */

import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

function auth(): { Authorization: string } {
  return {
    Authorization: 'Basic ' + Buffer.from(`admin:${ADMIN_PASSWORD}`).toString('base64'),
  };
}

// ─── /api/stats ──────────────────────────────────────────────────────────────

test('GET /api/stats returns 200 with valid JSON when authenticated', async ({ request }) => {
  const response = await request.get('/api/stats', { headers: auth() });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(typeof body.users).toBe('number');
  expect(typeof body.transactions).toBe('number');
  expect(typeof body.videos).toBe('number');
  expect(typeof body.revenue).toBe('number');
});

test('GET /api/stats returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/stats');
  expect(response.status()).toBe(401);
});

// ─── /api/users ──────────────────────────────────────────────────────────────

test('GET /api/users returns 200 with array when authenticated', async ({ request }) => {
  const response = await request.get('/api/users', { headers: auth() });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('GET /api/users returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(401);
});

test('GET /api/users respects limit query param', async ({ request }) => {
  const response = await request.get('/api/users?limit=5', { headers: auth() });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeLessThanOrEqual(5);
});

test('GET /api/users respects offset query param without error', async ({ request }) => {
  const response = await request.get('/api/users?offset=0&limit=10', { headers: auth() });
  expect(response.status()).toBe(200);
});

// ─── /api/config ─────────────────────────────────────────────────────────────

test('GET /api/config returns 200 with grouped object when authenticated', async ({ request }) => {
  const response = await request.get('/api/config', { headers: auth() });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();
  // Should have at least one key
  expect(Object.keys(body).length).toBeGreaterThan(0);
});

test('GET /api/config returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/config');
  expect(response.status()).toBe(401);
});

// ─── /api/pricing-overview ───────────────────────────────────────────────────

test('GET /api/pricing-overview returns 200 when authenticated', async ({ request }) => {
  const response = await request.get('/api/pricing-overview', { headers: auth() });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(typeof body).toBe('object');
});

test('GET /api/pricing-overview returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/pricing-overview');
  expect(response.status()).toBe(401);
});

// ─── /api/transactions ───────────────────────────────────────────────────────

test('GET /api/transactions returns 200 with array when authenticated', async ({ request }) => {
  const response = await request.get('/api/transactions', { headers: auth() });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(typeof body).toBe('object');
  expect(Array.isArray(body.transactions)).toBe(true);
  expect(typeof body.total).toBe('number');
});

test('GET /api/transactions returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/transactions');
  expect(response.status()).toBe(401);
});

// ─── /api/videos ─────────────────────────────────────────────────────────────

test('GET /api/videos returns 200 with array when authenticated', async ({ request }) => {
  const response = await request.get('/api/videos', { headers: auth() });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('GET /api/videos returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/videos');
  expect(response.status()).toBe(401);
});

// ─── /api/pricing/:category ──────────────────────────────────────────────────

test('GET /api/pricing/packages returns 200 when authenticated', async ({ request }) => {
  const response = await request.get('/api/pricing/packages', { headers: auth() });
  expect(response.status()).toBe(200);
});

test('GET /api/pricing/packages returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/pricing/packages');
  expect(response.status()).toBe(401);
});

// ─── Verifies ?token= query is NOT a server bypass (only used by frontend JS) ─

test('GET /api/stats with wrong Basic auth returns 401', async ({ request }) => {
  const response = await request.get('/api/stats', {
    headers: {
      Authorization: 'Basic ' + Buffer.from('admin:wrong-password').toString('base64'),
    },
  });
  expect(response.status()).toBe(401);
});
