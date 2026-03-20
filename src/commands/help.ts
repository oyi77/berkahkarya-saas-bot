/**
 * Help Command
 * 
 * Handles /help command
 */

import { BotContext } from '@/types';

/**
 * Handle /help command
 */
export async function helpCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(
    '🆘 *Help & Support*\n\n' +
    '*Available Commands:*\n' +
    '/start - Start the bot\n' +
    '/menu - Show all features\n' +
    '/create - Create a new video\n' +
    '/chat - Chat with AI (just type /chat followed by your question)\n' +
    '/topup - Top up credits\n' +
    '/subscription - Subscription plans\n' +
    '/videos - My videos\n' +
    '/profile - My profile\n' +
    '/referral - Referral & affiliate\n' +
    '/settings - Settings\n' +
    '/support - Get help\n' +
    '/help - Show this help\n\n' +
    '*Creative Tools:*\n' +
    '🎬 Create Video — AI video generation\n' +
    '🖼️ Generate Image — AI image generation\n' +
    '🔄 Clone Video/Image — Recreate similar content\n' +
    '📋 Storyboard — Plan your video scenes\n' +
    '📈 Viral Research — Discover trending content\n' +
    '🔍 Disassemble — Extract prompts from media\n\n' +
    '*Quick Tips:*\n' +
    '• Upload a reference image for better video results\n' +
    '• Use /chat to brainstorm ideas with AI\n' +
    '• Choose the right niche for best results\n' +
    '• Refer friends to earn 15% commission!\n\n' +
    'Need more help? Contact support: @openclaw\\_support',
    { parse_mode: 'Markdown' }
  );
}
