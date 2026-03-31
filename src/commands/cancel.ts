import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { t } from '@/i18n/translations';

export async function cancelCommand(ctx: BotContext): Promise<void> {
  try {
    const user = ctx.from;
    if (!user) {
      await ctx.reply(t('social.unable_identify_user', 'id'));
      return;
    }

    const currentState = ctx.session?.state;
    
    if (currentState && (
      currentState.includes('VIDEO_CREATE') ||
      currentState.includes('CREATE') ||
      currentState.includes('IMAGE_CREATE') ||
      currentState.includes('CUSTOM_')
    )) {
      if (ctx.session) {
        ctx.session.state = 'DASHBOARD';
        ctx.session.videoCreation = undefined;
        ctx.session.videoCreationNew = undefined;
        ctx.session.stateData = {};
      }
      
      await ctx.reply(
        'Dibatalkan. Operasi yang sedang berjalan telah dibatalkan.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        }
      );
      
      logger.info(`User ${user.id} cancelled operation`);
    } else {
      await ctx.reply(
        'Tidak ada operasi yang sedang berjalan.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Menu Utama', callback_data: 'main_menu' }],
            ],
          },
        }
      );
    }
  } catch (error) {
    logger.error('Error in cancel command:', error);
    await ctx.reply(t('error.generic', 'id'));
  }
}
