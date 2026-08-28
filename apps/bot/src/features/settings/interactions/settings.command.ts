import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { DiscordCommand } from '../../../discord/types/discord-command.interface.js';
import { CommandRegistryService } from '../../../discord/command-registry.service.js';

@Injectable()
export class SettingsCommand implements DiscordCommand {
  private readonly logger = new Logger(SettingsCommand.name);

  readonly data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure server settings (Admins only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

  constructor(private readonly commandRegistry: CommandRegistryService) {
    this.commandRegistry.register(this);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('⚙️ AmigosBot Server Settings')
      .setDescription('Choose a feature to configure below.')
      .setColor('#5865F2');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('settings:feature:select')
      .setPlaceholder('Select a feature...')
      .addOptions([
        {
          label: 'Birthdays',
          description: 'Configure birthday announcements for this server',
          value: 'birthday',
          emoji: '🎂',
        },
        // Future features can be added here
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  }
}
