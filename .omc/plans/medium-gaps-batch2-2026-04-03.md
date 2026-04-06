# Medium-Priority Gaps Batch 2 — Implementation Plan

**Date:** 2026-04-03
**Status:** REVISED — Architect amendments applied, ready for Critic evaluation
**Complexity:** MEDIUM (6 isolated fixes across 7 files)

---

## RALPLAN-DR Summary

### Principles
1. **Minimal scope** — Each fix is isolated; no cross-gap refactors
2. **Existing patterns** — Follow conventions already in the codebase (e.g., offset/limit pagination pattern from admin users endpoint)
3. **Config-driven values** — Replace hardcoded strings with env vars / template locals already available (BOT_USERNAME, WEBHOOK_URL/WEB_APP_URL)
4. **No breaking changes** — All API changes are additive (new optional query params)
5. **Reuse over duplication** — Extend existing endpoints rather than creating new ones (Architect mandate)

### Decision Drivers
1. **Impact/effort ratio** — Prioritize quick wins that affect real users over cosmetic fixes
2. **Independence** — Each fix can be developed, tested, and deployed independently
3. **Risk minimization** — Avoid touching i18n system (M4 excluded per instructions) or complex state flows

### Viable Options

**Option A (CHOSEN): Fix 6 gaps in a single batch, skip M4 (i18n)**
- Pros: High impact, all fixes are small and isolated, no architectural risk
- Cons: Slightly large batch, but each fix is independent

**Option B: Fix only the 3 highest-impact gaps (M1, M2, M5)**
- Pros: Smaller scope, faster delivery
- Cons: Leaves stub features (H3, H2) wasting UI real estate, leaves L1/L5 lingering
- Invalidation: Not chosen because H3/H2/L5 are trivial effort and high visibility

---

## Scope

| Gap  | Summary                                    | Files                                               | Effort |
|------|--------------------------------------------|------------------------------------------------------|--------|
| M1   | User videos API: no pagination             | `src/routes/web.ts`, `src/views/web/app.ejs`         | Small  |
| M2   | Admin transactions API: no offset/pagination | `src/routes/admin.ts`, `src/views/admin/analytics.ejs` | Small  |
| M5   | Landing OG/meta hardcoded URL              | `src/views/web/landing.ejs`, `src/routes/web.ts`     | Tiny   |
| L5   | Landing hardcoded bot username in JS i18n  | `src/views/web/landing.ejs`                           | Tiny   |
| H3   | Fingerprint menu = "coming soon" stub      | `src/commands/prompts.ts`                             | Small  |
| H2   | Edit Profile button = stub toast           | `src/views/web/app.ejs`, `src/routes/web.ts`         | Small  |

**Excluded:** M4 (i18n refactor — large separate project), L1 (robots.txt/sitemap — needs SEO strategy discussion)

---

## Task Flow (Execution Order)

### Task 1: M1 — Add cursor-based pagination to user videos API + UI

**Context:** `GET /api/user/videos` (`src/routes/web.ts:924`) returns all videos with `take: 30` hardcoded, no pagination. `loadVideos()` in `src/views/web/app.ejs` (line 788) fetches once and renders all.

**IMPORTANT:** Use `jobId` (String, `@unique`) as the cursor key, NOT the numeric BigInt `id`. The `jobId` field is defined at `prisma/schema.prisma:164` as `String @unique @map("job_id") @db.VarChar(64)`. This avoids BigInt JSON serialization errors that would occur with the `id` field (`BigInt @id @default(autoincrement())` at schema line 162).

**Changes needed:**

**File: `src/routes/web.ts` (lines 924-937)**
- Add optional query params: `?limit=20&cursor={jobId}`
- Parse `limit` (default 20, max 50) and `cursor` (optional jobId string for keyset pagination)
- Use Prisma cursor-based pagination:
  ```typescript
  const limit = Math.min(Math.max(1, parseInt(query.limit || '20') || 20), 50);
  const cursor = query.cursor as string | undefined;
  const videos = await prisma.video.findMany({
    where: { userId: user.telegramId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { jobId: cursor }, skip: 1 } : {}),
  });
  const hasMore = videos.length > limit;
  if (hasMore) videos.pop();
  return {
    videos,
    nextCursor: hasMore ? videos[videos.length - 1].jobId : null,
  };
  ```
- Backward compat: response shape changes from bare array to `{ videos, nextCursor }` -- update the frontend consumer in the same task

