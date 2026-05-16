# OpenClaw SaaS Bot — Gap Analysis & Implementation Plan
> Generated: 2026-04-01 | Goal: Micro SaaS serving beginners (zero tech knowledge) to advanced users

---

## WEEK 1 — Security & Data Integrity

### 1.1 [CRITICAL] Gate payment simulation handler
- **File:** `src/handlers/callbacks/payment.ts`
- **Issue:** `simulate_success_*` handler has no `NODE_ENV` gate — anyone can fake payments in production
- **Fix:** Add `if (process.env.NODE_ENV === 'production') return false;` or remove entirely
- **Segment:** All

### 1.2 [CRITICAL] Fix onboarding user creation race condition
- **File:** `src/handlers/callbacks/onboarding.ts` (lines 130-155, 361-393)
- **Issue:** Language handler creates user without niche/free-trial fields; niche handler skips init because user already exists. Result: `selectedNiche`, `welcomeBonusUsed`, `dailyFreeUsed` never initialized
- **Fix:** Make niche handler always update regardless of user existence, or merge creation logic
- **Segment:** All new users

### 1.3 [CRITICAL] Remove/implement COMEBACK50 promo code
- **File:** `src/workers/retention.worker.ts` (line 63)
- **Issue:** Retention messages promise 50% discount code that has zero redemption logic
- **Fix:** Either implement promo code redemption or remove from retention templates
- **Segment:** Churned users

### 1.4 [CRITICAL] Delete or consolidate packages.ts
- **Files:** `src/config/packages.ts` vs `src/config/pricing.ts`
- **Issue:** Starter = IDR 49K/6cr in packages.ts vs IDR 99K/5+1cr in pricing.ts — two sources of truth
- **Fix:** Delete `packages.ts` or make it re-export from `pricing.ts`. Add startup validation
- **Segment:** All

### 1.5 [CRITICAL] Fix subscription placeholder PII
- **File:** `src/commands/subscription.ts` (line 150-151)
- **Issue:** `email: 'customer@email.com'` and `phoneNumber: '08123456789'` sent to Duitku for ALL subscription purchases
- **Fix:** Collect real contact info during onboarding or use Telegram-provided user info
- **Segment:** All subscribers

### 1.6 [CRITICAL] Localize video completion notification
- **File:** `src/workers/video-generation.worker.ts` (line 1038-1056)
- **Issue:** The most-seen message ("Video Selesai!", button labels) is hardcoded Indonesian/English, bypasses i18n
- **Fix:** Look up user language from DB, use `t()` for all text and button labels
- **Segment:** All non-Indonesian users

---

## WEEK 2 — Beginner Conversion Funnel

### 2.1 [HIGH] Add free video trial with watermark
- **File:** `src/config/free-trial.ts`, `src/flows/generate.ts`
- **Issue:** Welcome bonus = 1 watermarked image only. Users never experience the core product (video) before paying
- **Fix:** Grant 1 free short (15s) watermarked video generation. Cost ~$0.02/user
- **Segment:** Beginners

### 2.2 [HIGH] Pre-creation credit check
- **File:** `src/flows/generate.ts` (before multi-step flow begins)
- **Issue:** Zero-credit users can go through 5+ creation steps before being told "insufficient credits"
- **Fix:** Check balance at flow entry. If 0, show friendly "top up first" with direct link
- **Segment:** All

### 2.3 [HIGH] Dynamic credit costs in inline buttons
- **Files:** `src/flows/generate.ts` (lines 609-616, 830-834, 1041-1044)
- **Issue:** All buttons show STATIC costs from `UNIT_COSTS` constant. Resolution multiplier (HD=2x, Ultra=4x) only revealed at final confirmation. Admin-overridden pricing via DB (`getUnitCostAsync()`) is never used in buttons.
- **Fix:**
  - **Action selection buttons:** Use `getUnitCostAsync()` instead of static `UNIT_COSTS`
  - **Resolution picker:** Show cost at each tier: `Standard (1.5 cr) / HD (3.0 cr) / Ultra (6.0 cr)` computed from current action's base cost
  - **Preset/duration buttons:** Use `getUnitCostAsync()` and apply resolution multiplier if already selected
  - **Aspect ratio picker:** Show running total or balance reminder
  - **Mode selection:** Show cost range per mode
  - **Every creation step message:** Include `(Balance: X.X cr)` in message text
