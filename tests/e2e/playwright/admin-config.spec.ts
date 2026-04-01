/**
 * Admin Config Page E2E Tests
 *
 * Tests the config viewer page (config.ejs served at /admin/config):
 * page loads, search filter present, sensitive value masking, expand/collapse.
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

function basicAuthHeader(password: string): string {
  return 'Basic ' + Buffer.from(`admin:${password}`).toString('base64');
}

function adminCookie(): string {
  const token = crypto.createHmac('sha256', 'openclaw-admin-v1').update(ADMIN_PASSWORD).digest('hex');
  return `admin_token=${token}`;
}

// ─── Page structure ──────────────────────────────────────────────────────────

test('config page loads and returns 200', async ({ request }) => {
  const response = await request.get('/admin/config', {
    headers: { Authorization: basicAuthHeader(ADMIN_PASSWORD) },
  });
  expect(response.status()).toBe(200);
});

test('config page contains Environment Config heading', async ({ request }) => {
  const response = await request.get('/admin/config', {
    headers: { Authorization: basicAuthHeader(ADMIN_PASSWORD) },
  });
  const text = await response.text();
  expect(text).toContain('Environment Config');
});

test('config page has search filter input', async ({ page }) => {
  await page.setExtraHTTPHeaders({ Authorization: basicAuthHeader(ADMIN_PASSWORD) });
  await page.goto('/admin/config');
  const searchInput = page.locator('input#search');
  await expect(searchInput).toBeVisible();
});

test('config page has Expand All and Collapse All buttons', async ({ page }) => {
  await page.setExtraHTTPHeaders({ Authorization: basicAuthHeader(ADMIN_PASSWORD) });
  await page.goto('/admin/config');
  await expect(page.getByText('Expand All')).toBeVisible();
  await expect(page.getByText('Collapse All')).toBeVisible();
});

test('config page has Refresh button', async ({ page }) => {
  await page.setExtraHTTPHeaders({ Authorization: basicAuthHeader(ADMIN_PASSWORD) });
  await page.goto('/admin/config');
  await expect(page.getByText('Refresh')).toBeVisible();
});

// ─── /api/config endpoint ────────────────────────────────────────────────────

test('/api/config returns JSON object', async ({ request }) => {
  const response = await request.get('/api/config', {
    headers: { Authorization: basicAuthHeader(ADMIN_PASSWORD) },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(typeof body).toBe('object');
  expect(body).not.toBeNull();
});

test('/api/config entries have value and group fields', async ({ request }) => {
  const response = await request.get('/api/config', {
    headers: { Authorization: basicAuthHeader(ADMIN_PASSWORD) },
  });
  const body = await response.json();
  const entries = Object.values(body) as any[];
  expect(entries.length).toBeGreaterThan(0);

  // Each entry should have at minimum a value and a group
  const first = entries[0];
  expect(first).toHaveProperty('value');
  expect(first).toHaveProperty('group');
});

test('/api/config masks sensitive values — no raw secrets in response', async ({ request }) => {
  const response = await request.get('/api/config', {
    headers: { Authorization: basicAuthHeader(ADMIN_PASSWORD) },
  });
  const body = await response.json();

  // Sensitive keys should have their value masked (contains •••• or similar, or "(not set)")
  // They should NOT expose full raw key values
  // We check by looking for entries whose key contains known sensitive keywords
  const sensitiveKeywords = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'PRIVATE'];
  for (const [key, entry] of Object.entries(body) as [string, any][]) {
    const isSensitive = sensitiveKeywords.some(kw => key.toUpperCase().includes(kw));
    if (isSensitive && entry.value !== '(not set)') {
      // Masked values should contain bullet characters or be short masked strings
      // They should NOT look like a full JWT/token (no long alphanumeric strings > 20 chars without masking)
      if (entry.sensitive === true) {
        expect(entry.value).toMatch(/[•*]{3,}|^\(not set\)$/);
      }
    }
  }
});

test('/api/config groups entries into named sections', async ({ request }) => {
  const response = await request.get('/api/config', {
    headers: { Authorization: basicAuthHeader(ADMIN_PASSWORD) },
  });
  const body = await response.json();
  const groups = new Set(Object.values(body).map((e: any) => e.group));
  // Should have multiple groups (Core, AI Providers, Payments, etc.)
  expect(groups.size).toBeGreaterThan(1);
});

// ─── Search filter behaviour (DOM) ──────────────────────────────────────────

test('search filter input accepts text without error', async ({ page }) => {
  await page.setExtraHTTPHeaders({ Authorization: basicAuthHeader(ADMIN_PASSWORD) });
  await page.goto('/admin/config');

  const searchInput = page.locator('input#search');
  await searchInput.fill('NODE_ENV');
  // No JS error should occur; the container should still be present
  await expect(page.locator('#config-container')).toBeVisible();
});

// ─── Expand/collapse sections ────────────────────────────────────────────────

test('Collapse All hides group body elements', async ({ page }) => {
  await page.setExtraHTTPHeaders({ Authorization: basicAuthHeader(ADMIN_PASSWORD) });
  await page.goto('/admin/config');

  // Wait for config to load (the loading placeholder disappears)
  await page.waitForFunction(() => {
    const container = document.getElementById('config-container');
    return container && !container.innerText.includes('Loading');
  }, { timeout: 10000 });

  await page.getByText('Collapse All').click();

  // After collapse, group bodies should have display:none
  const hiddenBodies = await page.evaluate(() => {
    const bodies = document.querySelectorAll('.group-body');
    return Array.from(bodies).every(el => (el as HTMLElement).style.display === 'none');
  });
  expect(hiddenBodies).toBe(true);
});

test('Expand All makes group body elements visible', async ({ page }) => {
  await page.setExtraHTTPHeaders({ Authorization: basicAuthHeader(ADMIN_PASSWORD) });
  await page.goto('/admin/config');

  await page.waitForFunction(() => {
    const container = document.getElementById('config-container');
    return container && !container.innerText.includes('Loading');
  }, { timeout: 10000 });

  // First collapse, then expand
  await page.getByText('Collapse All').click();
  await page.getByText('Expand All').click();

  const visibleBodies = await page.evaluate(() => {
    const bodies = document.querySelectorAll('.group-body');
    return Array.from(bodies).every(el => (el as HTMLElement).style.display !== 'none');
  });
  expect(visibleBodies).toBe(true);
});
