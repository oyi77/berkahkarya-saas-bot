"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const paymentSettings_1 = require("@/commands/admin/paymentSettings");
const fixtures_1 = require("../../../fixtures");
globals_1.jest.mock("@/services/payment-settings.service", () => ({
    PaymentSettingsService: {
        getAllSettings: globals_1.jest.fn(),
        getDefaultGateway: globals_1.jest.fn(),
        isGatewayEnabled: globals_1.jest.fn(),
        setGatewayEnabled: globals_1.jest.fn(),
        setDefaultGateway: globals_1.jest.fn(),
    },
}));
globals_1.jest.mock("@/utils/logger", () => ({
    logger: {
        info: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
    },
}));
(0, globals_1.describe)("Admin Payment Settings Command", () => {
    let ctx;
    let PaymentSettingsService;
    let logger;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        ctx = (0, fixtures_1.createMockContext)();
        ctx.session = {
            state: "DASHBOARD",
            lastActivity: new Date(),
            creditBalance: 10,
            tier: "free",
            stateData: {},
        };
        PaymentSettingsService =
            require("@/services/payment-settings.service").PaymentSettingsService;
        logger = require("@/utils/logger").logger;
        process.env.SUPER_ADMIN_IDS = "123456789";
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
        delete process.env.SUPER_ADMIN_IDS;
    });
    (0, globals_1.describe)("paymentSettingsCommand", () => {
        (0, globals_1.it)("should reject non-admin users", async () => {
            ctx.from.id = 999999999;
            await (0, paymentSettings_1.paymentSettingsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should handle missing user gracefully", async () => {
            ctx.from = undefined;
            await (0, paymentSettings_1.paymentSettingsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ You do not have permission to use this command.");
        });
        (0, globals_1.it)("should show payment settings menu", async () => {
            PaymentSettingsService.getAllSettings.mockResolvedValue({
                midtrans_enabled: "true",
                tripay_enabled: "false",
                duitku_enabled: "true",
            });
            PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");
            await (0, paymentSettings_1.paymentSettingsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalled();
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Payment Settings");
            (0, globals_1.expect)(replyCall[0]).toContain("Default Gateway:");
            (0, globals_1.expect)(replyCall[0]).toContain("MIDTRANS");
        });
        (0, globals_1.it)("should show enabled/disabled status for each gateway", async () => {
            PaymentSettingsService.getAllSettings.mockResolvedValue({
                midtrans_enabled: "true",
                tripay_enabled: "false",
                duitku_enabled: "true",
            });
            PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");
            await (0, paymentSettings_1.paymentSettingsCommand)(ctx);
            const replyCall = ctx.reply.mock.calls[0];
            (0, globals_1.expect)(replyCall[0]).toContain("Midtrans: ✅ Enabled");
            (0, globals_1.expect)(replyCall[0]).toContain("Tripay: ❌ Disabled");
            (0, globals_1.expect)(replyCall[0]).toContain("Duitku: ✅ Enabled");
        });
        (0, globals_1.it)("should show correct toggle buttons", async () => {
            PaymentSettingsService.getAllSettings.mockResolvedValue({
                midtrans_enabled: "true",
                tripay_enabled: "false",
                duitku_enabled: "true",
            });
            PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");
            await (0, paymentSettings_1.paymentSettingsCommand)(ctx);
            const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
            const allButtons = keyboard.flat();
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "admin_payment_toggle_midtrans")).toBe(true);
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "admin_payment_toggle_tripay")).toBe(true);
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "admin_payment_toggle_duitku")).toBe(true);
        });
        (0, globals_1.it)("should handle database errors gracefully", async () => {
            PaymentSettingsService.getAllSettings.mockRejectedValue(new Error("Database error"));
            await (0, paymentSettings_1.paymentSettingsCommand)(ctx);
            (0, globals_1.expect)(ctx.reply).toHaveBeenCalledWith("❌ Something went wrong. Please try again.");
        });
    });
    (0, globals_1.describe)("handlePaymentDefaultGateway", () => {
        (0, globals_1.it)("should reject non-admin users", async () => {
            ctx.from.id = 999999999;
            await (0, paymentSettings_1.handlePaymentDefaultGateway)(ctx);
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Unauthorized");
        });
        (0, globals_1.it)("should show gateway selection menu", async () => {
            await (0, paymentSettings_1.handlePaymentDefaultGateway)(ctx);
            (0, globals_1.expect)(ctx.editMessageText).toHaveBeenCalled();
            const editCall = ctx.editMessageText.mock.calls[0];
            (0, globals_1.expect)(editCall[0]).toContain("Select Default Gateway");
        });
        (0, globals_1.it)("should show all gateway options", async () => {
            await (0, paymentSettings_1.handlePaymentDefaultGateway)(ctx);
            const keyboard = ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
            const allButtons = keyboard.flat();
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "admin_payment_setdefault_midtrans")).toBe(true);
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "admin_payment_setdefault_duitku")).toBe(true);
            (0, globals_1.expect)(allButtons.some((btn) => btn.callback_data === "admin_payment_setdefault_tripay")).toBe(true);
        });
    });
    (0, globals_1.describe)("handlePaymentToggleGateway", () => {
        (0, globals_1.it)("should reject non-admin users", async () => {
            ctx.from.id = 999999999;
            await (0, paymentSettings_1.handlePaymentToggleGateway)(ctx, "midtrans");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Unauthorized");
        });
        (0, globals_1.it)("should enable disabled gateway", async () => {
            PaymentSettingsService.isGatewayEnabled.mockResolvedValue(false);
            PaymentSettingsService.getAllSettings.mockResolvedValue({
                midtrans_enabled: "false",
                tripay_enabled: "false",
                duitku_enabled: "true",
            });
            PaymentSettingsService.getDefaultGateway.mockResolvedValue("duitku");
            await (0, paymentSettings_1.handlePaymentToggleGateway)(ctx, "midtrans");
            (0, globals_1.expect)(PaymentSettingsService.setGatewayEnabled).toHaveBeenCalledWith("midtrans", true, BigInt(ctx.from.id));
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("MIDTRANS enabled!");
        });
        (0, globals_1.it)("should disable enabled gateway", async () => {
            PaymentSettingsService.isGatewayEnabled.mockResolvedValue(true);
            PaymentSettingsService.getAllSettings.mockResolvedValue({
                midtrans_enabled: "true",
                tripay_enabled: "false",
                duitku_enabled: "true",
            });
            PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");
            await (0, paymentSettings_1.handlePaymentToggleGateway)(ctx, "midtrans");
            (0, globals_1.expect)(PaymentSettingsService.setGatewayEnabled).toHaveBeenCalledWith("midtrans", false, BigInt(ctx.from.id));
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("MIDTRANS disabled!");
        });
        (0, globals_1.it)("should handle toggle errors gracefully", async () => {
            PaymentSettingsService.isGatewayEnabled.mockRejectedValue(new Error("Service error"));
            await (0, paymentSettings_1.handlePaymentToggleGateway)(ctx, "midtrans");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Failed to update setting");
        });
    });
    (0, globals_1.describe)("handlePaymentSetDefault", () => {
        (0, globals_1.it)("should reject non-admin users", async () => {
            ctx.from.id = 999999999;
            await (0, paymentSettings_1.handlePaymentSetDefault)(ctx, "midtrans");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Unauthorized");
        });
        (0, globals_1.it)("should set default gateway when enabled", async () => {
            PaymentSettingsService.isGatewayEnabled.mockResolvedValue(true);
            PaymentSettingsService.getAllSettings.mockResolvedValue({
                midtrans_enabled: "true",
                tripay_enabled: "false",
                duitku_enabled: "true",
            });
            PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");
            await (0, paymentSettings_1.handlePaymentSetDefault)(ctx, "duitku");
            (0, globals_1.expect)(PaymentSettingsService.setDefaultGateway).toHaveBeenCalledWith("duitku", BigInt(ctx.from.id));
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("✅ Default gateway set to DUITKU!");
        });
        (0, globals_1.it)("should reject setting disabled gateway as default", async () => {
            PaymentSettingsService.isGatewayEnabled.mockResolvedValue(false);
            await (0, paymentSettings_1.handlePaymentSetDefault)(ctx, "tripay");
            (0, globals_1.expect)(PaymentSettingsService.setDefaultGateway).not.toHaveBeenCalled();
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Cannot set tripay as default - it's disabled! Enable it first.", { show_alert: true });
        });
        (0, globals_1.it)("should handle set default errors gracefully", async () => {
            PaymentSettingsService.isGatewayEnabled.mockResolvedValue(true);
            PaymentSettingsService.setDefaultGateway.mockRejectedValue(new Error("Service error"));
            await (0, paymentSettings_1.handlePaymentSetDefault)(ctx, "midtrans");
            (0, globals_1.expect)(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Failed to update setting");
        });
    });
});
//# sourceMappingURL=paymentSettings.test.js.map