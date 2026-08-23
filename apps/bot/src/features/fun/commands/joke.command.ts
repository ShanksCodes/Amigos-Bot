import { Injectable, Logger } from '@nestjs/common';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '../../../discord/types/discord-command.interface.js';

interface JokeApiResponse {
  error: boolean;
  category?: string;
  type?: 'single' | 'twopart';
  joke?: string;
  setup?: string;
  delivery?: string;
}

@Injectable()
export class JokeCommand implements DiscordCommand {
  private readonly logger = new Logger(JokeCommand.name);

  readonly data = new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tells a random joke from JokeAPI!');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const response = await fetch(
        'https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit',
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        },
      );

      if (!response.ok) {
        throw new Error(`JokeAPI responded with status ${response.status}`);
      }

      const data = (await response.json()) as JokeApiResponse;

      if (data.error) {
        throw new Error('JokeAPI returned error');
      }

      let jokeText = '';
      if (data.type === 'single' && data.joke) {
        jokeText = data.joke;
      } else if (data.type === 'twopart' && data.setup && data.delivery) {
        jokeText = `${data.setup}\n\n*${data.delivery}*`;
      } else {
        throw new Error('Unexpected joke format');
      }

      const embed = new EmbedBuilder()
        .setTitle(`😂 ${data.category ?? 'Random'} Joke`)
        .setDescription(jokeText)
        .setColor('#5865F2')
        .setFooter({ text: 'Powered by JokeAPI (Sv443)' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      this.logger.warn('Failed to fetch joke from JokeAPI', error);
      await interaction.editReply({
        content: '⚠️ JokeAPI is currently unavailable. Please try again later!',
      });
    }
  }
}
