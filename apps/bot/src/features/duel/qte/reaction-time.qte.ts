import { ButtonInteraction } from 'discord.js';
import { QteResult } from '../domain/types.js';
import { QteStrategy } from './qte.interface.js';

export class ReactionTimeQte implements QteStrategy {
  readonly name = 'reaction_time';

  // Configurable thresholds in milliseconds
  private readonly PERFECT_MS = 300;
  private readonly GOOD_MS = 600;
  private readonly OKAY_MS = 1200;
  private readonly FAIL_MS = 2000;

  evaluate(interaction: ButtonInteraction, startTimeMs: number): QteResult {
    const reactionTimeMs = Date.now() - startTimeMs;

    if (reactionTimeMs <= this.PERFECT_MS) {
      return {
        multiplier: 1.5,
        reactionTimeMs,
        text: 'PERFECT timing!',
      };
    }

    if (reactionTimeMs <= this.GOOD_MS) {
      return {
        multiplier: 1.2,
        reactionTimeMs,
        text: 'Great reaction!',
      };
    }

    if (reactionTimeMs <= this.OKAY_MS) {
      return {
        multiplier: 1.0,
        reactionTimeMs,
        text: 'Good hit.',
      };
    }

    if (reactionTimeMs <= this.FAIL_MS) {
      return {
        multiplier: 0.8,
        reactionTimeMs,
        text: 'A bit slow...',
      };
    }

    // Completely missed the window
    return {
      multiplier: 0.5,
      reactionTimeMs,
      text: 'Too slow!',
    };
  }
}
