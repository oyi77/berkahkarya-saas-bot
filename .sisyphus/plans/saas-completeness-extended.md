# SaaS Completeness — Extended Plan (3-Tier Referral + Industry-Standard Media + Web Parity)

## TL;DR

> **Quick Summary**: Deep codebase audit of the existing saas-completeness.md plan revealed 20+ additional gaps across referral system (2-tier only, needs 3-tier), video generation pipeline (ProviderRouter not integrated, quality checks missing from flow), web app feature parity, security, and admin capabilities. This plan extends the original 25 items with all newly discovered gaps, organized for minimum-effort, maximum-impact delivery.
>
> **Deliverables**:
>
> - 3-level deep referral/affiliate system (Tier 3: 2% commission)
> - Video pipeline: ProviderRouter integration, quality check, post-processing hooks
> - Web app: ban check, language switcher, subscription/referral/settings/profile views, onboarding
> - Legal: TOS page, Privacy Policy page, account deletion mechanism
> - Admin: subscription management, queue management, welcome message override
> - Security: rate limiting on API endpoints, JWT refresh mechanism
> - Landing: fix misleading "60 detik" claim, add web app CTA, fix dual language toggle
>
> **Estimated Effort**: Large (~40 tasks across 5 waves)
> **Parallel Execution**: YES — 5 waves with 5-8 parallel tasks each
> **Critical Path**: Config/Types → Referral Core → Web Routes → Web UI → Verification

---

## Context

### Original Request

Extend the plans already available in `.omc/plans/saas-completeness.md` by exploring deeper in the codebase to understand what's missing, gaps, or not synced between platforms. Goals: SaaS-ready, minimum effort, industry-standard prompt/image/video processing, ready for micro-business end users, helpful, 3-level deep referral/affiliate system.

### Interview Summary

**Key Discussions**: N/A — deep codebase audit performed directly.

**Research Findings**:

- **Referral**: `referral.service.ts` processes only 2 tiers. `pricing.ts` already defines `TIER_3: 0.02` but it's never used. No code change needed in DB schema — `referredBy` chain traversal works for 3 levels.
- **Video Generation**: `video-generation.service.ts` has hardcoded GeminiGen + BytePlus only. `ProviderRouter` exists but is NOT used by the main generation flow. `dispatchToProvider()` returns "not yet implemented" for all other provider keys. Quality check, post-processing, and watermark services exist but are NOT integrated into the main pipeline.
- **Image Generation**: Excellent — 10 providers, text2img/img2img/IP-Adapter modes, vision enrichment, watermark pre-processing. Industry-standard.
- **Web App**: Missing ban check, language switcher, subscription management, referral dashboard, settings, image generation UI, profile view, onboarding for web-only users.
- **Security**: No rate limiting on most API endpoints. JWT 7-day expiry with no refresh. Banned users can fully use web app.
- **Admin**: Can't manage subscriptions, can't retry failed queue jobs, can't customize welcome message.

### Metis Review

**Identified Gaps** (addressed):

- Gap 1: Original plan missed that ProviderRouter exists but is unused — added integration task
- Gap 2: Original plan missed that quality-check service exists but isn't in main pipeline — added integration task
- Gap 3: Original plan missed that video post-processing isn't wired into generation flow — added wiring task
- Gap 4: Original plan missed web app onboarding gap for web-only registrations — added onboarding task
- Gap 5: Tier 3 commission constant already exists in pricing.ts — use it instead of creating new

---

## Work Objectives

### Core Objective

Make the Telegram bot SaaS platform production-ready for micro-business users with 3-level affiliate referrals, industry-standard media generation, and full web app parity — with minimum effort by leveraging existing services and filling only the gaps.

### Concrete Deliverables

- 3-tier referral commission processing (15% / 5% / 2%)
- Web app ban check middleware
- Web app language switcher (4 languages)
- Web app subscription management view + API
- Web app referral dashboard with 3-tier stats
- Web app settings page
- Web app profile page with credits/tier/stats
- Web app image generation UI
- Web app onboarding flow for new web users
- TOS page + Privacy Policy page
- Account deletion mechanism (bot + web)
- Landing page: fix "60 detik" claim, add web app CTA, fix dual toggle
- Admin: subscription management UI + API
- Admin: queue retry/clean endpoints
- Admin: welcome message override
- Video pipeline: ProviderRouter integration
- Video pipeline: quality check integration
- Video pipeline: post-processing integration
- API rate limiting middleware
- Billing history with receipt download

### Definition of Done

- [ ] `npm run typecheck` — 0 errors
- [ ] `npm test` — all suites pass (53+)
- [ ] `npm run test:e2e` — E2E tests pass
- [ ] 3-tier referral commissions verified via test
- [ ] Web app accessible, all views render, language switch works
- [ ] TOS and Privacy pages return 200 with styled content
- [ ] Ban check blocks banned users from web app (403)
- [ ] Video generation uses ProviderRouter for dynamic routing
- [ ] Admin can manage subscriptions and retry queue jobs

### Must Have

- 3-tier referral commissions (use existing TIER_3: 0.02 from pricing.ts)
- Ban check on ALL web app authenticated routes
- Language support matching bot (id, en, ru, zh)
- All existing tests must continue passing
- No breaking changes to existing payment flows

### Must NOT Have (Guardrails)

- No new database migrations for referral (use existing referredBy chain)
- No new external dependencies for rate limiting (use in-memory or Redis)
- No PDF library for receipts (use HTML with @media print CSS)
- No service worker for PWA (manifest only per original plan)
- No team/org accounts (out of scope — L5 from original plan)
- No email notifications (out of scope — L1 from original plan)
- No documentation site (out of scope — L4 from original plan)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: YES
- **Automated tests**: YES (Tests-after) — add test tasks after implementation tasks
- **Framework**: Jest (existing)
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

### QA Policy

Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — config, types, middleware, legal pages):
├── T1: Config — add THIRD_TIER constant to packages.ts [quick]
├── T2: Types — extend CommissionStatus with pending_cashout [quick]
├── T3: Rate limiting middleware for API routes [quick]
├── T4: TOS page (landing + web app) [quick]
├── T5: Privacy Policy page (landing + web app) [quick]
├── T6: Fix landing "60 detik" claim + dual toggle + web CTA [quick]
└── T7: PWA manifest for web app [quick]

Wave 2 (After Wave 1 — referral core + ban check + account deletion):
├── T8: 3-tier referral commission processing [deep]
├── T9: Web app ban check middleware [quick]
├── T10: Account deletion mechanism (bot + web + API) [medium]
├── T11: Admin subscription management API [medium]
├── T12: Admin queue management API [quick]
├── T13: Admin welcome message override [quick]
└── T14: Exchange rate sync (env vs admin DB) [quick]

Wave 3 (After Wave 2 — video pipeline improvements):
├── T15: ProviderRouter integration in video-generation.service.ts [deep]
├── T16: Quality check integration in video pipeline [medium]
├── T17: Post-processing integration in video pipeline [medium]
├── T18: Billing history with receipt download [medium]
└── T19: Fix web app hardcoded duitku fallback [quick]

Wave 4 (After Wave 3 — web app views):
├── T20: Web app language switcher [medium]
├── T21: Web app subscription management view [medium]
├── T22: Web app referral dashboard (3-tier) [medium]
├── T23: Web app settings page [quick]
├── T24: Web app profile page [quick]
├── T25: Web app image generation UI [medium]
├── T26: Web app video delete button [quick]
└── T27: Web app onboarding for new web users [medium]

Wave 5 (After Wave 4 — verification):
├── T28: Referral 3-tier tests + QA [deep]
├── T29: Web app integration tests + QA [deep]
├── T30: Video pipeline tests + QA [deep]
└── T31: Full E2E sweep + evidence capture [deep]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)

