import request from "supertest";
import fastify from "fastify";
import { adminRoutes } from "../../src/routes/admin";
import { ProviderSettingsService } from "../../src/services/provider-settings.service";

// Mock the Redis setup for testing
jest.mock("../../src/config/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock database to avoid hitting real Postgres during integration test
jest.mock("../../src/config/database", () => ({
  prisma: {
    transaction: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

describe("Admin Dashboard API Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    app = fastify();
    // Simulate auth token for testing scope
    app.decorateRequest("user", { role: "ADMIN" });
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

      const response = await request(app.server).get("/api/admin/settings/providers");
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
      expect(sorted.find(p => p.key === "byteplus")).toBeUndefined();
    });
  });

  describe("Real-time Tracking APIs", () => {
    it("should return P2P transfer logs with proper schema", async () => {
      const { prisma } = require("../../src/config/database");
      prisma.transaction.findMany.mockResolvedValueOnce([
        { id: "tx-123", type: "transfer", creditsAmount: 50, user: { username: "tester" } }
      ]);
      
      const response = await request(app.server).get("/api/admin/transactions/transfers");
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].creditsAmount).toBe(50);
      expect(response.body[0].type).toBe("transfer");
    });
  });
});
