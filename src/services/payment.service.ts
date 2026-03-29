/**
 * Payment Service
 * 
 * Handles Midtrans payment gateway integration with dynamic packages
 */

import axios from 'axios';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ReferralService } from '@/services/referral.service';
import { getPackagesAsync } from '@/config/pricing';
import crypto from 'crypto';

// Payment gateway configuration
const MIDTRANS_BASE_URL = process.env.MIDTRANS_ENVIRONMENT === 'production'
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';

export class PaymentService {
  /**
   * Create Midtrans Snap transaction
   */
  static async createTransaction(params: {
    userId: bigint;
    packageId: string;
    username?: string;
  }): Promise<{
    orderId: string;
    token: string;
    redirectUrl: string;
  }> {
    const packages = await getPackagesAsync();
    const pkg = packages.find(p => p.id === params.packageId);
    
    if (!pkg) {
      throw new Error('Invalid package');
    }

    const price = pkg.priceIdr || (pkg as any).price;
    const credits = pkg.credits + (pkg.bonus || 0);

    // Generate order ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `OC-${timestamp}-${params.userId}-${random}`;

    // Create transaction record
    await prisma.transaction.create({
      data: {
        orderId,
        userId: params.userId,
        type: 'topup',
        packageName: params.packageId,
        amountIdr: price,
        creditsAmount: credits,
        gateway: 'midtrans',
        status: 'pending',
      },
    });

    // Call Midtrans API
    try {
      const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
      
      const response = await axios.post(
        `${MIDTRANS_BASE_URL}/transactions`,
        {
          transaction_details: {
            order_id: orderId,
            gross_amount: price,
          },
          customer_details: {
            first_name: params.username || 'User',
          },
          item_details: [
            {
              id: params.packageId,
              price: price,
              quantity: 1,
              name: `${pkg.name} Package - ${credits} Credits`,
            },
          ],
          callbacks: {
            finish: `${process.env.WEBHOOK_URL}/payment/finish`,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      logger.info(`Created transaction: ${orderId}`);

      return {
        orderId,
        token: response.data.token,
        redirectUrl: response.data.redirect_url,
      };
    } catch (error: any) {
      logger.error('Midtrans API error:', error.response?.data || error.message);
      throw new Error('Failed to create payment transaction');
    }
  }

  /**
   * Verify Midtrans webhook signature
   */
  static verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string
  ): boolean {
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
      .digest('hex');
    
    return signatureKey === expectedSignature;
  }

  /**
   * Handle Midtrans webhook notification
   */
  static async handleNotification(notification: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
    transaction_status: string;
    payment_type: string;
  }): Promise<{ success: boolean; message: string }> {
    // Verify signature
    const isValid = this.verifySignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      notification.signature_key
    );

    if (!isValid) {
      logger.error('Invalid webhook signature');
      return { success: false, message: 'Invalid signature' };
    }

    // Find transaction
    const transaction = await prisma.transaction.findUnique({
      where: { orderId: notification.order_id },
    });

    if (!transaction) {
      logger.error(`Transaction not found: ${notification.order_id}`);
      return { success: false, message: 'Transaction not found' };
    }

    // Update transaction status
    let newStatus = transaction.status;
    
    switch (notification.transaction_status) {
      case 'capture':
      case 'settlement':
        newStatus = 'success';
        break;
      case 'pending':
        newStatus = 'pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        newStatus = 'failed';
        break;
      case 'refund':
        newStatus = 'refunded';
        break;
    }

    await prisma.transaction.update({
      where: { orderId: notification.order_id },
      data: {
        status: newStatus,
        paymentMethod: notification.payment_type,
        paidAt: newStatus === 'success' ? new Date() : undefined,
      },
    });

    // If success, add credits to user
    if (newStatus === 'success' && transaction.status !== 'success') {
      const credits = Number(transaction.creditsAmount) || 0;
      
      await prisma.user.update({
        where: { telegramId: transaction.userId },
        data: {
          creditBalance: { increment: credits },
          tier: 'basic',
        },
      });

      logger.info(`Added ${credits} credits to user ${transaction.userId}`);

      // Process referral commissions for this purchase
      await ReferralService.processCommissions(
        notification.order_id,
        Number(transaction.amountIdr),
        transaction.userId
      );
    }

    return { success: true, message: 'Notification processed' };
  }

  /**
   * Get transaction status
   */
  static async getTransactionStatus(orderId: string): Promise<{
    status: string;
    amount: number;
    credits: number;
  } | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
    });

    if (!transaction) return null;

    return {
      status: transaction.status,
      amount: Number(transaction.amountIdr),
      credits: Number(transaction.creditsAmount) || 0,
    };
  }

  /**
   * Get available packages
   */
  static async getPackages() {
    return getPackagesAsync();
  }
}
