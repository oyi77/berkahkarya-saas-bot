import { P2pService } from '../src/services/p2p.service';
import { prisma } from '../src/config/database';

jest.mock('../src/config/database', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        transaction: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

describe('P2pService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateFee', () => {
        it('should calculate exactly 0.5% fee', () => {
            expect(P2pService.calculateFee(100)).toBe(0.5);
            expect(P2pService.calculateFee(200)).toBe(1.0);
        });

        it('should enforce a minimum fee of 0.01', () => {
            expect(P2pService.calculateFee(1)).toBe(0.01);
        });

        it('should round fee to 2 decimal places', () => {
            expect(P2pService.calculateFee(155)).toBe(0.78);
        });
    });

    describe('validateTransfer', () => {
        it('should throw error if transfer amount is less than 1', async () => {
            await expect(P2pService.validateTransfer(1n, 2n, 0.5)).rejects.toThrow(
                'Minimum transfer amount is 1 credit'
            );
        });

        it('should throw error if transfer amount exceeds 10000', async () => {
            await expect(P2pService.validateTransfer(1n, 2n, 15000)).rejects.toThrow(
                'Maximum transfer amount is 10000 credits'
            );
        });

        it('should throw error for self-transfer', async () => {
            await expect(P2pService.validateTransfer(1n, 1n, 50)).rejects.toThrow(
                'Cannot transfer credits to yourself'
            );
        });

        it('should throw error if sender not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
            await expect(P2pService.validateTransfer(1n, 2n, 50)).rejects.toThrow(
                'Sender not found'
            );
        });

        it('should throw error if sender has insufficient balance', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                telegramId: 1n,
                creditBalance: 10,
            });
            await expect(P2pService.validateTransfer(1n, 2n, 50)).rejects.toThrow(
                'Insufficient balance'
            );
        });

        it('should return valid if conditions are met', async () => {
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce({ telegramId: 1n, creditBalance: 100 }) // Sender
                .mockResolvedValueOnce({ telegramId: 2n }); // Recipient

            const result = await P2pService.validateTransfer(1n, 2n, 50);
            expect(result.valid).toBe(true);
            expect(result.fee).toBe(0.25);
            expect(result.totalDeduction).toBe(50.25);
        });
    });

    describe('executeTransfer', () => {
        it('should return error if validation fails', async () => {
            const result = await P2pService.executeTransfer(1n, 1n, 50);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot transfer credits to yourself');
        });

        it('should wrap successful transfers in a transaction to update users and ledgers', async () => {
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce({ telegramId: 1n, creditBalance: 100 }) // Sender
                .mockResolvedValueOnce({ telegramId: 2n }); // Recipient

            // Mock transaction successful execution
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const tx = {
                    user: {
                        findUnique: jest.fn().mockResolvedValue({ telegramId: 1n, creditBalance: 100 }),
                        update: jest.fn(),
                    },
                    transaction: {
                        create: jest.fn(),
                    },
                };
                await callback(tx);
                return true;
            });

            const result = await P2pService.executeTransfer(1n, 2n, 50);
            expect(result.success).toBe(true);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
    });
});
