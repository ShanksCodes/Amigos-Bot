import { ButtonInteraction } from 'discord.js';
import { QteResult } from '../domain/types.js';

export interface QteStrategy {
  /**
   * The name/identifier of this QTE type.
   */
  readonly name: string;

  /**
   * Evaluates the user's interaction performance and returns a QteResult.
   * @param interaction The interaction that triggered the QTE evaluation.
   * @param startTimeMs The timestamp when the QTE prompt was shown to the user.
   */
  evaluate(interaction: ButtonInteraction, startTimeMs: number): QteResult;
}