- **Segment:** All

### 2.4 [HIGH] Plain-language pricing command
- **Issue:** Credits/Units math never translated to human terms. Users can't answer "how much does a video cost?"
- **Fix:** Add `/pricing` command or section in `/help`: "15s video = 0.8 credits, Starter pack (~7 short videos) = IDR 99K"
- **Segment:** Beginners

### 2.5 [HIGH] Step progress indicator in creation flow
- **File:** `src/flows/generate.ts` (all `show*()` functions)
- **Issue:** 4-11 step flow with no "Step 2/6" — users can't gauge progress
- **Fix:** Add step counter to each message, computed from mode (Basic=4 steps, Smart=6, Pro=11)
- **Segment:** Beginners

### 2.6 [HIGH] First-video post-creation guidance
- **File:** `src/workers/video-generation.worker.ts`
- **Issue:** Same generic completion message for video #1 and #100
- **Fix:** Detect `videoCount === 1`, send additional tips: save prompts, try different niches, share referral
- **Segment:** Beginners

---

## WEEK 3 — i18n Sweep

### 3.1 [HIGH] Localize V3 create flow strings
- **File:** `src/flows/generate.ts`
- **Issue:** `showGenerateAction()`, `showGenerateMode()`, scene review, platform selection, photo fallback all use hardcoded Indonesian/English strings instead of `t()`
- **Fix:** Replace all hardcoded strings with `t()` calls. Key areas: lines 573-577, 607-616, 802-810, 1067, 1106
- **Segment:** Non-Indonesian users

### 3.2 [HIGH] Localize video list + support buttons
- **Files:** `src/commands/videos.ts` (lines 42-72), `src/commands/support.ts` (lines 24-26)
- **Issue:** Hardcoded English strings: "No videos yet", "Found X video(s)", "Chat Support", "View Tutorial"
- **Fix:** Replace with `t()` calls
- **Segment:** Non-English users

### 3.3 [MEDIUM] Fix scene prompt language
- **File:** `src/flows/generate.ts` (line 1096)
- **Issue:** `generateVideoScenePrompts()` called with hardcoded `'id'` locale — all prompts generated in Indonesian regardless of user language
- **Fix:** Pass user's language setting
- **Segment:** Non-Indonesian users

### 3.4 [MEDIUM] Change i18n fallback chain
- **Issue:** Current: `user_lang -> id`. Should be: `user_lang -> en -> id`. A Japanese user seeing Indonesian fallback is worse than English
- **Segment:** 20 of 24 supported languages

### 3.5 [MEDIUM] Localize prompt library niche buttons
- **File:** `src/handlers/callbacks/promptLibrary.ts` (lines 199-219)
- **Issue:** Niche grid buttons ("F&B", "Fashion", "Tech") hardcoded English
- **Segment:** Non-English users

### 3.6 [LOW] Fix date locale hardcoding
- **File:** `src/commands/videos.ts` (line 128-136)
- **Issue:** `toLocaleDateString('id-ID')` regardless of user language
- **Segment:** International users

---

## WEEK 4 — Payment & Advanced UX

### 4.1 [HIGH] Extend idempotency lock from 30s to 300s
- **File:** `src/flows/generate.ts` (line 154)
- **Issue:** Slow providers can exceed 30s lock TTL, allowing double-tap double-charge
- **Fix:** Change lock TTL to 300s or tie to job completion
- **Segment:** All

### 4.2 [HIGH] Fix extra credit gateway hardcoding
- **File:** `src/commands/topup.ts` (line 385)
- **Issue:** `handleTopupExtraCredit` always uses Duitku regardless of enabled gateways
- **Fix:** Use `PaymentSettingsService.getEnabledGateways()` like main topup flow
- **Segment:** All

### 4.3 [HIGH] Explain referral commission mechanics
- **File:** `src/commands/referral.ts`
- **Issue:** No commission %, no tier explanation, 50% admin cashout rate never explained
- **Fix:** Add "How it works" button explaining percentage, tiers, pending vs available, cashout options
- **Segment:** Referral users

### 4.4 [MEDIUM] Route subscriptions through gateway selection
- **File:** `src/commands/subscription.ts`
- **Issue:** Subscription purchase hardcoded to Duitku with payment method `'VC'`, bypassing multi-gateway flow
- **Fix:** Use same gateway selection as topup
- **Segment:** All subscribers

