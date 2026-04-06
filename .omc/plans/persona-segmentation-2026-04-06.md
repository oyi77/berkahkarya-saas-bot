# Persona Segmentation & Niche Consolidation Plan

**Date:** 2026-04-06  
**Status:** REVISED v2 — Architect + Critic reviewed  
**Complexity:** HIGH (cross-cutting: schema, config, onboarding, generate flow, admin dashboard)

---

## RALPLAN-DR Summary

### Principles (5)

1. **Single Source of Truth** — One niche registry (`NICHE_CONFIG` in `src/config/niches.ts`), no duplicates. All consumers resolve through it.
2. **Additive, Not Destructive** — New `userMode` column and persona config layer; existing `selectedNiche`, credit deductions, and generate flow structure stay intact.
3. **Graceful Defaults** — Null `userMode` defaults to `content_creator` everywhere. No user is broken by the migration.
4. **Persona as Filter, Not Gate** — Personas restrict which niches/presets are *shown*, not which are *possible*. Admin override can unlock any combination.
5. **DB-Backed Overrides** — Static persona definitions in code; admin dashboard can override allowed niches/presets/multiplier per persona via `PricingConfig` table (same pattern as niche CRUD).

### Decision Drivers (Top 3)

1. **Backward compatibility** — ~3000-line callback handler, 1500-line generate flow, and 6+ consumers of `NICHES` must not break.
2. **Minimal migration risk** — Single new nullable column (`userMode`) with default behavior when null. No data loss.
3. **Onboarding UX** — Persona picker must be fast (one tap), skippable, and not add friction for existing users who already completed onboarding.

### Viable Options

#### Option A: Inline Persona Config in `src/config/niches.ts`

Add `PERSONA_CONFIG` map alongside `NICHE_CONFIG` in the same file.

**Pros:** Co-located with niche config; single import path; minimal new files  
**Cons:** `niches.ts` grows to ~400 lines; tight coupling between niche and persona lifecycle; harder to test independently

**Rejected because:** Personas have distinct lifecycle (onboarding, filtering, pricing multiplier) from niches (scene templates, prompt generation). Conflating them in one module makes each harder to evolve independently.

#### Option B (Chosen): Separate `src/config/personas.ts` Module

Standalone file with its own types, config map, and `getPersonasAsync()` DB-backed loader.

**Pros:** Clean lifecycle separation; independently testable; room for persona-specific prompt templates; single import for persona-related checks (re-exported from `personas.ts`)  
**Cons:** Extra import in every consumer; `getNichesAsync()` cache pattern duplicated (minor)

**Steelman antithesis:** Personas are *defined by* their relationship to niches — every function in the module takes a niche or preset as input. Separation could be premature. Counter: persona-specific prompt templates (planned follow-up) would break the co-location anyway. Accept Option B now.

#### Niche Key Mapping Strategy

**Sub-option A (Chosen): Alias Map** — `NICHE_KEY_ALIASES` maps old keys to canonical keys. No DB migration.  
**Sub-option B: Migrate DB Values** — Run migration, remove aliases. Cleaner long-term but irreversible with live data.

**Synthesis:** Use alias map now. Plan DB migration as follow-up after alias map stable 2+ weeks. Enforce all access through `getNicheConfig()` (never direct `NICHE_CONFIG[key]`) to prevent silent `undefined` for unmapped keys.

---

## Actual Onboarding Flow (from code)

**IMPORTANT — The flow differs from typical assumptions. Verified from `src/handlers/callbacks/onboarding.ts`:**

```
onboard_lang_* (line 390-447):
  → resolve referral code (lines 398-408)
  → prisma.user.upsert with language + referral (lines 411-430) [FIRST UPSERT]
  → show niche picker (lines 438-446): fnb, fashion, beauty, tech, property, general

onboard_niche_* (line 121-151):
  → prisma.user.upsert with selectedNiche (lines 131-151) [SECOND UPSERT]
  → grantWelcomeBonus (line 156)
  → welcome message

onboard_claim_trial (line 83-118):
  → separate entry point, shows DIFFERENT niche set (8 old keys)
  → also calls onboard_niche_* on selection
```