Critical Path: T1 → T8 → T22 → T28 → F1-F4
Parallel Speedup: ~75% faster than sequential
Max Concurrent: 7 (Waves 1 & 4)
```

### Dependency Matrix

- **1-7**: — — 8-14, 20
- **8**: 1 — 22, 28
- **9**: — — 10, 27
- **10**: 9 — 27
- **11-14**: 1-2 — 18, 21
- **15-17**: — — 30
- **18**: 11-14 — 29
- **19**: — — 21
- **20**: 6 — 21-27
- **21**: 11, 19, 20 — 29
- **22**: 8, 20 — 28, 29
- **23-27**: 9, 20 — 29, 30
- **28-30**: 8, 15-17, 21-27 — 31
- **31**: 28-30 — F1-F4

### Agent Dispatch Summary

- **Wave 1**: **7** — T1-T3 → `quick`, T4-T6 → `quick`, T7 → `quick`
- **Wave 2**: **7** — T8 → `deep`, T9 → `quick`, T10 → `unspecified-high`, T11-T12 → `unspecified-high`, T13-T14 → `quick`
- **Wave 3**: **5** — T15 → `deep`, T16-T17 → `unspecified-high`, T18 → `unspecified-high`, T19 → `quick`
- **Wave 4**: **8** — T20 → `visual-engineering`, T21-T22 → `unspecified-high`, T23-T24 → `quick`, T25 → `visual-engineering`, T26 → `quick`, T27 → `unspecified-high`
- **Wave 5**: **4** — T28-T31 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Config — Add THIRD_TIER constant to packages.ts

  **What to do**:
  - Add `THIRD_TIER_REFERRAL: 0.02` to `src/config/packages.ts` COMMISSIONS object
  - Use the existing value from `pricing.ts` (`REFERRAL_COMMISSIONS_V3.TIER_3 = 0.02`)
  - No new dependencies needed

  **Must NOT do**:
  - Do NOT create a new config file — add to existing packages.ts
  - Do NOT change pricing.ts values — they're already correct

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file edit, adding one constant to existing object
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2-T7)
  - **Blocks**: T8 (referral 3-tier processing)
  - **Blocked By**: None

  **References**:
  - `src/config/packages.ts:1-6` — Current COMMISSIONS object (only DIRECT_REFERRAL + INDIRECT_REFERRAL)
  - `src/config/pricing.ts:187` — REFERRAL_COMMISSIONS_V3 with TIER_3 already defined
  - `src/services/referral.service.ts:8` — Imports COMMISSIONS from packages.ts

  **Acceptance Criteria**:
  - [ ] `src/config/packages.ts` exports `THIRD_TIER_REFERRAL: 0.02`
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Verify THIRD_TIER constant is exported
    Tool: Bash (node REPL)
    Steps:
      1. Run: npx tsx -e "import { COMMISSIONS } from './src/config/packages'; console.log(COMMISSIONS.THIRD_TIER_REFERRAL)"
    Expected Result: Output is `0.02`
    Evidence: .sisyphus/evidence/task-1-third-tier-constant.txt
  ```

  **Commit**: YES (groups with T2-T7)
  - Message: `feat(config): add THIRD_TIER_REFERRAL constant for 3-level affiliate`
  - Files: `src/config/packages.ts`

- [x] 2. Types — Extend CommissionStatus with pending_cashout

  **What to do**:
  - Check `src/types/index.ts` for CommissionStatus type
  - Add `pending_cashout` to the union if not already present
  - Verify Commission model in schema.prisma uses varchar(16) — already does

  **Must NOT do**:
  - Do NOT modify the Prisma schema — status field is already varchar(16)
  - Do NOT add new database columns

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single type definition update
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3-T7)
  - **Blocks**: T10, T11
  - **Blocked By**: None

  **References**:
  - `src/types/index.ts:192` — CommissionStatus type definition
  - `prisma/schema.prisma:206` — Commission.status field

  **Acceptance Criteria**:
  - [ ] CommissionStatus includes 'pending_cashout'
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Verify pending_cashout is valid status
    Tool: Bash (tsc)
    Steps:
      1. Run: npm run typecheck 2>&1 | grep -c "error" || true
    Expected Result: 0 errors related to CommissionStatus
    Evidence: .sisyphus/evidence/task-2-commission-status.txt
  ```

  **Commit**: YES (groups with T1, T3-T7)
  - Message: `feat(types): add pending_cashout to CommissionStatus`
  - Files: `src/types/index.ts`

- [x] 3. Rate limiting middleware for API routes

  **What to do**:
  - Create `src/middleware/rateLimit.ts` with Redis-backed rate limiter
  - Apply to sensitive endpoints: `/api/payment/create`, `/api/referral/withdraw`, `/api/video/create`, `/api/image/generate`
  - Use sliding window: 10 requests/minute for payment, 30/min for generation, 60/min for reads
  - Return 429 with Retry-After header

  **Must NOT do**:
  - Do NOT add new npm dependencies — use existing ioredis
  - Do NOT rate limit health check or static file routes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard middleware pattern, Redis already available
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T2, T4-T7)
  - **Blocks**: None (middleware is additive)
  - **Blocked By**: None

  **References**:
  - `src/middleware/` — Existing middleware patterns
  - `src/config/redis.ts` — Redis client
  - `src/routes/web.ts:933-976` — Existing in-memory rate limiter for chat (pattern to replace)

  **Acceptance Criteria**:
  - [ ] `src/middleware/rateLimit.ts` created with configurable limits
  - [ ] Applied to payment, withdrawal, and generation endpoints
  - [ ] Returns 429 with Retry-After header when exceeded
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Rate limit triggers on excessive requests
    Tool: Bash (curl)
    Steps:
      1. Send 11 rapid POST requests to /api/payment/create
      2. Assert 11th request returns 429
      3. Assert response contains Retry-After header
    Expected Result: 10 requests succeed, 11th returns 429
    Evidence: .sisyphus/evidence/task-3-rate-limit-trigger.txt

  Scenario: Normal usage is not rate limited
    Tool: Bash (curl)
    Steps:
      1. Send 5 requests to /api/packages (read endpoint)
      2. Assert all return 200
    Expected Result: All 5 requests return 200
    Evidence: .sisyphus/evidence/task-3-rate-limit-normal.txt
  ```

  **Commit**: YES (groups with T1-T2, T4-T7)
  - Message: `feat(middleware): add Redis-backed rate limiting for API endpoints`
  - Files: `src/middleware/rateLimit.ts`

- [x] 4. TOS page (landing + web app)

  **What to do**:
  - Create `/terms` route in `src/routes/web.ts` serving styled TOS page
  - Add link to landing page footer and web app header
  - Cover: service description, payment terms, refund policy, user obligations, limitation of liability
  - Use existing landing page styling for consistency

  **Must NOT do**:
  - Do NOT create a new CSS file — reuse existing styles
  - Do NOT make it a separate SPA — serve as EJS template

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Static page with existing styling patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T3, T5-T7)
  - **Blocks**: T6 (landing footer link)
  - **Blocked By**: None

  **References**:
  - `src/routes/web.ts:49-69` — Landing page route pattern
  - `landing/` — Landing page HTML for styling reference
  - `src/views/` — EJS template directory

  **Acceptance Criteria**:
  - [ ] GET /terms returns 200 with styled TOS content
  - [ ] Landing footer includes link to /terms
  - [ ] Web app header includes link to /terms
  - [ ] Content covers payment terms, refunds, user obligations

  **QA Scenarios**:

  ```
  Scenario: TOS page loads correctly
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3000/terms
      2. Assert response contains "Syarat dan Ketentuan" or "Terms of Service"
      3. Assert HTTP status is 200
    Expected Result: 200 response with TOS content
    Evidence: .sisyphus/evidence/task-4-tos-page.html

  Scenario: Landing footer links to TOS
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3000/
      2. Assert response contains href="/terms"
    Expected Result: Landing page HTML includes link to /terms
    Evidence: .sisyphus/evidence/task-4-tos-link.txt
  ```

  **Commit**: YES (groups with T1-T3, T5-T7)
  - Message: `feat(legal): add Terms of Service page`
  - Files: `src/routes/web.ts`, `src/views/web/tos.ejs`, `landing/`

