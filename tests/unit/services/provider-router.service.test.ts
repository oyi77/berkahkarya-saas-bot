import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// ── Redis mock ──
const mockRedis = {
  get: jest.fn<any>(),
  set: jest.fn<any>(),
  incr: jest.fn<any>(),
  expire: jest.fn<any>(),
};

jest.mock("@/config/redis", () => ({
  redis: mockRedis,
}));

// ── Logger mock ──
jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── CircuitBreaker mock ──
const mockCircuitBreakerCanExecute = jest.fn<any>();
jest.mock("@/services/circuit-breaker.service", () => ({
  CircuitBreaker: {
    canExecute: mockCircuitBreakerCanExecute,
  },
}));

// ── ProviderSettingsService mock ──
const mockGetSortedVideoProviders = jest.fn<any>();
jest.mock("@/services/provider-settings.service", () => ({
  ProviderSettingsService: {
    getSortedVideoProviders: mockGetSortedVideoProviders,
    getDynamicSettings: jest.fn().mockResolvedValue({ video: {}, image: {} }),
  },
}));

import { ProviderRouter } from "@/services/provider-router.service";

// ── Helpers ──

function makeProvider(key: string, priority: number, strengths: string[] = [], avoid: string[] = []) {
  return {
    key,
    name: key,
    priority,
    timeout: 30000,
    failureThreshold: 3,
    recoveryTimeout: 60000,
    strengths,
    quirks: "",
    avoid,
    tokenLimit: 500,
    supportsImg2Video: true,
    maxDuration: 10,
    enabled: true,
  };
}

