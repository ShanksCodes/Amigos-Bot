import { ButtonInteraction } from 'discord.js';
import { QteResult } from '../domain/types.js';
import { QteStrategy } from './qte.interface.js';

export class ReactionTimeQte implements QteStrategy {
  readonly name = 'reaction_time';

  // Configurable thresholds in milliseconds (accounting for Discord latency)
  private readonly PERFECT_MS = 800;
  private readonly GOOD_MS = 1400;
  private readonly OKAY_MS = 2200;
  private readonly FAIL_MS = 3200;

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
        multiplier: 1.25,
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
        multiplier: 0.85,
        reactionTimeMs,
        text: 'A bit slow...',
      };
    }

    // Completely missed the window
    return {
      multiplier: 0.7,
      reactionTimeMs,
      text: 'Too slow!',
    };
  }
}
