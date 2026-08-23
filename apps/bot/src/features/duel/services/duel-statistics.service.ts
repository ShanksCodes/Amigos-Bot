import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '#app/database';
import { DuelSession } from '../domain/types.js';

@Injectable()
export class DuelStatisticsService {
  private readonly logger = new Logger(DuelStatisticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ensureProfileExists(userId: string): Promise<void> {
    await this.prisma.duelProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async recordMatch(session: DuelSession, berriesAwarded: number): Promise<void> {
    if (!session.winnerId) return;

    const loserId =
      session.winnerId === session.challenger.id ? session.opponent.id : session.challenger.id;

    try {
      await this.ensureProfileExists(session.winnerId);
      await this.ensureProfileExists(loserId);

      // Record History
      await this.prisma.duelHistory.create({
        data: {
          challengerId: session.challenger.id,
          opponentId: session.opponent.id,
          winnerId: session.winnerId,
          mode: session.mode,
          startedAt: session.startedAt,
          endedAt: new Date(),
          berriesAwarded,
        },
      });

      // Update Winner
      const winnerProfile = await this.prisma.duelProfile.findUnique({ where: { userId: session.winnerId } });
      const newWinStreak = (winnerProfile?.currentWinStreak ?? 0) + 1;
      const bestWinStreak = Math.max(newWinStreak, winnerProfile?.bestWinStreak ?? 0);

      await this.prisma.duelProfile.update({
        where: { userId: session.winnerId },
        data: {
          matchesPlayed: { increment: 1 },
          wins: { increment: 1 },
          currentWinStreak: newWinStreak,
          bestWinStreak,
          totalBerries: { increment: berriesAwarded },
        },
      });

      // Update Loser
      await this.prisma.duelProfile.update({
        where: { userId: loserId },
        data: {
          matchesPlayed: { increment: 1 },
          losses: { increment: 1 },
          currentWinStreak: 0,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record duel statistics for session ${session.id}`, error);
    }
  }

  async updateCombatStats(userId: string, data: { damageDealt?: number; damageTaken?: number; healing?: number; isCritical?: boolean; isParry?: boolean; reactionTimeMs?: number }): Promise<void> {
    try {
      await this.ensureProfileExists(userId);
      
      const updateData: any = {};
      if (data.damageDealt) updateData.totalDamageDealt = { increment: data.damageDealt };
      if (data.damageTaken) updateData.totalDamageTaken = { increment: data.damageTaken };
      if (data.healing) updateData.totalHealing = { increment: data.healing };
      if (data.isCritical) updateData.criticalHits = { increment: 1 };
      if (data.isParry) updateData.parries = { increment: 1 };

      await this.prisma.duelProfile.update({
        where: { userId },
        data: updateData,
      });

      // Handle fastest reaction separately if provided
      if (data.reactionTimeMs) {
        const profile = await this.prisma.duelProfile.findUnique({ where: { userId }, select: { fastestReaction: true } });
        if (!profile?.fastestReaction || data.reactionTimeMs < profile.fastestReaction) {
          await this.prisma.duelProfile.update({
            where: { userId },
            data: { fastestReaction: data.reactionTimeMs },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to update combat stats for user ${userId}`, error);
    }
  }

  async getProfile(userId: string) {
    return this.prisma.duelProfile.findUnique({ where: { userId }, include: { user: true } });
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.duelProfile.findMany({
      orderBy: [
        { wins: 'desc' },
        { matchesPlayed: 'asc' },
      ],
      take: limit,
      include: { user: true },
    });
  }
}