### 4.5 [MEDIUM] Restore VO/Subtitle toggle in V3
- **File:** `src/flows/generate.ts` (lines 303-304)
- **Issue:** V3 hardcodes `enableVO: true, enableSubtitles: true`, removing control V2 offered
- **Fix:** Add toggle step for Smart/Pro modes
- **Segment:** Advanced users

### 4.6 [MEDIUM] Add video pagination and filtering
- **File:** `src/commands/videos.ts`
- **Issue:** Hardcoded limit of 10 videos, no search/filter/pagination
- **Fix:** Add page navigation buttons, filter by status/niche
- **Segment:** Power users

### 4.7 [MEDIUM] Add contextual help buttons during creation flows
- **File:** `src/flows/generate.ts` (all `show*()` functions)
- **Issue:** No in-flow help — beginners must abort and use monolithic `/help`
- **Fix:** Add "Need help?" button at each step that shows step-specific tip and returns to same step
- **Segment:** Beginners

---

## WEEK 5 — Polish & Trust

### 5.1 [MEDIUM] Remove or hide "Coming Soon" buttons
- **Files:** `src/handlers/callbacks/settings.ts` (lines 50-63), social media publish
- **Issue:** 3 of 6 account menu items + social publish lead to dead ends, eroding trust
- **Fix:** Hide buttons until features are ready, or show a roadmap ETA

### 5.2 [MEDIUM] Add video expiry warnings
- **Issue:** 30-day deletion with zero advance notice
- **Fix:** Notify at 7, 3, and 1 day before expiry via retention worker

### 5.3 [MEDIUM] Implement bug report forwarding
- **File:** `src/handlers/callbacks/promptLibrary.ts` (line 379)
- **Issue:** Bug report shows instructions but text goes nowhere
- **Fix:** Forward bug report text to admin Telegram IDs (mechanism exists for cashout)

### 5.4 [MEDIUM] Fix credit race condition
- **File:** `src/flows/generate.ts` (lines 185-287)
- **Issue:** Credits deducted BEFORE BullMQ job enqueue. Redis drop between deduction and enqueue = lost credits with no refund trigger
- **Fix:** Deduct after successful job enqueue, or wrap in transaction with rollback

### 5.5 [MEDIUM] Add credit rollover policy for subscribers
- **Issue:** Unused subscription credits silently vanish at period end, never communicated
- **Fix:** Document policy, show warning 3 days before period end

### 5.6 [MEDIUM] Unify custom duration validation
- **Files:** `src/handlers/message.ts` (6-3600), `src/commands/create.ts` (6-300)
- **Issue:** Two code paths with different limits for same feature
- **Fix:** Unify to one range

### 5.7 [LOW] Add "Repeat Last" quick-create
- **Issue:** Returning users must navigate full flow even for identical re-creation
- **Fix:** Store last creation config, offer one-tap button on dashboard

### 5.8 [LOW] Fix formatPrice() duplication
- **Files:** `src/commands/topup.ts`, `src/commands/subscription.ts`
- **Issue:** Two independent implementations with inconsistent formatting
- **Fix:** Extract to shared utility in `src/utils/`

### 5.9 [LOW] Pro mode scene review truncation
- **File:** `src/flows/generate.ts` (line 1103)
- **Issue:** Truncates prompts to 60 chars — review screen functionally useless
- **Fix:** Show full text or expandable format

### 5.10 [LOW] Language change session propagation
- **File:** `src/handlers/callbacks/settings.ts` (line 197)
- **Issue:** DB updated but `ctx.session.userLang` not updated in same interaction
- **Fix:** Add `ctx.session.userLang = langCode;` after DB update

---

## Summary

| Week | Focus | Items | Critical | High | Medium | Low |
|------|-------|-------|----------|------|--------|-----|
| 1 | Security & Data Integrity | 6 | 6 | 0 | 0 | 0 |
| 2 | Beginner Conversion Funnel | 6 | 0 | 6 | 0 | 0 |
| 3 | i18n Sweep | 6 | 0 | 2 | 3 | 1 |
| 4 | Payment & Advanced UX | 7 | 0 | 3 | 4 | 0 |
| 5 | Polish & Trust | 10 | 0 | 0 | 6 | 4 |
| **Total** | | **35** | **6** | **11** | **13** | **5** |
