import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, EmbedBuilder } from 'discord.js';
import { QteResult } from '../domain/types.js';

export interface QtePromptData {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
}

export interface QteStrategy {
  /**
   * The name/identifier of this QTE type.
   */
  readonly name: string;

  /**
   * Generates the Discord UI components for this QTE.
   * @param sessionId The active duel session ID.
   * @param actionType The type of action triggering the QTE ('attack', 'defend', etc.).
   * @param startTimeMs The timestamp to embed in the payload for latency calculation.
   */
  generatePrompt(sessionId: string, actionType: string, startTimeMs: number): QtePromptData;

  /**
   * Evaluates the user's interaction performance and returns a QteResult.
   * @param interaction The interaction that triggered the QTE evaluation.
   * @param startTimeMs The timestamp when the QTE prompt was shown to the user.
   * @param payload Any custom state passed via the customId.
   */
  evaluate(interaction: ButtonInteraction, startTimeMs: number, payload?: string): QteResult;
}
