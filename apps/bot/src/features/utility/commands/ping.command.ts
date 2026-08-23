import { Injectable } from '@nestjs/common';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '../../../discord/types/discord-command.interface.js';

@Injectable()
export class PingCommand implements DiscordCommand {
  readonly data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and latency statistics.');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const response = await interaction.reply({
      content: 'Pinging...',
      withResponse: true,
    });

    const sentMessage = response.resource?.message;
    const roundtripLatency = sentMessage
      ? sentMessage.createdTimestamp - interaction.createdTimestamp
      : Date.now() - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    await interaction.editReply(
      `🏓 Pong!\n• **Roundtrip Latency:** \`${roundtripLatency}ms\`\n• **WebSocket Heartbeat:** \`${wsPing}ms\``,
    );
  }
}
