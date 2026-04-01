/**
 * Web Landing Page E2E Tests
 *
 * Tests public-facing pages:
 * - Landing page (GET /) structure and meta tags
 * - Health check endpoint
 * - Key CTA and feature elements
 */

import { test, expect } from '@playwright/test';

// ─── Health check ─────────────────────────────────────────────────────────────

test('GET /health returns 200 with healthy status', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('healthy');
});

test('GET /health response includes version and timestamp', async ({ request }) => {
  const response = await request.get('/health');
  const body = await response.json();
  expect(body).toHaveProperty('version');
  expect(body).toHaveProperty('timestamp');
  // timestamp is ISO 8601
  expect(() => new Date(body.timestamp)).not.toThrow();
});

test('GET /health response includes environment field', async ({ request }) => {
  const response = await request.get('/health');
  const body = await response.json();
  expect(body).toHaveProperty('environment');
});

// ─── Landing page ─────────────────────────────────────────────────────────────

test('GET / returns 200', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
});

test('landing page returns HTML content type', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()['content-type']).toContain('text/html');
});

test('landing page has DOCTYPE html declaration', async ({ request }) => {
  const response = await request.get('/');
  const text = await response.text();
  expect(text.trim().toLowerCase()).toMatch(/^<!doctype html/);
});

// ─── Meta tags ────────────────────────────────────────────────────────────────

test('landing page has title meta tag', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
});

test('landing page has meta description', async ({ page }) => {
  await page.goto('/');
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toBeTruthy();
  expect(description!.length).toBeGreaterThan(0);
});

test('landing page has og:title open graph tag', async ({ page }) => {
  await page.goto('/');
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
  expect(ogTitle).toBeTruthy();
});

test('landing page has og:description open graph tag', async ({ page }) => {
  await page.goto('/');
  const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
  expect(ogDesc).toBeTruthy();
});

test('landing page has twitter:card meta tag', async ({ page }) => {
  await page.goto('/');
  const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
  expect(twitterCard).toBeTruthy();
});

test('landing page has canonical link tag', async ({ page }) => {
  await page.goto('/');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBeTruthy();
});

// ─── Key page elements ────────────────────────────────────────────────────────

test('landing page renders a visible h1 heading', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible();
  const text = await h1.innerText();
  expect(text.length).toBeGreaterThan(0);
});

test('landing page has at least one CTA button', async ({ page }) => {
  await page.goto('/');
  // landing.ejs has .btn-primary class for CTA buttons
  const ctaButton = page.locator('.btn-primary, .btn-cta, a.btn').first();
  await expect(ctaButton).toBeVisible();
});

test('landing page has a navigation bar', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('nav').first();
  await expect(nav).toBeVisible();
});

test('landing page has features/solution section', async ({ page }) => {
  await page.goto('/');
  // landing.ejs has .solution-card or .section class for features
  const featureSection = page.locator('.solution-card, .solution-grid, [class*="feature"]').first();
  // May be below the fold — just assert it exists in DOM
  const count = await page.locator('.solution-card, .solution-grid, [class*="feature"]').count();
  expect(count).toBeGreaterThan(0);
});

test('landing page has pricing section', async ({ page }) => {
  await page.goto('/');
  const pricingSection = page.locator('.pricing-grid, .price-card, [class*="pricing"]').first();
  const count = await page.locator('.pricing-grid, .price-card, [class*="pricing"]').count();
  expect(count).toBeGreaterThan(0);
});

// ─── Logo ─────────────────────────────────────────────────────────────────────

test('landing page has logo in navigation', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('.logo, nav .logo, nav [class*="logo"]').first();
  await expect(logo).toBeVisible();
});
