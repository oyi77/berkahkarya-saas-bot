/**
 * Tripay Payment Gateway Service
 * 
 * Handles payment transactions via Tripay
 */

import axios from 'axios';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || '';
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || '';
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || '';
const TRIPAY_ENVIRONMENT = process.env.TRIPAY_ENVIRONMENT || 'sandbox';

const BASE_URL = TRIPAY_ENVIRONMENT === 'sandbox'
  ? 'https://tripay.co.id/api-sandbox'
  : 'https://tripay.co.id/api';

interface TripayCreatePaymentParams {
  userId: bigint;
  packageId: string;
  username: string;
}

interface TripayPayment {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  reference?: string;
  error?: string;
}

export class TripayService {
  private static getHeaders() {
    return {
      'Authorization': `Bearer ${TRIPAY_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  static async createTransaction(params: TripayCreatePaymentParams): Promise<TripayPayment> {
    try {
      const packageDetails = this.getPackageDetails(params.packageId);
      
      const orderId = `TRP-${Date.now()}-${params.userId}`;
      const amount = packageDetails.price;

      const payload = {
        method: 'BRIVA',
        merchant_ref: orderId,
        amount: amount,
        customer: {
          name: params.username,
          email: '',
          phone: '',
        },
        item: [
          {
            name: packageDetails.name,
            price: amount,
            quantity: 1,
          },
        ],
        callback_url: process.env.TRIPAY_CALLBACK_URL || 'https://yourdomain.com/webhook/tripay',
        return_url: 'https://yourdomain.com/payment/success',
        expired_time: (new Date(Date.now() + 24 * 60 * 60 * 1000)).toISOString(),
        signature: this.generateSignature(orderId, amount),
      };

      const response = await axios.post(`${BASE_URL}/transaction/create`, payload, {
        headers: this.getHeaders(),
      });

      const data = response.data;
      
      if (data.success) {
        await prisma.transaction.create({
          data: {
            orderId: orderId,
            userId: params.userId,
            type: 'topup',
            packageName: params.packageId,
            amountIdr: amount,
            creditsAmount: packageDetails.totalCredits,
            gateway: 'tripay',
            gatewayTransactionId: data.data.reference,
            paymentMethod: data.data.method,
            status: 'pending',
          },
        });

        return {
          success: true,
          orderId: orderId,
          paymentUrl: data.data.payment_url,
          reference: data.data.reference,
        };
      }

      return {
        success: false,
        error: data.message || 'Failed to create payment',
      };
    } catch (error: any) {
      logger.error('Tripay create transaction error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  static async handleCallback(callbackData: any): Promise<{ success: boolean; message: string }> {
    try {
      const { merchant_ref, status, _signature } = callbackData;
      
      const transaction = await prisma.transaction.findUnique({
        where: { orderId: merchant_ref },
      });

      if (!transaction) {
        return { success: false, message: 'Transaction not found' };
      }

      let newStatus = 'pending';
      if (status === 'PAID' || status === 'success') {
        newStatus = 'success';
      } else if (status === 'EXPIRED') {
        newStatus = 'expired';
      } else if (status === 'FAILED' || status === 'FAILED') {
        newStatus = 'failed';
      }

      if (newStatus === 'success' && transaction.status !== 'success') {
        await prisma.user.update({
          where: { telegramId: transaction.userId },
          data: {
            creditBalance: { increment: transaction.creditsAmount || 0 },
          },
        });
      }

      await prisma.transaction.update({
        where: { orderId: merchant_ref },
        data: {
          status: newStatus,
          paidAt: newStatus === 'success' ? new Date() : undefined,
        },
      });

      return { success: true, message: 'Callback processed' };
    } catch (error: any) {
      logger.error('Tripay callback error:', error);
      return { success: false, message: error.message };
    }
  }

  static async checkTransaction(reference: string): Promise<any> {
    try {
      const response = await axios.get(`${BASE_URL}/transaction/detail`, {
        headers: this.getHeaders(),
        params: { reference },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Tripay check transaction error:', error);
      return null;
    }
  }

  static getPackageDetails(packageId: string): { name: string; price: number; totalCredits: number } {
    const packages: Record<string, { name: string; price: number; totalCredits: number }> = {
      starter: { name: 'Starter Flow', price: 49000, totalCredits: 6 },
      growth: { name: 'Growth Machine', price: 149000, totalCredits: 22 },
      scale: { name: 'Business Kingdom', price: 499000, totalCredits: 85 },
      enterprise: { name: 'Enterprise', price: 999000, totalCredits: 200 },
    };

    return packages[packageId] || packages.starter;
  }

  private static generateSignature(merchantRef: string, amount: number): string {
    const signature = crypto
      .createHash('sha256')
      .update(TRIPAY_MERCHANT_CODE + merchantRef + amount + TRIPAY_PRIVATE_KEY)
      .digest('hex');
    return signature;
  }
}
