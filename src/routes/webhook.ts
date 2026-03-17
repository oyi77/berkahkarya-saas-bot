import { FastifyInstance } from 'fastify';
import { Telegraf } from 'telegraf';
import { BotContext } from '@/types';
import { logger } from '@/utils/logger';
import { PaymentService } from '@/services/payment.service';
import { DuitkuService } from '@/services/duitku.service';
import crypto from 'crypto';

interface WebhookOptions {
  bot: Telegraf<BotContext>;
}

export async function webhookRoutes(server: FastifyInstance, options: WebhookOptions): Promise<void> {
  const { bot } = options;

  server.post('/webhook/telegram', async (request, reply) => {
    try {
      const secret = request.headers['x-telegram-bot-api-secret-token'];
      if (secret !== process.env.WEBHOOK_SECRET) {
        logger.warn('Invalid webhook secret');
        return reply.status(401).send({ error: 'Unauthorized' });
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
      const signature = request.headers['x-signature'] as string;
      const expectedSignature = crypto
        .createHash('sha512')
        .update(`${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid Midtrans signature');
        return reply.status(401).send({ error: 'Invalid signature' });
      }

      logger.info('Midtrans webhook received:', body);
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
      const body = request.body as any;
      const signature = request.headers['x-signature'] as string;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.TRIPAY_PRIVATE_KEY || '')
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid Tripay signature');
        return reply.status(401).send({ error: 'Invalid signature' });
      }

      logger.info('Tripay webhook received:', body);
      const statusMap: Record<string, string> = {
        'PAID': 'success', 'EXPIRED': 'failed', 'FAILED': 'failed', 'CANCELLED': 'failed',
      };
      await PaymentService.handleNotification({
        order_id: body.reference,
        status_code: body.status_code?.toString() || '200',
        gross_amount: body.amount?.toString() || '0',
        signature_key: body.signature,
        transaction_status: statusMap[body.status] || 'pending',
        payment_type: body.payment_method,
      });
      
      return { ok: true };
    } catch (error) {
      logger.error('Tripay webhook error:', error);
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
      
      return { ok: result.success, message: result.message };
    } catch (error) {
      logger.error('Duitku webhook error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
