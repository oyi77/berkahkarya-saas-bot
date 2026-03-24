import { BotContext } from "@/types";
import { P2pService } from "@/services/p2p.service";

export async function sendCommand(ctx: BotContext): Promise<void> {
    const message = ctx.message as any;
    if (!message || !message.text) return;

    const args = message.text.split(" ");
    if (args.length !== 3) {
        await ctx.reply("Usage: /send <recipient_telegram_id> <amount>\nExample: /send 123456789 50", { parse_mode: "HTML" });
        return;
    }

    const recipientIdStr = args[1];
    const amountStr = args[2];
    const senderId = BigInt(ctx.from!.id);

    let recipientId: bigint;
    try {
        recipientId = BigInt(recipientIdStr);
    } catch (err) {
        await ctx.reply("❌ Invalid recipient ID format.");
        return;
    }

    const amount = Number(amountStr);
    if (isNaN(amount) || amount < 1) {
        await ctx.reply("❌ Amount must be a positive number.");
        return;
    }

    try {
        const { fee, totalDeduction } = await P2pService.validateTransfer(senderId, recipientId, amount);

        await ctx.reply(
            `💸 *Transfer Confirmation*\n\n` +
            `You are about to send *${amount}* credits to ID \`${recipientIdStr}\`.\n` +
            `💳 Network Fee (0.5%): *${fee}* credits\n` +
            `🔥 Total Deduction: *${totalDeduction}* credits\n\n` +
            `Do you want to proceed?`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "✅ Confirm Transfer", callback_data: `confirm_send_${recipientIdStr}_${amount}` },
                            { text: "❌ Cancel", callback_data: "cancel_send" }
                        ]
                    ]
                }
            }
        );
    } catch (error: any) {
        await ctx.reply(`❌ Transfer Failed: ${error.message}`);
    }
}