**Persona picker inserts BETWEEN lines 430 and 438** — after the first upsert but before the niche picker display. The niche picker becomes persona-filtered.

---

## Implementation Steps

### Step 1: Add `userMode` Column to Prisma Schema

**File:** `prisma/schema.prisma`

Add after `selectedNiche` (line 45):
```prisma
userMode  String?   @map("user_mode") @db.VarChar(32)
```

Run:
```bash
npm run migrate:dev   # creates migration
npm run db:generate   # regenerates client
```

**Acceptance Criteria:**
- `npx prisma migrate status` shows no pending migrations
- `prisma.user.findFirst()` returns object with `userMode` field (nullable)
- Existing users have `userMode = null`

---

### Step 2: Create Persona Config Module

**New file:** `src/config/personas.ts`

**Types:**
```typescript
export type UserMode = 'umkm' | 'content_creator' | 'movie_director' | 'anime_studio' | 'corporate' | 'agency';
export type AllowedNiches = string[] | 'ALL';
export type AllowedPresets = ('quick' | 'standard' | 'extended' | 'custom')[];

export interface PersonaConfig {
  id: UserMode;
  name: string;
  emoji: string;
  description: Record<string, string>; // { id: '...', en: '...' }
  allowedNiches: AllowedNiches;        // string[] or 'ALL'
  allowedPresets: AllowedPresets;
  priceMultiplier: number;             // default 1.0 for all, wired but not activated
}
```

**`PERSONA_CONFIG`:**

| ID | Emoji | `allowedNiches` | `allowedPresets` |
|---|---|---|---|
| `umkm` | 🏪 | `['food_culinary','fashion_lifestyle','home_decor','beauty_skincare']` | `['quick']` |
| `content_creator` | 🎥 | `'ALL'` | `['standard','extended']` |
| `movie_director` | 🎬 | `['cinematic','travel_adventure','entertainment']` | `['extended']` |
| `anime_studio` | 🎌 | `['anime','entertainment']` | `['quick','standard','extended']` |
| `corporate` | 💼 | `['business_finance','tech_gadgets','education_knowledge']` | `['standard','extended']` |
| `agency` | 🏢 | `'ALL'` | `['quick','standard','extended','custom']` |

**Exports:**
- `PERSONA_CONFIG: Record<UserMode, PersonaConfig>`
- `PERSONA_LIST`, `PERSONA_IDS`
- `getPersonasAsync()` — DB-backed loader via `PricingConfig` (category: `'persona'`), 5min cache. Same pattern as `getNichesAsync()` at `src/config/niches.ts:255-283`
- `getPersonaForUser(userMode: string | null | undefined): PersonaConfig` — returns config or defaults to `content_creator`
- `isNicheAllowedForPersona(persona: PersonaConfig, nicheId: string): boolean` — handles `'ALL'` and `string[]` branches
- `isPresetAllowedForPersona(persona: PersonaConfig, preset: string): boolean`

**`isNicheAllowedForPersona` implementation:**
```typescript
export function isNicheAllowedForPersona(persona: PersonaConfig, nicheId: string): boolean {
  if (persona.allowedNiches === 'ALL') return true;
  return persona.allowedNiches.includes(nicheId);
}
```

**Acceptance Criteria:**
- `getPersonaForUser(null)` returns `content_creator` config
- `getPersonaForUser('umkm')` returns config with `allowedNiches.length === 4`
- `isPresetAllowedForPersona(PERSONA_CONFIG.umkm, 'extended')` returns `false`
- `isPresetAllowedForPersona(PERSONA_CONFIG.agency, 'custom')` returns `true`
- `isNicheAllowedForPersona(PERSONA_CONFIG.content_creator, 'cinematic')` returns `true`
- `npm run typecheck` passes

---

