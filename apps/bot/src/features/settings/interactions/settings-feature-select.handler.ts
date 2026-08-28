import { Injectable, Logger } from '@nestjs/common';
import { MessageComponentInteraction, StringSelectMenuInteraction } from 'discord.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { SettingsRouterService } from '../settings-router.service.js';

@Injectable()
export class SettingsFeatureSelectHandler implements DiscordComponent {
  private readonly logger = new Logger(SettingsFeatureSelectHandler.name);
  readonly customIdPrefix = 'settings:feature:select';

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly settingsRouter: SettingsRouterService,
  ) {
    this.componentRegistry.register(this);
  }

  async execute(interaction: MessageComponentInteraction): Promise<void> {
    if (!interaction.isStringSelectMenu()) return;

    const featureId = interaction.values[0];
    const handler = this.settingsRouter.get(featureId);

    if (!handler) {
      this.logger.warn(`No settings handler found for feature: ${featureId}`);
      await interaction.reply({
        content: '⚠️ This feature settings panel is not yet implemented.',
        ephemeral: true,
      });
      return;
    }

    try {
      await handler.handleSettingsSelect(interaction);
    } catch (error) {
      this.logger.error(`Failed to handle settings select for ${featureId}`, error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'An error occurred while loading these settings.',
          ephemeral: true,
        });
      }
    }
  }
}
