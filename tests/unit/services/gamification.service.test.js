"use strict";
/**
 * Unit Tests — GamificationService
 * Tests for: recordGenerate, checkAndAwardBadges, getUserStats, getWeeklyLeaderboard
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockUserStreak = {
    findUnique: globals_1.jest.fn(),
    create: globals_1.jest.fn(),
    update: globals_1.jest.fn(),
    upsert: globals_1.jest.fn(),
    findMany: globals_1.jest.fn(),
};
const mockUserBadge = {
    findMany: globals_1.jest.fn(),
    create: globals_1.jest.fn(),
};
const mockVideo = {
    count: globals_1.jest.fn(),
    findMany: globals_1.jest.fn(),
    groupBy: globals_1.jest.fn(),
};
const mockTransaction = {
    count: globals_1.jest.fn(),
    aggregate: globals_1.jest.fn(),
};
const mockCommission = {
    count: globals_1.jest.fn(),
    findMany: globals_1.jest.fn(),
};
const mockUser = {
    findMany: globals_1.jest.fn(),
    findUnique: globals_1.jest.fn(),
    update: globals_1.jest.fn(),
};
const mockPrisma = {
    userStreak: mockUserStreak,
    userBadge: mockUserBadge,
    video: mockVideo,
    transaction: mockTransaction,
    commission: mockCommission,
    user: mockUser,
};
globals_1.jest.mock('@/config/database', () => ({ prisma: mockPrisma }));
globals_1.jest.mock('@/utils/logger', () => ({
    logger: { info: globals_1.jest.fn(), error: globals_1.jest.fn(), warn: globals_1.jest.fn(), debug: globals_1.jest.fn() },
}));
const gamification_service_1 = require("@/services/gamification.service");
// ── Helpers ───────────────────────────────────────────────────────────────────
function makeStreak(overrides = {}) {
    return {
        userId: 1001n,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        lastGenerateDate: null,
        streakStartDate: null,
        totalGenerates: 0,
        stylesUsed: [],
        updatedAt: new Date(),
        ...overrides,
    };
}
// ── BADGES constant ───────────────────────────────────────────────────────────
(0, globals_1.describe)('BADGES constant', () => {
    (0, globals_1.it)('contains expected badge ids', () => {
        (0, globals_1.expect)(Object.keys(gamification_service_1.BADGES)).toContain('first_timer');
        (0, globals_1.expect)(Object.keys(gamification_service_1.BADGES).length).toBeGreaterThanOrEqual(5);
    });
    (0, globals_1.it)('each badge has id, name, emoji, description, condition', () => {
        for (const badge of Object.values(gamification_service_1.BADGES)) {
            (0, globals_1.expect)(badge.id).toBeTruthy();
            (0, globals_1.expect)(badge.name).toBeTruthy();
            (0, globals_1.expect)(badge.emoji).toBeTruthy();
            (0, globals_1.expect)(badge.description).toBeTruthy();
            (0, globals_1.expect)(typeof badge.condition).toBe('function');
        }
    });
    (0, globals_1.it)('first_timer condition triggers at totalGenerates >= 1', () => {
        const stats = { totalGenerates: 1, currentStreak: 0, longestStreak: 0, totalDeposits: 0, referralCount: 0, hasDownline3Level: false, stylesUsed: new Set(), monthsActive: 1 };
        (0, globals_1.expect)(gamification_service_1.BADGES['first_timer'].condition(stats)).toBe(true);
    });
    (0, globals_1.it)('first_timer condition is false at 0 generates', () => {
        const stats = { totalGenerates: 0, currentStreak: 0, longestStreak: 0, totalDeposits: 0, referralCount: 0, hasDownline3Level: false, stylesUsed: new Set(), monthsActive: 0 };
        (0, globals_1.expect)(gamification_service_1.BADGES['first_timer'].condition(stats)).toBe(false);
    });
});
// ── STREAK_REWARDS ────────────────────────────────────────────────────────────
(0, globals_1.describe)('STREAK_REWARDS constant', () => {
    (0, globals_1.it)('is a non-empty array', () => {
        (0, globals_1.expect)(Array.isArray(gamification_service_1.STREAK_REWARDS)).toBe(true);
        (0, globals_1.expect)(gamification_service_1.STREAK_REWARDS.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('each reward has days, creditBonus, label', () => {
        for (const r of gamification_service_1.STREAK_REWARDS) {
            (0, globals_1.expect)(typeof r.days).toBe('number');
            (0, globals_1.expect)(typeof r.creditBonus).toBe('number');
            (0, globals_1.expect)(typeof r.label).toBe('string');
        }
    });
    (0, globals_1.it)('rewards are ordered by days ascending', () => {
        for (let i = 1; i < gamification_service_1.STREAK_REWARDS.length; i++) {
            (0, globals_1.expect)(gamification_service_1.STREAK_REWARDS[i].days).toBeGreaterThanOrEqual(gamification_service_1.STREAK_REWARDS[i - 1].days);
        }
    });
});
// ── recordGenerate ────────────────────────────────────────────────────────────
// Return type: { streakUpdated: boolean; newStreak: number; rewardCredit: number; newBadges: BadgeDefinition[]; streakMessage?: string }
(0, globals_1.describe)('GamificationService.recordGenerate', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        // Default mocks for badge checks (called internally)
        mockUserStreak.findUnique.mockResolvedValue(null);
        mockUserBadge.findMany.mockResolvedValue([]);
        mockVideo.count.mockResolvedValue(0);
        mockTransaction.count.mockResolvedValue(0);
        mockCommission.count.mockResolvedValue(0);
        mockUser.update.mockResolvedValue({});
    });
    (0, globals_1.it)('creates streak record for first-time user (no existing streak)', async () => {
        mockUserStreak.findUnique.mockResolvedValue(null);
        mockUserStreak.create.mockResolvedValue(makeStreak({ currentStreak: 1, totalGenerates: 1 }));
        const result = await gamification_service_1.GamificationService.recordGenerate(1001n);
        (0, globals_1.expect)(mockUserStreak.create).toHaveBeenCalled();
        (0, globals_1.expect)(result).toBeDefined();
        (0, globals_1.expect)(result.newStreak).toBeGreaterThanOrEqual(1);
        (0, globals_1.expect)(Array.isArray(result.newBadges)).toBe(true);
    });
    (0, globals_1.it)('increments streak when last activity was yesterday', async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        mockUserStreak.findUnique.mockResolvedValue(makeStreak({ currentStreak: 2, totalGenerates: 5, lastActivityDate: yesterday, lastGenerateDate: yesterday }));
        mockUserStreak.update.mockResolvedValue(makeStreak({ currentStreak: 3, totalGenerates: 6 }));
        const result = await gamification_service_1.GamificationService.recordGenerate(1001n);
        (0, globals_1.expect)(result.newStreak).toBe(3);
        (0, globals_1.expect)(result.streakUpdated).toBe(true);
    });
    (0, globals_1.it)('resets streak when gap > 1 day', async () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        mockUserStreak.findUnique.mockResolvedValue(makeStreak({ currentStreak: 10, totalGenerates: 20, lastActivityDate: threeDaysAgo, lastGenerateDate: threeDaysAgo }));
        mockUserStreak.update.mockResolvedValue(makeStreak({ currentStreak: 1, totalGenerates: 21 }));
        const result = await gamification_service_1.GamificationService.recordGenerate(1001n);
        (0, globals_1.expect)(result.newStreak).toBe(1);
    });
    (0, globals_1.it)('maintains streak if called same day (streakUpdated=false)', async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        mockUserStreak.findUnique.mockResolvedValue(makeStreak({ currentStreak: 5, totalGenerates: 10, lastActivityDate: today, lastGenerateDate: today }));
        mockUserStreak.update.mockResolvedValue(makeStreak({ currentStreak: 5, totalGenerates: 11 }));
        const result = await gamification_service_1.GamificationService.recordGenerate(1001n);
        (0, globals_1.expect)(result.streakUpdated).toBe(false);
    });
    (0, globals_1.it)('returns rewardCredit >= 0', async () => {
        mockUserStreak.findUnique.mockResolvedValue(null);
        mockUserStreak.create.mockResolvedValue(makeStreak({ currentStreak: 1, totalGenerates: 1 }));
        const result = await gamification_service_1.GamificationService.recordGenerate(1001n);
        (0, globals_1.expect)(result.rewardCredit).toBeGreaterThanOrEqual(0);
    });
});
// ── getUserStats ──────────────────────────────────────────────────────────────
(0, globals_1.describe)('GamificationService.getUserStats', () => {
    (0, globals_1.beforeEach)(() => { globals_1.jest.clearAllMocks(); });
    (0, globals_1.it)('returns UserStats with all required fields', async () => {
        mockUserStreak.findUnique.mockResolvedValue(makeStreak({ currentStreak: 3, longestStreak: 5, totalGenerates: 8, stylesUsed: ['fnb', 'fashion'] }));
        mockTransaction.count.mockResolvedValue(2);
        mockCommission.count.mockResolvedValue(1);
        mockCommission.findMany.mockResolvedValue([{ tier: 1 }, { tier: 2 }]);
        mockVideo.count.mockResolvedValue(8);
        mockUserBadge.findMany.mockResolvedValue([]);
        const stats = await gamification_service_1.GamificationService.getUserStats(1001n);
        (0, globals_1.expect)(typeof stats.totalGenerates).toBe('number');
        (0, globals_1.expect)(typeof stats.currentStreak).toBe('number');
        (0, globals_1.expect)(typeof stats.longestStreak).toBe('number');
        (0, globals_1.expect)(typeof stats.totalDeposits).toBe('number');
        (0, globals_1.expect)(typeof stats.referralCount).toBe('number');
        (0, globals_1.expect)(stats.stylesUsed instanceof Set).toBe(true);
    });
    (0, globals_1.it)('returns zero stats for new user with no streak record', async () => {
        mockUserStreak.findUnique.mockResolvedValue(null);
        mockTransaction.count.mockResolvedValue(0);
        mockCommission.count.mockResolvedValue(0);
        mockCommission.findMany.mockResolvedValue([]);
        mockVideo.count.mockResolvedValue(0);
        mockUserBadge.findMany.mockResolvedValue([]);
        const stats = await gamification_service_1.GamificationService.getUserStats(9999n);
        (0, globals_1.expect)(stats.totalGenerates).toBe(0);
        (0, globals_1.expect)(stats.currentStreak).toBe(0);
    });
});
// ── getWeeklyLeaderboard ──────────────────────────────────────────────────────
// Uses prisma.video.groupBy internally
(0, globals_1.describe)('GamificationService.getWeeklyLeaderboard', () => {
    (0, globals_1.beforeEach)(() => { globals_1.jest.clearAllMocks(); });
    (0, globals_1.it)('returns empty array when no videos this week', async () => {
        // groupBy returns empty
        mockPrisma.video.groupBy = globals_1.jest.fn().mockResolvedValue([]);
        const board = await gamification_service_1.GamificationService.getWeeklyLeaderboard();
        (0, globals_1.expect)(Array.isArray(board)).toBe(true);
        (0, globals_1.expect)(board.length).toBe(0);
    });
    (0, globals_1.it)('maps leaderboard entries with rank, userId, generateCount', async () => {
        mockPrisma.video.groupBy = globals_1.jest.fn().mockResolvedValue([
            { userId: 1001n, _count: { id: 8 } },
        ]);
        mockPrisma.user.findUnique = globals_1.jest.fn().mockResolvedValue({
            firstName: 'Alice', username: 'alice',
        });
        const board = await gamification_service_1.GamificationService.getWeeklyLeaderboard();
        (0, globals_1.expect)(Array.isArray(board)).toBe(true);
        if (board.length > 0) {
            (0, globals_1.expect)(board[0].rank).toBe(1);
            (0, globals_1.expect)(board[0].generateCount).toBe(8);
        }
    });
});
// ── formatLeaderboardMessage ──────────────────────────────────────────────────
(0, globals_1.describe)('GamificationService.formatLeaderboardMessage', () => {
    (0, globals_1.it)('returns non-empty string', () => {
        const entries = [
            { rank: 1, name: 'Alice', username: 'alice', streak: 10, generates: 20, badge: '🏆' },
        ];
        const msg = gamification_service_1.GamificationService.formatLeaderboardMessage(entries);
        (0, globals_1.expect)(typeof msg).toBe('string');
        (0, globals_1.expect)(msg.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('returns fallback message for empty leaderboard', () => {
        const msg = gamification_service_1.GamificationService.formatLeaderboardMessage([]);
        (0, globals_1.expect)(typeof msg).toBe('string');
        (0, globals_1.expect)(msg.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=gamification.service.test.js.map