**File: `src/views/web/app.ejs` (lines 788-804)**
- Update `loadVideos()` to accept optional `cursor` param and pass `?cursor=X&limit=20` to the API
- Store `nextCursor` from response in a module-level variable
- Destructure `{ videos, nextCursor }` from the response (not bare array)
- Update `loadVideosList()` to append (not replace) when loading more
- Add "Load More" button below video list, visible only when `nextCursor` is non-null
- Style the button consistently with existing `.btn.btn-outline` class

**File: `src/views/web/app.ejs` (line 538 — `loadDashboard()` caller)**
- The dashboard stats fetch also calls `/api/user/videos` and reads `.length` on the bare array. Update to destructure the new response shape and pass a `limit` param:
  ```javascript
  // Before (broken by response shape change):
  const videos = await apiFetch('/api/user/videos');
  document.getElementById('stat-videos').textContent = videos.length;

  // After:
  const { videos } = await apiFetch('/api/user/videos?limit=4');
  document.getElementById('stat-videos').textContent = videos.length;
  ```

**File: `src/views/web/app.ejs` (line 766 — `startPolling()` caller)**
- The polling interval also calls `/api/user/videos` and passes the bare array to `loadVideosList()`. Update to destructure:
  ```javascript
  // Before (broken by response shape change):
  const videos = await apiFetch('/api/user/videos');
  loadVideosList(videos);
  const processing = videos.filter(...);

  // After:
  const { videos } = await apiFetch('/api/user/videos');
  loadVideosList(videos);
  const processing = videos.filter(...);
  ```

**Acceptance criteria:**
- [ ] First load shows up to 20 videos
- [ ] "Load More" button appears when more videos exist
- [ ] Clicking "Load More" appends next page; button disappears when no more pages
- [ ] Polling for processing videos still works (existing `startPolling()` unaffected)
- [ ] No regressions when user has 0 videos (empty state still shows)
- [ ] No BigInt serialization errors in the JSON response

---

### Task 2: M2 — Add offset pagination to admin transactions API + UI

**Context:** `GET /api/transactions` (`src/routes/admin.ts:476`) accepts `status` and `limit` but no `offset`. `loadTransactions()` in `src/views/admin/analytics.ejs` (line 1273) fetches 50 with no "load more".

**CRITICAL:** The frontend at `analytics.ejs:1281` currently consumes the API response as a bare array:
```javascript
// Line 1279: const txs = await api('/api/transactions?' + params);
// Line 1281: if (!txs.length) { ... }
// Line 1284: txs.map(t => `<tr>...`)
```
The response shape is changing from `[...]` to `{ transactions, total, offset, limit }`. The frontend MUST be updated to destructure `{ transactions, total, offset, limit }` from the new response, replacing all `txs.length` and `txs.map(...)` references with `transactions.length` and `transactions.map(...)`.

**Changes needed:**

**File: `src/routes/admin.ts` (lines 476-499)**
- Add `offset` query param: `const offset = Math.max(0, parseInt(query.offset || '0') || 0);`
- Add `skip: offset` to `prisma.transaction.findMany()`
- Also add `total` count: `const total = await prisma.transaction.count({ where });`
- Return `{ transactions: [...], total, offset, limit }` instead of bare array

**File: `src/views/admin/analytics.ejs` (lines 1273-1295)**
- Destructure API response: change from `const txs = await api(...)` to:
  ```javascript
  const resp = await api('/api/transactions?' + params);
  if (!resp) return;
  const { transactions: txs, total, offset, limit } = resp;
  ```
- Track `currentTxOffset` variable (default 0)
- When `setTxFilter()` is called, reset offset to 0
- After rendering table, add pagination controls: "Previous | Page X of Y | Next"
- "Next" calls `loadTransactions()` with `offset + limit`; "Previous" with `offset - limit`
- Match existing admin UI styling (the Users section at line 281 already has a "Load More" pattern)

**Acceptance criteria:**
- [ ] Transactions load with default limit 50, offset 0
- [ ] Pagination controls appear showing page number and total pages
- [ ] Next/Previous navigate correctly; Previous disabled on page 1
- [ ] Changing status filter resets to page 1
- [ ] Frontend correctly destructures `{ transactions }` from the new response shape (not bare array)

---

### Task 3: M5 + L5 — Fix hardcoded URLs and bot username in landing.ejs

