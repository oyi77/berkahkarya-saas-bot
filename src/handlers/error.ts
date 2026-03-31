/**
 * Error Handler
 * 
 * Handles all bot errors
 */

import { BotContext } from '@/types';
import { logger } from '@/utils/logger';

/**
 * Handle bot errors
 */
export async function errorHandler(err: Error, ctx: BotContext): Promise<void> {
  logger.error('Bot error:', {
    error: err.message,
    stack: err.stack,
    update: ctx.update,
  });

  // Don't show internal errors to users — they're confusing.
  // Only log for admin. The specific handler should have already
  // sent a user-friendly message before the error escaped here.
  // If we DO need to notify (e.g., completely unhandled), keep it minimal.
  try {
    // Only reply if this is a callback query (user tapped a button) — prevents spam
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('').catch(() => {});
    }
    // Don't send error message to user — handlers already handle errors gracefully.
    // The global error handler is a safety net for truly unhandled exceptions.
  } catch (replyError) {
    logger.error('Failed in error handler:', replyError);
  }
}