### Step 3: Consolidate Niche Systems + Add New Niches

**3a. Add 3 new niches to `NICHE_CONFIG` in `src/config/niches.ts`:**

```typescript
cinematic: {
  id: 'cinematic', name: 'Cinematic & Film', emoji: '🎬',
  defaultAspectRatio: '16:9',
  sceneTemplates: {
    intro: ['establishing wide shot of {setting}', 'dramatic close-up of {subject}', 'atmospheric b-roll with {lighting}'],
    body: ['tension-building sequence with {product}', 'narrative moment featuring {subject}', 'visual metaphor using {product}'],
    outro: ['climactic reveal with {subject}', 'slow fade with {product} in frame', 'title card over {setting}'],
  },
  keywords: ['cinematic', 'narrative', 'dramatic', 'film', 'storytelling'],
  colorPalettes: ['moody dark', 'golden hour', 'desaturated', 'high contrast'],
},
anime: {
  id: 'anime', name: 'Anime & Illustration', emoji: '🎌',
  defaultAspectRatio: '16:9',
  sceneTemplates: {
    intro: ['anime-style character reveal with {product}', 'stylized flat-lay featuring {product}', 'illustrated title card with {product}'],
    body: ['action sequence with {product} as hero item', 'cute character interaction with {product}', 'dramatic lighting on {product}'],
    outro: ['kawaii satisfaction moment with {product}', 'stylized end card featuring {product}', 'sparkle effect on {product}'],
  },
  keywords: ['anime', 'illustration', 'manga', 'stylized', 'vibrant'],
  colorPalettes: ['vibrant anime', 'pastel', 'neon', 'cel-shaded'],
},
music_video: {
  id: 'music_video', name: 'Music Video', emoji: '🎤',
  defaultAspectRatio: '16:9',
  sceneTemplates: {
    intro: ['beat-synced flash of {product}', 'performance stage reveal with {product}', 'rhythm montage featuring {product}'],
    body: ['dance sequence with {product} visible', 'concert lighting on {product}', 'lyrical visual with {product}'],
    outro: ['final performance frame with {product}', 'crowd energy shot with {product}', 'fade to black on {product}'],
  },
  keywords: ['rhythm', 'beat', 'music', 'performance', 'visual'],
  colorPalettes: ['neon glow', 'concert lights', 'retro', 'high energy'],
},
```

**3b. Add expanded alias map to `src/config/niches.ts`:**

```typescript
// Maps old/alternate niche keys to canonical NICHE_CONFIG keys
export const NICHE_KEY_ALIASES: Record<string, string> = {
  // Old NICHES object keys (video-generation.service.ts)
  fnb: 'food_culinary',
  fashion: 'fashion_lifestyle',
  tech: 'tech_gadgets',
  health: 'fitness_health',
  travel: 'travel_adventure',
  education: 'education_knowledge',
  finance: 'business_finance',
  entertainment: 'entertainment',  // same, for completeness

  // Lang handler onboarding keys (onboarding.ts:441-443)
  beauty: 'beauty_skincare',
  property: 'home_decor',
  general: 'food_culinary',  // default fallback

  // NICHE_MOOD_MAP keys (scene-consistency.service.ts:29-52)
  cooking: 'food_culinary',
  fitness: 'fitness_health',
  trading: 'business_finance',
  retail: 'food_culinary',
  services: 'business_finance',
  professional: 'business_finance',
  hospitality: 'food_culinary',
};

export function resolveNicheKey(key: string): string {
  return NICHE_KEY_ALIASES[key] || key;
}

// Always use this — never NICHE_CONFIG[key] directly
export function getNicheConfig(key: string): NicheConfig | undefined {
  return NICHE_CONFIG[resolveNicheKey(key)];
}
```

**3c. Replace `NICHES` in `src/services/video-generation.service.ts` (lines 36-77):**

Remove the entire `NICHES` object. Replace with:

