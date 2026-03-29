import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ReferralService } from '@/services/referral.service';
import { SubscriptionService } from '@/services/subscription.service';
import { PlanKey, BillingCycle, getPackagesAsync } from '@/config/pricing';
import { AnalyticsService } from '@/services/analytics.service';

const DUITKU_BASE_URL = process.env.DUITKU_ENVIRONMENT === 'production'
  ? 'https://passport.duitku.com'
  : 'https://sandbox.duitku.com';

const MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || '';
const API_KEY = process.env.DUITKU_API_KEY || '';

export interface DuitkuCreateResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber?: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

export class DuitkuService {
  static async createTransaction(params: {
    userId: bigint;
    packageId: string;
    username?: string;
    email?: string;
    phone?: string;
  }): Promise<{ orderId: string; paymentUrl: string; vaNumber?: string }> {
    const packages = await getPackagesAsync();
    const pkg = packages.find(p => p.id === params.packageId);
    
    if (!pkg) {
      throw new Error('Invalid package');
    }

    const price = pkg.priceIdr || (pkg as any).price;
    const credits = pkg.credits + (pkg.bonus || 0);

    const orderId = `OC-${Date.now()}-${params.userId}`;
    const signature = crypto.createHash('md5')
      .update(MERCHANT_CODE + orderId + price + API_KEY)
      .digest('hex');

    await prisma.transaction.create({
      data: {
        orderId,
        userId: params.userId,
        type: 'topup',
        packageName: params.packageId,
        amountIdr: price,
        creditsAmount: credits,
        gateway: 'duitku',
        status: 'pending',
      },
    });

    try {
      const response = await axios.post(
        `${DUITKU_BASE_URL}/webapi/api/merchant/v2/inquiry`,
        {
          merchantCode: MERCHANT_CODE,
          paymentAmount: price,
          paymentMethod: 'VC', // Generic CC/VA
          merchantOrderId: orderId,
          productDetails: `${pkg.name} Package - ${credits} Credits`,
          customerVaName: params.username || 'Customer',
          email: params.email || 'customer@email.com',
          phoneNumber: params.phone || '08123456789',
          callbackUrl: `${process.env.WEBHOOK_URL}/webhook/duitku`,
          returnUrl: `${process.env.WEBHOOK_URL}/payment/finish`,
          signature,
          expiryPeriod: 60,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data: DuitkuCreateResponse = response.data;
      logger.info(`Duitku transaction created: ${orderId}, ref: ${data.reference}`);

      return { orderId, paymentUrl: data.paymentUrl, vaNumber: data.vaNumber };
    } catch (error: any) {
      logger.error('Duitku API error:', error.response?.data || error.message);
      throw new Error('Failed to create payment');
    }
  }

  static async handleCallback(params: {
    merchantCode: string;
    amount: string;
    merchantOrderId: string;
    resultCode: string;
    reference: string;
    signature: string;
  }): Promise<{ success: boolean; message: string }> {
    const expectedSignature = crypto.createHash('md5')
      .update(params.merchantCode + params.amount + params.merchantOrderId + API_KEY)
      .digest('hex');

    if (params.signature !== expectedSignature) {
      logger.error('Invalid Duitku signature');
      return { success: false, message: 'Invalid signature' };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { orderId: params.merchantOrderId },
    });

    if (!transaction) {
      logger.error(`Transaction not found: ${params.merchantOrderId}`);
      return { success: false, message: 'Transaction not found' };
    }

    let newStatus = transaction.status;
    if (params.resultCode === '00') newStatus = 'success';
    else if (params.resultCode === '01') newStatus = 'pending';
    else newStatus = 'failed';

    await prisma.transaction.update({
      where: { orderId: params.merchantOrderId },
      data: {
        status: newStatus,
        gatewayTransactionId: params.reference,
        paidAt: newStatus === 'success' ? new Date() : undefined,
      },
    });

    if (newStatus === 'success' && transaction.status !== 'success') {
      if (transaction.type === 'subscription') {
        const parts = transaction.packageName.split('_');
        const plan = parts[0] as PlanKey;
        const billingCycle: BillingCycle = parts[1] === 'annual' ? 'annual' : 'monthly';

        await SubscriptionService.createSubscription(
          transaction.userId,
          plan,
          billingCycle,
          params.merchantOrderId
        );
        logger.info(`Subscription activated: ${plan}/${billingCycle} for user ${transaction.userId}`);
      } else {
        const credits = Number(transaction.creditsAmount) || 0;
        await prisma.user.update({
          where: { telegramId: transaction.userId },
          data: { creditBalance: { increment: credits } },
        });
        logger.info(`Added ${credits} credits to user ${transaction.userId}`);
      }

      await ReferralService.processCommissions(
        params.merchantOrderId,
        Number(transaction.amountIdr),
        transaction.userId
      );

      // Track purchase event
      try {
        const user = await prisma.user.findUnique({
          where: { telegramId: transaction.userId },
          select: { 
            username: true,
            utmSource: true,
            utmCampaign: true,
            utmContent: true,
            lpVariant: true,
            fbc: true,
            fbp: true,
            ttclid: true,
            createdAt: true,
          },
        });
        
        const daysToConversion = user?.createdAt 
          ? Math.floor((Date.now() - user.createdAt.getTime()) / 86400000)
          : 0;
        
        await AnalyticsService.trackPurchase({
          user_id: transaction.userId.toString(),
          amount_idr: Number(transaction.amountIdr),
          transaction_id: params.merchantOrderId,
          event_source_url: `${process.env.WEBHOOK_URL}/topup`,
          utm_source: user?.utmSource,
          utm_campaign: user?.utmCampaign,
          utm_content: user?.utmContent,
          lp_variant: user?.lpVariant,
          fbc: user?.fbc,
          fbp: user?.fbp,
          ttclid: user?.ttclid,
          days_to_conversion: daysToConversion,
        });
        
        await prisma.transaction.update({
          where: { orderId: params.merchantOrderId },
          data: {
            utmCampaign: user?.utmCampaign,
            utmContent: user?.utmContent,
            lpVariant: user?.lpVariant,
            daysToConversion,
          },
        });
        
        logger.info(`✅ Analytics tracked for Duitku purchase: ${params.merchantOrderId}`);
      } catch (analyticsError) {
        logger.warn(`⚠️ Analytics tracking failed (non-blocking): ${analyticsError}`);
      }
    }

    return { success: true, message: 'Callback processed' };
  }

  static async checkTransaction(orderId: string): Promise<{
    status: string;
    amount: number;
  } | null> {
    const signature = crypto.createHash('md5')
      .update(MERCHANT_CODE + orderId + API_KEY)
      .digest('hex');

    try {
      const response = await axios.post(
        `${DUITKU_BASE_URL}/webapi/api/merchant/transactionStatus`,
        { merchantCode: MERCHANT_CODE, merchantOrderId: orderId, signature },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const data = response.data;
      return { status: data.statusCode, amount: parseInt(data.amount) };
    } catch (error) {
      logger.error('Duitku check error:', error);
      return null;
    }
  }

  static async getPackages() {
    return getPackagesAsync();
  }
}
