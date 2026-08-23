import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '#app/database';
import { DUEL_CONSTANTS } from '../domain/constants.js';
import { DuelSession } from '../domain/types.js';

@Injectable()
export class DuelRewardService {
  private readonly logger = new Logger(DuelRewardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns how many ranked duels have occurred between two users today.
   */
  async getPairMatchCountToday(userA: string, userB: string): Promise<number> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      return await this.prisma.duelHistory.count({
        where: {
          startedAt: { gte: startOfDay },
          mode: { not: 'Friendly' },
          OR: [
            { challengerId: userA, opponentId: userB },
            { challengerId: userB, opponentId: userA },
          ],
        },
      });
    } catch (error) {
      this.logger.error('Failed to query daily pair match count', error);
      return 0;
    }
  }

  /**
   * Evaluates if a match is eligible for berries reward.
   */
  async awardWin(session: DuelSession, winnerId: string, loserId: string): Promise<number> {
    try {
      // 1. If match is explicitly unranked / casual
      if (!session.isRanked) {
        this.logger.debug(`Match ${session.id} is unranked. No berries awarded.`);
        return 0;
      }

      // 2. Instant forfeit check (< 10 seconds or < 2 turns)
      const durationMs = Date.now() - session.startedAt.getTime();
      if (
        session.state === 'FORFEITED' &&
        (session.turnsPlayed < 2 || durationMs < DUEL_CONSTANTS.INSTANT_FORFEIT_THRESHOLD_MS)
      ) {
        this.logger.debug(`Match ${session.id} ended in instant forfeit. No berries awarded.`);
        return 0;
      }

      // 3. Double-check daily pair match limit
      const matchesToday = await this.getPairMatchCountToday(session.challenger.id, session.opponent.id);
      if (matchesToday >= DUEL_CONSTANTS.MAX_RANKED_MATCHES_PER_PAIR_DAILY) {
        this.logger.debug(`Daily pair limit reached for match ${session.id}. No berries awarded.`);
        return 0;
      }

      return DUEL_CONSTANTS.BERRY_REWARD;
    } catch (error) {
      this.logger.error(`Failed to award berries to ${winnerId}`, error);
      return 0;
    }
  }
}
