import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageComponentInteraction,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
} from 'discord.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { BirthdayService } from '../birthday.service.js';
import { BirthdayTimezoneService } from '../birthday-timezone.service.js';
import { BirthdayCommand } from './birthday.command.js';

@Injectable()
export class BirthdayTimezoneHandler implements DiscordComponent {
  private readonly logger = new Logger(BirthdayTimezoneHandler.name);
  readonly customIdPrefix = 'birthday:timezone:';

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly birthdayService: BirthdayService,
    private readonly timezoneService: BirthdayTimezoneService,
    private readonly birthdayCommand: BirthdayCommand,
  ) {
    this.componentRegistry.register(this);
  }

  async execute(interaction: MessageComponentInteraction | ModalSubmitInteraction): Promise<void> {
    const action = interaction.customId.replace('birthday:timezone:', '');

    if (interaction.isButton() && action === 'region') {
      await this.showRegionSelect(interaction);
    } else if (interaction.isStringSelectMenu() && action === 'region_select') {
      await this.showTimezoneSelect(interaction);
    } else if (interaction.isStringSelectMenu() && action === 'select') {
      await this.handleTimezoneSelect(interaction);
    } else if (interaction.isButton() && action === 'manual') {
      await this.showManualModal(interaction);
    } else if (interaction.isModalSubmit() && action === 'manual_submit') {
      await this.handleManualSubmit(interaction);
    }
  }

  private async showRegionSelect(interaction: MessageComponentInteraction) {
    const regions = this.timezoneService.getRegions();
    
    const select = new StringSelectMenuBuilder()
      .setCustomId('birthday:timezone:region_select')
      .setPlaceholder('Select your region...')
      .addOptions(
        regions.map(r => ({
          label: r.label,
          value: r.value,
          emoji: r.emoji,
        }))
      );

    const manualButton = new ButtonBuilder()
      .setCustomId('birthday:timezone:manual')
      .setLabel('Other / Manual IANA Entry')
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(manualButton);

    await interaction.update({
      embeds: [{
        title: '🌍 Timezone Setup',
        description: 'First, select your general region or continent.',
        color: 0x5865F2,
      }],
      components: [row1, row2],
    });
  }

  private async showTimezoneSelect(interaction: StringSelectMenuInteraction) {
    const region = interaction.values[0];
    const timezones = this.timezoneService.getTimezonesForRegion(region);
    
    const select = new StringSelectMenuBuilder()
      .setCustomId('birthday:timezone:select')
      .setPlaceholder('Select your specific timezone...')
      .addOptions(
        timezones.map(tz => ({
          label: tz.label,
          value: tz.value,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    await interaction.update({
      embeds: [{
        title: '🕐 Timezone Setup',
        description: 'Now, select the specific timezone for your area.',
        color: 0x5865F2,
      }],
      components: [row],
    });
  }

  private async handleTimezoneSelect(interaction: StringSelectMenuInteraction) {
    const timezone = interaction.values[0];
    await this.birthdayService.updateTimezone(interaction.user.id, timezone);
    await this.birthdayCommand.renderSettings(interaction);
  }

  private async showManualModal(interaction: MessageComponentInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('birthday:timezone:manual_submit')
      .setTitle('Enter IANA Timezone');

    const input = new TextInputBuilder()
      .setCustomId('timezone')
      .setLabel('IANA format (e.g. Asia/Kolkata)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await interaction.showModal(modal);
  }

  private async handleManualSubmit(interaction: ModalSubmitInteraction) {
    const timezone = interaction.fields.getTextInputValue('timezone').trim();

    if (!this.timezoneService.isValidIana(timezone)) {
      await interaction.reply({
        content: `⚠️ \`${timezone}\` is not a valid IANA timezone (e.g. \`America/New_York\`, \`Asia/Kolkata\`).`,
        ephemeral: true,
      });
      return;
    }

    await this.birthdayService.updateTimezone(interaction.user.id, timezone);
    await this.birthdayCommand.renderSettings(interaction);
  }
}
