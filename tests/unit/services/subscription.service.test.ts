import { SubscriptionService } from "@/services/subscription.service";
import { getSubscriptionPlansAsync, PlanKey, BillingCycle } from "@/config/pricing";

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
  $executeRaw: jest.fn().mockResolvedValue(0),
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

// Mock getSubscriptionPlansAsync
jest.mock("@/config/pricing", () => {
  const actual = jest.requireActual("@/config/pricing") as any;
  return {
    ...actual,
    getSubscriptionPlansAsync: jest.fn(),
  };
});
const mockGetSubscriptionPlansAsync = getSubscriptionPlansAsync as jest.MockedFunction<typeof getSubscriptionPlansAsync>;

// ── Helpers ──

function makeSubscription(overrides: Partial<any> = {}) {
  return {
    id: BigInt(1),
    userId: BigInt(12345),
    plan: "lite",
    billingCycle: "monthly",
    status: "active",
    currentPeriodStart: new Date("2025-01-01"),
    currentPeriodEnd: new Date("2099-12-31"),
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
    mockGetSubscriptionPlansAsync.mockResolvedValue({
      lite: { name: "Lite", monthlyCredits: 10, tier: "basic", dailyGenerationLimit: 5 },
      pro: { name: "Pro", monthlyCredits: 30, tier: "pro", dailyGenerationLimit: 10 },
      agency: { name: "Agency", monthlyCredits: 100, tier: "agency", dailyGenerationLimit: 30 },
    });
  });

  describe("createSubscription()", () => {
    it("should create a subscription using dynamic plan config", async () => {
      const telegramId = BigInt(12345);
      const mockSub = makeSubscription({ plan: "lite" });

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.subscription.create.mockResolvedValue(mockSub);
      mockPrisma.user.update.mockResolvedValue(makeUser());

      await SubscriptionService.createSubscription(telegramId, "lite", "monthly", "tx_123");

      expect(mockGetSubscriptionPlansAsync).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { telegramId },
        data: expect.objectContaining({
          tier: "basic",
          creditBalance: { increment: 10 },
        }),
      });
    });
  });

  describe("canGenerate()", () => {
    it("should respect dynamic daily limits for pro users", async () => {
      const telegramId = BigInt(12345);
      const mockSub = makeSubscription({ plan: "pro" });
      
      mockPrisma.user.findUnique.mockResolvedValue(makeUser({ creditBalance: 10 }));
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSub);
      mockPrisma.video.count.mockResolvedValue(10); // at limit

      const result = await SubscriptionService.canGenerate(telegramId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Daily limit reached (10/Pro plan)");
    });
  });
});
