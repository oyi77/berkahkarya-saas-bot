import { FastifyInstance } from 'fastify';
import { Telegraf } from 'telegraf';
import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { PaymentService } from '@/services/payment.service';
import { DuitkuService } from '@/services/duitku.service';
import { NowPaymentsService } from '@/services/nowpayments.service';
import crypto from 'crypto';

interface WebhookOptions {
  bot: Telegraf<BotContext>;
}

export async function webhookRoutes(server: FastifyInstance, options: WebhookOptions): Promise<void> {
  const { bot } = options;

  server.post('/webhook/telegram', async (request, reply) => {
    try {
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (webhookSecret) {
        const secret = request.headers['x-telegram-bot-api-secret-token'];
        if (secret !== webhookSecret) {
          logger.warn('Invalid webhook secret');
          return reply.status(401).send({ error: 'Unauthorized' });
        }
      }
      await bot.handleUpdate(request.body as any);
      return { ok: true };
    } catch (error) {
      logger.error('Telegram webhook error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  server.post('/webhook/midtrans', async (request, reply) => {
    try {
      const body = request.body as any;
      // Delegating verification to PaymentService for single-source-of-truth
      logger.info('Midtrans webhook received:', { order_id: body.order_id, status: body.transaction_status });
      await PaymentService.handleNotification({
        order_id: body.order_id,
        status_code: body.status_code,
        gross_amount: body.gross_amount,
        signature_key: body.signature_key,
        transaction_status: body.transaction_status,
        payment_type: body.payment_type,
      });
      
      return { ok: true };
    } catch (error) {
      logger.error('Midtrans webhook error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  server.post('/webhook/tripay', async (request, reply) => {
    try {
      const tripayPrivateKey = process.env.TRIPAY_PRIVATE_KEY || '';
      if (!tripayPrivateKey) {
        logger.error('TRIPAY_PRIVATE_KEY is not set — rejecting Tripay webhook');
        return reply.status(500).send({ error: 'Tripay webhook not configured' });
      }

      const body = request.body as any;
      const signature = request.headers['x-signature'] as string;
      const expectedSignature = crypto
        .createHmac('sha256', tripayPrivateKey)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid Tripay signature', { received: signature, expected: expectedSignature });
        return reply.status(401).send({ error: 'Invalid signature' });
      }

      logger.info('Tripay webhook received:', body);
      const statusMap: Record<string, string> = {
        'PAID': 'success', 'EXPIRED': 'failed', 'FAILED': 'failed', 'CANCELLED': 'failed',
      };
      const result = await PaymentService.handleNotification({
        order_id: body.merchant_ref,
        status_code: body.status_code?.toString() || '200',
        gross_amount: body.amount?.toString() || '0',
        signature_key: body.signature,
        transaction_status: statusMap[body.status] || 'pending',
        payment_type: body.payment_method,
      });

      // Notify user on payment failure/expiry
      if ((body.status === 'EXPIRED' || body.status === 'FAILED' || body.status === 'CANCELLED') && body.merchant_ref && bot) {
        try {
          const tx = await prisma.transaction.findUnique({ where: { orderId: body.merchant_ref } });
          if (tx?.userId) {
            await bot.telegram.sendMessage(tx.userId.toString(),
              `❌ *Pembayaran ${body.status === 'EXPIRED' ? 'Kedaluwarsa' : 'Gagal'}*\n\nOrder: \`${body.merchant_ref}\`\n\nSilakan coba lagi.`,
              { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '💳 Coba Lagi', callback_data: 'topup' }]] } }
            ).catch(() => {});
          }
        } catch { /* best-effort notification */ }
      }

      return { ok: result.success };
    } catch (error) {
      logger.error('Tripay webhook error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  server.post('/webhook/nowpayments', async (request, reply) => {
    try {
      const body = request.body as any;

      // Verify IPN signature — mandatory when NOWPAYMENTS_IPN_SECRET is configured
      const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
      if (ipnSecret) {
        const signature = request.headers['x-nowpayments-sig'] as string;
        if (!signature) {
          logger.warn('NOWPayments: missing x-nowpayments-sig header');
          return reply.status(400).send({ error: 'Missing signature' });
        }
        const sortedBody = JSON.stringify(
          Object.keys(body).sort().reduce((acc: any, key) => { acc[key] = body[key]; return acc; }, {})
        );
        const expectedSig = crypto.createHmac('sha512', ipnSecret).update(sortedBody).digest('hex');
        if (signature !== expectedSig) {
          logger.warn('NOWPayments: invalid IPN signature');
          return reply.status(401).send({ error: 'Invalid signature' });
        }
      }

      logger.info('NOWPayments webhook received:', body);

      const result = await NowPaymentsService.handleWebhook(body);

      // Send Telegram notification if credits were added
      if (result.success && result.message === 'Credits added' && body.order_id) {
        try {
          // order_id format: CRYPTO-<timestamp>-<telegramId>
          const orderId = body.order_id as string;
          const lastDash = orderId.lastIndexOf('-');
          const telegramId = orderId.substring(lastDash + 1);
          if (telegramId && /^\d+$/.test(telegramId) && bot) {
            const coin = body.pay_currency?.toUpperCase() || 'CRYPTO';
            const amount = body.price_amount ? `$${body.price_amount}` : '';
            await bot.telegram.sendMessage(
              telegramId,
              `✅ *Pembayaran Crypto Berhasil!*\n\n` +
              `💰 ${amount} ${coin} diterima\n` +
              `🎬 Kredit sudah ditambahkan ke akun kamu\n\n` +
              `Gunakan /create untuk buat video sekarang! 🚀`,
              { parse_mode: 'Markdown' }
            );
          }
        } catch (notifyErr) {
          logger.warn('Failed to notify user about crypto payment:', notifyErr);
        }
      }

      return { ok: result.success, message: result.message };
    } catch (error) {
      logger.error('NOWPayments webhook error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  server.post('/webhook/duitku', async (request, reply) => {
    try {
      const body = request.body as any;
      logger.info('Duitku callback received:', body);
      
      const result = await DuitkuService.handleCallback({
        merchantCode: body.merchantCode,
        amount: body.amount,
        merchantOrderId: body.merchantOrderId,
        resultCode: body.resultCode,
        reference: body.reference,
        signature: body.signature,
      });

      // Notify user on payment failure
      if (body.resultCode !== '00' && body.resultCode !== '01' && body.merchantOrderId && bot) {
        try {
          const tx = await prisma.transaction.findUnique({ where: { orderId: body.merchantOrderId } });
          if (tx?.userId) {
            await bot.telegram.sendMessage(tx.userId.toString(),
              `❌ *Pembayaran Gagal*\n\nOrder: \`${body.merchantOrderId}\`\n\nSilakan coba lagi atau pilih metode pembayaran lain.`,
              { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '💳 Coba Lagi', callback_data: 'topup' }]] } }
            ).catch(() => {});
          }
        } catch { /* best-effort notification */ }
      }

      return { ok: result.success, message: result.message };
    } catch (error) {
      logger.error('Duitku webhook error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
