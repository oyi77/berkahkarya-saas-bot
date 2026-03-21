/**
 * Avatar Service
 *
 * Manages persistent user avatars for consistent character/identity
 * generation across multiple image and video sessions.
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { ContentAnalysisService } from './content-analysis.service';

const MAX_AVATARS_PER_USER = 5;

export interface AvatarData {
  id: number;
  name: string;
  imageUrl: string;
  localPath?: string | null;
  description?: string | null;
  features?: Record<string, unknown> | null;
  isDefault: boolean;
}

export class AvatarService {
  /**
   * Save a new avatar for a user. Analyses the image with Gemini Vision
   * to extract a feature description for future prompt enrichment.
   */
  static async createAvatar(
    telegramId: bigint,
    name: string,
    imageUrl: string,
    localPath?: string,
  ): Promise<AvatarData> {
    // Check limit
    const count = await prisma.userAvatar.count({
      where: { userId: telegramId },
    });
    if (count >= MAX_AVATARS_PER_USER) {
      throw new Error(`Maximum ${MAX_AVATARS_PER_USER} avatars allowed. Delete one first.`);
    }

    // Analyse image to extract features
    let description = '';
    let features: Record<string, unknown> = {};
    try {
      const analysis = await ContentAnalysisService.extractPrompt(imageUrl, 'image');
      if (analysis.success && analysis.prompt) {
        description = analysis.prompt;
        features = {
          style: analysis.style || '',
          elements: analysis.elements || [],
        };
      }
    } catch (err) {
      logger.warn('Avatar analysis failed, saving without features:', err);
    }

    // If this is the user's first avatar, make it default
    const isDefault = count === 0;

    const avatar = await prisma.userAvatar.create({
      data: {
        userId: telegramId,
        name,
        imageUrl,
        localPath: localPath || null,
        description,
        features: features as any,
        isDefault,
      },
    });

    logger.info(`Avatar created: ${avatar.id} for user ${telegramId}`);

    return {
      id: avatar.id,
      name: avatar.name,
      imageUrl: avatar.imageUrl,
      localPath: avatar.localPath,
      description: avatar.description,
      features: avatar.features as Record<string, unknown> | null,
      isDefault: avatar.isDefault,
    };
  }

  /** List all avatars for a user */
  static async listAvatars(telegramId: bigint): Promise<AvatarData[]> {
    const avatars = await prisma.userAvatar.findMany({
      where: { userId: telegramId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return avatars.map(a => ({
      id: a.id,
      name: a.name,
      imageUrl: a.imageUrl,
      localPath: a.localPath,
      description: a.description,
      features: a.features as Record<string, unknown> | null,
      isDefault: a.isDefault,
    }));
  }

  /** Get user's default avatar */
  static async getDefaultAvatar(telegramId: bigint): Promise<AvatarData | null> {
    const avatar = await prisma.userAvatar.findFirst({
      where: { userId: telegramId, isDefault: true },
    });
    if (!avatar) return null;

    return {
      id: avatar.id,
      name: avatar.name,
      imageUrl: avatar.imageUrl,
      localPath: avatar.localPath,
      description: avatar.description,
      features: avatar.features as Record<string, unknown> | null,
      isDefault: avatar.isDefault,
    };
  }

  /** Get avatar by ID */
  static async getAvatar(avatarId: number): Promise<AvatarData | null> {
    const avatar = await prisma.userAvatar.findUnique({
      where: { id: avatarId },
    });
    if (!avatar) return null;

    return {
      id: avatar.id,
      name: avatar.name,
      imageUrl: avatar.imageUrl,
      localPath: avatar.localPath,
      description: avatar.description,
      features: avatar.features as Record<string, unknown> | null,
      isDefault: avatar.isDefault,
    };
  }

  /** Set avatar as default (unset previous default) */
  static async setDefault(telegramId: bigint, avatarId: number): Promise<void> {
    await prisma.$transaction([
      prisma.userAvatar.updateMany({
        where: { userId: telegramId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.userAvatar.update({
        where: { id: avatarId },
        data: { isDefault: true },
      }),
    ]);
  }

  /** Delete an avatar */
  static async deleteAvatar(telegramId: bigint, avatarId: number): Promise<boolean> {
    const avatar = await prisma.userAvatar.findFirst({
      where: { id: avatarId, userId: telegramId },
    });
    if (!avatar) return false;

    await prisma.userAvatar.delete({ where: { id: avatarId } });

    // If deleted avatar was default, promote another one
    if (avatar.isDefault) {
      const next = await prisma.userAvatar.findFirst({
        where: { userId: telegramId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await prisma.userAvatar.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return true;
  }
}
