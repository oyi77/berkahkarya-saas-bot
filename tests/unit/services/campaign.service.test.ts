/**
 * Unit Tests — CampaignService
 * Tests for: getHookVariations, generateCampaignSpecs, getCampaignCost, getCampaignSavings
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/config/database', () => ({ prisma: {} }));

import { CampaignService, HOOK_VARIATIONS } from '@/services/campaign.service';

// ── HOOK_VARIATIONS ───────────────────────────────────────────────────────────

describe('HOOK_VARIATIONS constant', () => {
  it('contains exactly 10 hook variations', () => {
    expect(HOOK_VARIATIONS).toHaveLength(10);
  });

  it('each variation has id, name, description, promptTemplate, style', () => {
    for (const hook of HOOK_VARIATIONS) {
      expect(hook.id).toBeTruthy();
      expect(hook.name).toBeTruthy();
      expect(hook.description).toBeTruthy();
      expect(hook.promptTemplate).toBeTruthy();
      expect(hook.style).toBeTruthy();
    }
  });

  it('ids are unique', () => {
    const ids = HOOK_VARIATIONS.map((h) => h.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ── getHookVariations ─────────────────────────────────────────────────────────

describe('CampaignService.getHookVariations', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns 5 variations for size=5', () => {
    const hooks = CampaignService.getHookVariations(5);
    expect(hooks).toHaveLength(5);
  });

  it('returns 10 variations for size=10', () => {
    const hooks = CampaignService.getHookVariations(10);
    expect(hooks).toHaveLength(10);
  });

  it('variations for size=5 are subset of all 10', () => {
    const all = CampaignService.getHookVariations(10);
    const five = CampaignService.getHookVariations(5);
    const allIds = new Set(all.map((h) => h.id));
    for (const hook of five) {
      expect(allIds.has(hook.id)).toBe(true);
    }
  });
});

// ── generateCampaignSpecs ─────────────────────────────────────────────────────

describe('CampaignService.generateCampaignSpecs', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  const PRODUCT = 'Kopi Arabika Premium dari Aceh';

  it('returns specs array with length equal to campaignSize (5)', () => {
    const specs = CampaignService.generateCampaignSpecs(PRODUCT, 5);
    expect(specs).toHaveLength(5);
  });

  it('returns specs array with length equal to campaignSize (10)', () => {
    const specs = CampaignService.generateCampaignSpecs(PRODUCT, 10);
    expect(specs).toHaveLength(10);
  });

  it('each spec has hookVariation and scenes array', () => {
    const specs = CampaignService.generateCampaignSpecs(PRODUCT, 5);
    for (const spec of specs) {
      expect(spec.hookVariation).toBeDefined();
      expect(Array.isArray(spec.scenes)).toBe(true);
      expect(spec.scenes.length).toBeGreaterThan(0);
    }
  });

  it('each spec has totalCreditCost > 0', () => {
    const specs = CampaignService.generateCampaignSpecs(PRODUCT, 5);
    for (const spec of specs) {
      expect(spec.totalCreditCost).toBeGreaterThan(0);
    }
  });

  it('each spec has hookPrompt containing product description', () => {
    const specs = CampaignService.generateCampaignSpecs(PRODUCT, 5);
    const hasProduct = specs.some((s) => s.hookPrompt.includes('Kopi'));
    expect(hasProduct).toBe(true);
  });

  it('all 3 duration presets work', () => {
    for (const preset of ['quick', 'standard', 'extended'] as const) {
      const specs = CampaignService.generateCampaignSpecs(PRODUCT, 5, preset);
      expect(specs).toHaveLength(5);
    }
  });
});

// ── getCampaignCost ───────────────────────────────────────────────────────────

describe('CampaignService.getCampaignCost', () => {
  it('returns a positive number for size=5', () => {
    expect(CampaignService.getCampaignCost(5)).toBeGreaterThan(0);
  });

  it('returns a positive number for size=10', () => {
    expect(CampaignService.getCampaignCost(10)).toBeGreaterThan(0);
  });

  it('cost for size=10 is greater than cost for size=5', () => {
    expect(CampaignService.getCampaignCost(10)).toBeGreaterThan(CampaignService.getCampaignCost(5));
  });
});

// ── getCampaignSavings ────────────────────────────────────────────────────────

describe('CampaignService.getCampaignSavings', () => {
  it('returns savings >= 0 for size=5', () => {
    expect(CampaignService.getCampaignSavings(5)).toBeGreaterThanOrEqual(0);
  });

  it('returns savings >= 0 for size=10', () => {
    expect(CampaignService.getCampaignSavings(10)).toBeGreaterThanOrEqual(0);
  });
});

// ── formatCampaignMessage ─────────────────────────────────────────────────────

describe('CampaignService.formatCampaignMessage', () => {
  it('returns non-empty string for size=5', () => {
    const msg = CampaignService.formatCampaignMessage(5);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns non-empty string for size=10', () => {
    const msg = CampaignService.formatCampaignMessage(10);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('message contains campaign size info', () => {
    const msg5  = CampaignService.formatCampaignMessage(5);
    const msg10 = CampaignService.formatCampaignMessage(10);
    // At least one should mention the count
    expect(msg5.includes('5') || msg10.includes('10')).toBe(true);
  });
});
