import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// ── Redis mock ──
const mockRedis = {
  get: jest.fn<any>(),
  set: jest.fn<any>(),
  del: jest.fn<any>(),
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

// ── PROVIDER_CONFIG mock ──
// byteplus: failureThreshold=3, recoveryTimeout=60000
// unknownprovider: not in config
jest.mock("@/config/providers", () => ({
  PROVIDER_CONFIG: {
    video: {
      byteplus: {
        name: "BytePlus",
        priority: 1,
        timeout: 30000,
        failureThreshold: 3,
        recoveryTimeout: 60000,
        strengths: ["realistic"],
        quirks: "",
        avoid: [],
        tokenLimit: 500,
        supportsImg2Video: true,
        maxDuration: 10,
      },
      xai: {
        name: "XAI",
        priority: 2,
        timeout: 25000,
        failureThreshold: 3,
        recoveryTimeout: 45000,
        strengths: ["creative"],
        quirks: "",
        avoid: [],
        tokenLimit: 1000,
        supportsImg2Video: true,
        maxDuration: 15,
      },
    },
    image: {},
  },
}));

import { CircuitBreaker } from "@/services/circuit-breaker.service";
import { logger } from "@/utils/logger";

const CB_PREFIX = "cb:";

function makeCbState(
  state: "closed" | "open" | "half-open",
  failureCount = 0,
  lastFailure: number | null = null,
  lastSuccess: number | null = null,
) {
  return JSON.stringify({ state, failureCount, lastFailure, lastSuccess });
}

describe("CircuitBreaker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────── canExecute ───────────────────────────

  describe("canExecute()", () => {
    it("returns true when state is closed", async () => {
      mockRedis.get.mockResolvedValue(makeCbState("closed"));

      const result = await CircuitBreaker.canExecute("byteplus");

      expect(result).toBe(true);
    });

    it("returns true for unknown provider (no config)", async () => {
      // Unknown provider — no config entry — should default to allowed
      const result = await CircuitBreaker.canExecute("nonexistent_provider");

      expect(result).toBe(true);
      // Redis is never consulted because config is missing
    });

    it("returns false when state is open and recovery timeout has NOT passed", async () => {
      const recentFailure = Date.now() - 5000; // 5 seconds ago — less than 60s timeout
      mockRedis.get.mockResolvedValue(
        makeCbState("open", 3, recentFailure, null),
      );

      const result = await CircuitBreaker.canExecute("byteplus");

      expect(result).toBe(false);
    });

    it("transitions open→half-open and returns true when recovery timeout has passed", async () => {
      const oldFailure = Date.now() - 70000; // 70 seconds ago — beyond 60s timeout
      mockRedis.get.mockResolvedValue(
        makeCbState("open", 3, oldFailure, null),
      );
      mockRedis.set.mockResolvedValue("OK");

      const result = await CircuitBreaker.canExecute("byteplus");

      expect(result).toBe(true);
      // Should persist the half-open state
      expect(mockRedis.set).toHaveBeenCalledWith(
        `${CB_PREFIX}byteplus`,
        expect.stringContaining('"state":"half-open"'),
        "EX",
        600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("half-open"),
      );
    });

    it("returns true when state is half-open (allows one test request)", async () => {
      mockRedis.get.mockResolvedValue(makeCbState("half-open", 3, null, null));

      const result = await CircuitBreaker.canExecute("byteplus");

      expect(result).toBe(true);
    });

    it("returns true when Redis has no stored state (defaults to closed)", async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await CircuitBreaker.canExecute("byteplus");

      expect(result).toBe(true);
    });

    it("returns true when Redis throws (falls back to closed default)", async () => {
      mockRedis.get.mockRejectedValue(new Error("Redis unavailable"));

      const result = await CircuitBreaker.canExecute("byteplus");

      expect(result).toBe(true);
    });
  });

  // ─────────────────────────── recordSuccess ────────────────────────

  describe("recordSuccess()", () => {
    it("resets state to closed with failureCount=0", async () => {
      mockRedis.get.mockResolvedValue(makeCbState("open", 3, Date.now(), null));
      mockRedis.set.mockResolvedValue("OK");

      await CircuitBreaker.recordSuccess("byteplus");

      const [, serialized] = mockRedis.set.mock.calls[0] as any[];
      const saved = JSON.parse(serialized);
      expect(saved.state).toBe("closed");
      expect(saved.failureCount).toBe(0);
      expect(saved.lastFailure).toBeNull();
      expect(saved.lastSuccess).toBeGreaterThan(0);
    });

    it("persists state with 600-second TTL", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue("OK");

      await CircuitBreaker.recordSuccess("xai");

      expect(mockRedis.set).toHaveBeenCalledWith(
        `${CB_PREFIX}xai`,
        expect.any(String),
        "EX",
        600,
      );
    });
  });

  // ─────────────────────────── recordFailure ────────────────────────

  describe("recordFailure()", () => {
    it("increments failure count but stays closed when below threshold", async () => {
      // threshold is 3 — start at 1 failure → still 2 failures after this call
      mockRedis.get.mockResolvedValue(
        makeCbState("closed", 1, Date.now() - 1000, null),
      );
      mockRedis.set.mockResolvedValue("OK");

      await CircuitBreaker.recordFailure("byteplus");

      const [, serialized] = mockRedis.set.mock.calls[0] as any[];
      const saved = JSON.parse(serialized);
      expect(saved.state).toBe("closed");
      expect(saved.failureCount).toBe(2);
    });

    it("opens circuit when failure count reaches threshold", async () => {
      // threshold is 3 — currently at 2 → this is the 3rd failure → OPEN
      mockRedis.get.mockResolvedValue(
        makeCbState("closed", 2, Date.now() - 2000, null),
      );
      mockRedis.set.mockResolvedValue("OK");

      await CircuitBreaker.recordFailure("byteplus");

      const [, serialized] = mockRedis.set.mock.calls[0] as any[];
      const saved = JSON.parse(serialized);
      expect(saved.state).toBe("open");
      expect(saved.failureCount).toBe(3);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("OPENED"),
      );
    });

    it("logs warning with provider name and failure count on open", async () => {
      mockRedis.get.mockResolvedValue(makeCbState("closed", 2, null, null));
      mockRedis.set.mockResolvedValue("OK");

      await CircuitBreaker.recordFailure("byteplus");

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining("byteplus"),
      );
    });

    it("does nothing for unknown provider (no config)", async () => {
      await CircuitBreaker.recordFailure("nonexistent_provider");

      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it("records lastFailure timestamp", async () => {
      mockRedis.get.mockResolvedValue(makeCbState("closed", 0, null, null));
      mockRedis.set.mockResolvedValue("OK");
      const before = Date.now();

      await CircuitBreaker.recordFailure("byteplus");

      const [, serialized] = mockRedis.set.mock.calls[0] as any[];
      const saved = JSON.parse(serialized);
      expect(saved.lastFailure).toBeGreaterThanOrEqual(before);
    });
  });

  // ─────────────────────────── resetAll ─────────────────────────────

  describe("resetAll()", () => {
    it("deletes circuit breaker keys for all configured video providers", async () => {
      mockRedis.del.mockResolvedValue(1);

      await CircuitBreaker.resetAll();

      expect(mockRedis.del).toHaveBeenCalledWith(`${CB_PREFIX}byteplus`);
      expect(mockRedis.del).toHaveBeenCalledWith(`${CB_PREFIX}xai`);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("reset"),
      );
    });
  });
});
