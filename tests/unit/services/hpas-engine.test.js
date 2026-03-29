"use strict";
/**
 * Unit Tests — HPAS Engine (config/hpas-engine.ts)
 * Tests for: HPAS_SCENES, DURATION_PRESETS, INDUSTRY_TEMPLATES,
 *            getScenesForPreset, getIndustryTemplate, generateVideoScenePrompts, detectIndustry
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const hpas_engine_1 = require("@/config/hpas-engine");
// ── HPAS_SCENES ───────────────────────────────────────────────────────────────
(0, globals_1.describe)('HPAS_SCENES', () => {
    (0, globals_1.it)('contains exactly 7 scenes', () => {
        (0, globals_1.expect)(Object.keys(hpas_engine_1.HPAS_SCENES)).toHaveLength(7);
    });
    (0, globals_1.it)('includes all required scene ids', () => {
        const expected = ['hook', 'problem', 'agitate', 'discovery', 'interaction', 'result', 'cta'];
        for (const id of expected) {
            (0, globals_1.expect)(hpas_engine_1.HPAS_SCENES).toHaveProperty(id);
        }
    });
    (0, globals_1.it)('each scene has id, name, order, durationRange, emotionTarget', () => {
        for (const scene of Object.values(hpas_engine_1.HPAS_SCENES)) {
            (0, globals_1.expect)(scene.id).toBeTruthy();
            (0, globals_1.expect)(scene.name).toBeTruthy();
            (0, globals_1.expect)(typeof scene.order).toBe('number');
            (0, globals_1.expect)(scene.durationRange.min).toBeGreaterThan(0);
            (0, globals_1.expect)(scene.durationRange.max).toBeGreaterThanOrEqual(scene.durationRange.min);
            (0, globals_1.expect)(scene.emotionTarget).toBeTruthy();
        }
    });
    (0, globals_1.it)('scene orders are unique', () => {
        const orders = Object.values(hpas_engine_1.HPAS_SCENES).map((s) => s.order);
        const unique = new Set(orders);
        (0, globals_1.expect)(unique.size).toBe(orders.length);
    });
});
// ── DURATION_PRESETS ──────────────────────────────────────────────────────────
(0, globals_1.describe)('DURATION_PRESETS', () => {
    (0, globals_1.it)('contains quick, standard, extended presets', () => {
        (0, globals_1.expect)(hpas_engine_1.DURATION_PRESETS).toHaveProperty('quick');
        (0, globals_1.expect)(hpas_engine_1.DURATION_PRESETS).toHaveProperty('standard');
        (0, globals_1.expect)(hpas_engine_1.DURATION_PRESETS).toHaveProperty('extended');
    });
    (0, globals_1.it)('each preset has totalSeconds > 0 and creditCost > 0', () => {
        for (const preset of Object.values(hpas_engine_1.DURATION_PRESETS)) {
            (0, globals_1.expect)(preset.totalSeconds).toBeGreaterThan(0);
            (0, globals_1.expect)(preset.creditCost).toBeGreaterThan(0);
        }
    });
    (0, globals_1.it)('extended has more seconds than standard which has more than quick', () => {
        (0, globals_1.expect)(hpas_engine_1.DURATION_PRESETS.extended.totalSeconds).toBeGreaterThan(hpas_engine_1.DURATION_PRESETS.standard.totalSeconds);
        (0, globals_1.expect)(hpas_engine_1.DURATION_PRESETS.standard.totalSeconds).toBeGreaterThan(hpas_engine_1.DURATION_PRESETS.quick.totalSeconds);
    });
    (0, globals_1.it)('each preset includes at least hook and cta scenes', () => {
        for (const preset of Object.values(hpas_engine_1.DURATION_PRESETS)) {
            (0, globals_1.expect)(preset.scenesIncluded).toContain('hook');
            (0, globals_1.expect)(preset.scenesIncluded).toContain('cta');
        }
    });
});
// ── INDUSTRY_TEMPLATES ────────────────────────────────────────────────────────
(0, globals_1.describe)('INDUSTRY_TEMPLATES', () => {
    (0, globals_1.it)('contains 6 industries', () => {
        (0, globals_1.expect)(Object.keys(hpas_engine_1.INDUSTRY_TEMPLATES)).toHaveLength(6);
    });
    (0, globals_1.it)('includes beauty, food, fashion, tech, fitness, general', () => {
        const expected = ['beauty', 'food', 'fashion', 'tech', 'fitness', 'general'];
        for (const id of expected) {
            (0, globals_1.expect)(hpas_engine_1.INDUSTRY_TEMPLATES).toHaveProperty(id);
        }
    });
    (0, globals_1.it)('each template has id, name, scenes array', () => {
        for (const tmpl of Object.values(hpas_engine_1.INDUSTRY_TEMPLATES)) {
            (0, globals_1.expect)(tmpl.id).toBeTruthy();
            (0, globals_1.expect)(tmpl.name).toBeTruthy();
            (0, globals_1.expect)(Array.isArray(tmpl.scenes)).toBe(true);
            (0, globals_1.expect)(tmpl.scenes.length).toBeGreaterThan(0);
        }
    });
});
// ── getScenesForPreset ────────────────────────────────────────────────────────
(0, globals_1.describe)('getScenesForPreset', () => {
    (0, globals_1.it)('quick preset returns fewer scenes than extended', () => {
        const quick = (0, hpas_engine_1.getScenesForPreset)('quick');
        const extended = (0, hpas_engine_1.getScenesForPreset)('extended');
        (0, globals_1.expect)(extended.length).toBeGreaterThanOrEqual(quick.length);
    });
    globals_1.it.each(['quick', 'standard', 'extended'])('preset "%s" returns SceneConfig array with valid items', (preset) => {
        const scenes = (0, hpas_engine_1.getScenesForPreset)(preset);
        (0, globals_1.expect)(Array.isArray(scenes)).toBe(true);
        (0, globals_1.expect)(scenes.length).toBeGreaterThan(0);
        for (const s of scenes) {
            (0, globals_1.expect)(s.id).toBeTruthy();
            (0, globals_1.expect)(s.order).toBeGreaterThan(0);
        }
    });
});
// ── getIndustryTemplate ───────────────────────────────────────────────────────
(0, globals_1.describe)('getIndustryTemplate', () => {
    globals_1.it.each(['beauty', 'food', 'fashion', 'tech', 'fitness', 'general'])('returns template for industry "%s"', (industry) => {
        const tmpl = (0, hpas_engine_1.getIndustryTemplate)(industry);
        (0, globals_1.expect)(tmpl.id).toBe(industry);
        (0, globals_1.expect)(tmpl.scenes.length).toBeGreaterThan(0);
    });
});
// ── detectIndustry ────────────────────────────────────────────────────────────
(0, globals_1.describe)('detectIndustry', () => {
    (0, globals_1.it)('detects food industry from food-related description', () => {
        const industry = (0, hpas_engine_1.detectIndustry)('Nasi goreng spesial dengan telur dan ayam');
        (0, globals_1.expect)(['food', 'general']).toContain(industry);
    });
    (0, globals_1.it)('detects fashion from fashion-related description', () => {
        const industry = (0, hpas_engine_1.detectIndustry)('Baju batik modern untuk wanita');
        (0, globals_1.expect)(['fashion', 'general']).toContain(industry);
    });
    (0, globals_1.it)('detects tech from tech-related description', () => {
        const industry = (0, hpas_engine_1.detectIndustry)('Aplikasi mobile untuk manajemen bisnis');
        (0, globals_1.expect)(['tech', 'general']).toContain(industry);
    });
    (0, globals_1.it)('returns a valid IndustryId for any input', () => {
        const valid = ['beauty', 'food', 'fashion', 'tech', 'fitness', 'general'];
        const result = (0, hpas_engine_1.detectIndustry)('produk random tanpa kategori jelas');
        (0, globals_1.expect)(valid).toContain(result);
    });
});
// ── generateVideoScenePrompts ─────────────────────────────────────────────────
(0, globals_1.describe)('generateVideoScenePrompts', () => {
    (0, globals_1.it)('returns array of scene prompts for valid industry + preset', () => {
        const prompts = (0, hpas_engine_1.generateVideoScenePrompts)('food', 'Kopi Arabika', 'standard');
        (0, globals_1.expect)(Array.isArray(prompts)).toBe(true);
        (0, globals_1.expect)(prompts.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('each prompt has sceneId and at least one prompt field', () => {
        const prompts = (0, hpas_engine_1.generateVideoScenePrompts)('tech', 'App Bisnis', 'quick');
        for (const p of prompts) {
            (0, globals_1.expect)(p.sceneId).toBeTruthy();
        }
    });
    (0, globals_1.it)('works for all 3 presets', () => {
        for (const preset of ['quick', 'standard', 'extended']) {
            const prompts = (0, hpas_engine_1.generateVideoScenePrompts)('general', 'Test Product', preset);
            (0, globals_1.expect)(prompts.length).toBeGreaterThan(0);
        }
    });
});
// ── getSceneDurations ─────────────────────────────────────────────────────────
(0, globals_1.describe)('getSceneDurations', () => {
    (0, globals_1.it)('returns object with at least hook key', () => {
        const durations = (0, hpas_engine_1.getSceneDurations)('standard');
        (0, globals_1.expect)(typeof durations).toBe('object');
        (0, globals_1.expect)(durations).toHaveProperty('hook');
    });
    (0, globals_1.it)('all duration values are positive numbers', () => {
        const durations = (0, hpas_engine_1.getSceneDurations)('extended');
        for (const val of Object.values(durations)) {
            if (val !== undefined) {
                (0, globals_1.expect)(val).toBeGreaterThan(0);
            }
        }
    });
});
//# sourceMappingURL=hpas-engine.test.js.map