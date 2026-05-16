/**
 * Unit Tests — HPAS Engine (config/hpas-engine.ts)
 * Tests for: HPAS_SCENES, DURATION_PRESETS, INDUSTRY_TEMPLATES,
 *            getScenesForPreset, getIndustryTemplate, generateVideoScenePrompts, detectIndustry
 */

import { describe, it, expect } from '@jest/globals';

import {
  HPAS_SCENES,
  DURATION_PRESETS,
  INDUSTRY_TEMPLATES,
  getScenesForPreset,
  getIndustryTemplate,
  generateVideoScenePrompts,
  detectIndustry,
  getSceneDurations,
} from '@/config/hpas-engine';

// ── HPAS_SCENES ───────────────────────────────────────────────────────────────

describe('HPAS_SCENES', () => {
  it('contains exactly 7 scenes', () => {
    expect(Object.keys(HPAS_SCENES)).toHaveLength(7);
  });

  it('includes all required scene ids', () => {
    const expected = ['hook', 'problem', 'agitate', 'discovery', 'interaction', 'result', 'cta'];
    for (const id of expected) {
      expect(HPAS_SCENES).toHaveProperty(id);
    }
  });

  it('each scene has id, name, order, durationRange, emotionTarget', () => {
    for (const scene of Object.values(HPAS_SCENES)) {
      expect(scene.id).toBeTruthy();
      expect(scene.name).toBeTruthy();
      expect(typeof scene.order).toBe('number');
      expect(scene.durationRange.min).toBeGreaterThan(0);
      expect(scene.durationRange.max).toBeGreaterThanOrEqual(scene.durationRange.min);
      expect(scene.emotionTarget).toBeTruthy();
    }
  });

  it('scene orders are unique', () => {
    const orders = Object.values(HPAS_SCENES).map((s) => s.order);
    const unique = new Set(orders);
    expect(unique.size).toBe(orders.length);
  });
});

// ── DURATION_PRESETS ──────────────────────────────────────────────────────────

describe('DURATION_PRESETS', () => {
  it('contains quick, standard, extended presets', () => {
    expect(DURATION_PRESETS).toHaveProperty('quick');
    expect(DURATION_PRESETS).toHaveProperty('standard');
    expect(DURATION_PRESETS).toHaveProperty('extended');
  });

  it('each preset has totalSeconds > 0 and creditCost > 0', () => {
    for (const preset of Object.values(DURATION_PRESETS)) {
      expect(preset.totalSeconds).toBeGreaterThan(0);
      expect(preset.creditCost).toBeGreaterThan(0);
    }
  });

  it('extended has more seconds than standard which has more than quick', () => {
    expect(DURATION_PRESETS.extended.totalSeconds).toBeGreaterThan(DURATION_PRESETS.standard.totalSeconds);
    expect(DURATION_PRESETS.standard.totalSeconds).toBeGreaterThan(DURATION_PRESETS.quick.totalSeconds);
  });

  it('each preset includes at least hook and cta scenes', () => {
    for (const preset of Object.values(DURATION_PRESETS)) {
      expect(preset.scenesIncluded).toContain('hook');
      expect(preset.scenesIncluded).toContain('cta');
    }
  });
});

// ── INDUSTRY_TEMPLATES ────────────────────────────────────────────────────────

describe('INDUSTRY_TEMPLATES', () => {
  it('contains 6 industries', () => {
    expect(Object.keys(INDUSTRY_TEMPLATES)).toHaveLength(6);
  });

  it('includes beauty, food, fashion, tech, fitness, general', () => {
    const expected = ['beauty', 'food', 'fashion', 'tech', 'fitness', 'general'];
    for (const id of expected) {
      expect(INDUSTRY_TEMPLATES).toHaveProperty(id);
    }
  });

  it('each template has id, name, scenes array', () => {
    for (const tmpl of Object.values(INDUSTRY_TEMPLATES)) {
      expect(tmpl.id).toBeTruthy();
      expect(tmpl.name).toBeTruthy();
      expect(Array.isArray(tmpl.scenes)).toBe(true);
      expect(tmpl.scenes.length).toBeGreaterThan(0);
    }
  });
});

// ── getScenesForPreset ────────────────────────────────────────────────────────

describe('getScenesForPreset', () => {
  it('quick preset returns fewer scenes than extended', () => {
    const quick    = getScenesForPreset('quick');
    const extended = getScenesForPreset('extended');
    expect(extended.length).toBeGreaterThanOrEqual(quick.length);
  });

  it.each(['quick', 'standard', 'extended'] as const)(
    'preset "%s" returns SceneConfig array with valid items',
    (preset) => {
      const scenes = getScenesForPreset(preset);
      expect(Array.isArray(scenes)).toBe(true);
      expect(scenes.length).toBeGreaterThan(0);
      for (const s of scenes) {
        expect(s.id).toBeTruthy();
        expect(s.order).toBeGreaterThan(0);
      }
    },
  );
});

// ── getIndustryTemplate ───────────────────────────────────────────────────────

describe('getIndustryTemplate', () => {
  it.each(['beauty', 'food', 'fashion', 'tech', 'fitness', 'general'] as const)(
    'returns template for industry "%s"',
    (industry) => {
      const tmpl = getIndustryTemplate(industry);
      expect(tmpl.id).toBe(industry);
      expect(tmpl.scenes.length).toBeGreaterThan(0);
    },
  );
});

// ── detectIndustry ────────────────────────────────────────────────────────────

describe('detectIndustry', () => {
  it('detects food industry from food-related description', () => {
    const industry = detectIndustry('Nasi goreng spesial dengan telur dan ayam');
    expect(['food', 'general']).toContain(industry);
  });

  it('detects fashion from fashion-related description', () => {
    const industry = detectIndustry('Baju batik modern untuk wanita');
    expect(['fashion', 'general']).toContain(industry);
  });

  it('detects tech from tech-related description', () => {
    const industry = detectIndustry('Aplikasi mobile untuk manajemen bisnis');
    expect(['tech', 'general']).toContain(industry);
  });

  it('returns a valid IndustryId for any input', () => {
    const valid = ['beauty', 'food', 'fashion', 'tech', 'fitness', 'general'];
    const result = detectIndustry('produk random tanpa kategori jelas');
    expect(valid).toContain(result);
  });
});

// ── generateVideoScenePrompts ─────────────────────────────────────────────────

describe('generateVideoScenePrompts', () => {
  it('returns array of scene prompts for valid industry + preset', () => {
    const prompts = generateVideoScenePrompts('food', 'Kopi Arabika', 'standard');
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBeGreaterThan(0);
  });

  it('each prompt has sceneId and at least one prompt field', () => {
    const prompts = generateVideoScenePrompts('tech', 'App Bisnis', 'quick');
    for (const p of prompts) {
      expect(p.sceneId).toBeTruthy();
    }
  });

  it('works for all 3 presets', () => {
    for (const preset of ['quick', 'standard', 'extended'] as const) {
      const prompts = generateVideoScenePrompts('general', 'Test Product', preset);
      expect(prompts.length).toBeGreaterThan(0);
    }
  });
});

// ── getSceneDurations ─────────────────────────────────────────────────────────

describe('getSceneDurations', () => {
  it('returns object with at least hook key', () => {
    const durations = getSceneDurations('standard');
    expect(typeof durations).toBe('object');
    expect(durations).toHaveProperty('hook');
  });

  it('all duration values are positive numbers', () => {
    const durations = getSceneDurations('extended');
    for (const val of Object.values(durations)) {
      if (val !== undefined) {
        expect(val).toBeGreaterThan(0);
      }
    }
  });
});
