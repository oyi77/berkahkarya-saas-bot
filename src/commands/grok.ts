/**
 * Grok Command — Chat with Grok-Api AI directly from Telegram.
 */

import { BotContext } from '@/types';
import { getGrokApiService } from '@/services/grok-api.service';
import { logger } from '@/utils/logger';

const VALID_MODELS = ['grok-3-auto', 'grok-3-fast', 'grok-4', 'grok-4-mini-thinking-tahoe'];

export async function grokCommand(ctx: BotContext): Promise<void> {
  const args = (ctx.message as { text?: string })?.text?.replace('/grok', '').trim() || '';

  if (!args) {
    await ctx.reply(
      '*Grok AI — Free LLM*\n\n' +
      'Usage: /grok <your question>\n\n' +
      'Models:\n' +
      '• grok-3-auto (default)\n' +
      '• grok-3-fast (quick)\n' +
      '• grok-4 (powerful)\n' +
      '• grok-4-mini-thinking-tahoe (reasoning)\n\n' +
      'Switch model: /grok --model grok-4 <question>\n\n' +
      'Clear context: /grok --clear',
      { parse_mode: 'Markdown' },
    );
    return;
  }

  let model = 'grok-3-fast';
  let message = args;

  if (args.startsWith('--model ')) {
    const parts = args.split(' ');
    const modelArg = parts[1];
    if (modelArg && VALID_MODELS.includes(modelArg)) {
      model = modelArg;
      message = parts.slice(2).join(' ');
    }
  }

  const clearMatch = message.match(/^--clear\s*/);
  if (clearMatch) {
    message = message.replace(/^--clear\s*/, '');
    const grok = getGrokApiService();
    grok.clearContext();
    await ctx.reply('Context cleared.');
    if (!message) return;
  }

  if (!message) {
    await ctx.reply('Please ask a question after the command.');
    return;
  }

  await ctx.reply('Thinking...');

  const grok = getGrokApiService();

  try {
    const result = await grok.ask(message, model);

    if (result.status !== 'success') {
      await ctx.reply(`Error: ${result.error || 'Unknown error'}`);
      return;
    }

    const response = result.response || 'No response received.';

    if (response.length > 4000) {
      const chunks = response.match(/[\s\S]{1,4000}/g) || [response];
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'Markdown' });
      }
    } else {
      await ctx.reply(response, { parse_mode: 'Markdown' });
    }

    logger.info(`LLM response: ${result.response?.slice(0, 100)}...`);
  } catch (err) {
    logger.error('Grok command error:', err);
    await ctx.reply(`Failed to connect to Grok-Api: ${err}`);
  }
}
