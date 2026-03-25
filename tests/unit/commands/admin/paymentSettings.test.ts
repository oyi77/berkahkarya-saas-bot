import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  paymentSettingsCommand,
  handlePaymentDefaultGateway,
  handlePaymentToggleGateway,
  handlePaymentSetDefault,
} from "@/commands/admin/paymentSettings";
import { createMockContext } from "../../../fixtures";

jest.mock("@/services/payment-settings.service", () => ({
  PaymentSettingsService: {
    getAllSettings: jest.fn(),
    getDefaultGateway: jest.fn(),
    isGatewayEnabled: jest.fn(),
    setGatewayEnabled: jest.fn(),
    setDefaultGateway: jest.fn(),
  },
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("Admin Payment Settings Command", () => {
  let ctx: ReturnType<typeof createMockContext>;
  let PaymentSettingsService: any;
  let logger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createMockContext();
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

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SUPER_ADMIN_IDS;
  });

  describe("paymentSettingsCommand", () => {
    it("should reject non-admin users", async () => {
      ctx.from.id = 999999999;

      await paymentSettingsCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ You do not have permission to use this command.",
      );
    });

    it("should handle missing user gracefully", async () => {
      ctx.from = undefined as any;

      await paymentSettingsCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ You do not have permission to use this command.",
      );
    });

    it("should show payment settings menu", async () => {
      PaymentSettingsService.getAllSettings.mockResolvedValue({
        midtrans_enabled: "true",
        tripay_enabled: "false",
        duitku_enabled: "true",
      });
      PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");

      await paymentSettingsCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalled();
      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Payment Settings");
      expect(replyCall[0]).toContain("Default Gateway:");
      expect(replyCall[0]).toContain("MIDTRANS");
    });

    it("should show enabled/disabled status for each gateway", async () => {
      PaymentSettingsService.getAllSettings.mockResolvedValue({
        midtrans_enabled: "true",
        tripay_enabled: "false",
        duitku_enabled: "true",
      });
      PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");

      await paymentSettingsCommand(ctx as any);

      const replyCall = ctx.reply.mock.calls[0];
      expect(replyCall[0]).toContain("Midtrans: ✅ Enabled");
      expect(replyCall[0]).toContain("Tripay: ❌ Disabled");
      expect(replyCall[0]).toContain("Duitku: ✅ Enabled");
    });

    it("should show correct toggle buttons", async () => {
      PaymentSettingsService.getAllSettings.mockResolvedValue({
        midtrans_enabled: "true",
        tripay_enabled: "false",
        duitku_enabled: "true",
      });
      PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");

      await paymentSettingsCommand(ctx as any);

      const keyboard = ctx.reply.mock.calls[0][1].reply_markup.inline_keyboard;
      const allButtons = keyboard.flat();
      expect(
        allButtons.some(
          (btn: any) => btn.callback_data === "admin_payment_toggle_midtrans",
        ),
      ).toBe(true);
      expect(
        allButtons.some(
          (btn: any) => btn.callback_data === "admin_payment_toggle_tripay",
        ),
      ).toBe(true);
      expect(
        allButtons.some(
          (btn: any) => btn.callback_data === "admin_payment_toggle_duitku",
        ),
      ).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      PaymentSettingsService.getAllSettings.mockRejectedValue(
        new Error("Database error"),
      );

      await paymentSettingsCommand(ctx as any);

      expect(ctx.reply).toHaveBeenCalledWith(
        "❌ Something went wrong. Please try again.",
      );
    });
  });

  describe("handlePaymentDefaultGateway", () => {
    it("should reject non-admin users", async () => {
      ctx.from.id = 999999999;

      await handlePaymentDefaultGateway(ctx as any);

      expect(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Unauthorized");
    });

    it("should show gateway selection menu", async () => {
      await handlePaymentDefaultGateway(ctx as any);

      expect(ctx.editMessageText).toHaveBeenCalled();
      const editCall = ctx.editMessageText.mock.calls[0];
      expect(editCall[0]).toContain("Select Default Gateway");
    });

    it("should show all gateway options", async () => {
      await handlePaymentDefaultGateway(ctx as any);

      const keyboard =
        ctx.editMessageText.mock.calls[0][1].reply_markup.inline_keyboard;
      const allButtons = keyboard.flat();
      expect(
        allButtons.some(
          (btn: any) =>
            btn.callback_data === "admin_payment_setdefault_midtrans",
        ),
      ).toBe(true);
      expect(
        allButtons.some(
          (btn: any) => btn.callback_data === "admin_payment_setdefault_duitku",
        ),
      ).toBe(true);
      expect(
        allButtons.some(
          (btn: any) => btn.callback_data === "admin_payment_setdefault_tripay",
        ),
      ).toBe(true);
    });
  });

  describe("handlePaymentToggleGateway", () => {
    it("should reject non-admin users", async () => {
      ctx.from.id = 999999999;

      await handlePaymentToggleGateway(ctx as any, "midtrans");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Unauthorized");
    });

    it("should enable disabled gateway", async () => {
      PaymentSettingsService.isGatewayEnabled.mockResolvedValue(false);
      PaymentSettingsService.getAllSettings.mockResolvedValue({
        midtrans_enabled: "false",
        tripay_enabled: "false",
        duitku_enabled: "true",
      });
      PaymentSettingsService.getDefaultGateway.mockResolvedValue("duitku");

      await handlePaymentToggleGateway(ctx as any, "midtrans");

      expect(PaymentSettingsService.setGatewayEnabled).toHaveBeenCalledWith(
        "midtrans",
        true,
        BigInt(ctx.from.id),
      );
      expect(ctx.answerCbQuery).toHaveBeenCalledWith("MIDTRANS enabled!");
    });

    it("should disable enabled gateway", async () => {
      PaymentSettingsService.isGatewayEnabled.mockResolvedValue(true);
      PaymentSettingsService.getAllSettings.mockResolvedValue({
        midtrans_enabled: "true",
        tripay_enabled: "false",
        duitku_enabled: "true",
      });
      PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");

      await handlePaymentToggleGateway(ctx as any, "midtrans");

      expect(PaymentSettingsService.setGatewayEnabled).toHaveBeenCalledWith(
        "midtrans",
        false,
        BigInt(ctx.from.id),
      );
      expect(ctx.answerCbQuery).toHaveBeenCalledWith("MIDTRANS disabled!");
    });

    it("should handle toggle errors gracefully", async () => {
      PaymentSettingsService.isGatewayEnabled.mockRejectedValue(
        new Error("Service error"),
      );

      await handlePaymentToggleGateway(ctx as any, "midtrans");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "❌ Failed to update setting",
      );
    });
  });

  describe("handlePaymentSetDefault", () => {
    it("should reject non-admin users", async () => {
      ctx.from.id = 999999999;

      await handlePaymentSetDefault(ctx as any, "midtrans");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith("❌ Unauthorized");
    });

    it("should set default gateway when enabled", async () => {
      PaymentSettingsService.isGatewayEnabled.mockResolvedValue(true);
      PaymentSettingsService.getAllSettings.mockResolvedValue({
        midtrans_enabled: "true",
        tripay_enabled: "false",
        duitku_enabled: "true",
      });
      PaymentSettingsService.getDefaultGateway.mockResolvedValue("midtrans");

      await handlePaymentSetDefault(ctx as any, "duitku");

      expect(PaymentSettingsService.setDefaultGateway).toHaveBeenCalledWith(
        "duitku",
        BigInt(ctx.from.id),
      );
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "✅ Default gateway set to DUITKU!",
      );
    });

    it("should reject setting disabled gateway as default", async () => {
      PaymentSettingsService.isGatewayEnabled.mockResolvedValue(false);

      await handlePaymentSetDefault(ctx as any, "tripay");

      expect(PaymentSettingsService.setDefaultGateway).not.toHaveBeenCalled();
      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "❌ Cannot set tripay as default - it's disabled! Enable it first.",
        { show_alert: true },
      );
    });

    it("should handle set default errors gracefully", async () => {
      PaymentSettingsService.isGatewayEnabled.mockResolvedValue(true);
      PaymentSettingsService.setDefaultGateway.mockRejectedValue(
        new Error("Service error"),
      );

      await handlePaymentSetDefault(ctx as any, "midtrans");

      expect(ctx.answerCbQuery).toHaveBeenCalledWith(
        "❌ Failed to update setting",
      );
    });
  });
});