**Context:** OG meta tags (landing.ejs:13,19) hardcode `https://saas.aitradepulse.com`. The JS i18n string `solution3_desc` (line 1853) hardcodes `@berkahkarya_saas_bot`. The EJS template already receives `botUsername` as a local var, and `WEBHOOK_URL`/`WEB_APP_URL` are available in config.

**Changes needed:**

**File: `src/routes/web.ts` (line 89-98)**
- Add `siteUrl` to the template locals: `siteUrl: getConfig().WEB_APP_URL || getConfig().WEBHOOK_URL || 'https://saas.aitradepulse.com'`

**File: `src/views/web/landing.ejs`**
- Line 13: Change `content="https://saas.aitradepulse.com"` to `content="<%= siteUrl %>"`
- Line 19: Change `href="https://saas.aitradepulse.com"` to `href="<%= siteUrl %>"`
- Line 1853: Change `Chat bot @berkahkarya_saas_bot` to `Chat bot @<%= botUsername %>`
  - NOTE: This is inside a JS object literal in a `<script>` tag. The EJS `<%= %>` will be evaluated server-side before the JS runs, so this is safe. The `botUsername` is already passed as a template local (web.ts:94).
- Lines 1916, 1979, 2042 (en/ru/zh translations): Same pattern — replace any hardcoded `@berkahkarya_saas_bot` with `@<%= botUsername %>`. Check these lines: the en/ru/zh `solution3_desc` strings at lines 1916/1979/2042 do NOT contain the hardcoded username (they say "Chat the bot" etc.), so only line 1853 (Indonesian) needs fixing.

**Acceptance criteria:**
- [ ] `og:url` meta tag renders the configured WEB_APP_URL, not hardcoded domain
- [ ] `canonical` link renders the configured URL
- [ ] Indonesian `solution3_desc` renders actual bot username from config
- [ ] Page loads without EJS rendering errors
- [ ] Other language strings unaffected

---

### Task 4: H3 — Replace fingerprint "coming soon" stub with useful content

**Context:** `fingerprintCommand()` in `src/commands/prompts.ts` (lines 1036-1045) just sends a "coming soon" i18n message with a single "Main Menu" button. The fingerprint button occupies prime keyboard real estate (row 3 of main menu).

**Changes needed:**

**File: `src/commands/prompts.ts` (lines 1036-1045)**
- Replace the stub with a meaningful feature preview plus a CTA funnel to the prompt library:
  - Show an informational message about the upcoming Fingerprint feature (brand voice analysis) with a teaser
  - Add a "Try Prompt Library" CTA button that redirects to the existing prompt library
  - Keep the "Main Menu" button
- The correct `callback_data` for the prompt library is **`"prompts_menu"`** (handled at `src/handlers/callbacks/navigation.ts:172`, which calls `promptsCommand(ctx)`). Do NOT use `prompts_start` -- that string does not exist in the codebase.
- Updated inline keyboard:
  ```typescript
  inline_keyboard: [
    [{ text: t("fingerprint.try_library", lang), callback_data: "prompts_menu" }],
    [{ text: t("btn.main_menu", lang), callback_data: "main_menu" }],
  ],
  ```
- Add i18n keys to translations: `fingerprint.preview_title`, `fingerprint.preview_desc`, `fingerprint.try_library` for all 4 languages (id, en, ru, zh)

**Acceptance criteria:**
- [ ] Tapping "Fingerprint" in main menu shows informative preview message, not just "coming soon"
- [ ] "Try Prompt Library" button works and opens the prompt library flow (callback_data: `"prompts_menu"`)
- [ ] "Main Menu" button still works
- [ ] All 4 languages have translation strings (id, en, ru, zh)

---

### Task 5: H2 — Replace Edit Profile stub with functional profile editing (via existing PATCH endpoint)

**Context:** The "Edit Profil" button in `src/views/web/app.ejs` (line 348) shows a toast `'Fitur edit profil segera hadir!'`. The web app already has `PATCH /api/user/settings` at `src/routes/web.ts:384` which handles `language` and `notificationsEnabled`.

**ARCHITECT MANDATE:** Do NOT create a new `PUT /api/user/profile` endpoint. Instead, extend the existing `PATCH /api/user/settings` to also accept a `firstName` field, and fix the broken `changeLang()` function.

**Changes needed:**

**File: `src/routes/web.ts` (lines 384-404) -- Extend `PATCH /api/user/settings`**
- Add `firstName` to the destructured body:
  ```typescript
  const { language, notificationsEnabled, firstName } = request.body as {
    language?: string;
    notificationsEnabled?: boolean;
    firstName?: string;
  };
  ```
