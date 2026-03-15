/**
 * User Middleware
 * 
 * Loads user data from database and attaches to session
 */

import { Middleware } from 'telegraf';
import { BotContext } from '@/types';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

/**
 * User middleware
 */
export const userMiddleware: Middleware<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    return next();
  }

  try {
    // Load user from database
    const dbUser = await prisma.user.findUnique({
      where: { telegramId: BigInt(userId) },
    });

    if (dbUser && ctx.session) {
      // Store user ID in session for quick access
      ctx.session.stateData = {
        ...ctx.session.stateData,
        userId: dbUser.telegramId.toString(),
        tier: dbUser.tier,
        credits: Number(dbUser.creditBalance),
      };

      // Update last activity
      await prisma.user.update({
        where: { telegramId: BigInt(userId) },
        data: { lastActivityAt: new Date() },
      });
    }

  } catch (error) {
    logger.error('Error loading user:', error);
    // Continue even if user loading fails
  }

  return next();
};
