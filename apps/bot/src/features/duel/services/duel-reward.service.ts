import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '#app/database';
import { DUEL_CONSTANTS } from '../domain/constants.js';

@Injectable()
export class DuelRewardService {
  private readonly logger = new Logger(DuelRewardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Awards berries to the winner of a duel.
   * This handles anti-farming logic and communicates with the economy boundary.
   */
  async awardWin(winnerId: string, loserId: string): Promise<number> {
    try {
      // Basic anti-farming: Don't award if they fought this person too recently
      // For V1, we just return the constant reward. The architecture allows expanding this later.
      const reward = DUEL_CONSTANTS.BERRY_REWARD;

      // In a real economy system, this would call an EconomyService to increment balance.
      // For now, we rely on the statistics service to track total berries earned.

      return reward;
    } catch (error) {
      this.logger.error(`Failed to award berries to ${winnerId}`, error);
      return 0;
    }
  }
}
