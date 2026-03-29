"use strict";
/**
 * Unit Tests — PromptEngine
 *
 * Validates that enrichForImage() and enrichForVideo() produce prompts with
 * the expected professional-grade layers (camera specs, lighting, style,
 * motion, etc.) and that negative prompts and provider_hints are well-formed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_engine_1 = require("@/config/prompt-engine");
describe('PromptEngine', () => {
    // ── enrichForImage ──
    describe('enrichForImage()', () => {
        it('should contain camera specs, lighting, and style for product category', () => {
            const result = prompt_engine_1.PromptEngine.enrichForImage('smartphone', 'product');
            // Camera specs layer
            expect(result.full).toMatch(/Canon EOS R5|85mm|f\/2\.8/);
            // Lighting layer
            expect(result.full).toMatch(/studio lighting|softbox/i);
            // Style layer
            expect(result.full).toMatch(/photorealistic|commercial/i);
        });
        it('should contain food-specific terms for fnb category', () => {
            const result = prompt_engine_1.PromptEngine.enrichForImage('nasi goreng', 'fnb');
            // FnB subject enrichment
            expect(result.full).toMatch(/food styled|steam|appetizing|fresh/i);
            // FnB lighting preset
            expect(result.full).toMatch(/warm|directional|side/i);
            // FnB camera preset
            expect(result.full).toMatch(/Sony A7IV|85mm|f\/1\.8/i);
        });
        it('should include a negative prompt that excludes bad quality terms', () => {
            const result = prompt_engine_1.PromptEngine.enrichForImage('smartphone', 'product');
            expect(result.negative).toMatch(/blurry/i);
            expect(result.negative).toMatch(/low quality/i);
            expect(result.negative).toMatch(/distorted/i);
            expect(result.negative).toMatch(/watermark/i);
        });
        it('should include category-specific negative terms for product', () => {
            const result = prompt_engine_1.PromptEngine.enrichForImage('smartphone', 'product');
            expect(result.negative).toMatch(/cartoon|anime|illustration/i);
        });
        it('should include category-specific negative terms for fnb', () => {
            const result = prompt_engine_1.PromptEngine.enrichForImage('nasi goreng', 'fnb');
            expect(result.negative).toMatch(/artificial looking food|plastic food/i);
        });
        it('should produce a provider_hint shorter than the full prompt', () => {
            const result = prompt_engine_1.PromptEngine.enrichForImage('smartphone', 'product');
            expect(result.provider_hint.length).toBeLessThan(result.full.length);
            expect(result.provider_hint.length).toBeGreaterThan(0);
        });
        it('should fallback to product template for unknown category', () => {
            const result = prompt_engine_1.PromptEngine.enrichForImage('mystery item', 'nonexistent_category');
            // Should still produce a valid prompt using product template
            expect(result.full).toMatch(/Canon EOS R5|softbox|studio/i);
            expect(result.negative).toBeTruthy();
        });
    });
    // ── enrichForVideo ──
    describe('enrichForVideo()', () => {
        it('should contain motion, camera, and speed terms', () => {
            const result = prompt_engine_1.PromptEngine.enrichForVideo('smartphone product showcase', 'tech', 'realistic', 10);
            // Motion direction (legacy or V3)
            expect(result.full).toMatch(/orbit|movement|motion|camera|tracking/i);
            // Speed/framerate
            expect(result.full).toMatch(/60fps|speed/i);
            // Cinematic layer
            expect(result.full).toMatch(/cinematic/i);
        });
        it('should include scene label when sceneNumber and totalScenes are given', () => {
            const result = prompt_engine_1.PromptEngine.enrichForVideo('coffee being poured', 'fnb', 'realistic', 5, 2, 4);
            expect(result.full).toContain('[Scene 2/4]');
            expect(result.provider_hint).toContain('[Scene 2/4]');
        });
        it('should not include scene label when sceneNumber is absent', () => {
            const result = prompt_engine_1.PromptEngine.enrichForVideo('coffee being poured', 'fnb', 'realistic', 5);
            expect(result.full).not.toContain('[Scene');
        });
        it('should include duration in the prompt', () => {
            const result = prompt_engine_1.PromptEngine.enrichForVideo('product demo', 'tech', 'cinematic', 15);
            expect(result.full).toContain('15s');
        });
        it('should produce a negative prompt excluding static/amateur terms', () => {
            const result = prompt_engine_1.PromptEngine.enrichForVideo('product demo', 'tech', 'realistic', 10);
            expect(result.negative).toMatch(/static image|slideshow|no movement/i);
            expect(result.negative).toMatch(/blurry|low quality/i);
        });
        it('should produce a provider_hint shorter than the full prompt', () => {
            const result = prompt_engine_1.PromptEngine.enrichForVideo('product demo', 'tech', 'realistic', 10);
            expect(result.provider_hint.length).toBeLessThan(result.full.length);
        });
    });
    // ── getNegativePrompt ──
    describe('getNegativePrompt()', () => {
        it('should always include universal negative terms', () => {
            const neg = prompt_engine_1.PromptEngine.getNegativePrompt('product');
            expect(neg).toMatch(/blurry/);
            expect(neg).toMatch(/watermark/);
        });
        it('should include category-specific negatives when available', () => {
            const neg = prompt_engine_1.PromptEngine.getNegativePrompt('food');
            expect(neg).toMatch(/artificial looking food/i);
        });
        it('should return only universal negatives for unknown category', () => {
            const neg = prompt_engine_1.PromptEngine.getNegativePrompt('unknown_cat');
            expect(neg).toMatch(/blurry/);
            // Should not throw
            expect(neg.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=prompt-engine.test.js.map