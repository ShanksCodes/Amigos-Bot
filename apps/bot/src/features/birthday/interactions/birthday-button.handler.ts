import { Injectable, Logger } from '@nestjs/common';
import { ActionRowBuilder, MessageComponentInteraction, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { BirthdayService } from '../birthday.service.js';
import { BirthdayCommand } from './birthday.command.js';

@Injectable()
export class BirthdayButtonHandler implements DiscordComponent {
  private readonly logger = new Logger(BirthdayButtonHandler.name);
  readonly customIdPrefix = 'birthday:';

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly birthdayService: BirthdayService,
    private readonly birthdayCommand: BirthdayCommand,
  ) {
    this.componentRegistry.register(this);
  }

  async execute(interaction: MessageComponentInteraction): Promise<void> {
    if (!interaction.isButton()) return;
    
    // Check if it's our prefix but handle specific button actions
    const action = interaction.customId.replace('birthday:', '');

    if (action === 'set' || action === 'edit') {
      await this.showBirthdayModal(interaction, action);
    } else if (action === 'enable_toggle') {
      await this.toggleGuild(interaction);
    }
  }

  private async showBirthdayModal(interaction: MessageComponentInteraction, action: string) {
    const modal = new ModalBuilder()
      .setCustomId(`birthday:modal:${action}`)
      .setTitle(action === 'set' ? 'Set Birthday' : 'Edit Birthday');

    const dayInput = new TextInputBuilder()
      .setCustomId('day')
      .setLabel('Day (1-31)')
      .setStyle(TextInputStyle.Short)
      .setMinLength(1)
      .setMaxLength(2)
      .setRequired(true);

    const monthInput = new TextInputBuilder()
      .setCustomId('month')
      .setLabel('Month (1-12)')
      .setStyle(TextInputStyle.Short)
      .setMinLength(1)
      .setMaxLength(2)
      .setRequired(true);

    const yearInput = new TextInputBuilder()
      .setCustomId('year')
      .setLabel('Year (Optional, e.g. 1990)')
      .setStyle(TextInputStyle.Short)
      .setMinLength(4)
      .setMaxLength(4)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(dayInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(monthInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(yearInput),
    );

    await interaction.showModal(modal);
  }

  private async toggleGuild(interaction: MessageComponentInteraction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    await this.birthdayService.toggleGuildSetting(interaction.user.id, guildId);
    
    // Re-render the personal settings page
    await this.birthdayCommand.renderSettings(interaction);
  }
}
