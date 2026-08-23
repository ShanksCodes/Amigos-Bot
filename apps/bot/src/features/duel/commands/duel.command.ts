import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import { DiscordCommand } from '../../../discord/types/discord-command.interface.js';
import { DuelSessionManager } from '../services/duel-session.manager.js';
import { DuelStatisticsService } from '../services/duel-statistics.service.js';
import { DUEL_CONSTANTS } from '../domain/constants.js';

import { DuelRewardService } from '../services/duel-reward.service.js';

@Injectable()
export class DuelCommand implements DiscordCommand {
  private readonly logger = new Logger(DuelCommand.name);

  readonly data = new SlashCommandBuilder()
    .setName('duel')
    .setDescription('Duel commands')
    .addSubcommand(sub =>
      sub
        .setName('challenge')
        .setDescription('Challenge another user to a duel')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('The user to challenge')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('stats')
        .setDescription('View your or another user\'s duel stats')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('The user to view stats for')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('leaderboard')
        .setDescription('View the duel leaderboard')
    );

  constructor(
    private readonly sessionManager: DuelSessionManager,
    private readonly statsService: DuelStatisticsService,
    private readonly rewardService: DuelRewardService,
  ) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'challenge':
        await this.handleChallenge(interaction);
        break;
      case 'stats':
        await this.handleStats(interaction);
        break;
      case 'leaderboard':
        await this.handleLeaderboard(interaction);
        break;
    }
  }

  private async handleChallenge(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.options.getUser('user', true);
    const challenger = interaction.user;

    if (targetUser.id === challenger.id) {
      await interaction.reply({ content: 'You cannot duel yourself!', ephemeral: true });
      return;
    }

    if (targetUser.bot) {
      await interaction.reply({ content: 'You cannot duel a bot!', ephemeral: true });
      return;
    }

    if (this.sessionManager.isUserInActiveDuel(challenger.id)) {
      await interaction.reply({ content: 'You are already in an active duel!', ephemeral: true });
      return;
    }

    if (this.sessionManager.isUserInActiveDuel(targetUser.id)) {
      await interaction.reply({ content: 'That user is already in an active duel!', ephemeral: true });
      return;
    }

    const matchesToday = await this.rewardService.getPairMatchCountToday(challenger.id, targetUser.id);
    const isRanked = matchesToday < DUEL_CONSTANTS.MAX_RANKED_MATCHES_PER_PAIR_DAILY;

    const sessionId = `${challenger.id}-${targetUser.id}-${Date.now()}`;
    const session = this.sessionManager.createSession(sessionId, challenger.id, targetUser.id, {
      mode: 'Regular',
      isRanked,
    });

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Duel Challenge!')
      .setDescription(`${userMention(challenger.id)} has challenged ${userMention(targetUser.id)} to a duel!`)
      .setColor('#FFA500')
      .addFields(
        { name: 'Mode', value: session.mode, inline: true },
        { name: 'Expires', value: `<t:${Math.floor(Date.now() / 1000) + 60}:R>`, inline: true }
      );

    if (!isRanked) {
      embed.addFields({
        name: '\u200B\nℹ️ Note',
        value: '\nDaily Limit Reached: You have already played 3 matches against this opponent today. This match will be unrecorded.',
        inline: false,
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`duel:accept:${sessionId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`duel:decline:${sessionId}`).setLabel('Decline').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      content: userMention(targetUser.id),
      embeds: [embed],
      components: [row],
    });

    this.sessionManager.scheduleTimeout(sessionId, DUEL_CONSTANTS.CHALLENGE_TIMEOUT_MS, async () => {
      this.sessionManager.removeSession(sessionId);
      await interaction.editReply({
        content: `The duel challenge between ${userMention(challenger.id)} and ${userMention(targetUser.id)} has expired.`,
        embeds: [],
        components: [],
      }).catch(() => {});
    });
  }

  private async handleStats(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const profile = await this.statsService.getProfile(targetUser.id);

    if (!profile) {
      await interaction.reply({ content: 'No duel statistics found for this user.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ Duel Stats: ${targetUser.username}`)
      .setColor('#0099FF')
      .addFields(
        { name: 'Matches', value: profile.matchesPlayed.toString(), inline: true },
        { name: 'Wins', value: profile.wins.toString(), inline: true },
        { name: 'Losses', value: profile.losses.toString(), inline: true },
        { name: 'Win Rate', value: profile.matchesPlayed > 0 ? `${Math.round((profile.wins / profile.matchesPlayed) * 100)}%` : '0%', inline: true },
        { name: 'Current Win Streak', value: profile.currentWinStreak.toString(), inline: true },
        { name: 'Best Win Streak', value: profile.bestWinStreak.toString(), inline: true },
        { name: 'Damage Dealt', value: profile.totalDamageDealt.toString(), inline: true },
        { name: 'Damage Taken', value: profile.totalDamageTaken.toString(), inline: true },
        { name: 'Healing Done', value: profile.totalHealing.toString(), inline: true },
        { name: 'Berries Earned', value: profile.totalBerries.toString(), inline: true },
      );

    if (profile.fastestReaction) {
      embed.addFields({ name: 'Fastest Reaction', value: `${profile.fastestReaction}ms`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  }

  private async handleLeaderboard(interaction: ChatInputCommandInteraction): Promise<void> {
    const topProfiles = await this.statsService.getLeaderboard(10);

    if (topProfiles.length === 0) {
      await interaction.reply('No duel data available yet.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Duel Leaderboard')
      .setColor('#FFD700');

    let description = '';
    topProfiles.forEach((profile, index) => {
      description += `**${index + 1}.** <@${profile.userId}> - ${profile.wins} Wins (${profile.matchesPlayed} Matches)\n`;
    });

    embed.setDescription(description);
    await interaction.reply({ embeds: [embed] });
  }
}
