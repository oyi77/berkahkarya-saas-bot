"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAnalytics = exports.mockPricingConfig = exports.mockPromptCache = exports.mockUnhealthyProvider = exports.mockProviderHealth = exports.mockSavedPrompt = exports.mockAvatar = exports.mockSocialAccount = exports.mockCommission = exports.mockSubscription = exports.mockPendingTransaction = exports.mockTransaction = exports.mockFailedVideo = exports.mockProcessingVideo = exports.mockVideo = exports.mockPremiumUser = exports.mockUser = void 0;
exports.createMockContext = createMockContext;
exports.createMockCallbackContext = createMockCallbackContext;
const library_js_1 = require("@prisma/client/runtime/library.js");
exports.mockUser = {
    id: BigInt(1),
    telegramId: BigInt(123456789),
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    username: "testuser",
    firstName: "Test",
    lastName: "User",
    tier: "free",
    creditBalance: new library_js_1.Decimal(10),
    referralCode: "TEST123",
    language: "id",
    isBanned: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
};
exports.mockPremiumUser = {
    ...exports.mockUser,
    id: BigInt(2),
    telegramId: BigInt(987654321),
    uuid: "550e8400-e29b-41d4-a716-446655440001",
    username: "premium_user",
    tier: "pro",
    creditBalance: new library_js_1.Decimal(100),
    referralCode: "PREMIUM",
};
exports.mockVideo = {
    id: BigInt(1),
    userId: BigInt(123456789),
    jobId: "job_test_123",
    niche: "fnb",
    platform: "tiktok",
    duration: 30,
    scenes: 5,
    status: "completed",
    progress: 100,
    creditsUsed: new library_js_1.Decimal(1),
    videoUrl: "https://example.com/video.mp4",
    thumbnailUrl: "https://example.com/thumb.jpg",
    createdAt: new Date(),
};
exports.mockProcessingVideo = {
    ...exports.mockVideo,
    id: BigInt(2),
    jobId: "job_processing_456",
    status: "processing",
    progress: 50,
    videoUrl: null,
};
exports.mockFailedVideo = {
    ...exports.mockVideo,
    id: BigInt(3),
    jobId: "job_failed_789",
    status: "failed",
    progress: 0,
    errorMessage: "Provider timeout",
    videoUrl: null,
};
exports.mockTransaction = {
    id: BigInt(1),
    orderId: "ORDER-TEST-001",
    userId: BigInt(123456789),
    type: "topup",
    packageName: "starter",
    amountIdr: new library_js_1.Decimal(50000),
    creditsAmount: new library_js_1.Decimal(6),
    gateway: "midtrans",
    status: "success",
    createdAt: new Date(),
    paidAt: new Date(),
};
exports.mockPendingTransaction = {
    ...exports.mockTransaction,
    id: BigInt(2),
    orderId: "ORDER-PENDING-002",
    status: "pending",
    paidAt: null,
};
exports.mockSubscription = {
    id: BigInt(1),
    userId: BigInt(123456789),
    plan: "pro",
    billingCycle: "monthly",
    status: "active",
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
};
exports.mockCommission = {
    id: BigInt(1),
    referrerId: BigInt(123456789),
    referredId: BigInt(987654321),
    amount: new library_js_1.Decimal(5000),
    tier: 1,
    status: "available",
    availableAt: new Date(),
    createdAt: new Date(),
};
exports.mockSocialAccount = {
    id: 1,
    userId: BigInt(123456789),
    platform: "tiktok",
    pbAccountId: "pb_tiktok_123",
    accountName: "@testuser",
    status: "active",
};
exports.mockAvatar = {
    id: 1,
    userId: BigInt(123456789),
    name: "Test Avatar",
    imageUrl: "https://example.com/avatar.jpg",
    isDefault: true,
    createdAt: new Date(),
};
exports.mockSavedPrompt = {
    id: 1,
    userId: BigInt(123456789),
    title: "Test Prompt",
    prompt: "Cinematic food shot with steam",
    niche: "fnb",
    source: "custom",
    usageCount: 5,
    createdAt: new Date(),
};
exports.mockProviderHealth = {
    provider: "geminigen",
    status: "healthy",
    failureCount: 0,
    circuitBreakerState: "closed",
    lastSuccess: new Date(),
    updatedAt: new Date(),
};
exports.mockUnhealthyProvider = {
    provider: "byteplus",
    status: "unhealthy",
    failureCount: 5,
    circuitBreakerState: "open",
    lastFailure: new Date(),
    updatedAt: new Date(),
};
exports.mockPromptCache = {
    id: 1,
    promptHash: "abc123",
    rawPrompt: "Original prompt text",
    provider: "geminigen",
    optimizedPrompt: "Optimized prompt text",
    hitCount: 10,
    createdAt: new Date(),
};
exports.mockPricingConfig = {
    id: 1,
    category: "credits",
    key: "per_video_cost",
    value: { baseCost: 0.5, premiumCost: 0.25 },
    updatedAt: new Date(),
};
exports.mockAnalytics = {
    id: 1,
    userId: BigInt(123456789),
    jobId: "job_test_123",
    niche: "fnb",
    styles: ["editorial", "viral"],
    providerUsed: "geminigen",
    fallbackCount: 0,
    optimizationUsed: true,
    generationTimeMs: 45000,
    sceneCount: 5,
    duration: 30,
    creditsUsed: new library_js_1.Decimal(1),
    createdAt: new Date(),
};
function createMockContext(overrides = {}) {
    const defaultContext = {
        from: {
            id: 123456789,
            is_bot: false,
            first_name: "Test",
            last_name: "User",
            username: "testuser",
            language_code: "en",
        },
        chat: {
            id: 123456789,
            type: "private",
        },
        session: {
            state: "DASHBOARD",
            lastActivity: new Date(),
            creditBalance: 10,
            tier: "free",
        },
        reply: jest.fn(),
        editMessageText: jest.fn(),
        editMessageMedia: jest.fn(),
        answerCbQuery: jest.fn(),
        replyWithPhoto: jest.fn(),
        replyWithVideo: jest.fn(),
        replyWithAnimation: jest.fn(),
        replyWithInvoice: jest.fn(),
        deleteMessage: jest.fn(),
        telegram: {
            sendMessage: jest.fn(),
            sendPhoto: jest.fn(),
            sendVideo: jest.fn(),
            sendAnimation: jest.fn(),
            getFileLink: jest.fn(),
            setWebhook: jest.fn(),
            deleteWebhook: jest.fn(),
            setMyCommands: jest.fn(),
            deleteMessage: jest.fn(() => Promise.resolve()),
        },
    };
    return { ...defaultContext, ...overrides };
}
function createMockCallbackContext(data, overrides = {}) {
    const ctx = createMockContext(overrides);
    return ctx;
}
//# sourceMappingURL=index.js.map