- Add validation for `firstName`:
  ```typescript
  if (firstName !== undefined) {
    if (typeof firstName !== 'string' || firstName.trim().length === 0 || firstName.length > 64)
      return reply.status(400).send({ error: 'Invalid name (1-64 chars)' });
    data.firstName = firstName.trim();
  }
  ```
- Insert this block between the existing `language` and `notificationsEnabled` handlers (after line 397, before line 398)

**File: `src/views/web/app.ejs` (line 348 area) -- Replace stub with inline edit form**
- Replace the stub button's `onclick` with a function that toggles an inline edit form
- The edit form should allow editing: display name (`firstName`) and language preference
- On save, call `PATCH /api/user/settings` with `{ firstName, language }` (the same endpoint that already handles settings)
- Form fields: text input for display name, select dropdown for language (reuse the language options from settings section at line 358)

**File: `src/views/web/app.ejs` (lines 1037-1039) -- Fix broken `changeLang()` function**
- Current broken implementation only writes to localStorage, never calls the API:
  ```javascript
  // BROKEN (current):
  function changeLang(lang) {
    localStorage.setItem('lang', lang);
  }
  ```
- Fix to call `PATCH /api/user/settings`:
  ```javascript
  async function changeLang(lang) {
    localStorage.setItem('lang', lang);
    try {
      await apiFetch('/api/user/settings', {
        method: 'PATCH',
        body: JSON.stringify({ language: lang }),
      });
    } catch (e) {
      console.error('Failed to save language:', e);
    }
  }
  ```
- This fixes the latent bug where language changes were never persisted to the database

**Acceptance criteria:**
- [ ] "Edit Profil" button reveals inline edit form (no page navigation)
- [ ] User can update display name and language via `PATCH /api/user/settings`
- [ ] Save button calls the existing settings API and shows success toast
- [ ] Cancel button hides form without changes
- [ ] Invalid input (empty name, invalid language) shows error from API
- [ ] Profile info refreshes after successful save
- [ ] `changeLang()` now persists language to the database via the API (not just localStorage)
- [ ] No new API endpoint created -- reuses `PATCH /api/user/settings`

---

## Guardrails

### Must Have
- All API changes are backward-compatible (new optional params only)
- No changes to database schema (all fields already exist)
- Each fix independently deployable
- Existing tests continue to pass
- M1 uses `jobId` (String) as cursor key, never BigInt `id`
- H2 extends existing `PATCH /api/user/settings`, no new endpoint
- H3 uses `callback_data: "prompts_menu"` (verified in `navigation.ts:172`)

### Must NOT Have
- No i18n refactor of app.ejs UI text (that is M4, separate project)
- No changes to main menu keyboard layout (fingerprint stays in its position)
- No new npm dependencies
- No changes to session state machine or BotState types
- No new `PUT /api/user/profile` endpoint (Architect vetoed)

---

## Success Criteria

1. All 6 gaps resolved with passing typecheck (`npm run typecheck`)
2. No regressions in existing functionality
3. User videos page handles 100+ videos gracefully with pagination via `jobId` cursor
4. Admin transactions page handles 1000+ records with pagination; frontend correctly destructures new response shape
5. Landing page meta tags are dynamic based on config
6. No dead-end "coming soon" stubs in primary user flows
7. `changeLang()` bug is fixed -- language changes persist to the database
8. Edit Profile uses the existing settings endpoint, no API duplication

---

## ADR: Batch Approach

- **Decision:** Fix 6 gaps (M1, M2, M5, L5, H3, H2) as isolated changes in one batch, reusing existing endpoints and patterns
- **Drivers:** Impact/effort ratio, independence of fixes, user-facing polish, no API duplication (Architect mandate)
- **Alternatives considered:** (A) Fix only top 3 — rejected because H3/H2/L5 are trivial effort; (B) Include M4 i18n — rejected because it requires full i18n architecture review; (C) Create new `PUT /api/user/profile` for H2 — rejected by Architect because `PATCH /api/user/settings` already exists and handles the same concerns
- **Why chosen:** Maximizes user-visible improvements with minimal risk; each fix is self-contained; extending existing endpoint avoids duplication and fixes the latent `changeLang()` bug
- **Consequences:** 6 changes to review, but all are small and isolated; `PATCH /api/user/settings` becomes the single endpoint for all user-editable settings
- **Follow-ups:** M4 (i18n) and L1 (robots.txt/sitemap) remain for a future batch
