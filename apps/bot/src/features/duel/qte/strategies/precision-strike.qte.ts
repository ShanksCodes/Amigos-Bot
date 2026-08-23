import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { QteResult } from '../../domain/types.js';
import { QtePromptData, QteStrategy } from '../qte.interface.js';

@Injectable()
export class PrecisionStrikeQte implements QteStrategy {
  readonly name = 'precision_strike';

  private readonly MIN_MS = 1500;
  private readonly MAX_MS = 2500;

  generatePrompt(sessionId: string, actionType: string, startTimeMs: number): QtePromptData {
    const embed = new EmbedBuilder()
      .setTitle('⏱️ Precision Strike!')
      .setDescription('Patience! Wait and strike between **1.5 and 2.5 seconds** from now!')
      .setColor('#00AAFF');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`duel:qte:${sessionId}:${actionType}:${startTimeMs}:${this.name}:none`)
        .setLabel('STRIKE NOW')
        .setStyle(ButtonStyle.Primary),
    );

    return { embed, components: [row] };
  }

  evaluate(interaction: ButtonInteraction, startTimeMs: number, payload?: string): QteResult {
    const reactionTimeMs = Date.now() - startTimeMs;

    if (reactionTimeMs < this.MIN_MS) {
      return {
        multiplier: 0.8,
        reactionTimeMs,
        text: 'Rushed the attack! Reduced damage.',
      };
    }

    if (reactionTimeMs <= this.MAX_MS) {
      // Sweet spot!
      return {
        multiplier: 1.5,
        reactionTimeMs,
        text: 'PERFECT TIMING!',
      };
    }

    // Too late
    return {
      multiplier: 0.7,
      reactionTimeMs,
      text: 'Too slow! Lost the window.',
    };
  }
}
