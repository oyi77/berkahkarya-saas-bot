import { BotContext } from "@/types";
import {
  handleTopupSelection,
  handlePaymentGateway,
  checkPayment,
  handleTopupExtraCredit,
  handleStarsMenu,
  handleStarsInvoice,
  STARS_PACKAGES,
  handleCryptoMenu,
  handleCryptoCoinSelect,
  handleCryptoPayment,
} from "@/commands/topup";
import { CRYPTO_PACKAGES, CRYPTO_COINS } from "@/services/nowpayments.service";
import {
  subscriptionCommand,
  handleSubscriptionPurchase,
  handleCancelSubscription,
} from "@/commands/subscription";
import { SUBSCRIPTION_PLANS, PlanKey, BillingCycle, EXTRA_CREDIT_PACKAGES } from "@/config/pricing";

export async function handleAccountCallback(ctx: BotContext, data: string): Promise<boolean> {
    // Telegram Stars handlers
    if (data === "topup_stars_menu") {
      await handleStarsMenu(ctx);
      return true;
    }

    if (data.startsWith("topup_stars_")) {
      const credits = parseInt(data.replace("topup_stars_", ""), 10);
      const validPkg = STARS_PACKAGES.find((p) => p.credits === credits);
      if (!validPkg) {
        await ctx.answerCbQuery("Invalid Stars package");
        return true;
      }
      await handleStarsInvoice(ctx, credits);
      return true;
    }

    // Crypto payment handlers
    if (data === "topup_crypto_menu") {
      await handleCryptoMenu(ctx);
      return true;
    }

    if (data.startsWith("topup_crypto_pkg_")) {
      const credits = parseInt(data.replace("topup_crypto_pkg_", ""), 10);
      const validPkg = CRYPTO_PACKAGES.find((p) => p.credits === credits);
      if (!validPkg) {
        await ctx.answerCbQuery("Invalid crypto package");
        return true;
      }
      await handleCryptoCoinSelect(ctx, credits);
      return true;
    }

    if (data.startsWith("topup_crypto_pay_")) {
      const parts = data.replace("topup_crypto_pay_", "").split("_");
      const credits = parseInt(parts[0], 10);
      const coin = parts.slice(1).join("_"); // coin ids may not have underscore but safe
      const validCoin = CRYPTO_COINS.find((c) => c.id === coin);
      if (!validCoin) {
        await ctx.answerCbQuery("Invalid coin");
        return true;
      }
      await handleCryptoPayment(ctx, credits, coin);
      return true;
    }

    // Topup handlers
    if (data.startsWith("topup_pkg_")) {
      const packageId = data.replace("topup_pkg_", "");
      await handleTopupSelection(ctx, packageId);
      return true;
    }

    if (data.startsWith("topup_pay_")) {
      const parts = data.replace("topup_pay_", "").split("_");
      const packageId = parts[0];
      const gateway = parts[1];
      await handlePaymentGateway(ctx, packageId, gateway);
      return true;
    }

    if (data.startsWith("topup_extra_")) {
      const credits = parseInt(data.replace("topup_extra_", ""), 10);
      const validPkg = EXTRA_CREDIT_PACKAGES.find((p) => p.credits === credits);
      if (!validPkg) {
        await ctx.answerCbQuery("Invalid credit package");
        return true;
      }
      await handleTopupExtraCredit(ctx, credits);
      return true;
    }

    if (data.startsWith("topup_")) {
      const packageId = data.replace("topup_", "");
      await handleTopupSelection(ctx, packageId);
      return true;
    }

    if (data.startsWith("check_payment_")) {
      const orderId = data.replace("check_payment_", "");
      await checkPayment(ctx, orderId);
      return true;
    }

    // Subscription handlers
    if (data.startsWith("subscribe_")) {
      const parts = data.replace("subscribe_", "").split("_");
      const plan = parts[0] as PlanKey;
      const cycle = parts[1] as BillingCycle;
      if (
        !(plan in SUBSCRIPTION_PLANS) ||
        !["monthly", "annual"].includes(cycle)
      ) {
        await ctx.answerCbQuery("Invalid plan selection");
        return true;
      }
      await handleSubscriptionPurchase(ctx, plan, cycle);
      return true;
    }

    if (data === "cancel_subscription") {
      await handleCancelSubscription(ctx);
      return true;
    }

    if (data === "open_subscription") {
      await ctx.deleteMessage().catch(() => { });
      await subscriptionCommand(ctx);
      return true;
    }

    return false;
}