- [x] 5. Privacy Policy page (landing + web app)

  **What to do**:
  - Create `/privacy` route in `src/routes/web.ts` serving styled Privacy Policy page
  - Add link to landing footer and web app header
  - Cover: data collection (Telegram ID, username, payment data), usage, retention, deletion rights (UU PDP compliance)

  **Must NOT do**:
  - Do NOT create separate CSS — reuse TOS/landing styles

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Same pattern as TOS page
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T4, T6-T7)
  - **Blocks**: T6 (landing footer link)
  - **Blocked By**: None

  **References**:
  - `src/routes/web.ts:49-69` — Landing page route pattern
  - Task 4 (TOS page) — Same styling pattern

  **Acceptance Criteria**:
  - [ ] GET /privacy returns 200 with styled Privacy Policy content
  - [ ] Landing footer includes link to /privacy
  - [ ] Web app header includes link to /privacy
  - [ ] Content covers UU PDP requirements: data collection, usage, retention, deletion rights

  **QA Scenarios**:

  ```
  Scenario: Privacy page loads correctly
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3000/privacy
      2. Assert response contains "Kebijakan Privasi" or "Privacy Policy"
      3. Assert HTTP status is 200
    Expected Result: 200 response with Privacy Policy content
    Evidence: .sisyphus/evidence/task-5-privacy-page.html
  ```

  **Commit**: YES (groups with T1-T4, T6-T7)
  - Message: `feat(legal): add Privacy Policy page (UU PDP compliant)`
  - Files: `src/routes/web.ts`, `src/views/web/privacy.ejs`

- [x] 6. Fix landing "60 detik" claim + dual toggle + web CTA

  **What to do**:
  - Change "Video Iklan Profesional dalam 60 detik" to "Video Iklan Profesional dalam Hitungan Menit" or clarify "Video hingga 60 detik durasi"
  - Remove the duplicate `<button>` language toggle, keep only the `<select>` dropdown (supports all 4 languages)
  - Add "Try Web App" secondary CTA button linking to `/app` alongside the Telegram CTA

  **Must NOT do**:
  - Do NOT remove the `<select>` dropdown — it's the correct one
  - Do NOT change the landing page layout drastically

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3 small edits to existing landing HTML
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T5, T7)
  - **Blocks**: T20 (web app language switcher — depends on knowing the select pattern)
  - **Blocked By**: None

  **References**:
  - `landing/` directory — main landing HTML file

  **Acceptance Criteria**:
  - [ ] Landing page no longer says "60 detik" as a time claim
  - [ ] Only ONE language toggle exists (the `<select>` dropdown)
  - [ ] Landing page has "Try Web App" CTA linking to `/app`

  **QA Scenarios**:

  ```
  Scenario: Landing page has correct CTA and single toggle
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3000/
      2. Assert response does NOT contain misleading "60 detik" time claim
      3. Assert response contains href="/app" for web app CTA
      4. Count <select> and <button> language toggles — only 1 <select> should exist
    Expected Result: Single select toggle, web app CTA present, no misleading claim
    Evidence: .sisyphus/evidence/task-6-landing-fix.html
  ```

  **Commit**: YES (groups with T1-T5, T7)
  - Message: `fix(landing): correct 60-detik claim, remove duplicate toggle, add web CTA`
  - Files: `landing/index.html` (or equivalent)

- [x] 7. PWA manifest for web app

  **What to do**:
  - Create `public/manifest.json` with app name, icons, theme color
  - Add `<link rel="manifest">` to `app.ejs` head section
  - No service worker needed for basic installability

  **Must NOT do**:
  - Do NOT implement service worker (out of scope per original plan M3)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2 file changes, standard PWA manifest
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1-T6)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `public/` — Static assets directory
  - `src/views/web/app.ejs` — Web app template

  **Acceptance Criteria**:
  - [ ] `public/manifest.json` exists with valid PWA manifest
  - [ ] `app.ejs` includes `<link rel="manifest" href="/manifest.json">`
  - [ ] Manifest validates as proper PWA manifest

  **QA Scenarios**:

  ```
  Scenario: PWA manifest is accessible and valid
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3000/manifest.json
      2. Assert response is valid JSON with name, icons, theme_color fields
      3. curl -s http://localhost:3000/app | grep 'rel="manifest"'
    Expected Result: Valid manifest JSON, link tag present in app.ejs
    Evidence: .sisyphus/evidence/task-7-pwa-manifest.json
  ```

  **Commit**: YES (groups with T1-T6)
  - Message: `feat(pwa): add manifest.json for web app installability`
  - Files: `public/manifest.json`, `src/views/web/app.ejs`

- [x] 8. 3-tier referral commission processing

  **What to do**:
  - Extend `src/services/referral.service.ts` `processCommissions()` to traverse 3 levels up the referral chain
  - Level 1: buyer.referredBy → directReferrer (15%)
  - Level 2: directReferrer.referredBy → indirectReferrer (5%)
  - Level 3: indirectReferrer.referredBy → thirdTierReferrer (2%)
  - Use `COMMISSIONS.THIRD_TIER_REFERRAL` from packages.ts (added in T1)
  - Keep existing eligibility check (`isEligible()`) for all 3 levels
  - No DB schema change needed — referredBy chain traversal works

  **Must NOT do**:
  - Do NOT add new database columns or tables
  - Do NOT change the Commission model
  - Do NOT break existing 2-tier behavior for users without 3rd-level referrers

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core business logic change with commission calculation, needs careful testing
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: Write tests first for 3-tier commission paths before implementing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T9-T14)
  - **Blocks**: T22 (web app referral dashboard), T28 (referral tests)
  - **Blocked By**: T1 (THIRD_TIER constant)

  **References**:
  - `src/services/referral.service.ts:16-56` — Current processCommissions (2-tier only)
  - `src/config/packages.ts:1-6` — COMMISSIONS object (will have THIRD_TIER after T1)
  - `src/config/pricing.ts:180-187` — getReferralCommissionsAsync with TIER_3 default
  - `src/handlers/callbacks/onboarding.ts:390-411` — How referredBy is set during registration
  - `tests/unit/services/referral.service.test.ts` — Existing 2-tier tests to extend

  **Acceptance Criteria**:
  - [ ] processCommissions creates 3 commission records for a 3-level chain
  - [ ] Tier 3 commission uses 2% rate
  - [ ] Eligibility check applies to all 3 levels
  - [ ] Existing 2-tier tests still pass
  - [ ] New 3-tier test added and passes

  **QA Scenarios**:

  ```
  Scenario: 3-level chain commissions are created correctly
    Tool: Bash (Jest)
    Steps:
      1. Create chain: user3 → user2 → user1 → buyer
      2. Process a transaction for buyer
      3. Query commissions table for all 3 referrers
      4. Assert user1 gets 15%, user2 gets 5%, user3 gets 2%
    Expected Result: 3 commission records with correct tiers and amounts
    Evidence: .sisyphus/evidence/task-8-three-tier-commissions.txt

  Scenario: Ineligible 3rd-tier referrer gets no commission
    Tool: Bash (Jest)
    Steps:
      1. Create chain where 3rd-tier referrer has no activity in 30 days
      2. Process transaction for buyer
      3. Assert only 2 commissions created (tiers 1 and 2)
    Expected Result: Tier 3 commission skipped due to ineligibility
    Evidence: .sisyphus/evidence/task-8-tier3-ineligible.txt
  ```

  **Commit**: YES (groups with T9-T14)
  - Message: `feat(referral): extend commission processing to 3-tier MLM`
  - Files: `src/services/referral.service.ts`, `tests/unit/services/referral.service.test.ts`