```typescript
import { NICHE_CONFIG, getNicheConfig, resolveNicheKey } from '@/config/niches';

// Backward-compatible re-export — consumers that import NICHES from here continue to work
export const NICHES = Object.fromEntries(
  Object.entries(NICHE_CONFIG).map(([k, v]) => [k, {
    name: v.name,
    emoji: v.emoji,
    styles: v.keywords.slice(0, 3),
  }])
);
export { getNicheConfig, resolveNicheKey };
```

**3d. Update `generatePromptFromNiche()` (lines 545-566):**

Replace the hardcoded `templates` record with a dynamic builder using `getNicheConfig()`:

```typescript
function generatePromptFromNiche(niche: string, styles: string[], duration: number): string {
  const config = getNicheConfig(niche);
  if (!config) return `Create a ${styles.join(', ')} video, ${duration}s, professional quality`;
  
  const styleStr = styles.length > 0 ? styles.join(', ') : config.keywords.slice(0, 2).join(', ');
  const palette = config.colorPalettes[0] || 'natural';
  const intro = config.sceneTemplates.intro[0].replace(/{[^}]+}/g, config.keywords[0] || niche);
  
  return `Create a ${styleStr} ${config.name.toLowerCase()} video, ${duration}s. Opening: ${intro}. Color palette: ${palette}. Professional quality, trending.`;
}
```

This covers all 12 niches including `cinematic`, `anime`, `music_video` — no fallback to `fnb` template for new niches.

**3e. Update `scene-consistency.service.ts` `NICHE_MOOD_MAP` (lines 29-52):**

Add `resolveNicheKey()` call before mood lookup. Also add entries for the 3 new niches:

```typescript
import { resolveNicheKey } from '@/config/niches';

// In the mood lookup function:
const canonicalKey = resolveNicheKey(niche);
const mood = NICHE_MOOD_MAP[canonicalKey] || 'professional and engaging';

// Add to NICHE_MOOD_MAP:
cinematic: 'dramatic and cinematic',
anime: 'vibrant and stylized',
music_video: 'energetic and rhythmic',
```

**3f. Update onboarding niche pickers to use canonical keys:**

In `src/handlers/callbacks/onboarding.ts`:
- Lang handler niche picker (lines 439-445): Replace `onboard_niche_beauty` → `onboard_niche_beauty_skincare`, `onboard_niche_property` → `onboard_niche_home_decor`, `onboard_niche_general` → `onboard_niche_food_culinary`. (Or keep old callback_data and rely on alias resolution in the `onboard_niche_*` handler.)
- `onboard_claim_trial` niche picker (lines 91-114): Replace with dynamic generation from persona-filtered `NICHE_CONFIG`.
- In `onboard_niche_*` handler (line 122): After `const niche = data.replace('onboard_niche_', '')`, add `const canonicalNiche = resolveNicheKey(niche)` and use `canonicalNiche` for the DB upsert.

**Acceptance Criteria:**
- `NICHE_CONFIG` has exactly 12 entries (9 + 3 new)
- `import { NICHES } from '@/services/video-generation.service'` compiles (backward-compat re-export)
- `getNicheConfig('fnb')` returns `food_culinary` config
- `getNicheConfig('beauty')` returns `beauty_skincare` config
- `getNicheConfig('property')` returns `home_decor` config
- `getNicheConfig('cinematic')` returns cinematic config
- `generatePromptFromNiche('cinematic', ['dramatic'], 30)` returns a non-food-related string
- `resolveNicheKey('cooking')` returns `'food_culinary'`
- `npm run typecheck` passes

---

### Step 4: Persona Selection in Onboarding Flow

**Files modified:**
- `src/handlers/callbacks/onboarding.ts`
- `src/types/index.ts` — Add `'ONBOARDING_PERSONA'` to `BotState` union (line 106)
- `src/i18n/translations.ts` — Add `onboarding.select_persona` key

**Actual insertion point:** Between line 430 (end of first upsert) and line 438 (start of niche picker display) in `onboard_lang_*` handler.

