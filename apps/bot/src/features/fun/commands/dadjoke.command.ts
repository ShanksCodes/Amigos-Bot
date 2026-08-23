import { Injectable, Logger } from '@nestjs/common';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '../../../discord/types/discord-command.interface.js';

@Injectable()
export class DadJokeCommand implements DiscordCommand {
  private readonly logger = new Logger(DadJokeCommand.name);

  readonly data = new SlashCommandBuilder()
    .setName('dadjoke')
    .setDescription('Tells a random dad joke!');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const response = await fetch('https://icanhazdadjoke.com/', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AmigosBot (DiscordBot)',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = (await response.json()) as { joke?: string };
      if (!data.joke) {
        throw new Error('Invalid response structure');
      }

      const embed = new EmbedBuilder()
        .setTitle('🥸 Dad Joke')
        .setDescription(data.joke)
        .setColor('#FFA500')
        .setFooter({ text: 'Powered by icanhazdadjoke' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.logger.warn('Failed to fetch dad joke', error);
      await interaction.editReply({
        content: '⚠️ Dad joke service is currently unavailable. Please try again later!',
      });
    }
  }
}
