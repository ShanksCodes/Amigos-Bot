import { Injectable, Logger } from '@nestjs/common';
import { MessageComponentInteraction } from 'discord.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { PrismaService } from '#app/database';
import { BirthdaySettingsHandler } from './birthday-settings.handler.js';

@Injectable()
export class BirthdayChannelHandler implements DiscordComponent {
  private readonly logger = new Logger(BirthdayChannelHandler.name);
  readonly customIdPrefix = 'birthday:settings:channel';

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly prisma: PrismaService,
    private readonly birthdaySettingsHandler: BirthdaySettingsHandler,
  ) {
    this.componentRegistry.register(this);
  }

  async execute(interaction: MessageComponentInteraction): Promise<void> {
    if (!interaction.isChannelSelectMenu()) return;
    
    const guildId = interaction.guildId;
    if (!guildId) return;

    const channelId = interaction.values[0];
    
    if (channelId) {
      await this.prisma.guildBirthdayConfig.upsert({
        where: { guildId },
        update: { announcementChannelId: channelId },
        create: { guildId, announcementChannelId: channelId },
      });
    }

    // Re-render the settings page
    // We can cast because we know it renders the same view
    await this.birthdaySettingsHandler.handleSettingsSelect(interaction as any);
  }
}
