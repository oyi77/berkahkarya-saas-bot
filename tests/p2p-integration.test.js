"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const send_1 = require("../src/commands/send");
const callback_1 = require("../src/handlers/callback");
const p2p_service_1 = require("../src/services/p2p.service");
jest.mock('../src/services/p2p.service');
jest.mock('../src/config/database', () => ({
    prisma: {
        video: { update: jest.fn() },
        user: { findUnique: jest.fn() },
    }
}));
describe('P2P Integration Tests', () => {
    let ctx;
    beforeEach(() => {
        jest.clearAllMocks();
        ctx = {
            from: { id: 111 },
            message: { text: '' },
            reply: jest.fn(),
            editMessageText: jest.fn(),
            answerCbQuery: jest.fn(),
            telegram: {
                sendMessage: jest.fn(),
            },
        };
    });
    describe('sendCommand', () => {
        it('should prompt for confirmation with correct fee calculation', async () => {
            ctx.message.text = '/send 222 100';
            p2p_service_1.P2pService.validateTransfer.mockResolvedValueOnce({
                valid: true,
                fee: 0.5,
                totalDeduction: 100.5,
            });
            await (0, send_1.sendCommand)(ctx);
            expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('100'), expect.objectContaining({
                reply_markup: expect.objectContaining({
                    inline_keyboard: expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({ callback_data: 'confirm_send_222_100' }),
                            expect.objectContaining({ callback_data: 'cancel_send' }),
                        ])
                    ])
                })
            }));
        });
        it('should reject invalid arguments', async () => {
            ctx.message.text = '/send invalid';
            await (0, send_1.sendCommand)(ctx);
            expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Usage: /send'), expect.any(Object));
        });
    });
    describe('callback handling', () => {
        it('should handle cancel_send correctly', async () => {
            ctx.callbackQuery = { data: 'cancel_send' };
            await (0, callback_1.callbackHandler)(ctx);
            expect(ctx.answerCbQuery).toHaveBeenCalledWith(expect.stringContaining('Transfer cancelled'));
            expect(ctx.editMessageText).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
        });
        it('should handle confirm_send correctly and notify recipient', async () => {
            ctx.callbackQuery = { data: 'confirm_send_222_100' };
            p2p_service_1.P2pService.executeTransfer.mockResolvedValueOnce({ success: true });
            await (0, callback_1.callbackHandler)(ctx);
            expect(ctx.answerCbQuery).toHaveBeenCalledWith('Processing transfer...');
            expect(p2p_service_1.P2pService.executeTransfer).toHaveBeenCalledWith(111n, 222n, 100);
            expect(ctx.editMessageText).toHaveBeenCalledWith(expect.stringContaining('Transfer Successful'), expect.any(Object));
            expect(ctx.telegram.sendMessage).toHaveBeenCalledWith(222, expect.stringContaining('You received credits'), expect.any(Object));
        });
    });
});
//# sourceMappingURL=p2p-integration.test.js.map