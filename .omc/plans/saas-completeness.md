# SaaS Product Completeness Plan — Final Gaps

## Summary

Cross-surface gap analysis found **25 remaining items** across 4 priority levels. The product is ~85% production-ready after our 90+ fixes. These items close the last 15% to make it sellable.

---

## CRITICAL — Blocks Sales (4 items)

### C1: Ban check missing in web app
- **File:** `src/routes/web.ts` line ~230 (`getUser()` middleware)
- **What:** Banned users can fully use the web app. Bot checks `isBanned`, web app doesn't.
- **Fix:** Add `if (user.isBanned) return reply.status(403).send({ error: 'Account suspended' });` after user lookup
- **Effort:** S | **Surface:** WebApp

### C2: Terms of Service page
- **What:** No TOS page. Payment gateways (Midtrans, DuitKu, Tripay) require merchant TOS or may suspend the account.
- **Fix:** Create `/terms` route serving a styled TOS page. Add link to landing footer and web app.
- **Effort:** S | **Surface:** Landing + WebApp

### C3: Privacy Policy page
- **What:** No privacy policy. Required by Indonesian UU PDP law (effective Oct 2024) and Telegram bot policy.
- **Fix:** Create `/privacy` route. Add link to landing footer and web app. Cover data collection, usage, retention, deletion rights.
- **Effort:** S | **Surface:** Landing + WebApp

### C4: Account deletion mechanism
- **What:** No way for users to delete their account or data. Required by UU PDP.
- **Fix:** Add `/delete_account` bot command + web app button. Soft-delete user (anonymize PII, keep transaction records for 30 days, then hard-delete). Add `DELETE /api/user` endpoint.
- **Effort:** M | **Surface:** Bot + WebApp

---

## HIGH — Hurts Conversion (7 items)

### H1: Web app minimum feature parity
- **What:** Web app only has video creation + billing. Missing: subscription management, referral dashboard, settings, image generation, profile.
- **Fix:** Add 4 new views to `app.ejs`: Subscriptions (view plans, buy), Referrals (stats, withdraw, share link), Settings (language), Profile (credits, tier, stats).
- **Effort:** L | **Surface:** WebApp

### H2: Web app onboarding for new users
- **What:** Users who register via web skip niche selection, welcome bonus, referral code entry.
- **Fix:** After first web login, show an onboarding overlay: niche picker → welcome bonus → referral code input. Store state in localStorage.
- **Effort:** M | **Surface:** WebApp

### H3: FAQ / Help page
- **What:** Zero documentation. Bot has `/support` but web users have nothing.
- **Fix:** Create `/faq` route with collapsible FAQ sections covering: How to create videos, Pricing explained, Payment methods, Referral program, Account management.
- **Effort:** S | **Surface:** Landing + WebApp

### H4: Fix "60 detik" misleading claim on landing
- **What:** Landing says "60 detik" which users interpret as "ready in 60 seconds" but it means video duration. Generation takes minutes.
- **Fix:** Change to "Video Iklan Profesional dalam Hitungan Menit" or clarify "Video hingga 60 detik durasi".
- **Effort:** S | **Surface:** Landing