- [x] 9. Web app ban check middleware

  **What to do**:
  - Add ban check to `getUser()` middleware in `src/routes/web.ts` (around line 228)
  - After user lookup, add: `if (user.isBanned) return reply.status(403).send({ error: 'Account suspended' });`
  - This closes the gap where banned users can fully use the web app

  **Must NOT do**:
  - Do NOT change the bot ban check — it already works
  - Do NOT invalidate existing JWTs (per-request check is sufficient)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3-line addition to existing middleware
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8, T10-T14)
  - **Blocks**: T10, T27 (account deletion, onboarding)
  - **Blocked By**: None

  **References**:
  - `src/routes/web.ts:228-249` — getUser() middleware function
  - `src/commands/start.ts:77-87` — Bot ban check pattern to mirror

  **Acceptance Criteria**:
  - [ ] Banned user JWT returns 403 on any authenticated API route
  - [ ] Non-banned users unaffected
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Banned user is blocked from web app
    Tool: Bash (curl)
    Steps:
      1. Set a user's isBanned = true in DB
      2. Get JWT for that user
      3. curl -H "Authorization: Bearer <token>" http://localhost:3000/api/user
      4. Assert response is 403 with "Account suspended"
    Expected Result: 403 response, user blocked
    Evidence: .sisyphus/evidence/task-9-ban-check-blocked.txt

  Scenario: Non-banned user can access web app
    Tool: Bash (curl)
    Steps:
      1. Get JWT for non-banned user
      2. curl -H "Authorization: Bearer <token>" http://localhost:3000/api/user
      3. Assert response is 200 with user data
    Expected Result: 200 response with user data
    Evidence: .sisyphus/evidence/task-9-ban-check-allowed.txt
  ```

  **Commit**: YES (groups with T8, T10-T14)
  - Message: `fix(security): add ban check to web app middleware`
  - Files: `src/routes/web.ts`

- [x] 10. Account deletion mechanism (bot + web + API)

  **What to do**:
  - Add `/delete_account` bot command that confirms and soft-deletes user
  - Add `DELETE /api/user` endpoint for web app account deletion
  - Soft-delete: anonymize PII (set firstName="Deleted User", clear username, phone, referralCode), keep transaction records for 30 days
  - After 30 days: hard-delete via scheduled job or manual admin action
  - Send confirmation message to user before deletion

  **Must NOT do**:
  - Do NOT hard-delete immediately — keep transaction records for compliance
  - Do NOT delete Commission records (needed for referrer payouts)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-surface change (bot command + API + data handling)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8-T9, T11-T14)
  - **Blocks**: T27 (onboarding — needs to handle deleted referrer chains)
  - **Blocked By**: T9 (ban check middleware)

  **References**:
  - `src/routes/web.ts` — Web API routes
  - `src/commands/` — Bot command patterns
  - `prisma/schema.prisma:16-88` — User model fields to anonymize

  **Acceptance Criteria**:
  - [ ] `/delete_account` bot command with confirmation flow
  - [ ] `DELETE /api/user` endpoint with JWT auth
  - [ ] PII anonymized, transaction records preserved
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Web user deletes account via API
    Tool: Bash (curl)
    Steps:
      1. Get JWT for test user
      2. DELETE http://localhost:3000/api/user with JWT
      3. Assert 200 response
      4. Query DB: user firstName = "Deleted User", referralCode = null
      5. Query DB: user's transactions still exist
    Expected Result: PII anonymized, transactions preserved
    Evidence: .sisyphus/evidence/task-10-account-deletion-api.txt
  ```

  **Commit**: YES (groups with T8-T9, T11-T14)
  - Message: `feat(account): add account deletion mechanism (UU PDP compliant)`
  - Files: `src/routes/web.ts`, `src/commands/delete-account.ts`, `src/services/user.service.ts`

- [x] 11. Admin subscription management API

  **What to do**:
  - Add `GET /api/subscriptions/active` endpoint to admin routes
  - Add `POST /api/subscriptions/:id/cancel` endpoint
  - Add `POST /api/subscriptions/:id/extend` endpoint
  - Return subscription list with user info, plan, status, period dates

  **Must NOT do**:
  - Do NOT change subscription model or create new tables

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New admin API endpoints with business logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8-T10, T12-T14)
  - **Blocks**: T18 (billing history), T21 (web subscription view)
  - **Blocked By**: T1-T2 (config/types)

  **References**:
  - `src/routes/admin.ts` — Admin API patterns
  - `src/services/subscription.service.ts` — Subscription business logic
  - `prisma/schema.prisma:228-257` — Subscription model

  **Acceptance Criteria**:
  - [ ] GET /api/subscriptions/active returns all active subscriptions
  - [ ] POST /api/subscriptions/:id/cancel sets cancelAtPeriodEnd
  - [ ] POST /api/subscriptions/:id/extend extends currentPeriodEnd
  - [ ] Admin auth required for all endpoints

  **QA Scenarios**:

  ```
  Scenario: Admin can list active subscriptions
    Tool: Bash (curl)
    Steps:
      1. curl -u admin:password http://localhost:3000/api/subscriptions/active
      2. Assert 200 response with subscription array
    Expected Result: Array of active subscriptions with user info
    Evidence: .sisyphus/evidence/task-11-subscriptions-list.txt
  ```

  **Commit**: YES (groups with T8-T10, T12-T14)
  - Message: `feat(admin): add subscription management API endpoints`
  - Files: `src/routes/admin.ts`

