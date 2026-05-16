import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Prisma
const mockFindMany = jest.fn() as any;
const mockCreate = jest.fn() as any;
const mockUpdate = jest.fn() as any;
const mockDelete = jest.fn() as any;

jest.mock('@/config/database', () => ({
  prisma: {
    templateVideo: {
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
    },
  },
}));

import { TemplateVideoService } from '@/services/template-video.service';

describe('TemplateVideoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getByNiche', () => {
    it('returns active templates for a niche', async () => {
      const mockTemplates = [
        { id: 1n, niche: 'food_culinary', title: 'Food Demo', videoUrl: 'https://example.com/food.mp4', isActive: true },
      ];
      mockFindMany.mockResolvedValue(mockTemplates);

      const result = await TemplateVideoService.getByNiche('food_culinary');

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { niche: 'food_culinary', isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('getRandom', () => {
    it('returns null when no templates exist for niche or general', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await TemplateVideoService.getRandom('nonexistent');

      expect(result).toBeNull();
    });

    it('returns a template from the niche', async () => {
      const template = { id: 1n, niche: 'fashion', title: 'Fashion Demo', videoUrl: 'https://example.com/fashion.mp4' };
      mockFindMany.mockResolvedValue([template]);

      const result = await TemplateVideoService.getRandom('fashion');

      expect(result).toEqual(template);
    });

    it('falls back to general niche when specific niche is empty', async () => {
      const generalTemplate = { id: 2n, niche: 'general', title: 'General Demo', videoUrl: 'https://example.com/general.mp4' };
      mockFindMany
        .mockResolvedValueOnce([]) // First call: specific niche returns empty
        .mockResolvedValueOnce([generalTemplate]); // Second call: general returns template

      const result = await TemplateVideoService.getRandom('rare_niche');

      expect(result).toEqual(generalTemplate);
      expect(mockFindMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('create', () => {
    it('creates a new template', async () => {
      const data = { niche: 'tech', title: 'Tech Demo', videoUrl: 'https://example.com/tech.mp4' };
      mockCreate.mockResolvedValue({ id: 3n, ...data });

      const result = await TemplateVideoService.create(data);

      expect(mockCreate).toHaveBeenCalledWith({ data });
      expect(result.niche).toBe('tech');
    });
  });

  describe('cacheGeneratedVideo', () => {
    it('creates a template from a generated video', async () => {
      mockCreate.mockResolvedValue({ id: 4n });

      await TemplateVideoService.cacheGeneratedVideo('beauty', 'https://cdn.example.com/beauty.mp4', undefined, 15);

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          niche: 'beauty',
          videoUrl: 'https://cdn.example.com/beauty.mp4',
          duration: 15,
          isActive: true,
        }),
      });
    });
  });
});