**4a. Replace lines 432-447 in `onboard_lang_*` handler:**

Instead of immediately showing niche picker, show persona picker:

```typescript
// Line 432 onwards — replace niche picker display with persona picker
ctx.session.stateData = { ...ctx.session.stateData, detectedLang: langCode };
ctx.session.state = 'ONBOARDING_PERSONA';

await ctx.reply(
  t('onboarding.select_persona', langCode),
  {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏪 UMKM / Toko Kecil', callback_data: 'persona_select_umkm' }],
        [{ text: '🎥 Content Creator', callback_data: 'persona_select_content_creator' }],
        [{ text: '🎬 Movie Director', callback_data: 'persona_select_movie_director' }],
        [{ text: '🎌 Anime Studio', callback_data: 'persona_select_anime_studio' }],
        [{ text: '💼 Corporate', callback_data: 'persona_select_corporate' }],
        [{ text: '🏢 Agency', callback_data: 'persona_select_agency' }],
        [{ text: t('btn.skip', langCode), callback_data: 'persona_select_skip' }],
      ],
    },
  }
);
return true;
```

**4b. Add `persona_select_*` callback handler block** (new block before `onboard_lang_*`):

```typescript
if (data.startsWith('persona_select_')) {
  await ctx.answerCbQuery();
  const personaId = data.replace('persona_select_', '');
  const userMode = personaId === 'skip' ? 'content_creator' : personaId;
  const lang = ctx.session?.userLang || ctx.session?.stateData?.detectedLang as string || 'id';

  // Store in session for downstream use
  ctx.session.stateData = { ...ctx.session.stateData, selectedUserMode: userMode };

  // Update existing user record with userMode (already created in onboard_lang_*)
  const userId = ctx.from?.id;
  if (userId) {
    await prisma.user.update({
      where: { telegramId: BigInt(userId) },
      data: { userMode },
    });
  }

  // Get persona config to filter niche picker
  const { getPersonaForUser, isNicheAllowedForPersona } = await import('@/config/personas');
  const persona = getPersonaForUser(userMode);
  const { NICHE_CONFIG } = await import('@/config/niches');

  const allowedNiches = Object.entries(NICHE_CONFIG).filter(([k]) =>
    isNicheAllowedForPersona(persona, k)
  );

  // Show filtered niche picker
  const rows = [];
  for (let i = 0; i < allowedNiches.length; i += 2) {
    rows.push(allowedNiches.slice(i, i + 2).map(([k, v]) => ({
      text: `${v.emoji} ${v.name}`,
      callback_data: `onboard_niche_${k}`,
    })));
  }

  await ctx.reply(t('onboarding.select_niche', lang), { reply_markup: { inline_keyboard: rows } });
  ctx.session.state = 'DASHBOARD';
  return true;
}
```

**4c. Update `onboard_niche_*` handler** — add `userMode` to BOTH upsert clauses:

```typescript
// Line 131-151 — add userMode to create and update
const userMode = (ctx.session?.stateData?.selectedUserMode as string) || 'content_creator';
const canonicalNiche = resolveNicheKey(niche);

await prisma.user.upsert({
  where: { telegramId },
  create: {
    // ... existing fields ...
    selectedNiche: canonicalNiche,
    userMode,  // ADD
  },
  update: {
    selectedNiche: canonicalNiche,
    userMode,  // ADD (update too, in case persona_select ran first)
  },
});
```

**4d. For returning users with `userMode = null`** (in `src/commands/start.ts` line 68):

After the existing user welcome, if `existingUser.userMode` is null, append a non-blocking persona suggestion:

```typescript
if (!existingUser.userMode) {
  await ctx.reply(
    t('onboarding.persona_suggestion', lang),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏪 UMKM', callback_data: 'persona_set_umkm' },
           { text: '🎥 Creator', callback_data: 'persona_set_content_creator' }],
          [{ text: '🎬 Director', callback_data: 'persona_set_movie_director' },
           { text: '🎌 Anime', callback_data: 'persona_set_anime_studio' }],
          [{ text: '💼 Corporate', callback_data: 'persona_set_corporate' },
           { text: '🏢 Agency', callback_data: 'persona_set_agency' }],
        ],
      },
    }
  );
}
```

