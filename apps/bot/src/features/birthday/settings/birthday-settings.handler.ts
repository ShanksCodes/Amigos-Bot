import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { SettingsHandler, SettingsRouterService } from '../../settings/settings-router.service.js';
import { PrismaService } from '#app/database';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';

@Injectable()
export class BirthdaySettingsHandler implements SettingsHandler, DiscordComponent {
  private readonly logger = new Logger(BirthdaySettingsHandler.name);
  readonly featureId = 'birthday';
  readonly customIdPrefix = 'birthday:settings';

  constructor(
    private readonly settingsRouter: SettingsRouterService,
    private readonly prisma: PrismaService,
    private readonly componentRegistry: ComponentRegistryService,
  ) {
    this.settingsRouter.register(this);
    this.componentRegistry.register(this);
  }

  // Handle the /settings select menu selection
  async handleSettingsSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    await this.renderSettings(interaction);
  }

  // Handle the Enable/Disable buttons
  async execute(interaction: any): Promise<void> {
    if (!interaction.isButton()) return;
    
    const guildId = interaction.guildId;
    if (!guildId) return;

    if (interaction.customId === 'birthday:settings:toggle') {
      const config = await this.prisma.guildBirthdayConfig.findUnique({ where: { guildId } });
      const currentEnabled = config?.enabled ?? false;

      await this.prisma.guildBirthdayConfig.upsert({
        where: { guildId },
        update: { enabled: !currentEnabled },
        create: { guildId, enabled: !currentEnabled },
      });

      await this.renderSettings(interaction);
    }
  }

  private async renderSettings(interaction: any): Promise<void> {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: 'This must be used in a server.', ephemeral: true });
      return;
    }

    const config = await this.prisma.guildBirthdayConfig.findUnique({
      where: { guildId },
    });

    const isEnabled = config?.enabled ?? false;
    const channelId = config?.announcementChannelId;
    const channelMention = channelId ? `<#${channelId}>` : 'Not configured';

    const embed = new EmbedBuilder()
      .setTitle('🎂 Birthday Settings')
      .setDescription(`Status: **${isEnabled ? 'Enabled' : 'Disabled'}**\nAnnouncement Channel: **${channelMention}**`)
      .setColor(isEnabled ? '#57F287' : '#ED4245');

    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId('birthday:settings:channel')
      .setPlaceholder('Select an announcement channel...')
      .setChannelTypes([ChannelType.GuildText]);

    const toggleButton = new ButtonBuilder()
      .setCustomId('birthday:settings:toggle')
      .setLabel(isEnabled ? 'Disable in this Server' : 'Enable in this Server')
      .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

    const backButton = new ButtonBuilder()
      .setCustomId('settings:back')
      .setLabel('Back to Settings')
      .setStyle(ButtonStyle.Secondary);

    const channelRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);
    const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleButton, backButton);

    const options = {
      embeds: [embed],
      components: [channelRow, buttonsRow],
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(options);
    } else {
      await interaction.update(options);
    }
  }
}
