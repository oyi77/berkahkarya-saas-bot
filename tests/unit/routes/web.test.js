"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const mockPrismaVideoCreate = globals_1.jest.fn();
const mockPrismaVideoFindMany = globals_1.jest.fn();
const mockPrismaTransactionFindMany = globals_1.jest.fn();
globals_1.jest.mock("@/config/database", () => ({
    prisma: {
        video: { create: mockPrismaVideoCreate, findMany: mockPrismaVideoFindMany },
        transaction: { findMany: mockPrismaTransactionFindMany },
    },
}));
const mockFindByTelegramId = globals_1.jest.fn();
const mockFindByUuid = globals_1.jest.fn();
const mockUserCreate = globals_1.jest.fn();
const mockDeductCredits = globals_1.jest.fn();
globals_1.jest.mock("@/services/user.service", () => ({
    UserService: {
        findByTelegramId: mockFindByTelegramId,
        findByUuid: mockFindByUuid,
        create: mockUserCreate,
        deductCredits: mockDeductCredits,
    },
}));
const mockGetByJobId = globals_1.jest.fn();
globals_1.jest.mock("@/services/video.service", () => ({
    VideoService: { getByJobId: mockGetByJobId },
}));
const mockGetPackages = globals_1.jest.fn();
const mockPaymentCreateTransaction = globals_1.jest.fn();
globals_1.jest.mock("@/services/payment.service", () => ({
    PaymentService: {
        getPackages: mockGetPackages,
        createTransaction: mockPaymentCreateTransaction,
    },
}));
const mockDuitkuCreateTransaction = globals_1.jest.fn();
globals_1.jest.mock("@/services/duitku.service", () => ({
    DuitkuService: { createTransaction: mockDuitkuCreateTransaction },
}));
const mockTripayCreateTransaction = globals_1.jest.fn();
globals_1.jest.mock("@/services/tripay.service", () => ({
    TripayService: { createTransaction: mockTripayCreateTransaction },
}));
const mockCheckTelegramHash = globals_1.jest.fn();
globals_1.jest.mock("@/utils/telegram", () => ({
    checkTelegramHash: mockCheckTelegramHash,
}));
const mockEnqueueVideoGeneration = globals_1.jest.fn();
globals_1.jest.mock("@/config/queue", () => ({
    enqueueVideoGeneration: mockEnqueueVideoGeneration,
}));
const mockGenerateStoryboard = globals_1.jest.fn();
globals_1.jest.mock("@/services/video-generation.service", () => ({
    generateStoryboard: mockGenerateStoryboard,
    NICHES: {
        fashion: { styles: ["trendy", "minimal"] },
        food: { styles: ["appetizing", "cozy"] },
    },
}));
const mockGetVideoCreditCost = globals_1.jest.fn();
globals_1.jest.mock("@/config/pricing", () => ({
    getVideoCreditCost: mockGetVideoCreditCost,
}));
const mockExistsSync = globals_1.jest.fn();
const mockCreateReadStream = globals_1.jest.fn();
const mockStatSync = globals_1.jest.fn();
globals_1.jest.mock("fs", () => ({
    existsSync: mockExistsSync,
    createReadStream: mockCreateReadStream,
    statSync: mockStatSync,
}));
process.env.JWT_SECRET = "test-jwt-secret";
process.env.BOT_TOKEN = "test-bot-token";
process.env.NODE_ENV = "test";
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const web_1 = require("@/routes/web");
function createMockRequest(body = {}, headers = {}, params = {}, query = {}) {
    return { body, headers, params, query };
}
function createMockReply() {
    return {
        status: globals_1.jest.fn().mockReturnThis(),
        send: globals_1.jest.fn().mockReturnThis(),
        view: globals_1.jest.fn().mockReturnThis(),
        type: globals_1.jest.fn().mockReturnThis(),
        header: globals_1.jest.fn().mockReturnThis(),
    };
}
function createMockServer() {
    const routes = {
        get: {},
        post: {},
    };
    const server = {
        get: globals_1.jest.fn((path, handler) => {
            routes.get[path] = handler;
        }),
        post: globals_1.jest.fn((path, handler) => {
            routes.post[path] = handler;
        }),
        register: globals_1.jest.fn().mockResolvedValue(undefined),
        log: { info: globals_1.jest.fn(), error: globals_1.jest.fn(), warn: globals_1.jest.fn() },
    };
    return { server, routes };
}
function createValidToken(userId = "user-uuid-123") {
    return jsonwebtoken_1.default.sign({ userId, telegramId: "123456789", tier: "free" }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
function createMockUser(overrides = {}) {
    return {
        uuid: "user-uuid-123",
        telegramId: BigInt(123456789),
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        creditBalance: 10,
        tier: "free",
        referralCode: "REF123",
        createdAt: new Date("2024-01-01"),
        ...overrides,
    };
}
(0, globals_1.describe)("Web Routes", () => {
    let server;
    let routes;
    (0, globals_1.beforeEach)(async () => {
        globals_1.jest.clearAllMocks();
        const mockServer = createMockServer();
        server = mockServer.server;
        routes = mockServer.routes;
        await (0, web_1.webRoutes)(server);
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.describe)("Route Registration", () => {
        (0, globals_1.it)("should register GET / route", () => {
            (0, globals_1.expect)(server.get).toHaveBeenCalledWith("/", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register GET /app route", () => {
            (0, globals_1.expect)(server.get).toHaveBeenCalledWith("/app", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register POST /auth/telegram route", () => {
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/auth/telegram", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register GET /api/user route", () => {
            (0, globals_1.expect)(server.get).toHaveBeenCalledWith("/api/user", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register POST /api/storyboard route", () => {
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/api/storyboard", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register POST /api/video/create route", () => {
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/api/video/create", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register GET /api/packages route", () => {
            (0, globals_1.expect)(server.get).toHaveBeenCalledWith("/api/packages", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register POST /api/payment/create route", () => {
            (0, globals_1.expect)(server.post).toHaveBeenCalledWith("/api/payment/create", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register GET /api/my/transactions route", () => {
            (0, globals_1.expect)(server.get).toHaveBeenCalledWith("/api/my/transactions", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register GET /api/user/videos route", () => {
            (0, globals_1.expect)(server.get).toHaveBeenCalledWith("/api/user/videos", globals_1.expect.any(Function));
        });
        (0, globals_1.it)("should register GET /video/:jobId/download route", () => {
            (0, globals_1.expect)(server.get).toHaveBeenCalledWith("/video/:jobId/download", globals_1.expect.any(Function));
        });
    });
    (0, globals_1.describe)("GET /", () => {
        (0, globals_1.it)("should render landing page", async () => {
            const handler = routes.get["/"];
            const request = createMockRequest();
            const reply = createMockReply();
            await handler(request, reply);
            (0, globals_1.expect)(reply.view).toHaveBeenCalledWith("web/landing.ejs");
        });
    });
    (0, globals_1.describe)("GET /app", () => {
        (0, globals_1.it)("should render web app page", async () => {
            const handler = routes.get["/app"];
            const request = createMockRequest();
            const reply = createMockReply();
            await handler(request, reply);
            (0, globals_1.expect)(reply.view).toHaveBeenCalledWith("web/app.ejs");
        });
    });
    (0, globals_1.describe)("POST /auth/telegram", () => {
        const handler = () => routes.post["/auth/telegram"];
        (0, globals_1.it)("should return 400 when user data is missing", async () => {
            const request = createMockRequest(null);
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Invalid user data" });
        });
        (0, globals_1.it)("should return 400 when user id is missing", async () => {
            const request = createMockRequest({ username: "test" });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Invalid user data" });
        });
        (0, globals_1.it)("should return 401 when hash verification fails in production", async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "production";
            const userData = {
                id: "123456789",
                username: "testuser",
                first_name: "Test",
                last_name: "User",
                hash: "invalid-hash",
            };
            mockCheckTelegramHash.mockReturnValue(false);
            const request = createMockRequest(userData);
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Auth hash verification failed",
            });
            process.env.NODE_ENV = originalEnv;
        });
        (0, globals_1.it)("should allow twa hash bypass in production", async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "production";
            const userData = {
                id: "123456789",
                username: "testuser",
                first_name: "Test",
                last_name: "User",
                hash: "twa",
            };
            mockCheckTelegramHash.mockReturnValue(false);
            mockFindByTelegramId.mockResolvedValue(null);
            mockUserCreate.mockResolvedValue(createMockUser({ telegramId: BigInt(123456789) }));
            const request = createMockRequest(userData);
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(result).toHaveProperty("token");
            (0, globals_1.expect)(result).toHaveProperty("user");
            process.env.NODE_ENV = originalEnv;
        });
        (0, globals_1.it)("should create new user when not found", async () => {
            const userData = {
                id: "123456789",
                username: "testuser",
                first_name: "Test",
                last_name: "User",
                hash: "valid-hash",
            };
            mockCheckTelegramHash.mockReturnValue(true);
            mockFindByTelegramId.mockResolvedValue(null);
            mockUserCreate.mockResolvedValue(createMockUser({ telegramId: BigInt(123456789) }));
            const request = createMockRequest(userData);
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockUserCreate).toHaveBeenCalledWith({
                telegramId: BigInt(123456789),
                username: "testuser",
                firstName: "Test",
                lastName: "User",
            });
            (0, globals_1.expect)(result).toHaveProperty("token");
            (0, globals_1.expect)(result).toHaveProperty("user");
        });
        (0, globals_1.it)("should return existing user when found", async () => {
            const userData = {
                id: "123456789",
                username: "testuser",
                first_name: "Test",
                last_name: "User",
                hash: "valid-hash",
            };
            mockCheckTelegramHash.mockReturnValue(true);
            mockFindByTelegramId.mockResolvedValue(createMockUser());
            const request = createMockRequest(userData);
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockUserCreate).not.toHaveBeenCalled();
            (0, globals_1.expect)(result).toHaveProperty("token");
            (0, globals_1.expect)(result).toHaveProperty("user");
            (0, globals_1.expect)(result.user).toEqual({
                id: "user-uuid-123",
                credits: 10,
                tier: "free",
            });
        });
        (0, globals_1.it)("should return valid JWT token", async () => {
            const userData = {
                id: "123456789",
                username: "testuser",
                first_name: "Test",
                hash: "valid-hash",
            };
            mockCheckTelegramHash.mockReturnValue(true);
            mockFindByTelegramId.mockResolvedValue(createMockUser());
            const request = createMockRequest(userData);
            const reply = createMockReply();
            const result = await handler()(request, reply);
            const decoded = jsonwebtoken_1.default.verify(result.token, process.env.JWT_SECRET);
            (0, globals_1.expect)(decoded.userId).toBe("user-uuid-123");
            (0, globals_1.expect)(decoded.telegramId).toBe("123456789");
        });
        (0, globals_1.it)("should return 500 on internal error", async () => {
            const userData = {
                id: "123456789",
                username: "testuser",
                first_name: "Test",
                hash: "valid-hash",
            };
            mockCheckTelegramHash.mockReturnValue(true);
            mockFindByTelegramId.mockRejectedValue(new Error("Database error"));
            const request = createMockRequest(userData);
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Authentication failed",
            });
        });
    });
    (0, globals_1.describe)("GET /api/user", () => {
        const handler = () => routes.get["/api/user"];
        (0, globals_1.it)("should return 401 when no authorization header", async () => {
            const request = createMockRequest({}, {});
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Unauthorized" });
        });
        (0, globals_1.it)("should return 401 when authorization header is malformed", async () => {
            const request = createMockRequest({}, { authorization: "InvalidHeader" });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Unauthorized" });
        });
        (0, globals_1.it)("should return 401 when token is invalid", async () => {
            const request = createMockRequest({}, { authorization: "Bearer invalid-token" });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Invalid token" });
        });
        (0, globals_1.it)("should return 404 when user not found", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(null);
            const request = createMockRequest({}, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(404);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "User not found" });
        });
        (0, globals_1.it)("should return user profile when authenticated", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            const request = createMockRequest({}, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(result).toEqual({
                id: "user-uuid-123",
                telegramId: "123456789",
                username: "testuser",
                firstName: "Test",
                credits: 10,
                tier: "free",
                referralCode: "REF123",
                createdAt: globals_1.expect.any(Date),
            });
        });
    });
    (0, globals_1.describe)("POST /api/storyboard", () => {
        const handler = () => routes.post["/api/storyboard"];
        (0, globals_1.it)("should return 400 when niche is missing", async () => {
            const request = createMockRequest({ duration: 30 });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Niche and duration required",
            });
        });
        (0, globals_1.it)("should return 400 when duration is missing", async () => {
            const request = createMockRequest({ niche: "fashion" });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Niche and duration required",
            });
        });
        (0, globals_1.it)("should generate storyboard for known niche", async () => {
            const mockStoryboard = [
                { duration: 10, description: "Scene 1" },
                { duration: 10, description: "Scene 2" },
                { duration: 10, description: "Scene 3" },
            ];
            mockGenerateStoryboard.mockReturnValue(mockStoryboard);
            const request = createMockRequest({ niche: "fashion", duration: 30 });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockGenerateStoryboard).toHaveBeenCalledWith("fashion", ["trendy", "minimal"], 30, 6);
            (0, globals_1.expect)(result.scenes).toHaveLength(3);
            (0, globals_1.expect)(result.caption).toContain("FASHION");
            (0, globals_1.expect)(result.hashtags).toContain("#fashion");
        });
        (0, globals_1.it)("should generate storyboard for unknown niche", async () => {
            const mockStoryboard = [
                { duration: 15, description: "Scene 1" },
                { duration: 15, description: "Scene 2" },
            ];
            mockGenerateStoryboard.mockReturnValue(mockStoryboard);
            const request = createMockRequest({ niche: "tech", duration: 30 });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockGenerateStoryboard).toHaveBeenCalledWith("tech", ["viral"], 30, 4);
            (0, globals_1.expect)(result.scenes).toHaveLength(2);
        });
        (0, globals_1.it)("should include custom prompt in scene descriptions", async () => {
            const mockStoryboard = [
                { duration: 15, description: "Original description" },
            ];
            mockGenerateStoryboard.mockReturnValue(mockStoryboard);
            const request = createMockRequest({
                niche: "fashion",
                duration: 30,
                customPrompt: "Show product close-up",
            });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(result.scenes[0].description).toBe("Show product close-up — Original description");
        });
        (0, globals_1.it)("should return 500 on generation error", async () => {
            mockGenerateStoryboard.mockImplementation(() => {
                throw new Error("Generation failed");
            });
            const request = createMockRequest({ niche: "fashion", duration: 30 });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Generation failed" });
        });
    });
    (0, globals_1.describe)("POST /api/video/create", () => {
        const handler = () => routes.post["/api/video/create"];
        (0, globals_1.it)("should return 401 when not authenticated", async () => {
            const request = createMockRequest({}, {});
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
        });
        (0, globals_1.it)("should return 400 when niche is missing", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            const request = createMockRequest({ duration: 30 }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "niche and duration required",
            });
        });
        (0, globals_1.it)("should return 400 when duration is missing", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            const request = createMockRequest({ niche: "fashion" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
        });
        (0, globals_1.it)("should return 402 when insufficient credits", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser({ creditBalance: 0 }));
            mockGetVideoCreditCost.mockReturnValue(5);
            const request = createMockRequest({ niche: "fashion", duration: 30 }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(402);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Insufficient credits. Need 5, have 0",
            });
        });
        (0, globals_1.it)("should create video with storyboard scenes", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockGetVideoCreditCost.mockReturnValue(1);
            mockDeductCredits.mockResolvedValue(undefined);
            mockPrismaVideoCreate.mockResolvedValue({});
            mockEnqueueVideoGeneration.mockResolvedValue(undefined);
            const storyboard = {
                scenes: [
                    { scene: 1, duration: 15, description: "Scene 1" },
                    { scene: 2, duration: 15, description: "Scene 2" },
                ],
            };
            const request = createMockRequest({ niche: "fashion", style: "trendy", duration: 30, storyboard }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockDeductCredits).toHaveBeenCalledWith(BigInt(123456789), 1);
            (0, globals_1.expect)(mockPrismaVideoCreate).toHaveBeenCalled();
            (0, globals_1.expect)(mockEnqueueVideoGeneration).toHaveBeenCalled();
            (0, globals_1.expect)(result).toEqual({
                ok: true,
                jobId: globals_1.expect.stringMatching(/^WEB-/),
                message: "Video generation started",
            });
        });
        (0, globals_1.it)("should create video with custom prompt when no storyboard", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockGetVideoCreditCost.mockReturnValue(1);
            mockDeductCredits.mockResolvedValue(undefined);
            mockPrismaVideoCreate.mockResolvedValue({});
            mockEnqueueVideoGeneration.mockResolvedValue(undefined);
            const request = createMockRequest({ niche: "fashion", duration: 30, customPrompt: "Custom video prompt" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockPrismaVideoCreate).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: globals_1.expect.objectContaining({
                    storyboard: [
                        { scene: 1, duration: 30, description: "Custom video prompt" },
                    ],
                }),
            }));
            (0, globals_1.expect)(result.ok).toBe(true);
        });
        (0, globals_1.it)("should use default description when no custom prompt", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockGetVideoCreditCost.mockReturnValue(1);
            mockDeductCredits.mockResolvedValue(undefined);
            mockPrismaVideoCreate.mockResolvedValue({});
            mockEnqueueVideoGeneration.mockResolvedValue(undefined);
            const request = createMockRequest({ niche: "fashion", duration: 30 }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(mockPrismaVideoCreate).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                data: globals_1.expect.objectContaining({
                    storyboard: [
                        {
                            scene: 1,
                            duration: 30,
                            description: "fashion marketing video",
                        },
                    ],
                }),
            }));
        });
        (0, globals_1.it)("should return 500 on creation error", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockGetVideoCreditCost.mockReturnValue(1);
            mockDeductCredits.mockRejectedValue(new Error("Deduct failed"));
            const request = createMockRequest({ niche: "fashion", duration: 30 }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Deduct failed" });
        });
    });
    (0, globals_1.describe)("GET /api/packages", () => {
        const handler = () => routes.get["/api/packages"];
        (0, globals_1.it)("should return credit packages", async () => {
            const mockPackages = [
                { id: "starter", name: "Starter", credits: 5, priceIdr: 49000 },
                { id: "growth", name: "Growth", credits: 18, priceIdr: 149000 },
            ];
            mockGetPackages.mockResolvedValue(mockPackages);
            const request = createMockRequest();
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockGetPackages).toHaveBeenCalled();
            (0, globals_1.expect)(result).toEqual(mockPackages);
        });
    });
    (0, globals_1.describe)("POST /api/payment/create", () => {
        const handler = () => routes.post["/api/payment/create"];
        (0, globals_1.it)("should return 401 when not authenticated", async () => {
            const request = createMockRequest({}, {});
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
        });
        (0, globals_1.it)("should return 400 when packageId is missing", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            const request = createMockRequest({ gateway: "midtrans" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "packageId and gateway required",
            });
        });
        (0, globals_1.it)("should return 400 when gateway is missing", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            const request = createMockRequest({ packageId: "starter" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(400);
        });
        (0, globals_1.it)("should create payment with duitku gateway", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockDuitkuCreateTransaction.mockResolvedValue({
                paymentUrl: "https://duitku.com/pay",
            });
            const request = createMockRequest({ packageId: "starter", gateway: "duitku" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockDuitkuCreateTransaction).toHaveBeenCalledWith({
                userId: BigInt(123456789),
                packageId: "starter",
                username: "testuser",
            });
            (0, globals_1.expect)(result).toEqual({ paymentUrl: "https://duitku.com/pay" });
        });
        (0, globals_1.it)("should create payment with tripay gateway", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockTripayCreateTransaction.mockResolvedValue({
                paymentUrl: "https://tripay.com/pay",
            });
            const request = createMockRequest({ packageId: "starter", gateway: "tripay" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockTripayCreateTransaction).toHaveBeenCalled();
            (0, globals_1.expect)(result).toEqual({ paymentUrl: "https://tripay.com/pay" });
        });
        (0, globals_1.it)("should create payment with default gateway", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockPaymentCreateTransaction.mockResolvedValue({
                paymentUrl: "https://default.com/pay",
            });
            const request = createMockRequest({ packageId: "starter", gateway: "midtrans" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockPaymentCreateTransaction).toHaveBeenCalled();
            (0, globals_1.expect)(result).toEqual({ paymentUrl: "https://default.com/pay" });
        });
        (0, globals_1.it)("should use firstName when username is not available", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser({ username: null }));
            mockPaymentCreateTransaction.mockResolvedValue({});
            const request = createMockRequest({ packageId: "starter", gateway: "midtrans" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(mockPaymentCreateTransaction).toHaveBeenCalledWith(globals_1.expect.objectContaining({ username: "Test" }));
        });
        (0, globals_1.it)("should return 500 on payment error", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockPaymentCreateTransaction.mockRejectedValue(new Error("Payment failed"));
            const request = createMockRequest({ packageId: "starter", gateway: "midtrans" }, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Payment failed" });
        });
    });
    (0, globals_1.describe)("GET /api/my/transactions", () => {
        const handler = () => routes.get["/api/my/transactions"];
        (0, globals_1.it)("should return 401 when not authenticated", async () => {
            const request = createMockRequest({}, {});
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
        });
        (0, globals_1.it)("should return transactions when authenticated", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            const mockTransactions = [
                { id: 1, amount: 50000, status: "success" },
                { id: 2, amount: 100000, status: "pending" },
            ];
            mockPrismaTransactionFindMany.mockResolvedValue(mockTransactions);
            const request = createMockRequest({}, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockPrismaTransactionFindMany).toHaveBeenCalledWith({
                where: { userId: BigInt(123456789) },
                orderBy: { createdAt: "desc" },
                take: 50,
            });
            (0, globals_1.expect)(result).toEqual(mockTransactions);
        });
        (0, globals_1.it)("should return 500 on database error", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockPrismaTransactionFindMany.mockRejectedValue(new Error("DB error"));
            const request = createMockRequest({}, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Failed to fetch transactions",
            });
        });
    });
    (0, globals_1.describe)("GET /api/user/videos", () => {
        const handler = () => routes.get["/api/user/videos"];
        (0, globals_1.it)("should return 401 when not authenticated", async () => {
            const request = createMockRequest({}, {});
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
        });
        (0, globals_1.it)("should return videos when authenticated", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            const mockVideos = [
                { id: 1, jobId: "JOB-1", status: "completed" },
                { id: 2, jobId: "JOB-2", status: "processing" },
            ];
            mockPrismaVideoFindMany.mockResolvedValue(mockVideos);
            const request = createMockRequest({}, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            const result = await handler()(request, reply);
            (0, globals_1.expect)(mockPrismaVideoFindMany).toHaveBeenCalledWith({
                where: { userId: BigInt(123456789) },
                orderBy: { createdAt: "desc" },
                take: 30,
            });
            (0, globals_1.expect)(result).toEqual(mockVideos);
        });
        (0, globals_1.it)("should return 500 on database error", async () => {
            const token = createValidToken();
            mockFindByUuid.mockResolvedValue(createMockUser());
            mockPrismaVideoFindMany.mockRejectedValue(new Error("DB error"));
            const request = createMockRequest({}, { authorization: `Bearer ${token}` });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Failed to fetch videos",
            });
        });
    });
    (0, globals_1.describe)("GET /video/:jobId/download", () => {
        const handler = () => routes.get["/video/:jobId/download"];
        (0, globals_1.it)("should return 401 when token is missing", async () => {
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, {});
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Missing token" });
        });
        (0, globals_1.it)("should return 403 when token decodes to mismatched jobId", async () => {
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token: "!!!invalid-base64!!!" });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(403);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Token mismatch" });
        });
        (0, globals_1.it)("should return 403 when token jobId does not match param", async () => {
            const token = Buffer.from("user-123:JOB-OTHER").toString("base64");
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(403);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Token mismatch" });
        });
        (0, globals_1.it)("should return 403 when token userId is missing", async () => {
            const token = Buffer.from(":JOB-123").toString("base64");
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(403);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Token mismatch" });
        });
        (0, globals_1.it)("should return 404 when video not found", async () => {
            const token = Buffer.from("user-123:JOB-123").toString("base64");
            mockGetByJobId.mockResolvedValue(null);
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(404);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Video not found" });
        });
        (0, globals_1.it)("should return 403 when user does not own video", async () => {
            const token = Buffer.from("user-123:JOB-123").toString("base64");
            mockGetByJobId.mockResolvedValue({
                userId: BigInt(999),
                downloadUrl: "/path/to/video.mp4",
            });
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(403);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Access denied" });
        });
        (0, globals_1.it)("should return 404 when video file not found on disk", async () => {
            const token = Buffer.from("123:JOB-123").toString("base64");
            mockGetByJobId.mockResolvedValue({
                userId: BigInt(123),
                downloadUrl: "/path/to/video.mp4",
            });
            mockExistsSync.mockReturnValue(false);
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(404);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({
                error: "Video file not found",
            });
        });
        (0, globals_1.it)("should return 404 when downloadUrl is missing", async () => {
            const token = Buffer.from("123:JOB-123").toString("base64");
            mockGetByJobId.mockResolvedValue({
                userId: BigInt(123),
                downloadUrl: null,
            });
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(404);
        });
        (0, globals_1.it)("should stream video file when valid", async () => {
            const token = Buffer.from("123:JOB-123").toString("base64");
            const mockStream = { pipe: globals_1.jest.fn() };
            mockGetByJobId.mockResolvedValue({
                userId: BigInt(123),
                downloadUrl: "/path/to/video.mp4",
            });
            mockExistsSync.mockReturnValue(true);
            mockCreateReadStream.mockReturnValue(mockStream);
            mockStatSync.mockReturnValue({ size: 1024000 });
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.header).toHaveBeenCalledWith("Content-Type", "video/mp4");
            (0, globals_1.expect)(reply.header).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="berkahkarya-JOB-123.mp4"');
            (0, globals_1.expect)(reply.header).toHaveBeenCalledWith("Content-Length", 1024000);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith(mockStream);
        });
        (0, globals_1.it)("should return 500 on unexpected error", async () => {
            const token = Buffer.from("123:JOB-123").toString("base64");
            mockGetByJobId.mockRejectedValue(new Error("Unexpected error"));
            const request = createMockRequest({}, {}, { jobId: "JOB-123" }, { token });
            const reply = createMockReply();
            await handler()(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(500);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Download failed" });
        });
    });
    (0, globals_1.describe)("Authentication Middleware", () => {
        (0, globals_1.it)("should reject expired tokens", async () => {
            const expiredToken = jsonwebtoken_1.default.sign({ userId: "user-uuid-123", telegramId: "123", tier: "free" }, process.env.JWT_SECRET, { expiresIn: "-1s" });
            const handler = routes.get["/api/user"];
            const request = createMockRequest({}, { authorization: `Bearer ${expiredToken}` });
            const reply = createMockReply();
            await handler(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
            (0, globals_1.expect)(reply.send).toHaveBeenCalledWith({ error: "Invalid token" });
        });
        (0, globals_1.it)("should reject tokens signed with wrong secret", async () => {
            const wrongToken = jsonwebtoken_1.default.sign({ userId: "user-uuid-123", telegramId: "123", tier: "free" }, "wrong-secret", { expiresIn: "7d" });
            const handler = routes.get["/api/user"];
            const request = createMockRequest({}, { authorization: `Bearer ${wrongToken}` });
            const reply = createMockReply();
            await handler(request, reply);
            (0, globals_1.expect)(reply.status).toHaveBeenCalledWith(401);
        });
    });
});
//# sourceMappingURL=web.test.js.map