Add `persona_set_*` handler that simply updates `User.userMode` and replies with confirmation.

**Acceptance Criteria:**
- New user onboarding: language → persona picker → filtered niche picker → welcome
- Tapping "UMKM" shows only 4 niche options (food_culinary, fashion_lifestyle, home_decor, beauty_skincare)
- Tapping "Skip" defaults to `content_creator`, niche picker shows ALL niches
- `User.userMode` is set in DB after both `persona_select_*` and `onboard_niche_*` complete
- `BotState` includes `'ONBOARDING_PERSONA'`
- Existing users with `userMode = null` see persona suggestion on next `/start` (non-blocking)

---

### Step 5: Persona-Aware Generate Flow

**Files modified:**
- `src/types/index.ts` — Add `userMode?: string` to `SessionData` (line 83, after `userLang`)
- `src/flows/generate.ts` — Filter presets and niches by persona

**5a. Cache `userMode` in session at the START of the `/create` command** (`src/commands/create.ts`):

```typescript
// At the top of createCommand(), after loading user:
const user = await UserService.findByTelegramId(telegramId);
if (ctx.session && user) {
  ctx.session.userMode = user.userMode || 'content_creator';
}
```

This ensures `ctx.session.userMode` is populated BEFORE `showSmartPresetSelection` is ever called.

**5b. Filter preset selection in `showSmartPresetSelection` (`src/flows/generate.ts` ~line 1262):**

```typescript
import { getPersonaForUser, isPresetAllowedForPersona } from '@/config/personas';

const persona = getPersonaForUser(ctx.session?.userMode);
const allPresets = [
  { text: `⚡ Quick — 15s (${UNIT_COSTS.VIDEO_15S / 10} cr)`, data: 'preset_quick', key: 'quick' },
  { text: `🎯 Standard — 30s (${UNIT_COSTS.VIDEO_30S / 10} cr)`, data: 'preset_standard', key: 'standard' },
  { text: `🎥 Extended — 60s (${UNIT_COSTS.VIDEO_60S / 10} cr)`, data: 'preset_extended', key: 'extended' },
  { text: '⏱️ Custom', data: 'preset_custom', key: 'custom' },
];
const filtered = allPresets.filter(p => isPresetAllowedForPersona(persona, p.key));
// Use filtered instead of allPresets for keyboard rows
```

**5c. Filter niche selection buttons** in `src/handlers/callbacks/video.ts` (~line 211):

```typescript
import { getPersonaForUser, isNicheAllowedForPersona } from '@/config/personas';
import { NICHE_CONFIG } from '@/config/niches';

const persona = getPersonaForUser(ctx.session?.userMode);
const visibleNiches = Object.entries(NICHE_CONFIG).filter(([k]) =>
  isNicheAllowedForPersona(persona, k)
);
// Build keyboard from visibleNiches instead of hardcoded list
```

**Acceptance Criteria:**
- `userMode` on `SessionData` is optional string — existing sessions deserialize without error
- User with `userMode = 'umkm'` in `/create`: only "Quick" preset shown
- User with `userMode = 'movie_director'`: only "Extended" preset shown
- User with `userMode = 'agency'`: all 4 presets including Custom
- User with `userMode = null` (legacy): `content_creator` behavior (standard + extended)
- Niche selection buttons filtered by persona's `allowedNiches`
- `detectIndustry()` auto-detection in `hpas-engine.ts` is NOT affected (UI filtering only)
- `npm run typecheck` passes

---

### Step 6: Admin Dashboard Persona Config Page

**Files:**
- `src/routes/admin.ts` — Add `/api/personas` GET/POST endpoints (after niche management block ~line 2169)
- New file: `src/views/admin/personas.ejs`