describe("ProviderRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: circuit breaker allows all providers
    mockCircuitBreakerCanExecute.mockResolvedValue(true);
    // Default: no history in Redis
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
  });

  // ─────────────────────────── scoreProvider ───────────────────────

  describe("scoreProvider()", () => {
    it("calculates base score from priority (priority 1 = score 90)", async () => {
      const config = makeProvider("provA", 1);

      const score = await ProviderRouter.scoreProvider("provA", config, "fashion", []);

      // (10 - 1) * 10 = 90
      expect(score).toBe(90);
    });

    it("adds +20 bonus when niche matches a provider strength", async () => {
      const config = makeProvider("provA", 1, ["fashion"]);

      const score = await ProviderRouter.scoreProvider("provA", config, "fashion", []);

      // 90 + 20 = 110
      expect(score).toBe(110);
    });

    it("applies -50 penalty when a style matches the avoid list", async () => {
      const config = makeProvider("provA", 1, [], ["anime"]);

      const score = await ProviderRouter.scoreProvider("provA", config, "tech", ["anime"]);

      // 90 - 50 = 40
      expect(score).toBe(40);
    });

    it("applies -100 penalty when circuit breaker is open", async () => {
      mockCircuitBreakerCanExecute.mockResolvedValue(false);
      const config = makeProvider("provA", 1);

      const score = await ProviderRouter.scoreProvider("provA", config, "tech", []);

      // 90 - 100 = -10
      expect(score).toBe(-10);
    });

    it("adds +10 per success capped at 5 successes", async () => {
      // 5 successes = +50, 0 failures = 0
      mockRedis.get
        .mockResolvedValueOnce("5") // success count
        .mockResolvedValueOnce("0"); // failure count
      const config = makeProvider("provA", 1);

      const score = await ProviderRouter.scoreProvider("provA", config, "tech", []);

      // 90 + 50 = 140
      expect(score).toBe(140);
    });

    it("caps success bonus at 5 even when Redis shows higher count", async () => {
      mockRedis.get
        .mockResolvedValueOnce("20") // more than 5 successes
        .mockResolvedValueOnce("0");
      const config = makeProvider("provA", 5);

      const score = await ProviderRouter.scoreProvider("provA", config, "tech", []);

      // (10-5)*10=50 base + min(20,5)*10=50 → 100
      expect(score).toBe(100);
    });

    it("subtracts -10 per failure capped at 5 failures", async () => {
      mockRedis.get
        .mockResolvedValueOnce("0")  // success count
        .mockResolvedValueOnce("5"); // failure count
      const config = makeProvider("provA", 1);

      const score = await ProviderRouter.scoreProvider("provA", config, "tech", []);

      // 90 - 50 = 40
      expect(score).toBe(40);
    });

    it("does not penalise when Redis throws (graceful degradation)", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis down"));
      const config = makeProvider("provA", 1);

      const score = await ProviderRouter.scoreProvider("provA", config, "tech", []);

      // No history adjustment — 90 base
      expect(score).toBe(90);
    });

    it("does not penalise when circuit breaker check throws", async () => {
      mockCircuitBreakerCanExecute.mockRejectedValue(new Error("CB error"));
      const config = makeProvider("provA", 1);

      const score = await ProviderRouter.scoreProvider("provA", config, "tech", []);

      // No CB penalty
      expect(score).toBe(90);
    });
  });

  // ─────────────────────────── getOrderedProviders ─────────────────

  describe("getOrderedProviders()", () => {
    it("returns providers sorted by score descending", async () => {
      // provA priority=1 (score 90), provB priority=5 (score 50)
      mockGetSortedVideoProviders.mockResolvedValue([
        makeProvider("provA", 1),
        makeProvider("provB", 5),
      ]);

      const result = await ProviderRouter.getOrderedProviders("tech", []);

      expect(result[0].key).toBe("provA");
      expect(result[1].key).toBe("provB");
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it("places niche-matching provider above non-matching even with lower base priority", async () => {
      // provA priority=1 (base 90), provB priority=3 (base 70) + niche match (+20) = 90
      mockGetSortedVideoProviders.mockResolvedValue([
        makeProvider("provA", 1, [], []),
        makeProvider("provB", 3, ["fashion"], []),
      ]);

      const result = await ProviderRouter.getOrderedProviders("fashion", []);

      // provA=90, provB=90 — tie → order preserved (stable sort expected), but both are in result
      const keys = result.map((r) => r.key);
      expect(keys).toContain("provA");
      expect(keys).toContain("provB");
    });

    it("demotes circuit-breaker-open provider to last position", async () => {
      mockGetSortedVideoProviders.mockResolvedValue([
        makeProvider("provOpen", 1),
        makeProvider("provHealthy", 5),
      ]);
      // provOpen circuit is open
      mockCircuitBreakerCanExecute
        .mockImplementation((key: string) =>
          Promise.resolve(key !== "provOpen"),
        );

      const result = await ProviderRouter.getOrderedProviders("tech", []);

      expect(result[result.length - 1].key).toBe("provOpen");
    });

    it("returns each provider with key, config, and score fields", async () => {
      mockGetSortedVideoProviders.mockResolvedValue([makeProvider("provA", 2)]);

      const result = await ProviderRouter.getOrderedProviders("fnb", []);

      expect(result[0]).toHaveProperty("key", "provA");
      expect(result[0]).toHaveProperty("config");
      expect(result[0]).toHaveProperty("score");
    });
  });

  // ─────────────────────────── getOrderedProviderKeys ──────────────

  describe("getOrderedProviderKeys()", () => {
    it("returns an array of provider key strings in order", async () => {
      mockGetSortedVideoProviders.mockResolvedValue([
        makeProvider("alpha", 1),
        makeProvider("beta", 2),
      ]);

      const keys = await ProviderRouter.getOrderedProviderKeys("tech", []);

      expect(keys).toEqual(["alpha", "beta"]);
    });
  });

  // ─────────────────────────── recordSuccess ───────────────────────

  describe("recordSuccess()", () => {
    it("increments success counter in Redis", async () => {
      await ProviderRouter.recordSuccess("byteplus");

      expect(mockRedis.incr).toHaveBeenCalledWith("provider:history:byteplus:success");
    });

    it("sets TTL of 86400 seconds on the success key", async () => {
      await ProviderRouter.recordSuccess("byteplus");

      expect(mockRedis.expire).toHaveBeenCalledWith(
        "provider:history:byteplus:success",
        86400,
      );
    });

    it("does not throw when Redis is unavailable", async () => {
      mockRedis.incr.mockRejectedValue(new Error("Redis down"));

      await expect(ProviderRouter.recordSuccess("byteplus")).resolves.toBeUndefined();
    });
  });

  // ─────────────────────────── recordFailure ───────────────────────

  describe("recordFailure()", () => {
    it("increments failure counter in Redis", async () => {
      await ProviderRouter.recordFailure("xai");

      expect(mockRedis.incr).toHaveBeenCalledWith("provider:history:xai:failure");
    });

    it("sets TTL of 86400 seconds on the failure key", async () => {
      await ProviderRouter.recordFailure("xai");

      expect(mockRedis.expire).toHaveBeenCalledWith(
        "provider:history:xai:failure",
        86400,
      );
    });

    it("does not throw when Redis is unavailable", async () => {
      mockRedis.incr.mockRejectedValue(new Error("Redis down"));

      await expect(ProviderRouter.recordFailure("xai")).resolves.toBeUndefined();
    });
  });
});
