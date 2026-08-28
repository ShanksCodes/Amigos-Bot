import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { DiscordCommand } from '../../../discord/types/discord-command.interface.js';
import { CommandRegistryService } from '../../../discord/command-registry.service.js';
import { BirthdayService } from '../birthday.service.js';

@Injectable()
export class BirthdayCommand implements DiscordCommand {
  private readonly logger = new Logger(BirthdayCommand.name);

  readonly data = new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Manage your personal birthday and timezone settings');

  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly birthdayService: BirthdayService,
  ) {
    this.commandRegistry.register(this);
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await this.renderSettings(interaction);
  }

  async renderSettings(interaction: any): Promise<void> {
    const userId = interaction.user.id;
    const profile = await this.birthdayService.getUserProfile(userId);
    
    let isGuildEnabled = false;
    const guildId = interaction.guildId;
    if (guildId) {
      const setting = await this.birthdayService.getGuildSetting(userId, guildId);
      isGuildEnabled = !!setting;
    }

    const hasBirthday = profile && profile.birthDay && profile.birthMonth;
    const birthdayStr = hasBirthday
      ? `${profile.birthMonth}/${profile.birthDay}${profile.birthYear ? `/${profile.birthYear}` : ''}`
      : 'Not set';
    const timezoneStr = profile?.timezone || 'Not set';

    const embed = new EmbedBuilder()
      .setTitle('🎂 Your Personal Settings')
      .addFields(
        { name: 'Birthday', value: birthdayStr, inline: true },
        { name: 'Timezone', value: timezoneStr, inline: true },
        { name: 'Announcements in this Server', value: isGuildEnabled ? 'Enabled' : 'Disabled', inline: false },
      )
      .setColor('#5865F2');

    const setEditButton = new ButtonBuilder()
      .setCustomId(hasBirthday ? 'birthday:edit' : 'birthday:set')
      .setLabel(hasBirthday ? 'Edit Birthday' : 'Set Birthday')
      .setStyle(hasBirthday ? ButtonStyle.Secondary : ButtonStyle.Primary);

    const timezoneButton = new ButtonBuilder()
      .setCustomId('birthday:timezone:region') // Starts region selection
      .setLabel('Set/Change Timezone')
      .setStyle(ButtonStyle.Secondary);

    const toggleGuildButton = new ButtonBuilder()
      .setCustomId('birthday:enable_toggle')
      .setLabel(isGuildEnabled ? 'Disable in this Server' : 'Enable in this Server')
      .setStyle(isGuildEnabled ? ButtonStyle.Danger : ButtonStyle.Success)
      .setDisabled(!guildId); // Disabled if used in DMs

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      setEditButton,
      timezoneButton,
      toggleGuildButton
    );

    const options = {
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(options);
    } else if (interaction.isMessageComponent?.()) {
      await interaction.update(options);
    } else {
      await interaction.reply(options);
    }
  }
}