**6a. API endpoints:**

```typescript
// GET /api/personas
server.get('/api/personas', async () => {
  const { getPersonasAsync } = await import('../config/personas.js');
  return getPersonasAsync();
});

// POST /api/personas — upsert override
server.post('/api/personas', async (request, reply) => {
  const body = request.body as {
    id: string;
    allowedNiches?: string[] | 'ALL';
    allowedPresets?: string[];
    priceMultiplier?: number;
  };
  if (!body.id) return reply.status(400).send({ error: 'id required' });
  await prisma.pricingConfig.upsert({
    where: { category_key: { category: 'persona', key: body.id } },
    create: { category: 'persona', key: body.id, value: body as any, updatedBy: BigInt(0) },
    update: { value: body as any, updatedBy: BigInt(0) },
  });
  return { success: true };
});

// GET /admin/personas — EJS page
server.get('/admin/personas', { onRequest: [adminAuth] }, async (_req, reply) => {
  const { getPersonasAsync } = await import('../config/personas.js');
  const personas = await getPersonasAsync();
  return reply.view('admin/personas', { personas });
});
```

**6b. EJS page `src/views/admin/personas.ejs`:**

Table with columns: ID, Name, Emoji, Allowed Niches (comma-separated with edit), Allowed Presets (checkboxes), Price Multiplier (number input), Save button. Follow `analytics.ejs` pattern.

**Acceptance Criteria:**
- `GET /api/personas` returns array of 6 persona objects
- `POST /api/personas` with `{ id: 'umkm', allowedPresets: ['quick', 'standard'] }` persists to DB
- Subsequent `GET /api/personas` reflects override (umkm now has 2 presets)
- `/admin/personas` renders without errors
- Admin change takes effect within 5 minutes (cache TTL)

---

## Dependency Order

```
Step 1 (schema migration)
  → Step 2 (personas.ts) + Step 3 (niche consolidation)  [parallel]
    → Step 4 (onboarding flow)
      → Step 5 (generate flow filtering)
        → Step 6 (admin dashboard)
```

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Breaking `NICHES` imports | MEDIUM | HIGH | Backward-compat re-export from `video-generation.service.ts` |
| `resolveNicheKey()` forgotten — direct `NICHE_CONFIG[key]` access | MEDIUM | MEDIUM | Always go through `getNicheConfig()` wrapper; never direct access |
| Old `selectedNiche` values (`fnb`, `beauty`, `property`, `general`) break | MEDIUM | HIGH | Expanded alias map covers all known old keys |
| `onboard_lang_*` upsert creates user without `userMode` | RESOLVED | HIGH | Step 4b adds `persona_select_*` handler that immediately updates `userMode` via `prisma.user.update` |
| New niches (`cinematic`, `anime`, `music_video`) produce bad prompts | LOW | MEDIUM | Step 3d replaces hardcoded templates with dynamic `getNicheConfig()` builder covering all 12 niches |
| Session deserialization with new `userMode` field | LOW | LOW | Optional field — absent in old sessions = `undefined`, handled by `getPersonaForUser(undefined)` → `content_creator` |
| `PricingConfig` table schema mismatch for persona data | LOW | LOW | Same `category/key/value(JSON)` pattern as niches (proven pattern) |
| `showSmartPresetSelection` called before session `userMode` populated | RESOLVED | HIGH | Step 5a caches `userMode` in `/create` command before any sub-flow |

---

## Verification Steps

1. **Schema:** `npx prisma migrate status` clean. `npx prisma studio` shows `userMode` nullable column.

2. **Type safety:** `npm run typecheck` → 0 errors.

3. **Unit assertions (add to `tests/unit/config/niches.test.ts`):**
   - `NICHE_CONFIG` has 12 keys
   - `getNicheConfig('fnb')?.id === 'food_culinary'`
   - `getNicheConfig('beauty')?.id === 'beauty_skincare'`
   - `getNicheConfig('property')?.id === 'home_decor'`
   - `getNicheConfig('cinematic')?.id === 'cinematic'`
   - `generatePromptFromNiche('cinematic', ['dramatic'], 30)` does not contain 'food'