### H5: Web app language switcher
- **What:** Web app is hardcoded `lang="id"`. No language toggle despite bot supporting 4 languages.
- **Fix:** Add language selector to web app header. Store preference in localStorage. Apply to all text via i18n dict (same pattern as landing page's `switchLang()`).
- **Effort:** M | **Surface:** WebApp

### H6: Landing page CTA to web app
- **What:** All CTAs link to Telegram bot only. Users who prefer web have no path.
- **Fix:** Add "Try Web App" secondary CTA button linking to `/app` alongside the Telegram CTA.
- **Effort:** S | **Surface:** Landing

### H7: Web app ban + gateway edge cases
- **What:** Web app `buyPackage()` has hardcoded `duitku` fallback at line 683 if gateway array is empty. Banned user JWT not invalidated.
- **Fix:** Show "No payment methods available" if gateway array empty (no silent fallback). JWT validity is acceptable with per-request ban check (C1).
- **Effort:** S | **Surface:** WebApp

---

## MEDIUM — Should Fix Soon (9 items)

### M1: Admin subscription management
- **What:** Admin can't view, cancel, or modify active subscriptions.
- **Fix:** Add `#subscriptions` section to admin SPA with subscription list table, cancel/extend buttons. Add `GET /api/subscriptions/active` and `POST /api/subscriptions/:id/cancel` endpoints.
- **Effort:** M | **Surface:** Admin

### M2: Landing page dual language toggle
- **What:** Two competing toggles: `<select>` dropdown (4 languages) and `<button>` (EN/ID only).
- **Fix:** Remove the `<button>` toggle, keep only the `<select>` dropdown which supports all 4 languages.
- **Effort:** S | **Surface:** Landing

### M3: PWA manifest for web app
- **What:** Web app is not installable. No `manifest.json`, no service worker.
- **Fix:** Add `manifest.json` with app name, icons, theme color. Add `<link rel="manifest">` to `app.ejs`. No service worker needed for basic installability.
- **Effort:** S | **Surface:** WebApp

### M4: Admin welcome message override
- **What:** Bot welcome message is hardcoded in `start.ts`. Admin can't customize.
- **Fix:** Store in `PricingConfig` with `category: 'system', key: 'welcome_message'`. Read in `startCommand()` with fallback to hardcoded default.
- **Effort:** S | **Surface:** Admin + Bot

### M5: Admin queue management
- **What:** Admin can see queue stats but can't retry failed or clear stuck jobs.
- **Fix:** Add `POST /api/queue/retry/:jobId` and `POST /api/queue/clean` endpoints. Add retry/clean buttons in the system health section.
- **Effort:** M | **Surface:** Admin

### M6: Exchange rate in bot (env vs admin)
- **What:** Bot reads `getConfig().USD_TO_IDR_RATE` from env, not the admin-set rate in DB.
- **Fix:** In `token-tracker.service.ts`, read exchange rate from `PaymentSettingsService.getPricingConfig('system', 'exchange_rate')` with env fallback.
- **Effort:** S | **Surface:** Bot

### M7: Billing history with download
- **What:** Transaction table exists but no PDF/receipt download. Indonesian tax law requires invoices for B2B.
- **Fix:** Add `GET /api/my/transactions/:id/receipt` that generates a simple HTML receipt (printable). No PDF library needed — HTML with `@media print` CSS.
- **Effort:** M | **Surface:** WebApp

### M8: Web app image generation UI
- **What:** API exists (`POST /api/image/generate`) but no UI in web app.
- **Fix:** Add Image Generation view with: category selector, reference image upload (optional), text prompt, generate button, result display.
- **Effort:** M | **Surface:** WebApp

### M9: Web app video delete button
- **What:** API exists (`DELETE /api/video/:jobId`) but no delete button in video cards.
- **Fix:** Add delete button to each video card with confirmation dialog.
- **Effort:** S | **Surface:** WebApp

---

## LOW — Future Enhancement (5 items)

### L1: Email notifications (SMTP integration)
- **Effort:** L | Add SendGrid/SES for payment receipts, subscription expiry warnings, welcome email

### L2: Public status page
- **Effort:** S | Simple `/status` page showing system health (DB, Redis, providers)

### L3: Customer support widget for web
- **Effort:** M | Embed Tawk.to/Crisp chat widget on web app, or build simple ticket form

### L4: Documentation / help center
- **Effort:** L | Static docs site with user guide, API docs, video tutorials

### L5: Team/organization accounts
- **Effort:** XL | Multi-user organizations with shared credits, role-based access

---

## Implementation Order

**Sprint A (Day 1):** C1, C2, C3, H4, H6, M2, M9 — all S-effort, no dependencies
**Sprint B (Day 2):** C4, H3, H5, M3, M4, M6 — S/M effort, independent
**Sprint C (Day 3-4):** H1, H2, H7, M1 — L/M effort, web app views
**Sprint D (Day 5):** M5, M7, M8 — M effort, admin + web features

---

## Verification

- `npm run typecheck` — 0 errors after each sprint
- `npm test` — 53/53 suites pass
- Manual: `/terms` and `/privacy` return styled pages
- Manual: Ban user → verify web app returns 403
- Manual: Web app shows subscription/referral/settings views
- Manual: Landing CTAs include both Telegram and web app links
- Manual: Single language toggle on landing page
