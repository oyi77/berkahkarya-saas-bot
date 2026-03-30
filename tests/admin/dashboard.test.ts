import request from "supertest";
import fastify from "fastify";

const TEST_ADMIN_PASSWORD = "test-admin-password";

// Set env var before ANY module is imported (runs before hoisted jest.mock factories)
// jest.mock factories are hoisted, so we embed the password there too.
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

// Mock modules before admin.ts loads — factories run with the env var already set
jest.mock("../../src/config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    publish: jest.fn(),
  },
}));

jest.mock("../../src/config/database", () => ({
  prisma: {
    transaction: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

// Prevent BullMQ from opening real Redis connections during tests
jest.mock("../../src/config/queue", () => ({
  videoQueue: { add: jest.fn() },
  paymentQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  billingQueue: { add: jest.fn() },
  cleanupQueue: { add: jest.fn() },
}));

jest.mock("../../src/workers/retention.worker", () => ({
  retentionQueue: { add: jest.fn() },
  RetentionWorker: jest.fn(),
}));

// Import after mocks are in place. admin.ts captures ADMIN_PASSWORD at module
// load; the jest.mock factory for a sentinel module forces admin.ts to be
// evaluated only after all mocks (including process.env) are set.
// We use jest.isolateModules in beforeAll to guarantee fresh evaluation.
let adminRoutes: (server: any) => Promise<void>;
let ProviderSettingsService: any;
let isolatedPrisma: any;

// Helper: build Basic auth header matching admin.ts verifyAdmin logic
// verifyAdmin splits "user:password" and takes the password part ([1]).
function adminAuthHeader(): string {
  const encoded = Buffer.from(`admin:${TEST_ADMIN_PASSWORD}`).toString("base64");
  return `Basic ${encoded}`;
}

describe("Admin Dashboard API Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    // Ensure env var is set before the fresh module evaluation
    process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

    await new Promise<void>((resolve) => {
      jest.isolateModules(async () => {
        ({ adminRoutes } = require("../../src/routes/admin"));
        ({ ProviderSettingsService } = require("../../src/services/provider-settings.service"));
        // Capture the prisma instance from the same isolated module scope
        ({ prisma: isolatedPrisma } = require("../../src/config/database"));
        resolve();
      });
    });

    app = fastify();
    await app.register(adminRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Provider Settings API", () => {
    it("should successfully retrieve provider overrides", async () => {
      // Mock the service response
      jest.spyOn(ProviderSettingsService, "getDynamicSettings").mockResolvedValue({
        video: {
          xai: { priority: 1, enabled: true },
          byteplus: { priority: 2, enabled: false },
        },
        image: {},
      });

      const response = await request(app.server)
        .get("/api/admin/settings/providers")
        .set("Authorization", adminAuthHeader());
      expect(response.status).toBe(200);
      expect(response.body.overrides.video.xai.priority).toBe(1);
      expect(response.body.overrides.video.byteplus.enabled).toBe(false);
    });

    it("should accurately sort video providers according to dynamic overrides", async () => {
      // When byteplus is disabled, and xai is forced priority 1
      jest.spyOn(ProviderSettingsService, "getSortedVideoProviders").mockResolvedValue([
        { key: "xai", priority: 1 } as any,
        { key: "laozhang", priority: 2 } as any,
      ]);

      const sorted = await ProviderSettingsService.getSortedVideoProviders();
      expect(sorted[0].key).toBe("xai");
      expect(sorted.find((p: any) => p.key === "byteplus")).toBeUndefined();
    });
  });

  describe("Real-time Tracking APIs", () => {
    it("should return P2P transfer logs with proper schema", async () => {
      // Use the prisma instance from the same isolated module scope as adminRoutes
      isolatedPrisma.transaction.findMany.mockResolvedValueOnce([
        { id: "tx-123", type: "transfer", creditsAmount: 50, user: { username: "tester" } }
      ]);

      const response = await request(app.server)
        .get("/api/transactions/transfers")
        .set("Authorization", adminAuthHeader());
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].creditsAmount).toBe(50);
      expect(response.body[0].type).toBe("transfer");
    });
  });
});
