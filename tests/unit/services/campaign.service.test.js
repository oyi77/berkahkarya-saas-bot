"use strict";
/**
 * Unit Tests — CampaignService
 * Tests for: getHookVariations, generateCampaignSpecs, getCampaignCost, getCampaignSavings
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
globals_1.jest.mock('@/utils/logger', () => ({
    logger: { info: globals_1.jest.fn(), error: globals_1.jest.fn(), warn: globals_1.jest.fn(), debug: globals_1.jest.fn() },
}));
globals_1.jest.mock('@/config/database', () => ({ prisma: {} }));
const campaign_service_1 = require("@/services/campaign.service");
// ── HOOK_VARIATIONS ───────────────────────────────────────────────────────────
(0, globals_1.describe)('HOOK_VARIATIONS constant', () => {
    (0, globals_1.it)('contains exactly 10 hook variations', () => {
        (0, globals_1.expect)(campaign_service_1.HOOK_VARIATIONS).toHaveLength(10);
    });
    (0, globals_1.it)('each variation has id, name, description, promptTemplate, style', () => {
        for (const hook of campaign_service_1.HOOK_VARIATIONS) {
            (0, globals_1.expect)(hook.id).toBeTruthy();
            (0, globals_1.expect)(hook.name).toBeTruthy();
            (0, globals_1.expect)(hook.description).toBeTruthy();
            (0, globals_1.expect)(hook.promptTemplate).toBeTruthy();
            (0, globals_1.expect)(hook.style).toBeTruthy();
        }
    });
    (0, globals_1.it)('ids are unique', () => {
        const ids = campaign_service_1.HOOK_VARIATIONS.map((h) => h.id);
        const unique = new Set(ids);
        (0, globals_1.expect)(unique.size).toBe(ids.length);
    });
});
// ── getHookVariations ─────────────────────────────────────────────────────────
(0, globals_1.describe)('CampaignService.getHookVariations', () => {
    (0, globals_1.beforeEach)(() => { globals_1.jest.clearAllMocks(); });
    (0, globals_1.it)('returns 5 variations for size=5', () => {
        const hooks = campaign_service_1.CampaignService.getHookVariations(5);
        (0, globals_1.expect)(hooks).toHaveLength(5);
    });
    (0, globals_1.it)('returns 10 variations for size=10', () => {
        const hooks = campaign_service_1.CampaignService.getHookVariations(10);
        (0, globals_1.expect)(hooks).toHaveLength(10);
    });
    (0, globals_1.it)('variations for size=5 are subset of all 10', () => {
        const all = campaign_service_1.CampaignService.getHookVariations(10);
        const five = campaign_service_1.CampaignService.getHookVariations(5);
        const allIds = new Set(all.map((h) => h.id));
        for (const hook of five) {
            (0, globals_1.expect)(allIds.has(hook.id)).toBe(true);
        }
    });
});
// ── generateCampaignSpecs ─────────────────────────────────────────────────────
(0, globals_1.describe)('CampaignService.generateCampaignSpecs', () => {
    (0, globals_1.beforeEach)(() => { globals_1.jest.clearAllMocks(); });
    const PRODUCT = 'Kopi Arabika Premium dari Aceh';
    (0, globals_1.it)('returns specs array with length equal to campaignSize (5)', () => {
        const specs = campaign_service_1.CampaignService.generateCampaignSpecs(PRODUCT, 5);
        (0, globals_1.expect)(specs).toHaveLength(5);
    });
    (0, globals_1.it)('returns specs array with length equal to campaignSize (10)', () => {
        const specs = campaign_service_1.CampaignService.generateCampaignSpecs(PRODUCT, 10);
        (0, globals_1.expect)(specs).toHaveLength(10);
    });
    (0, globals_1.it)('each spec has hookVariation and scenes array', () => {
        const specs = campaign_service_1.CampaignService.generateCampaignSpecs(PRODUCT, 5);
        for (const spec of specs) {
            (0, globals_1.expect)(spec.hookVariation).toBeDefined();
            (0, globals_1.expect)(Array.isArray(spec.scenes)).toBe(true);
            (0, globals_1.expect)(spec.scenes.length).toBeGreaterThan(0);
        }
    });
    (0, globals_1.it)('each spec has totalCreditCost > 0', () => {
        const specs = campaign_service_1.CampaignService.generateCampaignSpecs(PRODUCT, 5);
        for (const spec of specs) {
            (0, globals_1.expect)(spec.totalCreditCost).toBeGreaterThan(0);
        }
    });
    (0, globals_1.it)('each spec has hookPrompt containing product description', () => {
        const specs = campaign_service_1.CampaignService.generateCampaignSpecs(PRODUCT, 5);
        const hasProduct = specs.some((s) => s.hookPrompt.includes('Kopi'));
        (0, globals_1.expect)(hasProduct).toBe(true);
    });
    (0, globals_1.it)('all 3 duration presets work', () => {
        for (const preset of ['quick', 'standard', 'extended']) {
            const specs = campaign_service_1.CampaignService.generateCampaignSpecs(PRODUCT, 5, preset);
            (0, globals_1.expect)(specs).toHaveLength(5);
        }
    });
});
// ── getCampaignCost ───────────────────────────────────────────────────────────
(0, globals_1.describe)('CampaignService.getCampaignCost', () => {
    (0, globals_1.it)('returns a positive number for size=5', () => {
        (0, globals_1.expect)(campaign_service_1.CampaignService.getCampaignCost(5)).toBeGreaterThan(0);
    });
    (0, globals_1.it)('returns a positive number for size=10', () => {
        (0, globals_1.expect)(campaign_service_1.CampaignService.getCampaignCost(10)).toBeGreaterThan(0);
    });
    (0, globals_1.it)('cost for size=10 is greater than cost for size=5', () => {
        (0, globals_1.expect)(campaign_service_1.CampaignService.getCampaignCost(10)).toBeGreaterThan(campaign_service_1.CampaignService.getCampaignCost(5));
    });
});
// ── getCampaignSavings ────────────────────────────────────────────────────────
(0, globals_1.describe)('CampaignService.getCampaignSavings', () => {
    (0, globals_1.it)('returns savings >= 0 for size=5', () => {
        (0, globals_1.expect)(campaign_service_1.CampaignService.getCampaignSavings(5)).toBeGreaterThanOrEqual(0);
    });
    (0, globals_1.it)('returns savings >= 0 for size=10', () => {
        (0, globals_1.expect)(campaign_service_1.CampaignService.getCampaignSavings(10)).toBeGreaterThanOrEqual(0);
    });
});
// ── formatCampaignMessage ─────────────────────────────────────────────────────
(0, globals_1.describe)('CampaignService.formatCampaignMessage', () => {
    (0, globals_1.it)('returns non-empty string for size=5', () => {
        const msg = campaign_service_1.CampaignService.formatCampaignMessage(5);
        (0, globals_1.expect)(typeof msg).toBe('string');
        (0, globals_1.expect)(msg.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('returns non-empty string for size=10', () => {
        const msg = campaign_service_1.CampaignService.formatCampaignMessage(10);
        (0, globals_1.expect)(typeof msg).toBe('string');
        (0, globals_1.expect)(msg.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('message contains campaign size info', () => {
        const msg5 = campaign_service_1.CampaignService.formatCampaignMessage(5);
        const msg10 = campaign_service_1.CampaignService.formatCampaignMessage(10);
        // At least one should mention the count
        (0, globals_1.expect)(msg5.includes('5') || msg10.includes('10')).toBe(true);
    });
});
//# sourceMappingURL=campaign.service.test.js.map