- [x] 12. Admin queue management API

  **What to do**:
  - Add `POST /api/queue/retry/:jobId` endpoint to retry failed jobs
  - Add `POST /api/queue/clean` endpoint to clean completed/failed jobs
  - Add buttons in admin SPA system health section

  **Must NOT do**:
  - Do NOT change BullMQ configuration

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard BullMQ operations, 2 endpoints
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8-T11, T13-T14)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/routes/admin.ts` — Admin API patterns
  - `src/config/queue.ts` — BullMQ queue setup
  - `src/services/admin-alert.service.ts` — Admin notification patterns

  **Acceptance Criteria**:
  - [ ] POST /api/queue/retry/:jobId retries a failed job
  - [ ] POST /api/queue/clean removes completed/failed jobs older than 24h
  - [ ] Admin auth required

  **QA Scenarios**:

  ```
  Scenario: Admin can retry a failed job
    Tool: Bash (curl)
    Steps:
      1. Create a job that fails
      2. POST /api/queue/retry/<jobId>
      3. Assert job is re-queued
    Expected Result: Job re-queued successfully
    Evidence: .sisyphus/evidence/task-12-queue-retry.txt
  ```

  **Commit**: YES (groups with T8-T11, T13-T14)
  - Message: `feat(admin): add queue management endpoints (retry/clean)`
  - Files: `src/routes/admin.ts`

- [x] 13. Admin welcome message override

  **What to do**:
  - Store welcome message in `PricingConfig` with `category: 'system', key: 'welcome_message'`
  - Read in `startCommand()` with fallback to hardcoded default
  - Add admin UI to edit the welcome message

  **Must NOT do**:
  - Do NOT remove the hardcoded default — it's the fallback

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small change to existing pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8-T12, T14)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/commands/start.ts:106-117` — Current welcome message
  - `src/services/payment-settings.service.ts` — PricingConfig read/write pattern
  - `prisma/schema.prisma:376-387` — PricingConfig model

  **Acceptance Criteria**:
  - [ ] Admin can set custom welcome message via PricingConfig
  - [ ] startCommand reads from DB with fallback to hardcoded default
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Custom welcome message overrides default
    Tool: Bash (node REPL)
    Steps:
      1. Set PricingConfig welcome_message to "Custom welcome!"
      2. Trigger /start command
      3. Assert response contains "Custom welcome!"
    Expected Result: Custom message displayed
    Evidence: .sisyphus/evidence/task-13-welcome-override.txt
  ```

  **Commit**: YES (groups with T8-T12, T14)
  - Message: `feat(admin): make welcome message configurable via PricingConfig`
  - Files: `src/commands/start.ts`, `src/routes/admin.ts`

- [x] 14. Exchange rate sync (env vs admin DB)

  **What to do**:
  - In `src/services/token-tracker.service.ts`, read exchange rate from `PaymentSettingsService.getPricingConfig('system', 'exchange_rate')`
  - Fall back to `getConfig().USD_TO_IDR_RATE` env var if DB value not set
  - This ensures admin-set rate takes precedence over env var

  **Must NOT do**:
  - Do NOT remove env var fallback

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single service edit
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T8-T13)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/services/token-tracker.service.ts` — Current exchange rate usage
  - `src/services/payment-settings.service.ts` — getPricingConfig pattern

  **Acceptance Criteria**:
  - [ ] Exchange rate reads from DB first, env fallback
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: DB exchange rate takes precedence
    Tool: Bash (node REPL)
    Steps:
      1. Set PricingConfig exchange_rate to 16000
      2. Set env USD_TO_IDR_RATE to 15000
      3. Call token tracker cost calculation
      4. Assert 16000 rate is used
    Expected Result: DB rate (16000) used, not env (15000)
    Evidence: .sisyphus/evidence/task-14-exchange-rate.txt
  ```

  **Commit**: YES (groups with T8-T13)
  - Message: `fix(pricing): sync exchange rate from admin DB with env fallback`
  - Files: `src/services/token-tracker.service.ts`

- [x] 15. ProviderRouter integration in video-generation.service.ts

  **What to do**:
  - Replace the current hardcoded provider iteration in `generateVideo()` with `ProviderRouter.getOrderedProviders()`
  - Use `ProviderRouter.getOrderedProviders(niche, styles)` to get dynamically-scored providers
  - Replace the `dispatchToProvider()` switch with dynamic dispatch using provider key
  - Record success/failure via `ProviderRouter.recordSuccess()` / `ProviderRouter.recordFailure()`
  - Keep circuit breaker checks and demo fallback

  **Must NOT do**:
  - Do NOT remove existing provider implementations (GeminiGen, BytePlus)
  - Do NOT break the fallback chain or demo mode

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core pipeline refactor — replaces hardcoded routing with dynamic scoring
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T16-T19)
  - **Blocks**: T30 (video pipeline tests)
  - **Blocked By**: None

  **References**:
  - `src/services/video-generation.service.ts:130-171` — Current provider iteration (to replace)
  - `src/services/provider-router.service.ts:44-66` — getOrderedProviders() API
  - `src/services/provider-router.service.ts:136-157` — recordSuccess/recordFailure
  - `src/services/video-fallback.service.ts` — 9-provider fallback chain (for reference)

  **Acceptance Criteria**:
  - [ ] generateVideo() uses ProviderRouter for dynamic provider ordering
  - [ ] Provider scoring considers niche, styles, circuit breaker, and history
  - [ ] Existing 2-provider behavior preserved when only 2 are configured
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: ProviderRouter orders providers by score
    Tool: Bash (node REPL)
    Steps:
      1. Import ProviderRouter and call getOrderedProviders('fnb', ['appetizing'])
      2. Assert providers are returned in score order
      3. Assert circuit-breaker-open providers are excluded or penalized
    Expected Result: Ordered provider list with correct scoring
    Evidence: .sisyphus/evidence/task-15-provider-router-order.txt
  ```

  **Commit**: YES (groups with T16-T19)
  - Message: `feat(video): integrate ProviderRouter for dynamic provider selection`
  - Files: `src/services/video-generation.service.ts`

- [x] 16. Quality check integration in video pipeline

  **What to do**:
  - After video generation completes, run `QualityCheckService.analyzeFrame()` on the generated video
  - If quality score is below threshold, trigger fallback to next provider
  - Log quality scores to `GenerationAnalytics` model
  - Add quality check toggle via feature flag (default: enabled)

  **Must NOT do**:
  - Do NOT block delivery on quality check — only trigger fallback, not rejection
  - Do NOT add new dependencies

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration of existing service into pipeline with fallback logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15, T17-T19)
  - **Blocks**: T30 (video pipeline tests)
  - **Blocked By**: None

  **References**:
  - `src/services/quality-check.service.ts` — QualityCheckService API
  - `src/services/video-generation.service.ts:293-302` — Where to insert quality check (after provider success)
  - `prisma/schema.prisma:412-430` — GenerationAnalytics model

  **Acceptance Criteria**:
  - [ ] Quality check runs after successful video generation
  - [ ] Low-quality videos trigger fallback to next provider
  - [ ] Quality scores logged to GenerationAnalytics
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Quality check triggers fallback on low score
    Tool: Bash (Jest)
    Steps:
      1. Mock QualityCheckService to return low score
      2. Generate video
      3. Assert fallback to next provider is triggered
    Expected Result: Fallback triggered due to low quality
    Evidence: .sisyphus/evidence/task-16-quality-fallback.txt
  ```

  **Commit**: YES (groups with T15, T17-T19)
  - Message: `feat(video): integrate quality check into generation pipeline`
  - Files: `src/services/video-generation.service.ts`

- [x] 17. Post-processing integration in video pipeline

  **What to do**:
  - After video generation and quality check, run `VideoPostProcessingService` for transitions and color grading
  - Apply niche-specific transitions and color grades
  - Run watermark detection/removal via `WatermarkService` before post-processing
  - Save final processed video URL to Video record

  **Must NOT do**:
  - Do NOT skip post-processing for paid users
  - Do NOT add FFmpeg as new dependency (already available)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Pipeline integration with FFmpeg processing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15-T16, T18-T19)
  - **Blocks**: T30 (video pipeline tests)
  - **Blocked By**: None

  **References**:
  - `src/services/video-post-processing.service.ts` — Post-processing API
  - `src/services/watermark.service.ts` — Watermark detection/removal
  - `src/services/video-generation.service.ts` — Main pipeline

  **Acceptance Criteria**:
  - [ ] Post-processing runs after generation + quality check
  - [ ] Watermark detection runs before post-processing
  - [ ] Niche-specific transitions applied
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Post-processing applies niche transitions
    Tool: Bash (Jest)
    Steps:
      1. Generate video with niche='fnb'
      2. Assert post-processing applies F&B transitions
      3. Assert final video URL is saved to DB
    Expected Result: Processed video with correct transitions
    Evidence: .sisyphus/evidence/task-17-post-processing.txt
  ```

  **Commit**: YES (groups with T15-T16, T18-T19)
  - Message: `feat(video): integrate post-processing and watermark removal into pipeline`
  - Files: `src/services/video-generation.service.ts`

- [x] 18. Billing history with receipt download

  **What to do**:
  - Add `GET /api/my/transactions/:id/receipt` endpoint that generates HTML receipt
  - Use `@media print` CSS for printable receipts (no PDF library needed)
  - Include: transaction details, user info, amount, credits, payment method, date
  - Add receipt link to web app transaction history

  **Must NOT do**:
  - Do NOT add PDF generation library (use HTML print)
  - Do NOT expose receipt without authentication

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New endpoint with HTML template generation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15-T17, T19)
  - **Blocks**: T29 (web app integration tests)
  - **Blocked By**: T11-T14 (admin APIs)

  **References**:
  - `src/routes/web.ts:605-615` — Existing transactions endpoint
  - `prisma/schema.prisma:93-137` — Transaction model

  **Acceptance Criteria**:
  - [ ] GET /api/my/transactions/:id/receipt returns HTML receipt
  - [ ] Receipt includes all transaction details
  - [ ] @media print CSS makes it printable
  - [ ] JWT auth required

  **QA Scenarios**:

  ```
  Scenario: Receipt generates correctly
    Tool: Bash (curl)
    Steps:
      1. Get JWT for user with transactions
      2. curl -H "Authorization: Bearer <token>" http://localhost:3000/api/my/transactions/1/receipt
      3. Assert 200 response with HTML containing transaction details
      4. Assert response contains @media print CSS
    Expected Result: HTML receipt with transaction details and print styles
    Evidence: .sisyphus/evidence/task-18-receipt.html
  ```

  **Commit**: YES (groups with T15-T17, T19)
  - Message: `feat(billing): add transaction receipt download with print-friendly HTML`
  - Files: `src/routes/web.ts`, `src/views/web/receipt.ejs`

