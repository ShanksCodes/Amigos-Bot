import { Injectable, Logger } from '@nestjs/common';
import { MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { BirthdayService } from '../birthday.service.js';
import { isValidDate } from '../birthday.util.js';
import { BirthdayCommand } from './birthday.command.js';

@Injectable()
export class BirthdayModalHandler implements DiscordComponent {
  private readonly logger = new Logger(BirthdayModalHandler.name);
  readonly customIdPrefix = 'birthday:modal:';

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly birthdayService: BirthdayService,
    private readonly birthdayCommand: BirthdayCommand,
  ) {
    this.componentRegistry.register(this);
  }

  async execute(interaction: MessageComponentInteraction | ModalSubmitInteraction): Promise<void> {
    if (!interaction.isModalSubmit()) return;

    const dayStr = interaction.fields.getTextInputValue('day');
    const monthStr = interaction.fields.getTextInputValue('month');
    const yearStr = interaction.fields.fields.has('year') ? interaction.fields.getTextInputValue('year') : '';

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = yearStr ? parseInt(yearStr, 10) : null;

    if (isNaN(day) || isNaN(month) || (yearStr && isNaN(year as number))) {
      await interaction.reply({ content: 'Please enter valid numbers for dates.', ephemeral: true });
      return;
    }

    if (!isValidDate(day, month, year)) {
      await interaction.reply({ content: 'Invalid date provided. Please check the day, month, and year.', ephemeral: true });
      return;
    }

    const result = await this.birthdayService.setBirthday(interaction.user.id, { day, month, year });

    if (!result.success) {
      await interaction.reply({ content: `⚠️ ${result.message}`, ephemeral: true });
      return;
    }

    // Re-render settings to show updated info
    await this.birthdayCommand.renderSettings(interaction);
  }
}
