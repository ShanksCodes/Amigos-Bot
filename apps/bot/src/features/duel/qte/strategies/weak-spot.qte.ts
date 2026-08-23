import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { QteResult } from '../../domain/types.js';
import { QtePromptData, QteStrategy } from '../qte.interface.js';

@Injectable()
export class WeakSpotQte implements QteStrategy {
  readonly name = 'weak_spot';

  private readonly PERFECT_MS = 1500;
  private readonly OKAY_MS = 2500;

  generatePrompt(sessionId: string, actionType: string, startTimeMs: number): QtePromptData {
    const embed = new EmbedBuilder()
      .setTitle('🎯 Weak Spot Exposed!')
      .setDescription('Quickly hit the target to land a critical strike! Avoid the decoys.')
      .setColor('#FF5500');

    // Generate 3 buttons, 1 target, 2 decoys
    const targetIndex = Math.floor(Math.random() * 3);
    const row = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 0; i < 3; i++) {
      const isTarget = i === targetIndex;
      const button = new ButtonBuilder()
        .setCustomId(`duel:qte:${sessionId}:${actionType}:${startTimeMs}:${this.name}:${isTarget ? 'hit' : 'miss'}_${i}`)
        .setStyle(ButtonStyle.Secondary);

      if (isTarget) {
        button.setLabel('🎯 STRIKE');
      } else {
        button.setLabel('🛡️ Blocked');
      }

      row.addComponents(button);
    }

    return { embed, components: [row] };
  }

  evaluate(interaction: ButtonInteraction, startTimeMs: number, payload?: string): QteResult {
    const reactionTimeMs = Date.now() - startTimeMs;
    const hitTarget = payload?.startsWith('hit');

    if (!hitTarget) {
      return {
        multiplier: 0.7,
        reactionTimeMs,
        text: 'Hit the armor! Reduced damage...',
      };
    }

    if (reactionTimeMs <= this.PERFECT_MS) {
      return {
        multiplier: 1.5,
        reactionTimeMs,
        text: 'PERFECT STRIKE!',
      };
    }

    if (reactionTimeMs <= this.OKAY_MS) {
      return {
        multiplier: 1.25,
        reactionTimeMs,
        text: 'Good hit!',
      };
    }

    return {
      multiplier: 1.0,
      reactionTimeMs,
      text: 'A bit slow, but hit.',
    };
  }
}