- [x] 19. Fix web app hardcoded duitku fallback

  **What to do**:
  - In `src/routes/web.ts` `buyPackage()` (around line 683), remove hardcoded `duitku` fallback
  - Show "No payment methods available" if gateway array is empty
  - Use `PaymentSettingsService.getEnabledGateways()` to determine available gateways

  **Must NOT do**:
  - Do NOT remove duitku as an option — just remove the silent fallback

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small logic fix in existing route
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T15-T18)
  - **Blocks**: T21 (web subscription view)
  - **Blocked By**: None

  **References**:
  - `src/routes/web.ts:565-599` — Payment create endpoint
  - `src/services/payment-settings.service.ts` — getEnabledGateways()

  **Acceptance Criteria**:
  - [ ] No silent duitku fallback when gateway array is empty
  - [ ] User sees "No payment methods available" message
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:

  ```
  Scenario: Empty gateway list shows error
    Tool: Bash (curl)
    Steps:
      1. Disable all payment gateways in admin
      2. Try to create payment via web app
      3. Assert 400 or 502 with "No payment methods available"
    Expected Result: Clear error message, no silent fallback
    Evidence: .sisyphus/evidence/task-19-no-gateway-fallback.txt
  ```

  **Commit**: YES (groups with T15-T18)
  - Message: `fix(payment): remove silent duitku fallback in web app`
  - Files: `src/routes/web.ts`

- [x] 20. Web app language switcher

  **What to do**:
  - Add language selector to web app header (same 4 languages as bot: id, en, ru, zh)
  - Store preference in localStorage
  - Apply to all text via i18n dict (reuse landing page's `switchLang()` pattern)
  - Add i18n dictionary to app.ejs with all UI strings in 4 languages

  **Must NOT do**:
  - Do NOT create a separate i18n library — use inline dict pattern from landing page
  - Do NOT change bot language handling

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend UI changes with i18n integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T21-T27)
  - **Blocks**: T21-T27 (all web views need i18n)
  - **Blocked By**: T6 (landing toggle fix)

  **References**:
  - `landing/` — Landing page switchLang() pattern
  - `src/i18n/translations.ts` — Bot translation strings to mirror
  - `src/views/web/app.ejs` — Web app template

  **Acceptance Criteria**:
  - [ ] Language selector in web app header
  - [ ] All 4 languages supported (id, en, ru, zh)
  - [ ] Preference persists in localStorage
  - [ ] All UI text translates

  **QA Scenarios**:

  ```
  Scenario: Language switcher changes all UI text
    Tool: Playwright
    Steps:
      1. Open web app
      2. Click language selector, choose "English"
      3. Assert all UI text changes to English
      4. Reload page, assert English persists
    Expected Result: All text translates, preference persists
    Evidence: .sisyphus/evidence/task-20-lang-switcher.png
  ```

  **Commit**: YES (groups with T21-T27)
  - Message: `feat(webapp): add 4-language switcher with localStorage persistence`
  - Files: `src/views/web/app.ejs`

- [x] 21. Web app subscription management view

  **What to do**:
  - Add Subscriptions view to web app: view current plan, available plans, buy/upgrade
  - Use existing `/api/subscriptions` and `/api/subscription/buy` endpoints
  - Show plan comparison table (Lite/Pro/Agency with credits, limits, pricing)
  - Show current subscription status with cancel button

  **Must NOT do**:
  - Do NOT create new subscription API endpoints (use existing ones)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New web app view with API integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20, T22-T27)
  - **Blocks**: T29 (web app integration tests)
  - **Blocked By**: T11 (admin subscription API), T19 (payment fix), T20 (language switcher)

  **References**:
  - `src/routes/web.ts:791-870` — Existing subscription API endpoints
  - `src/config/pricing.ts:38-66` — SUBSCRIPTION_PLANS definitions
  - `src/views/web/app.ejs` — Web app template

  **Acceptance Criteria**:
  - [ ] Subscriptions view renders plan comparison table
  - [ ] Current subscription status displayed
  - [ ] Buy/upgrade button works
  - [ ] Cancel subscription button works

  **QA Scenarios**:

  ```
  Scenario: User can view and buy subscription
    Tool: Playwright
    Steps:
      1. Open web app, navigate to Subscriptions
      2. Assert plan comparison table shows Lite/Pro/Agency
      3. Click "Buy Pro" → payment flow initiates
    Expected Result: Plan table visible, buy flow works
    Evidence: .sisyphus/evidence/task-21-subscriptions-view.png
  ```

  **Commit**: YES (groups with T20, T22-T27)
  - Message: `feat(webapp): add subscription management view`
  - Files: `src/views/web/app.ejs`

- [x] 22. Web app referral dashboard (3-tier)

  **What to do**:
  - Add Referrals view to web app: referral code, share link, 3-tier stats, commission balance
  - Use existing `/api/referral` and `/api/referral/withdraw` endpoints
  - Show 3-tier breakdown: Tier 1 (15%), Tier 2 (5%), Tier 3 (2%)
  - Show withdraw options: convert to credits OR sell to admin
  - Show referral link with copy button

  **Must NOT do**:
  - Do NOT create new referral API endpoints (use existing ones)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: New web app view with 3-tier data display
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20-T21, T23-T27)
  - **Blocks**: T28 (referral tests), T29 (web app integration tests)
  - **Blocked By**: T8 (3-tier referral), T20 (language switcher)

  **References**:
  - `src/routes/web.ts:676-788` — Existing referral API endpoints
  - `src/services/referral.service.ts` — 3-tier commission processing (after T8)
  - `src/handlers/callbacks/referral.ts` — Bot referral UI for reference

  **Acceptance Criteria**:
  - [ ] Referral dashboard shows 3-tier commission breakdown
  - [ ] Referral link with copy button
  - [ ] Withdraw options (convert to credits / sell to admin)
  - [ ] Commission balance displayed

  **QA Scenarios**:

  ```
  Scenario: Referral dashboard shows 3-tier stats
    Tool: Playwright
    Steps:
      1. Open web app, navigate to Referrals
      2. Assert referral code and share link displayed
      3. Assert 3-tier commission breakdown visible
      4. Assert withdraw options available
    Expected Result: Full referral dashboard with 3-tier data
    Evidence: .sisyphus/evidence/task-22-referral-dashboard.png
  ```

  **Commit**: YES (groups with T20-T21, T23-T27)
  - Message: `feat(webapp): add referral dashboard with 3-tier commission display`
  - Files: `src/views/web/app.ejs`

- [x] 23. Web app settings page

  **What to do**:
  - Add Settings view to web app: language preference, notification toggle, auto-renewal toggle
  - Use existing `/api/user` endpoint for reading settings
  - Add `PUT /api/user/settings` endpoint for updating settings
  - Sync with bot settings (language, notifications)

  **Must NOT do**:
  - Do NOT create new user model fields

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple settings form with existing data
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20-T22, T24-T27)
  - **Blocks**: T29 (web app integration tests)
  - **Blocked By**: T20 (language switcher)

  **References**:
  - `src/routes/web.ts:252-268` — Existing /api/user endpoint
  - `prisma/schema.prisma:37-40` — User settings fields (language, notificationsEnabled, autoRenewal)

  **Acceptance Criteria**:
  - [ ] Settings view renders with language, notifications, auto-renewal toggles
  - [ ] PUT /api/user/settings endpoint created
  - [ ] Changes persist and sync with bot

  **QA Scenarios**:

  ```
  Scenario: User can update settings
    Tool: Playwright
    Steps:
      1. Open web app, navigate to Settings
      2. Toggle notifications off, change language to English
      3. Assert settings saved successfully
      4. Reload page, assert settings persisted
    Expected Result: Settings update and persist
    Evidence: .sisyphus/evidence/task-23-settings-page.png
  ```

  **Commit**: YES (groups with T20-T22, T24-T27)
  - Message: `feat(webapp): add settings page with language, notifications, auto-renewal`
  - Files: `src/views/web/app.ejs`, `src/routes/web.ts`

