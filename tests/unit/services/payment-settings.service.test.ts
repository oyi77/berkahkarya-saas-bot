import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

// ── Prisma mock ──
const mockPrismaPaymentSettings = {
  findUnique: jest.fn<any>(),
  upsert: jest.fn<any>(),
  findMany: jest.fn<any>(),
};

const mockPrismaAuditLog = {
  create: jest.fn<any>(),
};

const mockPrismaPricingConfig = {
  findUnique: jest.fn<any>(),
  findMany: jest.fn<any>(),
  upsert: jest.fn<any>(),
  update: jest.fn<any>(),
  createMany: jest.fn<any>(),
  deleteMany: jest.fn<any>(),
  count: jest.fn<any>(),
};

const mockPrisma = {
  paymentSettings: mockPrismaPaymentSettings,
  auditLog: mockPrismaAuditLog,
  pricingConfig: mockPrismaPricingConfig,
};

jest.mock("@/config/database", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { PaymentSettingsService } from "@/services/payment-settings.service";

describe("PaymentSettingsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the in-memory pricing cache between tests
    PaymentSettingsService.clearPricingCache();
  });

  // ─────────────────────────── get / set ───────────────────────────

  describe("get()", () => {
    it("returns value when setting exists", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue({
        key: "default_gateway",
        value: "midtrans",
      });

      const result = await PaymentSettingsService.get("default_gateway");

      expect(result).toBe("midtrans");
      expect(mockPrismaPaymentSettings.findUnique).toHaveBeenCalledWith({
        where: { key: "default_gateway" },
      });
    });

    it("returns null when setting does not exist", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue(null);

      const result = await PaymentSettingsService.get("nonexistent_key");

      expect(result).toBeNull();
    });
  });

  describe("set()", () => {
    it("upserts setting with key and value", async () => {
      mockPrismaPaymentSettings.upsert.mockResolvedValue({});

      await PaymentSettingsService.set("default_gateway", "tripay", "The default gateway");

      expect(mockPrismaPaymentSettings.upsert).toHaveBeenCalledWith({
        where: { key: "default_gateway" },
        update: expect.objectContaining({ value: "tripay" }),
        create: expect.objectContaining({ key: "default_gateway", value: "tripay" }),
      });
    });
  });

  // ─────────────────────────── getDefaultGateway ───────────────────

  describe("getDefaultGateway()", () => {
    it("returns stored gateway value", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue({
        key: "default_gateway",
        value: "duitku",
      });

      const result = await PaymentSettingsService.getDefaultGateway();

      expect(result).toBe("duitku");
    });

    it("returns 'midtrans' as fallback when no setting stored", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue(null);

      const result = await PaymentSettingsService.getDefaultGateway();

      expect(result).toBe("midtrans");
    });
  });

  // ─────────────────────────── setDefaultGateway ───────────────────

  describe("setDefaultGateway()", () => {
    it("stores valid gateway name", async () => {
      mockPrismaPaymentSettings.upsert.mockResolvedValue({});

      await expect(
        PaymentSettingsService.setDefaultGateway("tripay"),
      ).resolves.toBeUndefined();

      expect(mockPrismaPaymentSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: "default_gateway" },
          update: expect.objectContaining({ value: "tripay" }),
        }),
      );
    });

    it("throws when gateway name is not in the allowed list", async () => {
      await expect(
        PaymentSettingsService.setDefaultGateway("paypal"),
      ).rejects.toThrow("Invalid gateway");
    });
  });

  // ─────────────────────────── isGatewayEnabled ────────────────────

  describe("isGatewayEnabled()", () => {
    it("returns true when setting is not 'false'", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue({
        key: "midtrans_enabled",
        value: "true",
      });

      const result = await PaymentSettingsService.isGatewayEnabled("midtrans");

      expect(result).toBe(true);
    });

    it("returns false when setting is explicitly 'false'", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue({
        key: "midtrans_enabled",
        value: "false",
      });

      const result = await PaymentSettingsService.isGatewayEnabled("midtrans");

      expect(result).toBe(false);
    });

    it("returns true when no setting exists (defaults to enabled)", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue(null);

      const result = await PaymentSettingsService.isGatewayEnabled("tripay");

      expect(result).toBe(true);
    });
  });

  // ─────────────────────────── setGatewayEnabled ───────────────────

  describe("setGatewayEnabled()", () => {
    it("stores 'true' string when enabling gateway", async () => {
      mockPrismaPaymentSettings.upsert.mockResolvedValue({});

      await PaymentSettingsService.setGatewayEnabled("duitku", true);

      expect(mockPrismaPaymentSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ value: "true" }),
        }),
      );
    });

    it("stores 'false' string when disabling gateway", async () => {
      mockPrismaPaymentSettings.upsert.mockResolvedValue({});

      await PaymentSettingsService.setGatewayEnabled("midtrans", false);

      expect(mockPrismaPaymentSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ value: "false" }),
        }),
      );
    });
  });

  // ─────────────────────────── getEnabledGateways ──────────────────

  describe("getEnabledGateways()", () => {
    it("returns only enabled gateways", async () => {
      // midtrans=true, duitku=true, tripay=false
      mockPrismaPaymentSettings.findUnique
        .mockResolvedValueOnce({ key: "midtrans_enabled", value: "true" })
        .mockResolvedValueOnce({ key: "duitku_enabled", value: "true" })
        .mockResolvedValueOnce({ key: "tripay_enabled", value: "false" });

      const result = await PaymentSettingsService.getEnabledGateways();

      const ids = result.map((g) => g.id);
      expect(ids).toContain("midtrans");
      expect(ids).toContain("duitku");
      expect(ids).not.toContain("tripay");
    });

    it("returns empty array when all gateways are disabled", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue({
        value: "false",
      });

      const result = await PaymentSettingsService.getEnabledGateways();

      expect(result).toHaveLength(0);
    });

    it("each gateway entry has id, name, and description fields", async () => {
      mockPrismaPaymentSettings.findUnique.mockResolvedValue({
        value: "true",
      });

      const result = await PaymentSettingsService.getEnabledGateways();

      result.forEach((gateway) => {
        expect(gateway).toHaveProperty("id");
        expect(gateway).toHaveProperty("name");
        expect(gateway).toHaveProperty("description");
      });
    });
  });

  // ─────────────────────────── getPricingConfig (with cache) ───────

  describe("getPricingConfig()", () => {
    it("returns value from DB on first call", async () => {
      mockPrismaPricingConfig.findUnique.mockResolvedValue({
        category: "global",
        key: "margin_percent",
        value: 30,
      });

      const result = await PaymentSettingsService.getPricingConfig(
        "global",
        "margin_percent",
      );

      expect(result).toBe(30);
      expect(mockPrismaPricingConfig.findUnique).toHaveBeenCalledTimes(1);
    });

    it("returns cached value on second call without hitting DB again", async () => {
      mockPrismaPricingConfig.findUnique.mockResolvedValue({
        category: "global",
        key: "margin_percent",
        value: 30,
      });

      await PaymentSettingsService.getPricingConfig("global", "margin_percent");
      await PaymentSettingsService.getPricingConfig("global", "margin_percent");

      // DB should only be queried once — second call uses cache
      expect(mockPrismaPricingConfig.findUnique).toHaveBeenCalledTimes(1);
    });

    it("returns null when row does not exist in DB", async () => {
      mockPrismaPricingConfig.findUnique.mockResolvedValue(null);

      const result = await PaymentSettingsService.getPricingConfig(
        "global",
        "nonexistent",
      );

      expect(result).toBeNull();
    });

    it("re-fetches from DB after cache is cleared", async () => {
      mockPrismaPricingConfig.findUnique.mockResolvedValue({
        value: 30,
      });

      await PaymentSettingsService.getPricingConfig("global", "margin_percent");
      PaymentSettingsService.clearPricingCache();
      await PaymentSettingsService.getPricingConfig("global", "margin_percent");

      expect(mockPrismaPricingConfig.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────── initializePricingDefaults ───────────

  describe("initializePricingDefaults()", () => {
    it("seeds defaults on startup via upsert", async () => {
      mockPrismaPricingConfig.upsert.mockResolvedValue({});
      mockPrismaPricingConfig.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaPricingConfig.findUnique.mockResolvedValue(null);

      await PaymentSettingsService.initializePricingDefaults();

      // Should upsert unit costs, packages, subscriptions, margin, providers
      expect(mockPrismaPricingConfig.upsert).toHaveBeenCalled();
      const calls = mockPrismaPricingConfig.upsert.mock.calls;
      const categories = calls.map((c: any) => c[0]?.create?.category);
      expect(categories).toContain('unit_cost');
      expect(categories).toContain('package');
      expect(categories).toContain('global');
    });

    it("cleans up legacy video_credit entries on seed", async () => {
      mockPrismaPricingConfig.upsert.mockResolvedValue({});
      mockPrismaPricingConfig.deleteMany.mockResolvedValue({ count: 3 });
      mockPrismaPricingConfig.findUnique.mockResolvedValue(null);

      await PaymentSettingsService.initializePricingDefaults();

      expect(mockPrismaPricingConfig.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'video_credit' } }),
      );
    });
  });

  // ─────────────────────────── getMarginPercent ────────────────────

  describe("getMarginPercent()", () => {
    it("returns numeric margin directly", async () => {
      mockPrismaPricingConfig.findUnique.mockResolvedValue({ value: 25 });

      const result = await PaymentSettingsService.getMarginPercent();

      expect(result).toBe(25);
    });

    it("extracts value from legacy {value: N} object format", async () => {
      mockPrismaPricingConfig.findUnique.mockResolvedValue({
        value: { value: 35 },
      });

      const result = await PaymentSettingsService.getMarginPercent();

      expect(result).toBe(35);
    });

    it("returns default of 30 when no config exists", async () => {
      mockPrismaPricingConfig.findUnique.mockResolvedValue(null);

      const result = await PaymentSettingsService.getMarginPercent();

      expect(result).toBe(30);
    });
  });
});
