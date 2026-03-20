/**
 * Unit Tests — SceneConsistencyEngine
 *
 * Validates that createMemory() extracts subject and visual identity,
 * enrichScenePrompt() returns the first scene unchanged, and subsequent
 * scenes get continuity anchors injected.
 */

// Mock dependencies before importing the module under test
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/config/niches', () => ({
  NICHE_CONFIG: {
    fashion_lifestyle: {
      colorPalettes: ['neutral tones', 'pastel'],
    },
    food_culinary: {
      colorPalettes: ['warm tones', 'rustic'],
    },
  },
}));

jest.mock('@/config/styles', () => ({
  STYLE_PRESETS: {
    realistic: {
      lighting: ['golden hour natural light', 'soft window light'],
    },
    cinematic: {
      lighting: ['cinematic lighting', 'dramatic chiaroscuro'],
    },
  },
}));

import { SceneConsistencyEngine, SceneMemory } from '@/services/scene-consistency.service';

describe('SceneConsistencyEngine', () => {
  // ── createMemory ──

  describe('createMemory()', () => {
    it('should extract the main subject from the first clause of the prompt', () => {
      const memory = SceneConsistencyEngine.createMemory(
        'a beautiful leather handbag, on a marble countertop, golden hour light',
        'fashion_lifestyle',
        'realistic',
      );

      expect(memory.mainSubject).toBe('a beautiful leather handbag');
    });

    it('should strip duration tokens from subject extraction', () => {
      const memory = SceneConsistencyEngine.createMemory(
        '10s smartphone on a desk, tiktok format, professional style',
        'tech',
        'realistic',
      );

      // "10s" and "tiktok format" and "professional style" should be removed
      expect(memory.mainSubject).not.toMatch(/10s/);
      expect(memory.mainSubject).not.toMatch(/tiktok format/i);
    });

    it('should derive color palette from niche config when available', () => {
      const memory = SceneConsistencyEngine.createMemory(
        'red dress on a model',
        'fashion_lifestyle',
        'realistic',
      );

      expect(memory.colorPalette).toBe('neutral tones');
    });

    it('should use fallback color palette for unknown niche', () => {
      const memory = SceneConsistencyEngine.createMemory(
        'a product on a table',
        'tech',
        'realistic',
      );

      // tech is not in NICHE_CONFIG mock, so should use fallback
      expect(memory.colorPalette).toBe('cool modern tones');
    });

    it('should derive lighting from style preset when available', () => {
      const memory = SceneConsistencyEngine.createMemory(
        'a product on a table',
        'tech',
        'realistic',
      );

      expect(memory.lightingStyle).toBe('golden hour natural light');
    });

    it('should set mood from the niche mood map', () => {
      const memory = SceneConsistencyEngine.createMemory(
        'nasi goreng close-up',
        'fnb',
        'realistic',
      );

      expect(memory.mood).toBe('warm and appetizing');
    });

    it('should store the full first scene prompt in previousSceneDescription', () => {
      const prompt = 'a beautiful leather handbag on marble';
      const memory = SceneConsistencyEngine.createMemory(prompt, 'fashion_lifestyle', 'realistic');

      expect(memory.previousSceneDescription).toBe(prompt);
    });
  });

  // ── enrichScenePrompt ──

  describe('enrichScenePrompt()', () => {
    let memory: SceneMemory;

    beforeEach(() => {
      memory = {
        mainSubject: 'leather handbag',
        colorPalette: 'neutral tones',
        lightingStyle: 'golden hour natural light',
        cameraStyle: 'natural perspective, steady framing',
        mood: 'stylish and aspirational',
        previousSceneDescription: 'leather handbag on marble countertop',
      };
    });

    it('should return the prompt unchanged for scene index 0', () => {
      const original = 'leather handbag hero shot on marble';
      const result = SceneConsistencyEngine.enrichScenePrompt(original, memory, 0);

      expect(result).toBe(original);
    });

    it('should add continuity anchors for scene index > 0', () => {
      const scenePrompt = 'close-up of handbag stitching detail';
      const result = SceneConsistencyEngine.enrichScenePrompt(scenePrompt, memory, 1);

      // Should contain the original prompt
      expect(result).toContain(scenePrompt);

      // Should contain continuity reference to previous scene
      expect(result).toContain('[Continuing from previous scene:');
      expect(result).toContain('leather handbag on marble countertop');

      // Should contain visual consistency anchors
      expect(result).toContain('[Visual consistency:');
      expect(result).toContain('maintaining focus on leather handbag');
      expect(result).toContain('neutral tones color palette');
      expect(result).toContain('golden hour natural light');
      expect(result).toContain('stylish and aspirational mood');
    });

    it('should update memory.previousSceneDescription after enrichment', () => {
      const scenePrompt = 'wide shot of handbag in store window';
      SceneConsistencyEngine.enrichScenePrompt(scenePrompt, memory, 1);

      expect(memory.previousSceneDescription).toBe(scenePrompt);
    });

    it('should chain scene descriptions across multiple scenes', () => {
      const scene2 = 'detail shot of zipper';
      SceneConsistencyEngine.enrichScenePrompt(scene2, memory, 1);
      expect(memory.previousSceneDescription).toBe(scene2);

      const scene3 = 'lifestyle shot with model';
      const result = SceneConsistencyEngine.enrichScenePrompt(scene3, memory, 2);

      // Scene 3 should reference scene 2's prompt as previous
      expect(result).toContain('detail shot of zipper');
    });
  });
});
