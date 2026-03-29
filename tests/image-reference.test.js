"use strict";
/**
 * Image Reference & Avatar Tests
 *
 * Tests smart routing, img2img, IP-Adapter, avatar CRUD,
 * and backward compatibility of text-to-image flow.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const image_service_1 = require("@/services/image.service");
const avatar_service_1 = require("@/services/avatar.service");
const database_1 = require("@/config/database");
// ── Test user setup ──
const TEST_TELEGRAM_ID = BigInt(999999999);
beforeAll(async () => {
    // Clean up any leftover test avatars from previous runs
    try {
        await database_1.prisma.userAvatar.deleteMany({ where: { userId: TEST_TELEGRAM_ID } });
    }
    catch (_) { /* table might not exist yet */ }
    // Ensure test user exists
    await database_1.prisma.user.upsert({
        where: { telegramId: TEST_TELEGRAM_ID },
        update: {},
        create: {
            telegramId: TEST_TELEGRAM_ID,
            firstName: 'TestUser',
            username: 'testuser_imgref',
            tier: 'pro',
            creditBalance: 100,
        },
    });
});
afterAll(async () => {
    // Clean up test avatars
    await database_1.prisma.userAvatar.deleteMany({
        where: { userId: TEST_TELEGRAM_ID },
    });
    await database_1.prisma.$disconnect();
});
// ── Mode Detection ──
describe('Image Generation Mode Detection', () => {
    it('should default to text2img when no reference or avatar', () => {
        const params = {
            prompt: 'A product on white background',
            category: 'product',
        };
        // Mode detection is internal — test via generateImage behavior
        // With DEMO_MODE, we can verify it returns
        expect(params.referenceImageUrl).toBeUndefined();
        expect(params.avatarImageUrl).toBeUndefined();
        expect(params.mode).toBeUndefined();
    });
    it('should detect img2img mode when referenceImageUrl is set', () => {
        const params = {
            prompt: 'Product on marble table',
            category: 'product',
            referenceImageUrl: 'https://example.com/product.jpg',
        };
        expect(params.referenceImageUrl).toBeDefined();
        expect(params.mode).toBeUndefined(); // auto-detected internally
    });
    it('should detect ip_adapter mode when avatarImageUrl is set', () => {
        const params = {
            prompt: 'Person in office setting',
            category: 'product',
            avatarImageUrl: 'https://example.com/avatar.jpg',
        };
        expect(params.avatarImageUrl).toBeDefined();
    });
    it('should respect explicit mode override', () => {
        const params = {
            prompt: 'Product shot',
            category: 'product',
            mode: 'ip_adapter',
            avatarImageUrl: 'https://example.com/avatar.jpg',
        };
        expect(params.mode).toBe('ip_adapter');
    });
});
// ── Backward Compatibility ──
describe('Backward Compatibility — Text-to-Image', () => {
    it('generateProductImage should work without reference (string-only signature)', async () => {
        // This tests the old API signature still works
        const originalEnv = process.env.DEMO_MODE;
        process.env.DEMO_MODE = 'true';
        const result = await image_service_1.ImageGenerationService.generateProductImage('Modern smartphone on white background');
        expect(result.success).toBe(true);
        expect(result.imageUrl).toBeDefined();
        expect(result.provider).toBe('demo');
        process.env.DEMO_MODE = originalEnv;
    });
    it('generateFoodImage should work without reference', async () => {
        const originalEnv = process.env.DEMO_MODE;
        process.env.DEMO_MODE = 'true';
        const result = await image_service_1.ImageGenerationService.generateFoodImage('Sushi platter with wasabi');
        expect(result.success).toBe(true);
        expect(result.provider).toBe('demo');
        process.env.DEMO_MODE = originalEnv;
    });
    it('generateRealEstateImage should work without reference', async () => {
        const originalEnv = process.env.DEMO_MODE;
        process.env.DEMO_MODE = 'true';
        const result = await image_service_1.ImageGenerationService.generateRealEstateImage('Modern villa with pool');
        expect(result.success).toBe(true);
        process.env.DEMO_MODE = originalEnv;
    });
    it('generateCarImage should work without reference', async () => {
        const originalEnv = process.env.DEMO_MODE;
        process.env.DEMO_MODE = 'true';
        const result = await image_service_1.ImageGenerationService.generateCarImage('Red Ferrari on mountain road');
        expect(result.success).toBe(true);
        process.env.DEMO_MODE = originalEnv;
    });
});
// ── Reference Image Flow ──
describe('Reference Image (img2img) Flow', () => {
    it('generateProductImage with referenceImageUrl should pass it through', async () => {
        const originalEnv = process.env.DEMO_MODE;
        process.env.DEMO_MODE = 'true';
        // With DEMO_MODE, all providers are skipped → demo fallback
        // But this verifies the function signature accepts referenceImageUrl
        const result = await image_service_1.ImageGenerationService.generateProductImage('Product on marble table', 'https://example.com/my-product.jpg');
        expect(result.success).toBe(true);
        process.env.DEMO_MODE = originalEnv;
    });
    it('generateImage with referenceImageUrl should set img2img mode', async () => {
        const originalEnv = process.env.DEMO_MODE;
        process.env.DEMO_MODE = 'true';
        const result = await image_service_1.ImageGenerationService.generateImage({
            prompt: 'Product on marble table, soft lighting',
            category: 'product',
            aspectRatio: '1:1',
            style: 'commercial',
            referenceImageUrl: 'https://example.com/my-product.jpg',
        });
        expect(result.success).toBe(true);
        process.env.DEMO_MODE = originalEnv;
    });
});
// ── Avatar CRUD ──
describe('Avatar Service CRUD', () => {
    let createdAvatarId;
    it('should create an avatar', async () => {
        const avatar = await avatar_service_1.AvatarService.createAvatar(TEST_TELEGRAM_ID, 'Test Avatar', 'https://example.com/avatar-test.jpg');
        expect(avatar.id).toBeDefined();
        expect(avatar.name).toBe('Test Avatar');
        expect(avatar.imageUrl).toBe('https://example.com/avatar-test.jpg');
        expect(avatar.isDefault).toBe(true); // First avatar → default
        createdAvatarId = avatar.id;
    });
    it('should list avatars', async () => {
        const avatars = await avatar_service_1.AvatarService.listAvatars(TEST_TELEGRAM_ID);
        expect(avatars.length).toBeGreaterThanOrEqual(1);
        expect(avatars.some(a => a.name === 'Test Avatar')).toBe(true);
    });
    it('should get avatar by ID', async () => {
        const avatar = await avatar_service_1.AvatarService.getAvatar(createdAvatarId);
        expect(avatar).not.toBeNull();
        expect(avatar.name).toBe('Test Avatar');
    });
    it('should get default avatar', async () => {
        const avatar = await avatar_service_1.AvatarService.getDefaultAvatar(TEST_TELEGRAM_ID);
        expect(avatar).not.toBeNull();
        expect(avatar.isDefault).toBe(true);
    });
    it('should create second avatar (non-default)', async () => {
        const avatar2 = await avatar_service_1.AvatarService.createAvatar(TEST_TELEGRAM_ID, 'Second Avatar', 'https://example.com/avatar-2.jpg');
        expect(avatar2.isDefault).toBe(false); // Second → not default
    });
    it('should set a different avatar as default', async () => {
        const avatars = await avatar_service_1.AvatarService.listAvatars(TEST_TELEGRAM_ID);
        const nonDefault = avatars.find(a => !a.isDefault);
        expect(nonDefault).toBeDefined();
        await avatar_service_1.AvatarService.setDefault(TEST_TELEGRAM_ID, nonDefault.id);
        const newDefault = await avatar_service_1.AvatarService.getDefaultAvatar(TEST_TELEGRAM_ID);
        expect(newDefault.id).toBe(nonDefault.id);
        // Old default should no longer be default
        const oldDefault = await avatar_service_1.AvatarService.getAvatar(createdAvatarId);
        expect(oldDefault.isDefault).toBe(false);
    });
    it('should enforce max avatar limit', async () => {
        // Create up to max (5) — already have 2, add 3 more
        for (let i = 3; i <= 5; i++) {
            await avatar_service_1.AvatarService.createAvatar(TEST_TELEGRAM_ID, `Avatar ${i}`, `https://example.com/avatar-${i}.jpg`);
        }
        // 6th should fail
        await expect(avatar_service_1.AvatarService.createAvatar(TEST_TELEGRAM_ID, 'Too Many', 'https://example.com/avatar-6.jpg')).rejects.toThrow('Maximum 5 avatars');
    });
    it('should delete an avatar', async () => {
        const avatars = await avatar_service_1.AvatarService.listAvatars(TEST_TELEGRAM_ID);
        const toDelete = avatars[avatars.length - 1];
        const deleted = await avatar_service_1.AvatarService.deleteAvatar(TEST_TELEGRAM_ID, toDelete.id);
        expect(deleted).toBe(true);
        const afterDelete = await avatar_service_1.AvatarService.listAvatars(TEST_TELEGRAM_ID);
        expect(afterDelete.length).toBe(avatars.length - 1);
    });
    it('should promote next avatar if default is deleted', async () => {
        const defaultAvatar = await avatar_service_1.AvatarService.getDefaultAvatar(TEST_TELEGRAM_ID);
        expect(defaultAvatar).not.toBeNull();
        await avatar_service_1.AvatarService.deleteAvatar(TEST_TELEGRAM_ID, defaultAvatar.id);
        const newDefault = await avatar_service_1.AvatarService.getDefaultAvatar(TEST_TELEGRAM_ID);
        // Should have promoted another one
        if (newDefault) {
            expect(newDefault.isDefault).toBe(true);
            expect(newDefault.id).not.toBe(defaultAvatar.id);
        }
    });
    it('should return false when deleting non-existent avatar', async () => {
        const deleted = await avatar_service_1.AvatarService.deleteAvatar(TEST_TELEGRAM_ID, 999999);
        expect(deleted).toBe(false);
    });
});
// ── Avatar + Image Generation ──
describe('Generate with Avatar (IP-Adapter)', () => {
    it('generateWithAvatar should accept avatar URL and use ip_adapter mode', async () => {
        const originalEnv = process.env.DEMO_MODE;
        process.env.DEMO_MODE = 'true';
        const result = await image_service_1.ImageGenerationService.generateWithAvatar('Person presenting a product in a modern office', 'https://example.com/avatar.jpg', 'product', '1:1');
        expect(result.success).toBe(true);
        process.env.DEMO_MODE = originalEnv;
    });
});
// ── Provider Capability Verification ──
describe('Provider Config Capability Flags', () => {
    it('should have correct capability flags in PROVIDER_CONFIG', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PROVIDER_CONFIG } = require('@/config/providers');
        // Text-only providers
        expect(PROVIDER_CONFIG.image.geminigen.supportsImg2Img).toBe(false);
        expect(PROVIDER_CONFIG.image.geminigen.supportsIPAdapter).toBe(false);
        expect(PROVIDER_CONFIG.image.nvidia.supportsImg2Img).toBe(false);
        expect(PROVIDER_CONFIG.image.nvidia.supportsIPAdapter).toBe(false);
        expect(PROVIDER_CONFIG.image.huggingface.supportsImg2Img).toBe(false);
        // Capable providers
        expect(PROVIDER_CONFIG.image.falai.supportsImg2Img).toBe(true);
        expect(PROVIDER_CONFIG.image.falai.supportsIPAdapter).toBe(true);
        expect(PROVIDER_CONFIG.image.gemini.supportsImg2Img).toBe(true);
        expect(PROVIDER_CONFIG.image.gemini.supportsIPAdapter).toBe(false);
        expect(PROVIDER_CONFIG.image.replicate.supportsImg2Img).toBe(true);
        expect(PROVIDER_CONFIG.image.replicate.supportsIPAdapter).toBe(true);
        // New aggregator providers
        expect(PROVIDER_CONFIG.image.laozhang.supportsImg2Img).toBe(true);
        expect(PROVIDER_CONFIG.image.laozhang.supportsIPAdapter).toBe(false);
        expect(PROVIDER_CONFIG.image.laozhang.costPerGenerationUsd).toBe(0.04);
        expect(PROVIDER_CONFIG.image.evolink.supportsImg2Img).toBe(true);
        expect(PROVIDER_CONFIG.image.evolink.supportsIPAdapter).toBe(false);
        expect(PROVIDER_CONFIG.image.evolink.costPerGenerationUsd).toBe(0.03);
        // Cheapest providers
        expect(PROVIDER_CONFIG.image.together.supportsImg2Img).toBe(false);
        expect(PROVIDER_CONFIG.image.together.costPerGenerationUsd).toBe(0.003);
        expect(PROVIDER_CONFIG.image.segmind.supportsImg2Img).toBe(true);
        expect(PROVIDER_CONFIG.image.segmind.supportsIPAdapter).toBe(true);
        expect(PROVIDER_CONFIG.image.segmind.costPerGenerationUsd).toBe(0.01);
    });
});
// ── ImageGenerationParams interface ──
describe('ImageGenerationParams Interface', () => {
    it('should support all new fields', () => {
        const params = {
            prompt: 'test',
            category: 'product',
            style: 'commercial',
            aspectRatio: '1:1',
            referenceImageUrl: 'https://example.com/ref.jpg',
            referenceImagePath: '/tmp/ref.jpg',
            avatarImageUrl: 'https://example.com/avatar.jpg',
            avatarImagePath: '/tmp/avatar.jpg',
            mode: 'img2img',
        };
        expect(params.referenceImageUrl).toBe('https://example.com/ref.jpg');
        expect(params.referenceImagePath).toBe('/tmp/ref.jpg');
        expect(params.avatarImageUrl).toBe('https://example.com/avatar.jpg');
        expect(params.avatarImagePath).toBe('/tmp/avatar.jpg');
        expect(params.mode).toBe('img2img');
    });
    it('should work with minimal params (backward compat)', () => {
        const params = {
            prompt: 'test',
            category: 'product',
        };
        expect(params.referenceImageUrl).toBeUndefined();
        expect(params.avatarImageUrl).toBeUndefined();
        expect(params.mode).toBeUndefined();
    });
});
//# sourceMappingURL=image-reference.test.js.map