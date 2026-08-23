import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { QteResult } from '../../domain/types.js';
import { QtePromptData, QteStrategy } from '../qte.interface.js';

@Injectable()
export class DefensiveParryQte implements QteStrategy {
  readonly name = 'defensive_parry';

  private readonly PERFECT_MS = 2000;
  private readonly FAIL_MS = 4000;

  generatePrompt(sessionId: string, actionType: string, startTimeMs: number): QtePromptData {
    const directions = ['LEFT ⬅️', 'RIGHT ➡️', 'OVERHEAD ⬆️'];
    const targetDirectionIdx = Math.floor(Math.random() * directions.length);
    const targetText = directions[targetDirectionIdx];

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Incoming Attack!')
      .setDescription(`Strike incoming from **${targetText}**! Quickly guard in the correct direction!`)
      .setColor('#00FF88');

    const row = new ActionRowBuilder<ButtonBuilder>();

    const options = [
      { label: '⬅️ Block Left', value: '0' },
      { label: '➡️ Block Right', value: '1' },
      { label: '⬆️ Duck', value: '2' },
    ];

    options.forEach((opt, idx) => {
      const isCorrect = opt.value === targetDirectionIdx.toString();
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`duel:qte:${sessionId}:${actionType}:${startTimeMs}:${this.name}:${isCorrect ? 'correct' : 'wrong'}_${idx}`)
          .setLabel(opt.label)
          .setStyle(ButtonStyle.Secondary)
      );
    });

    return { embed, components: [row] };
  }

  evaluate(interaction: ButtonInteraction, startTimeMs: number, payload?: string): QteResult {
    const reactionTimeMs = Date.now() - startTimeMs;
    const isCorrect = payload?.startsWith('correct');

    if (!isCorrect) {
      return {
        multiplier: 0.5, // Used in the engine to reduce block chance or parry chance
        reactionTimeMs,
        text: 'Guarded the wrong way!',
      };
    }

    if (reactionTimeMs <= this.PERFECT_MS) {
      return {
        multiplier: 1.5, // Huge parry bonus
        reactionTimeMs,
        text: 'FLAWLESS PARRY!',
      };
    }

    if (reactionTimeMs <= this.FAIL_MS) {
      return {
        multiplier: 1.1, // Good block
        reactionTimeMs,
        text: 'Solid block.',
      };
    }

    return {
      multiplier: 0.8,
      reactionTimeMs,
      text: 'Too slow to react!',
    };
  }
}
