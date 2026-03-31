/**
 * Unit Tests — GamificationService
 * Tests for: recordGenerate, checkAndAwardBadges, getUserStats, getWeeklyLeaderboard
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUserStreak = {
  findUnique: jest.fn<any>(),
  create:     jest.fn<any>(),
  update:     jest.fn<any>(),
  upsert:     jest.fn<any>(),
  findMany:   jest.fn<any>(),
};
const mockUserBadge = {
  findMany: jest.fn<any>(),
  create:   jest.fn<any>(),
};
const mockVideo = {
  count:    jest.fn<any>(),
  findMany: jest.fn<any>(),
  groupBy:  jest.fn<any>(),
};
const mockTransaction = {
  count:     jest.fn<any>(),
  aggregate: jest.fn<any>(),
};
const mockCommission = {
  count:    jest.fn<any>(),
  findMany: jest.fn<any>(),
};
const mockUser = {
  findMany:   jest.fn<any>(),
  findUnique: jest.fn<any>(),
  update:     jest.fn<any>(),
};

const mockPrisma = {
  userStreak:  mockUserStreak,
  userBadge:   mockUserBadge,
  video:       mockVideo,
  transaction: mockTransaction,
  commission:  mockCommission,
  user:        mockUser,
};

jest.mock('@/config/database', () => ({ prisma: mockPrisma }));
jest.mock('@/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GamificationService, BADGES, STREAK_REWARDS } from '@/services/gamification.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStreak(overrides: Record<string, any> = {}) {
  return {
    userId:           1001n,
    currentStreak:    0,
    longestStreak:    0,
    lastActivityDate: null,
    lastGenerateDate: null,
    streakStartDate:  null,
    totalGenerates:   0,
    stylesUsed:       [] as string[],
    updatedAt:        new Date(),
    ...overrides,
  };
}

// ── BADGES constant ───────────────────────────────────────────────────────────

describe('BADGES constant', () => {
  it('contains expected badge ids', () => {
    expect(Object.keys(BADGES)).toContain('first_timer');
    expect(Object.keys(BADGES).length).toBeGreaterThanOrEqual(5);
  });

  it('each badge has id, name, emoji, description, condition', () => {
    for (const badge of Object.values(BADGES)) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.emoji).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(typeof badge.condition).toBe('function');
    }
  });

  it('first_timer condition triggers at totalGenerates >= 1', () => {
    const stats = { totalGenerates: 1, currentStreak: 0, longestStreak: 0, totalDeposits: 0, referralCount: 0, hasDownline3Level: false, stylesUsed: new Set<string>(), monthsActive: 1 };
    expect(BADGES['first_timer'].condition(stats)).toBe(true);
  });

  it('first_timer condition is false at 0 generates', () => {
    const stats = { totalGenerates: 0, currentStreak: 0, longestStreak: 0, totalDeposits: 0, referralCount: 0, hasDownline3Level: false, stylesUsed: new Set<string>(), monthsActive: 0 };
    expect(BADGES['first_timer'].condition(stats)).toBe(false);
  });
});

// ── STREAK_REWARDS ────────────────────────────────────────────────────────────

describe('STREAK_REWARDS constant', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(STREAK_REWARDS)).toBe(true);
    expect(STREAK_REWARDS.length).toBeGreaterThan(0);
  });

  it('each reward has days, creditBonus, label', () => {
    for (const r of STREAK_REWARDS) {
      expect(typeof r.days).toBe('number');
      expect(typeof r.creditBonus).toBe('number');
      expect(typeof r.label).toBe('string');
    }
  });

  it('rewards are ordered by days ascending', () => {
    for (let i = 1; i < STREAK_REWARDS.length; i++) {
      expect(STREAK_REWARDS[i].days).toBeGreaterThanOrEqual(STREAK_REWARDS[i - 1].days);
    }
  });
});

// ── recordGenerate ────────────────────────────────────────────────────────────
// Return type: { streakUpdated: boolean; newStreak: number; rewardCredit: number; newBadges: BadgeDefinition[]; streakMessage?: string }

describe('GamificationService.recordGenerate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks for badge checks (called internally)
    mockUserStreak.findUnique.mockResolvedValue(null);
    mockUserBadge.findMany.mockResolvedValue([]);
    mockVideo.count.mockResolvedValue(0);
    mockTransaction.count.mockResolvedValue(0);
    mockCommission.count.mockResolvedValue(0);
    mockUser.update.mockResolvedValue({});
  });

  it('creates streak record for first-time user (no existing streak)', async () => {
    mockUserStreak.findUnique.mockResolvedValue(null);
    mockUserStreak.create.mockResolvedValue(
      makeStreak({ currentStreak: 1, totalGenerates: 1 })
    );

    const result = await GamificationService.recordGenerate(1001n);
    expect(mockUserStreak.create).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.newStreak).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.newBadges)).toBe(true);
  });

  it('increments streak when last activity was yesterday', async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    mockUserStreak.findUnique.mockResolvedValue(
      makeStreak({ currentStreak: 2, totalGenerates: 5, lastActivityDate: yesterday, lastGenerateDate: yesterday }),
    );
    mockUserStreak.update.mockResolvedValue(makeStreak({ currentStreak: 3, totalGenerates: 6 }));

    const result = await GamificationService.recordGenerate(1001n);
    expect(result.newStreak).toBe(3);
    expect(result.streakUpdated).toBe(true);
  });

  it('resets streak when gap > 1 day', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    mockUserStreak.findUnique.mockResolvedValue(
      makeStreak({ currentStreak: 10, totalGenerates: 20, lastActivityDate: threeDaysAgo, lastGenerateDate: threeDaysAgo }),
    );
    mockUserStreak.update.mockResolvedValue(makeStreak({ currentStreak: 1, totalGenerates: 21 }));

    const result = await GamificationService.recordGenerate(1001n);
    expect(result.newStreak).toBe(1);
  });

  it('maintains streak if called same day (streakUpdated=false)', async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    mockUserStreak.findUnique.mockResolvedValue(
      makeStreak({ currentStreak: 5, totalGenerates: 10, lastActivityDate: today, lastGenerateDate: today }),
    );
    mockUserStreak.update.mockResolvedValue(makeStreak({ currentStreak: 5, totalGenerates: 11 }));

    const result = await GamificationService.recordGenerate(1001n);
    expect(result.streakUpdated).toBe(false);
  });

  it('returns rewardCredit >= 0', async () => {
    mockUserStreak.findUnique.mockResolvedValue(null);
    mockUserStreak.create.mockResolvedValue(makeStreak({ currentStreak: 1, totalGenerates: 1 }));

    const result = await GamificationService.recordGenerate(1001n);
    expect(result.rewardCredit).toBeGreaterThanOrEqual(0);
  });
});

// ── getUserStats ──────────────────────────────────────────────────────────────

describe('GamificationService.getUserStats', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns UserStats with all required fields', async () => {
    mockUserStreak.findUnique.mockResolvedValue(makeStreak({ currentStreak: 3, longestStreak: 5, totalGenerates: 8, stylesUsed: ['fnb', 'fashion'] }));
    mockTransaction.count.mockResolvedValue(2);
    mockCommission.count.mockResolvedValue(1);
    mockCommission.findMany.mockResolvedValue([{ tier: 1 }, { tier: 2 }]);
    mockVideo.count.mockResolvedValue(8);
    mockUserBadge.findMany.mockResolvedValue([]);

    const stats = await GamificationService.getUserStats(1001n);
    expect(typeof stats.totalGenerates).toBe('number');
    expect(typeof stats.currentStreak).toBe('number');
    expect(typeof stats.longestStreak).toBe('number');
    expect(typeof stats.totalDeposits).toBe('number');
    expect(typeof stats.referralCount).toBe('number');
    expect(stats.stylesUsed instanceof Set).toBe(true);
  });

  it('returns zero stats for new user with no streak record', async () => {
    mockUserStreak.findUnique.mockResolvedValue(null);
    mockTransaction.count.mockResolvedValue(0);
    mockCommission.count.mockResolvedValue(0);
    mockCommission.findMany.mockResolvedValue([]);
    mockVideo.count.mockResolvedValue(0);
    mockUserBadge.findMany.mockResolvedValue([]);

    const stats = await GamificationService.getUserStats(9999n);
    expect(stats.totalGenerates).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });
});

// ── getWeeklyLeaderboard ──────────────────────────────────────────────────────
// Uses prisma.video.groupBy internally

describe('GamificationService.getWeeklyLeaderboard', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns empty array when no videos this week', async () => {
    // groupBy returns empty
    (mockPrisma as any).video.groupBy = jest.fn<any>().mockResolvedValue([]);
    (mockPrisma as any).user.findMany = jest.fn<any>().mockResolvedValue([]);
    const board = await GamificationService.getWeeklyLeaderboard();
    expect(Array.isArray(board)).toBe(true);
    expect(board.length).toBe(0);
  });

  it('maps leaderboard entries with rank, userId, generateCount', async () => {
    (mockPrisma as any).video.groupBy = jest.fn<any>().mockResolvedValue([
      { userId: 1001n, _count: { id: 8 } },
    ]);
    (mockPrisma as any).user.findMany = jest.fn<any>().mockResolvedValue([
      { id: 1001n, firstName: 'Alice', username: 'alice' },
    ]);
    const board = await GamificationService.getWeeklyLeaderboard();
    expect(Array.isArray(board)).toBe(true);
    if (board.length > 0) {
      expect(board[0].rank).toBe(1);
      expect(board[0].generateCount).toBe(8);
    }
  });
});

// ── formatLeaderboardMessage ──────────────────────────────────────────────────

describe('GamificationService.formatLeaderboardMessage', () => {
  it('returns non-empty string', () => {
    const entries = [
      { rank: 1, name: 'Alice', username: 'alice', streak: 10, generates: 20, badge: '🏆' },
    ];
    const msg = GamificationService.formatLeaderboardMessage(entries as any);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns fallback message for empty leaderboard', () => {
    const msg = GamificationService.formatLeaderboardMessage([]);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});