- [x] 24. Web app profile page

  **What to do**:
  - Add Profile view to web app: credits balance, tier, referral code, total videos, total spent
  - Use existing `/api/user` endpoint
  - Show usage stats: videos generated this month, credits used, credits remaining
  - Show account creation date and last activity

  **Must NOT do**:
  - Do NOT create new stats endpoints — compute from existing data

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Read-only view using existing API
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20-T23, T25-T27)
  - **Blocks**: T29 (web app integration tests)
  - **Blocked By**: T20 (language switcher)

  **References**:
  - `src/routes/web.ts:252-268` — /api/user endpoint
  - `src/routes/web.ts:618-629` — /api/user/videos endpoint
  - `src/services/user.service.ts` — UserService.getStats()

  **Acceptance Criteria**:
  - [ ] Profile view shows credits, tier, referral code, stats
  - [ ] Usage stats computed from existing data
  - [ ] All data loads correctly

  **QA Scenarios**:

  ```
  Scenario: Profile page shows correct user data
    Tool: Playwright
    Steps:
      1. Open web app, navigate to Profile
      2. Assert credits balance, tier, referral code displayed
      3. Assert video count and usage stats correct
    Expected Result: All profile data accurate
    Evidence: .sisyphus/evidence/task-24-profile-page.png
  ```

  **Commit**: YES (groups with T20-T23, T25-T27)
  - Message: `feat(webapp): add profile page with credits, tier, and usage stats`
  - Files: `src/views/web/app.ejs`

- [x] 25. Web app image generation UI

  **What to do**:
  - Add Image Generation view to web app: category selector, reference image upload (optional), text prompt, generate button, result display
  - Use existing `/api/image/generate` endpoint
  - Show generation progress and result with download button
  - Support all image modes: text2img, img2img, IP-Adapter (avatar)

  **Must NOT do**:
  - Do NOT create new image generation endpoints

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI with image upload, preview, and result display
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20-T24, T26-T27)
  - **Blocks**: T29 (web app integration tests)
  - **Blocked By**: T20 (language switcher)

  **References**:
  - `src/routes/web.ts:439-501` — /api/image/generate endpoint
  - `src/services/image.service.ts` — Image generation service

  **Acceptance Criteria**:
  - [ ] Image generation view with category, prompt, reference image upload
  - [ ] Generation progress indicator
  - [ ] Result display with download button
  - [ ] All image modes supported

  **QA Scenarios**:

  ```
  Scenario: User can generate image via web app
    Tool: Playwright
    Steps:
      1. Open web app, navigate to Image Generation
      2. Select category "product", enter prompt, click Generate
      3. Assert progress indicator shows
      4. Assert image result displays with download button
    Expected Result: Image generated and displayed
    Evidence: .sisyphus/evidence/task-25-image-gen-ui.png
  ```

  **Commit**: YES (groups with T20-T24, T26-T27)
  - Message: `feat(webapp): add image generation UI with all modes`
  - Files: `src/views/web/app.ejs`

- [x] 26. Web app video delete button

  **What to do**:
  - Add delete button to each video card in web app video list
  - Use existing `DELETE /api/video/:jobId` endpoint
  - Show confirmation dialog before deletion
  - Remove video from list after successful deletion

  **Must NOT do**:
  - Do NOT create new delete endpoints

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small UI addition with existing API
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20-T25, T27)
  - **Blocks**: T29 (web app integration tests)
  - **Blocked By**: T20 (language switcher)

  **References**:
  - `src/routes/web.ts:633-649` — DELETE /api/video/:jobId endpoint

  **Acceptance Criteria**:
  - [ ] Delete button on each video card
  - [ ] Confirmation dialog before deletion
  - [ ] Video removed from list after deletion

  **QA Scenarios**:

  ```
  Scenario: User can delete video from web app
    Tool: Playwright
    Steps:
      1. Open web app, navigate to My Videos
      2. Click delete button on a video card
      3. Confirm deletion in dialog
      4. Assert video removed from list
    Expected Result: Video deleted and removed from list
    Evidence: .sisyphus/evidence/task-26-video-delete.png
  ```

  **Commit**: YES (groups with T20-T25, T27)
  - Message: `feat(webapp): add video delete button with confirmation`
  - Files: `src/views/web/app.ejs`

- [x] 27. Web app onboarding for new web users

  **What to do**:
  - After first web login, show onboarding overlay: niche picker → welcome bonus → referral code input
  - Store onboarding state in localStorage (skip if already completed)
  - Call `/api/user` to check if user has selectedNiche
  - If no niche selected, show overlay; otherwise skip
  - Welcome bonus: award credits for completing onboarding
  - Referral code input: validate and link to referrer

  **Must NOT do**:
  - Do NOT change bot onboarding flow
  - Do NOT require onboarding for returning bot users

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-step onboarding flow with API integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T20-T26)
  - **Blocks**: T29 (web app integration tests)
  - **Blocked By**: T9 (ban check), T20 (language switcher)

  **References**:
  - `src/handlers/callbacks/onboarding.ts` — Bot onboarding flow for reference
  - `src/routes/web.ts:154-225` — Auth endpoint
  - `src/routes/web.ts:252-268` — /api/user endpoint

  **Acceptance Criteria**:
  - [ ] Onboarding overlay shows for new web users without niche
  - [ ] Niche picker with 8 niches
  - [ ] Welcome bonus awarded after completion
  - [ ] Referral code input validates and links
  - [ ] Onboarding state persists (doesn't show again)

  **QA Scenarios**:

  ```
  Scenario: New web user sees onboarding
    Tool: Playwright
    Steps:
      1. Auth as new user (no niche selected)
      2. Assert onboarding overlay appears
      3. Select niche, enter referral code, complete
      4. Assert overlay dismissed, credits added
      5. Reload page, assert onboarding doesn't show again
    Expected Result: Onboarding completes, persists, doesn't repeat
    Evidence: .sisyphus/evidence/task-27-onboarding.png
  ```

  **Commit**: YES (groups with T20-T26)
  - Message: `feat(webapp): add onboarding flow for new web users`
  - Files: `src/views/web/app.ejs`

- [ ] 28. Referral 3-tier tests + QA

  **What to do**:
  - Extend `tests/unit/services/referral.service.test.ts` with 3-tier test cases
  - Test: 3-level chain commission calculation
  - Test: Ineligible 3rd-tier referrer
  - Test: Chain with missing links (only 2 levels)
  - Test: Self-referral prevention
  - Run full test suite to verify no regressions

  **Must NOT do**:
  - Do NOT modify existing 2-tier tests — only add new ones

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Comprehensive test coverage for critical business logic
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T29-T31)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: T8 (3-tier referral), T22 (referral dashboard)

  **References**:
  - `tests/unit/services/referral.service.test.ts` — Existing referral tests
  - `src/services/referral.service.ts` — Updated 3-tier implementation

  **Acceptance Criteria**:
  - [ ] All existing referral tests pass
  - [ ] New 3-tier tests pass
  - [ ] `npm test` passes with 0 failures
  - [ ] Coverage for referral.service.ts >= 90%

  **QA Scenarios**:

  ```
  Scenario: Full test suite passes
    Tool: Bash (Jest)
    Steps:
      1. Run: npm test -- --testPathPattern=referral
      2. Assert all tests pass
      3. Run: npm test (full suite)
      4. Assert 0 failures
    Expected Result: All referral tests pass, no regressions
    Evidence: .sisyphus/evidence/task-28-referral-tests.txt
  ```

  **Commit**: YES (groups with T29-T31)
  - Message: `test(referral): add 3-tier commission test coverage`
  - Files: `tests/unit/services/referral.service.test.ts`

