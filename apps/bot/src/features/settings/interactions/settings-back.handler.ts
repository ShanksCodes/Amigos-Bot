import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  EmbedBuilder,
  MessageComponentInteraction,
  StringSelectMenuBuilder,
} from 'discord.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { SettingsCommand } from './settings.command.js';

@Injectable()
export class SettingsBackHandler implements DiscordComponent {
  private readonly logger = new Logger(SettingsBackHandler.name);
  readonly customIdPrefix = 'settings:back';

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly settingsCommand: SettingsCommand,
  ) {
    this.componentRegistry.register(this);
  }

  async execute(interaction: MessageComponentInteraction): Promise<void> {
    if (!interaction.isButton()) return;

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
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  }
}