4. **Unit assertions (add to `tests/unit/config/personas.test.ts`):**
   - `getPersonaForUser(null).id === 'content_creator'`
   - `isPresetAllowedForPersona(PERSONA_CONFIG.umkm, 'extended') === false`
   - `isPresetAllowedForPersona(PERSONA_CONFIG.agency, 'custom') === true`
   - `isNicheAllowedForPersona(PERSONA_CONFIG.content_creator, 'cinematic') === true`
   - `isNicheAllowedForPersona(PERSONA_CONFIG.umkm, 'cinematic') === false`

5. **Integration — new user onboarding:**
   - `/start` as new user → language picker → select language → persona picker appears
   - Select "UMKM" → niche picker shows exactly 4 niches
   - Select niche → `User.userMode = 'umkm'`, `User.selectedNiche = 'food_culinary'`

6. **Integration — generate flow:**
   - User with `userMode = 'umkm'` → `/create` → smart mode → only "Quick" preset visible
   - User with `userMode = 'agency'` → all 4 presets visible including Custom

7. **Integration — backward compat:**
   - Existing user with `selectedNiche = 'fnb'`, `userMode = null` → `/create` → sees `content_creator` presets (standard + extended) → generate succeeds

8. **Admin:**
   - `/admin/personas` loads. Edit umkm to allow `standard`. Create video as umkm → now sees Quick + Standard.

---

## ADR: Persona Segmentation Architecture

**Decision:** Separate `src/config/personas.ts` module + nullable `User.userMode` column + `PricingConfig` DB overrides.

**Drivers:** Backward compat, minimal migration risk, admin-configurable without deploys.

**Alternatives Considered:**
- Inline in `niches.ts` — rejected (tight lifecycle coupling)
- Enum column + hardcoded logic — rejected (not admin-configurable)
- Separate `Persona` DB model — deferred (PricingConfig pattern is sufficient for now)
- DB migration for niche keys — deferred (alias map is safer for live prod data)

**Why Chosen:** Clean lifecycle separation, independently testable, `PricingConfig` pattern battle-tested for niches.

**Consequences:**
- `PricingConfig` table grows by 6 persona entries
- Session carries optional `userMode` string
- Persona picker adds one step to onboarding (mitigated by skip)

**Follow-ups:**
- Persona-specific prompt templates (different tone/style per persona)
- Price multiplier activation in payment flow (field wired, not activated)
- Persona analytics (users per persona, conversion rates)
- DB migration to clean up old niche keys after alias map proven stable (2+ weeks)
- `onboard_claim_trial` path also needs persona filtering (currently separate entry point)

---

## Changelog (v2 — Critic/Architect fixes applied)

- **CRITICAL FIX:** Corrected onboarding flow description to match actual code (two upserts at lines 411 and 131). `persona_select_*` handler uses `prisma.user.update` immediately after persona selection to bridge the gap.
- **CRITICAL FIX:** `userMode` session caching moved to `/create` command handler (before any sub-flow), not inside `executeGeneration()`.
- **MAJOR FIX:** `allowedNiches` type explicitly defined as `string[] | 'ALL'`. `isNicheAllowedForPersona` handles both branches.
- **MAJOR FIX:** `NICHE_KEY_ALIASES` expanded to cover all keys: `beauty`, `property`, `general`, `cooking`, `fitness`, `trading`, `retail`, `services`, `professional`, `hospitality`.
- **MAJOR FIX:** `generatePromptFromNiche()` replaced with dynamic `getNicheConfig()` builder — covers all 12 niches, no `fnb` fallback for new niches.
- **MINOR FIX:** `NICHE_MOOD_MAP` in `scene-consistency.service.ts` gets entries for `cinematic`, `anime`, `music_video` + `resolveNicheKey()` call.