- [ ] 29. Web app integration tests + QA

  **What to do**:
  - Create Playwright E2E tests for all new web app views
  - Test: language switcher, subscription management, referral dashboard, settings, profile, image generation, video delete, onboarding
  - Test: ban check blocks banned users
  - Test: receipt download
  - Test: payment flow

  **Must NOT do**:
  - Do NOT test external payment gateways (mock them)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Comprehensive E2E testing across multiple views
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T28, T30-T31)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: T20-T27 (all web views)

  **References**:
  - `playwright.config.ts` — Playwright configuration
  - `tests/e2e/` — Existing E2E test patterns

  **Acceptance Criteria**:
  - [ ] Playwright tests cover all new web app views
  - [ ] All tests pass
  - [ ] Evidence screenshots captured

  **QA Scenarios**:

  ```
  Scenario: Full web app E2E sweep
    Tool: Playwright
    Steps:
      1. Run: npx playwright test tests/e2e/webapp/
      2. Assert all tests pass
      3. Verify evidence screenshots exist in .sisyphus/evidence/
    Expected Result: All E2E tests pass with evidence
    Evidence: .sisyphus/evidence/task-29-webapp-e2e/
  ```

  **Commit**: YES (groups with T28, T30-T31)
  - Message: `test(webapp): add E2E tests for all new web app views`
  - Files: `tests/e2e/webapp/*.spec.ts`

- [ ] 30. Video pipeline tests + QA

  **What to do**:
  - Add tests for ProviderRouter integration in video generation
  - Add tests for quality check integration
  - Add tests for post-processing integration
  - Test: provider fallback chain works correctly
  - Test: quality check triggers fallback on low score
  - Test: post-processing applies niche-specific transitions

  **Must NOT do**:
  - Do NOT test external AI providers (mock them)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex pipeline testing with multiple integrations
  - **Skills**: [`test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T28-T29, T31)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: T15-T17 (video pipeline improvements)

  **References**:
  - `tests/unit/services/video-generation.service.test.ts` — Existing video tests
  - `src/services/video-generation.service.ts` — Updated pipeline

  **Acceptance Criteria**:
  - [ ] ProviderRouter integration tested
  - [ ] Quality check integration tested
  - [ ] Post-processing integration tested
  - [ ] `npm test` passes with 0 failures

  **QA Scenarios**:

  ```
  Scenario: Video pipeline tests pass
    Tool: Bash (Jest)
    Steps:
      1. Run: npm test -- --testPathPattern=video-generation
      2. Assert all tests pass
    Expected Result: All video pipeline tests pass
    Evidence: .sisyphus/evidence/task-30-video-tests.txt
  ```

  **Commit**: YES (groups with T28-T29, T31)
  - Message: `test(video): add tests for ProviderRouter, quality check, post-processing`
  - Files: `tests/unit/services/video-generation.service.test.ts`

- [ ] 31. Full E2E sweep + evidence capture

  **What to do**:
  - Run complete E2E test suite: `npm test && npm run test:e2e`
  - Run Playwright E2E tests for all surfaces (bot, web, admin)
  - Capture evidence for all critical paths: registration, payment, video generation, referral, subscription
  - Verify all evidence files exist in `.sisyphus/evidence/`

  **Must NOT do**:
  - Do NOT skip any test suite

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Full verification sweep across all surfaces
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T28-T30)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: T28-T30 (all tests)

  **References**:
  - `jest.e2e.config.js` — E2E Jest config
  - `playwright.config.ts` — Playwright config

  **Acceptance Criteria**:
  - [ ] `npm test` passes (all unit tests)
  - [ ] `npm run test:e2e` passes (all E2E tests)
  - [ ] `npm run typecheck` passes (0 errors)
  - [ ] All evidence files captured

  **QA Scenarios**:

  ```
  Scenario: Full test suite passes
    Tool: Bash
    Steps:
      1. Run: npm run typecheck
      2. Run: npm test
      3. Run: npm run test:e2e
      4. Run: npx playwright test
      5. Assert all pass with 0 failures
    Expected Result: All tests pass, typecheck clean
    Evidence: .sisyphus/evidence/task-31-full-sweep.txt
  ```

  **Commit**: YES (groups with T28-T30)
  - Message: `chore: full E2E sweep and evidence capture`
  - Files: N/A (verification only)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `tsc --noEmit` + linter + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
      Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 (T1-T7)**: `feat(config,legal,landing,pwa): add 3-tier config, legal pages, landing fixes, PWA manifest`
  - Files: `src/config/packages.ts`, `src/types/index.ts`, `src/middleware/rateLimit.ts`, `src/routes/web.ts`, `src/views/web/tos.ejs`, `src/views/web/privacy.ejs`, `public/manifest.json`, `src/views/web/app.ejs`, `landing/`
  - Pre-commit: `npm run typecheck`

- **Wave 2 (T8-T14)**: `feat(referral,security,admin,account): 3-tier referral, ban check, account deletion, admin APIs`
  - Files: `src/services/referral.service.ts`, `src/routes/web.ts`, `src/routes/admin.ts`, `src/commands/delete-account.ts`, `src/services/user.service.ts`, `src/commands/start.ts`, `src/services/token-tracker.service.ts`, `tests/unit/services/referral.service.test.ts`
  - Pre-commit: `npm test -- --testPathPattern=referral`

- **Wave 3 (T15-T19)**: `feat(video,billing,payment): ProviderRouter integration, quality check, post-processing, billing receipts`
  - Files: `src/services/video-generation.service.ts`, `src/routes/web.ts`, `src/views/web/receipt.ejs`
  - Pre-commit: `npm run typecheck`

- **Wave 4 (T20-T27)**: `feat(webapp): language switcher, subscriptions, referrals, settings, profile, image gen, onboarding`
  - Files: `src/views/web/app.ejs`, `src/routes/web.ts`
  - Pre-commit: `npm run typecheck`

- **Wave 5 (T28-T31)**: `test: comprehensive test coverage for referral, web app, video pipeline`
  - Files: `tests/unit/services/referral.service.test.ts`, `tests/unit/services/video-generation.service.test.ts`, `tests/e2e/webapp/*.spec.ts`
  - Pre-commit: `npm test && npm run test:e2e`

---

## Success Criteria

### Verification Commands

```bash
npm run typecheck  # Expected: 0 errors
npm test           # Expected: all suites pass (53+)
npm run test:e2e   # Expected: all E2E tests pass
curl http://localhost:3000/terms        # Expected: 200 with TOS content
curl http://localhost:3000/privacy      # Expected: 200 with Privacy Policy content
curl http://localhost:3000/manifest.json # Expected: valid PWA manifest JSON
```

### Final Checklist

- [ ] All "Must Have" present (3-tier referral, ban check, 4-language web, legal pages, account deletion)
- [ ] All "Must NOT Have" absent (no new DB migrations for referral, no PDF library, no service worker)
- [ ] All tests pass (unit + E2E + typecheck)
- [ ] Evidence files captured for all QA scenarios
- [ ] Landing page: no misleading claims, single language toggle, web app CTA
- [ ] Web app: all views functional, language switch works, onboarding completes
- [ ] Admin: subscription management, queue management, welcome message override
- [ ] Video pipeline: ProviderRouter integrated, quality check active, post-processing wired
- [ ] Security: rate limiting on sensitive endpoints, ban check on web app
