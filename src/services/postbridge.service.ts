/**
 * PostBridge Service
 * 
 * Handles social media distribution via post-bridge.com
 */

import axios from 'axios';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const PB_API_KEY = process.env.POSTBRIDGE_API_KEY || '';
const PB_BASE_URL = 'https://api.post-bridge.com/v1';

const pbClient = axios.create({
  baseURL: PB_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PB_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export class PostBridgeService {
  /**
   * Get connect URL for social media platform
   * @param platform Platform to connect (tiktok, facebook, instagram, youtube)
   * @returns Auth URL
   */
  static async getConnectUrl(platform: string): Promise<string> {
    try {
      // In production, PB has an endpoint to generate OAuth URL for specific platform
      // For now, returning placeholder for the dashboard integration
      return `https://app.post-bridge.com/connect/${platform}?callback_url=${process.env.WEBHOOK_URL}/auth/pb-callback`;
    } catch (error) {
      logger.error('Error getting PB connect URL:', error);
      throw error;
    }
  }

  /**
   * Push video to PostBridge for publishing
   */
  static async publishVideo(params: {
    videoUrl: string;
    caption: string;
    socialAccountIds: string[];
    scheduledAt?: Date;
  }) {
    try {
      const response = await pbClient.post('/posts', {
        caption: params.caption,
        social_accounts: params.socialAccountIds,
        media_urls: [params.videoUrl],
        scheduled_at: params.scheduledAt?.toISOString(),
        use_queue: !params.scheduledAt,
      });

      return response.data;
    } catch (error) {
      logger.error('Error publishing to PostBridge:', error);
      throw error;
    }
  }

  /**
   * Sync accounts from PostBridge
   */
  static async syncUserAccounts(userId: bigint) {
    try {
      // This would normally fetch from PB and update our local SocialAccount table
      // response = await pbClient.get('/social-accounts');
      return true;
    } catch (error) {
       logger.error('Error syncing PB accounts:', error);
       return false;
    }
  }
}
