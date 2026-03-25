/**
 * Unit Tests — SubscriptionService
 *
 * Comprehensive coverage for all SubscriptionService methods:
 * - createSubscription
 * - cancelSubscription
 * - renewSubscription
 * - getActiveSubscription
 * - isSubscribed
 * - checkExpiredSubscriptions
 * - getDailyGenerationCount
 * - canGenerate
 */

import { SubscriptionService } from "@/services/subscription.service";
import { SUBSCRIPTION_PLANS } from "@/config/pricing";

const mockPrisma = {
  subscription: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  video: {
    count: jest.fn(),
  },
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock("@/config/database", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

jest.mock("@/utils/logger", () => ({
  get logger() {
    return mockLogger;
  },
}));

// ── Helpers ──

function makeSubscription(overrides: Partial<any> = {}) {
  return {
    id: BigInt(1),
    userId: BigInt(12345),
    plan: "lite",
    billingCycle: "monthly",
    status: "active",
    currentPeriodStart: new Date("2025-01-01"),
    currentPeriodEnd: new Date("2099-12-31"), // far future
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function makeUser(overrides: Partial<any> = {}) {
  return {
    telegramId: BigInt(12345),
    tier: "free",
    creditBalance: 5,
    creditExpiresAt: null,
    ...overrides,
  };
}

// ── Tests ──

describe("SubscriptionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════════
  // createSubscription
  // ══════════════════════════════════════════════════════════════════════

  describe("createSubscription()", () => {
    it("should create a monthly subscription and cancel existing active subs", async () => {
      const telegramId = BigInt(12345);
      const mockSub = makeSubscription({
        plan: "lite",
        billingCycle: "monthly",
      });

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.subscription.create.mockResolvedValue(mockSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      const result = await SubscriptionService.createSubscription(
        telegramId,
        "lite",
        "monthly",
        "txn_123",
      );

      // Should cancel existing active subscriptions
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { userId: telegramId, status: "active" },
        data: { status: "cancelled", cancelledAt: expect.any(Date) },
      });

      // Should create new subscription
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: telegramId,
          plan: "lite",
          billingCycle: "monthly",
          status: "active",
          cancelAtPeriodEnd: false,
        }),
      });

      // Should update user tier and credits
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId },
        data: expect.objectContaining({
          tier: SUBSCRIPTION_PLANS.lite.tier,
          creditBalance: { increment: SUBSCRIPTION_PLANS.lite.monthlyCredits },
        }),
      });

      expect(result).toEqual(mockSub);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Subscription created"),
      );
    });

    it("should create an annual subscription with correct period end", async () => {
      const telegramId = BigInt(12345);
      const mockSub = makeSubscription({ plan: "pro", billingCycle: "annual" });

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.subscription.create.mockResolvedValue(mockSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      await SubscriptionService.createSubscription(
        telegramId,
        "pro",
        "annual",
        "txn_456",
      );

      const createCall = mockPrisma.subscription.create.mock.calls[0][0];
      const periodStart = createCall.data.currentPeriodStart;
      const periodEnd = createCall.data.currentPeriodEnd;

      // Annual: period end should be ~1 year after start
      const diffMs = periodEnd.getTime() - periodStart.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(364);
      expect(diffDays).toBeLessThanOrEqual(366);
    });

    it("should create monthly subscription with ~30 day period", async () => {
      const telegramId = BigInt(12345);
      const mockSub = makeSubscription({
        plan: "lite",
        billingCycle: "monthly",
      });

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.subscription.create.mockResolvedValue(mockSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      await SubscriptionService.createSubscription(
        telegramId,
        "lite",
        "monthly",
        "txn_789",
      );

      const createCall = mockPrisma.subscription.create.mock.calls[0][0];
      const periodStart = createCall.data.currentPeriodStart;
      const periodEnd = createCall.data.currentPeriodEnd;

      // Monthly: period end should be ~1 month after start
      const diffMs = periodEnd.getTime() - periodStart.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it("should handle agency plan with correct tier and credits", async () => {
      const telegramId = BigInt(99999);
      const mockSub = makeSubscription({
        plan: "agency",
        billingCycle: "monthly",
        userId: telegramId,
      });

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.subscription.create.mockResolvedValue(mockSub);
      mockPrisma.user.update.mockResolvedValue(makeUser({ telegramId }));

      await SubscriptionService.createSubscription(
        telegramId,
        "agency",
        "monthly",
        "txn_agency",
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId },
        data: expect.objectContaining({
          tier: "agency",
          creditBalance: {
            increment: SUBSCRIPTION_PLANS.agency.monthlyCredits,
          },
        }),
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // cancelSubscription
  // ══════════════════════════════════════════════════════════════════════

  describe("cancelSubscription()", () => {
    it("should set cancelAtPeriodEnd=true for active subscriptions", async () => {
      const telegramId = BigInt(12345);
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      await SubscriptionService.cancelSubscription(telegramId);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { userId: telegramId, status: "active" },
        data: { cancelAtPeriodEnd: true },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("cancellation scheduled"),
      );
    });

    it("should handle user with no active subscription gracefully", async () => {
      const telegramId = BigInt(99999);
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 0 });

      // Should not throw
      await expect(
        SubscriptionService.cancelSubscription(telegramId),
      ).resolves.toBeUndefined();
      expect(mockPrisma.subscription.updateMany).toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // renewSubscription
  // ══════════════════════════════════════════════════════════════════════

  describe("renewSubscription()", () => {
    it("should renew a monthly subscription extending period by 1 month", async () => {
      const subId = BigInt(100);
      const periodEnd = new Date("2025-02-01");
      const mockSub = makeSubscription({
        id: subId,
        plan: "lite",
        billingCycle: "monthly",
        currentPeriodEnd: periodEnd,
      });

      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub);
      mockPrisma.subscription.update.mockResolvedValue(mockSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      await SubscriptionService.renewSubscription(subId);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subId },
        data: expect.objectContaining({
          currentPeriodStart: periodEnd,
        }),
      });

      // Verify new period end is ~1 month after old period end
      const updateCall = mockPrisma.subscription.update.mock.calls[0][0];
      const newEnd = updateCall.data.currentPeriodEnd;
      const diffMs = newEnd.getTime() - periodEnd.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);

      // Should reset credits
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: mockSub.userId },
        data: expect.objectContaining({
          creditBalance: SUBSCRIPTION_PLANS.lite.monthlyCredits,
        }),
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Subscription renewed"),
      );
    });

    it("should renew an annual subscription extending period by 1 year", async () => {
      const subId = BigInt(200);
      const periodEnd = new Date("2025-06-15");
      const mockSub = makeSubscription({
        id: subId,
        plan: "pro",
        billingCycle: "annual",
        currentPeriodEnd: periodEnd,
      });

      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub);
      mockPrisma.subscription.update.mockResolvedValue(mockSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      await SubscriptionService.renewSubscription(subId);

      const updateCall = mockPrisma.subscription.update.mock.calls[0][0];
      const newEnd = updateCall.data.currentPeriodEnd;
      const diffMs = newEnd.getTime() - periodEnd.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThanOrEqual(364);
      expect(diffDays).toBeLessThanOrEqual(366);
    });

    it("should return early if subscription not found", async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      await SubscriptionService.renewSubscription(BigInt(999));

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should return early if subscription is not active", async () => {
      const mockSub = makeSubscription({ status: "expired" });
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub);

      await SubscriptionService.renewSubscription(mockSub.id);

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should return early if plan config not found", async () => {
      const mockSub = makeSubscription({ plan: "nonexistent_plan" });
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSub);

      await SubscriptionService.renewSubscription(mockSub.id);

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // getActiveSubscription
  // ══════════════════════════════════════════════════════════════════════

  describe("getActiveSubscription()", () => {
    it("should return the most recent active subscription", async () => {
      const telegramId = BigInt(12345);
      const mockSub = makeSubscription({ userId: telegramId });
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);

      const result =
        await SubscriptionService.getActiveSubscription(telegramId);

      expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { userId: telegramId, status: "active" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockSub);
    });

    it("should return null when no active subscription exists", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await SubscriptionService.getActiveSubscription(
        BigInt(99999),
      );

      expect(result).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // isSubscribed
  // ══════════════════════════════════════════════════════════════════════

  describe("isSubscribed()", () => {
    it("should return true when user has active subscription with future period end", async () => {
      const mockSub = makeSubscription({
        currentPeriodEnd: new Date("2099-12-31"),
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);

      const result = await SubscriptionService.isSubscribed(BigInt(12345));

      expect(result).toBe(true);
    });

    it("should return false when user has no active subscription", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await SubscriptionService.isSubscribed(BigInt(99999));

      expect(result).toBe(false);
    });

    it("should return false when subscription period has ended", async () => {
      const mockSub = makeSubscription({
        currentPeriodEnd: new Date("2020-01-01"), // past date
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);

      const result = await SubscriptionService.isSubscribed(BigInt(12345));

      expect(result).toBe(false);
    });

    it("should return false when subscription period ends exactly now", async () => {
      const now = new Date();
      const mockSub = makeSubscription({
        currentPeriodEnd: now,
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);

      const result = await SubscriptionService.isSubscribed(BigInt(12345));

      // currentPeriodEnd <= now means expired
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // checkExpiredSubscriptions
  // ══════════════════════════════════════════════════════════════════════

  describe("checkExpiredSubscriptions()", () => {
    it("should expire cancelled subscriptions past their period end", async () => {
      const expiredSub = makeSubscription({
        id: BigInt(1),
        userId: BigInt(100),
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date("2020-01-01"),
      });

      mockPrisma.subscription.findMany
        .mockResolvedValueOnce([expiredSub]) // expiredCancelled
        .mockResolvedValueOnce([]); // dueForRenewal

      mockPrisma.subscription.update.mockResolvedValue(expiredSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      const count = await SubscriptionService.checkExpiredSubscriptions();

      expect(count).toBe(1);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: expiredSub.id },
        data: { status: "expired" },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: expiredSub.userId },
        data: { tier: "free", creditBalance: 0, creditExpiresAt: null },
      });
    });

    it("should expire non-cancelled subscriptions past period end (manual renewal)", async () => {
      const dueSub = makeSubscription({
        id: BigInt(2),
        userId: BigInt(200),
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date("2020-01-01"),
      });

      mockPrisma.subscription.findMany
        .mockResolvedValueOnce([]) // expiredCancelled
        .mockResolvedValueOnce([dueSub]); // dueForRenewal

      mockPrisma.subscription.update.mockResolvedValue(dueSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      const count = await SubscriptionService.checkExpiredSubscriptions();

      expect(count).toBe(1);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: dueSub.id },
        data: { status: "expired" },
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("requires manual renewal"),
      );
    });

    it("should handle both cancelled and due-for-renewal in one run", async () => {
      const cancelledSub = makeSubscription({
        id: BigInt(1),
        userId: BigInt(100),
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date("2020-01-01"),
      });
      const dueSub = makeSubscription({
        id: BigInt(2),
        userId: BigInt(200),
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date("2020-01-01"),
      });

      mockPrisma.subscription.findMany
        .mockResolvedValueOnce([cancelledSub])
        .mockResolvedValueOnce([dueSub]);

      mockPrisma.subscription.update.mockResolvedValue(cancelledSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      const count = await SubscriptionService.checkExpiredSubscriptions();

      expect(count).toBe(2);
      expect(mockPrisma.subscription.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
    });

    it("should return 0 when no subscriptions are expired", async () => {
      mockPrisma.subscription.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const count = await SubscriptionService.checkExpiredSubscriptions();

      expect(count).toBe(0);
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });

    it("should log summary of processed subscriptions", async () => {
      mockPrisma.subscription.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await SubscriptionService.checkExpiredSubscriptions();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Processed"),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // getDailyGenerationCount
  // ══════════════════════════════════════════════════════════════════════

  describe("getDailyGenerationCount()", () => {
    it("should count videos created today", async () => {
      const telegramId = BigInt(12345);
      mockPrisma.video.count.mockResolvedValue(5);

      const count =
        await SubscriptionService.getDailyGenerationCount(telegramId);

      expect(mockPrisma.video.count).toHaveBeenCalledWith({
        where: {
          userId: telegramId,
          createdAt: { gte: expect.any(Date) },
        },
      });
      expect(count).toBe(5);
    });

    it("should return 0 when no videos today", async () => {
      mockPrisma.video.count.mockResolvedValue(0);

      const count = await SubscriptionService.getDailyGenerationCount(
        BigInt(12345),
      );

      expect(count).toBe(0);
    });

    it("should use start of day as gte boundary", async () => {
      mockPrisma.video.count.mockResolvedValue(0);

      await SubscriptionService.getDailyGenerationCount(BigInt(12345));

      const callArgs = mockPrisma.video.count.mock.calls[0][0];
      const gteDate = callArgs.where.createdAt.gte;
      expect(gteDate.getHours()).toBe(0);
      expect(gteDate.getMinutes()).toBe(0);
      expect(gteDate.getSeconds()).toBe(0);
      expect(gteDate.getMilliseconds()).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // canGenerate
  // ══════════════════════════════════════════════════════════════════════

  describe("canGenerate()", () => {
    it("should deny generation when user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await SubscriptionService.canGenerate(BigInt(99999));

      expect(result).toEqual({ allowed: false, reason: "User not found" });
    });

    it("should deny when no subscription and no credits", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 0 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("No credits");
    });

    it("should allow when no subscription but has credits", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 10 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result).toEqual({ allowed: true });
    });

    it("should allow when subscribed and under daily limit with credits", async () => {
      const mockSub = makeSubscription({ plan: "lite" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 10 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(1); // under limit of 3

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result).toEqual({ allowed: true });
    });

    it("should deny when daily generation limit reached", async () => {
      const mockSub = makeSubscription({ plan: "lite" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 10 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(3); // at limit of 3

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily limit reached");
      expect(result.reason).toContain("Lite");
    });

    it("should deny when subscribed but no credits remaining", async () => {
      const mockSub = makeSubscription({ plan: "pro" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 0 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(0);

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("No credits remaining");
    });

    it("should allow generation for pro plan with higher limits", async () => {
      const mockSub = makeSubscription({ plan: "pro" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 50 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(5); // under limit of 10

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result).toEqual({ allowed: true });
    });

    it("should deny when pro plan daily limit reached", async () => {
      const mockSub = makeSubscription({ plan: "pro" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 50 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(10); // at limit of 10

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("10/Pro plan");
    });

    it("should handle agency plan with 30 daily limit", async () => {
      const mockSub = makeSubscription({ plan: "agency" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 150 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(25); // under limit of 30

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result).toEqual({ allowed: true });
    });

    it("should allow when plan config is not found (fallback)", async () => {
      const mockSub = makeSubscription({ plan: "unknown_plan" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 5 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);

      const result = await SubscriptionService.canGenerate(BigInt(12345));

      expect(result).toEqual({ allowed: true });
    });

    it("should check daily count against plan limit", async () => {
      const mockSub = makeSubscription({ plan: "lite" });
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ creditBalance: 5 }),
      );
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(2); // under limit

      await SubscriptionService.canGenerate(BigInt(12345));

      // Should have called video.count for daily generation check
      expect(mockPrisma.video.count).toHaveBeenCalled();
    });
  });
});
