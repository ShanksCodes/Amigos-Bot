import { Injectable, Logger } from '@nestjs/common';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  MessageComponentInteraction,
  userMention,
} from 'discord.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { DuelEngineService } from '../services/duel-engine.service.js';
import { DuelMediaService } from '../services/duel-media.service.js';
import { DuelRewardService } from '../services/duel-reward.service.js';
import { DuelSessionManager } from '../services/duel-session.manager.js';
import { DuelStatisticsService } from '../services/duel-statistics.service.js';
import { DUEL_CONSTANTS } from '../domain/constants.js';
import { DuelState, DuelTurn, CombatResult, DuelSession } from '../domain/types.js';
import { ReactionTimeQte } from '../qte/reaction-time.qte.js';

@Injectable()
export class DuelComponentHandler implements DiscordComponent {
  private readonly logger = new Logger(DuelComponentHandler.name);
  private readonly qte = new ReactionTimeQte();

  readonly customIdPrefix = 'duel:';

  constructor(
    private readonly sessionManager: DuelSessionManager,
    private readonly engineService: DuelEngineService,
    private readonly mediaService: DuelMediaService,
    private readonly statsService: DuelStatisticsService,
    private readonly rewardService: DuelRewardService,
  ) {}

  async execute(interaction: MessageComponentInteraction): Promise<void> {
    if (!interaction.isButton()) return;

    const parts = interaction.customId.split(':');
    const action = parts[1];
    const sessionId = parts[2];

    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      await interaction.reply({ content: 'This duel session is no longer active or has expired.', ephemeral: true });
      return;
    }

    const isChallenger = interaction.user.id === session.challenger.id;
    const isOpponent = interaction.user.id === session.opponent.id;

    if (!isChallenger && !isOpponent) {
      await interaction.reply({ content: 'You are not part of this duel!', ephemeral: true });
      return;
    }

    if (action === 'accept' || action === 'decline') {
      await this.handleAcceptDecline(interaction, action, session, isOpponent);
      return;
    }

    if (action === 'forfeit') {
      await this.handleForfeit(interaction, session);
      return;
    }

    if (action === 'qte') {
      await this.handleQte(interaction, session, parts[3], parseInt(parts[4], 10));
      return;
    }

    // Combat Actions (Attack, Defend, Heal)
    const currentTurnUserId = session.currentTurn === DuelTurn.CHALLENGER ? session.challenger.id : session.opponent.id;
    if (interaction.user.id !== currentTurnUserId) {
      await interaction.reply({ content: "It's not your turn!", ephemeral: true });
      return;
    }

    await this.handleCombatAction(interaction, action as 'attack' | 'defend' | 'heal', session);
  }

  private async handleAcceptDecline(
    interaction: ButtonInteraction,
    action: string,
    session: DuelSession,
    isOpponent: boolean,
  ): Promise<void> {
    if (!isOpponent) {
      await interaction.reply({ content: 'Only the challenged user can accept or decline.', ephemeral: true });
      return;
    }

    this.sessionManager.clearTimeout(session.id);

    if (action === 'decline') {
      this.sessionManager.removeSession(session.id);
      await interaction.update({
        content: `The duel was declined by ${userMention(session.opponent.id)}.`,
        embeds: [],
        components: [],
      });
      return;
    }

    // Accept
    session.state = DuelState.ACTIVE;
    this.sessionManager.updateSession(session.id, { state: DuelState.ACTIVE });

    await this.renderCombatState(interaction, session, 'The duel begins!');
  }

  private async handleCombatAction(
    interaction: ButtonInteraction,
    actionType: 'attack' | 'defend' | 'heal',
    session: DuelSession,
  ): Promise<void> {
    if (actionType === 'defend' || actionType === 'heal') {
      const result = this.engineService.processAction(session, { type: actionType });
      await this.applyCombatResult(interaction, session, result);
    } else {
      // Trigger QTE for Attack
      const qteStartTime = Date.now();

      const qteEmbed = new EmbedBuilder()
        .setTitle('⚡ Quick Time Event!')
        .setDescription('Click the button as fast as possible to boost your attack!')
        .setColor('#FFFF00');

      const qteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`duel:qte:${session.id}:${actionType}:${qteStartTime}`)
          .setLabel('STRIKE!')
          .setStyle(ButtonStyle.Danger),
      );

      await interaction.update({ embeds: [qteEmbed], components: [qteRow] });

      // If they don't click within 5 seconds, auto-fail QTE
      this.sessionManager.scheduleTimeout(session.id, 5000, async () => {
        const failedSession = this.sessionManager.getSession(session.id);
        if (failedSession) {
          const result = this.engineService.processAction(failedSession, {
            type: actionType,
            qteResult: { multiplier: 0.7, text: 'Too slow!' },
          });

          try {
            const playerState =
              failedSession.currentTurn === DuelTurn.CHALLENGER
                ? failedSession.challenger
                : failedSession.opponent;
            const defenderState =
              failedSession.currentTurn === DuelTurn.CHALLENGER
                ? failedSession.opponent
                : failedSession.challenger;

            if (result.damage) {
              defenderState.hp = result.newHp;
            } else if (result.healing) {
              playerState.hp = result.newHp;
            }

            if (result.type === 'defend') {
              playerState.isDefending = true;
            } else {
              playerState.isDefending = false;
            }

            if (result.isGameOver) {
              failedSession.state = DuelState.FINISHED;
              failedSession.winnerId = playerState.id;
              const berries = await this.rewardService.awardWin(failedSession, playerState.id, defenderState.id);
              await this.statsService.recordMatch(failedSession, berries);
              this.sessionManager.removeSession(failedSession.id);
            } else {
              failedSession.turnsPlayed += 1;
              failedSession.currentTurn =
                failedSession.currentTurn === DuelTurn.CHALLENGER ? DuelTurn.OPPONENT : DuelTurn.CHALLENGER;
              this.sessionManager.updateSession(failedSession.id, failedSession);
            }

            const flavorText = this.mediaService.getRandomText(result.textCategory, result.textCategory);
            const desc =
              `*(QTE Failed: Too slow!)*\n${userMention(playerState.id)} ${flavorText} ${userMention(defenderState.id)} ` +
              (result.damage ? `for **${result.damage}** damage!` : '');

            await interaction.editReply(
              this.buildCombatMessage(failedSession, desc, result.isGameOver, playerState.id),
            );
          } catch (e) {
            this.logger.error('Failed to handle QTE timeout', e);
          }
        }
      });
    }
  }

  private async handleQte(
    interaction: ButtonInteraction,
    session: DuelSession,
    actionType: string,
    startTime: number,
  ): Promise<void> {
    const currentTurnUserId =
      session.currentTurn === DuelTurn.CHALLENGER ? session.challenger.id : session.opponent.id;
    if (interaction.user.id !== currentTurnUserId) {
      await interaction.reply({ content: "It's not your turn!", ephemeral: true });
      return;
    }

    this.sessionManager.clearTimeout(session.id);

    const qteResult = this.qte.evaluate(interaction, startTime);
    const result = this.engineService.processAction(session, {
      type: actionType as 'attack' | 'defend' | 'heal',
      qteResult,
    });

    await this.applyCombatResult(interaction, session, result, qteResult.text);
  }

  private async applyCombatResult(
    interaction: ButtonInteraction,
    session: DuelSession,
    result: CombatResult,
    qteText?: string,
  ): Promise<void> {
    const playerState =
      session.currentTurn === DuelTurn.CHALLENGER ? session.challenger : session.opponent;
    const defenderState =
      session.currentTurn === DuelTurn.CHALLENGER ? session.opponent : session.challenger;

    // Apply state mutations
    if (result.type === 'heal' && result.subType !== 'max_heal') {
      playerState.healsRemaining -= 1;
      playerState.hp = result.newHp;
    } else if (result.type === 'attack') {
      defenderState.hp = result.newHp;
    }

    if (result.type === 'defend') {
      playerState.isDefending = true;
    } else {
      playerState.isDefending = false;
    }

    // Update stats
    if (result.type === 'attack' && result.subType !== 'miss') {
      await this.statsService.updateCombatStats(playerState.id, {
        damageDealt: result.damage,
        isCritical: result.subType === 'critical',
      });
      await this.statsService.updateCombatStats(defenderState.id, {
        damageTaken: result.damage,
        isParry: result.subType === 'parry',
      });
    } else if (result.type === 'heal') {
      await this.statsService.updateCombatStats(playerState.id, { healing: result.healing });
    }

    // Handle end of turn / game over
    let description = qteText ? `*(QTE: ${qteText})*\n` : '';
    const flavorText = this.mediaService.getRandomText(result.textCategory, result.textCategory);

    if (result.type === 'attack') {
      description += `${userMention(playerState.id)} ${flavorText} ${userMention(defenderState.id)}`;
      if (result.damage) description += ` for **${result.damage}** damage!`;
    } else if (result.type === 'heal') {
      description += `${userMention(playerState.id)} ${flavorText}`;
      if (result.healing) description += ` for **${result.healing}** HP!`;
    } else {
      description += `${userMention(playerState.id)} ${flavorText}`;
    }

    if (result.isGameOver) {
      session.state = DuelState.FINISHED;
      session.winnerId = result.subType === 'parry' ? defenderState.id : playerState.id;

      const loserId = session.winnerId === session.challenger.id ? session.opponent.id : session.challenger.id;
      const berries = await this.rewardService.awardWin(session, session.winnerId, loserId);
      await this.statsService.recordMatch(session, berries);
      this.sessionManager.removeSession(session.id);

      if (berries > 0) {
        description += `\n\n🏆 **${userMention(session.winnerId)} wins the duel and earns 🍓 ${berries} Berries!**`;
      } else {
        description += `\n\n🏆 **${userMention(session.winnerId)} wins the duel!**`;
      }
    } else {
      session.turnsPlayed += 1;
      session.currentTurn =
        session.currentTurn === DuelTurn.CHALLENGER ? DuelTurn.OPPONENT : DuelTurn.CHALLENGER;
      this.sessionManager.updateSession(session.id, session);
    }

    await this.renderCombatState(interaction, session, description, result.isGameOver, session.winnerId);
  }

  private async renderCombatState(
    interaction: ButtonInteraction,
    session: DuelSession,
    description: string,
    isGameOver = false,
    winnerId?: string,
  ): Promise<void> {
    const messagePayload = this.buildCombatMessage(session, description, isGameOver, winnerId);
    await interaction.update(messagePayload).catch((e) => {
      this.logger.error('Failed to update interaction', e);
    });

    if (!isGameOver) {
      // Schedule turn timeout
      this.sessionManager.scheduleTimeout(session.id, DUEL_CONSTANTS.TURN_TIMEOUT_MS, async () => {
        const winner =
          session.currentTurn === DuelTurn.CHALLENGER ? session.opponent : session.challenger;
        const loser =
          session.currentTurn === DuelTurn.CHALLENGER ? session.challenger : session.opponent;

        session.state = DuelState.FINISHED;
        session.winnerId = winner.id;

        const berries = await this.rewardService.awardWin(session, winner.id, loser.id);
        await this.statsService.recordMatch(session, berries);
        this.sessionManager.removeSession(session.id);

        const rewardText = berries > 0 ? ` and earns 🍓 ${berries} Berries!` : '!';
        const timeoutDesc = `*Turn timeout!*\n${userMention(loser.id)} took too long to move.\n\n🏆 **${userMention(winner.id)} wins by default${rewardText}**`;

        await interaction
          .editReply(this.buildCombatMessage(session, timeoutDesc, true, winner.id))
          .catch(() => {});
      });
    }
  }

  private async handleForfeit(
    interaction: ButtonInteraction,
    session: DuelSession,
  ): Promise<void> {
    this.sessionManager.clearTimeout(session.id);

    const forfeitingUserId = interaction.user.id;
    const winnerId =
      forfeitingUserId === session.challenger.id ? session.opponent.id : session.challenger.id;

    session.state = DuelState.FORFEITED;
    session.forfeitedById = forfeitingUserId;
    session.winnerId = winnerId;

    const berries = await this.rewardService.awardWin(session, winnerId, forfeitingUserId);
    await this.statsService.recordMatch(session, berries);
    this.sessionManager.removeSession(session.id);

    let description = `🏳️ ${userMention(forfeitingUserId)} has **forfeited** the duel!\n\n`;
    if (berries > 0) {
      description += `🏆 **${userMention(winnerId)} wins by forfeit and earns 🍓 ${berries} Berries!**`;
    } else {
      description += `🏆 **${userMention(winnerId)} wins by forfeit!**`;
    }

    await this.renderCombatState(interaction, session, description, true, winnerId);
  }

  private buildCombatMessage(
    session: DuelSession,
    description: string,
    isGameOver: boolean,
    winnerId?: string,
  ) {
    const isChallengerTurn = session.currentTurn === DuelTurn.CHALLENGER;
    const currentTurnUserId = isChallengerTurn ? session.challenger.id : session.opponent.id;

    const embed = new EmbedBuilder()
      .setTitle(isGameOver ? '⚔️ Duel: Game Over' : '⚔️ Duel')
      .setDescription(description)
      .setColor(isGameOver ? (winnerId ? '#00FF00' : '#888888') : '#FFA500')
      .addFields(
        {
          name: isGameOver ? '🛡️ Challenger' : isChallengerTurn ? '🛡️ Challenger 🟢' : '🛡️ Challenger ⏳',
          value: `<@${session.challenger.id}>\n\n❤️ **HP:** \`${session.challenger.hp} / ${DUEL_CONSTANTS.MAX_HP}\`\n🧪 **Heals:** \`${session.challenger.healsRemaining}\``,
          inline: true,
        },
        { name: '⚡', value: '\n⚔️\n**VS**', inline: true },
        {
          name: isGameOver ? '🛡️ Opponent' : !isChallengerTurn ? '🛡️ Opponent 🟢' : '🛡️ Opponent ⏳',
          value: `<@${session.opponent.id}>\n\n❤️ **HP:** \`${session.opponent.hp} / ${DUEL_CONSTANTS.MAX_HP}\`\n🧪 **Heals:** \`${session.opponent.healsRemaining}\``,
          inline: true,
        },
      );

    if (!isGameOver) {
      embed.addFields({
        name: '\u200B\n🎯 Active Turn',
        value: `👉 **<@${currentTurnUserId}>**, it's your turn!`,
        inline: false,
      });
    }

    if (!session.isRanked) {
      embed.setFooter({
        text: 'Daily Limit Reached: You have already played 3 matches against this opponent today. This match will be unrecorded.',
      });
    }

    const components = [];
    if (!isGameOver) {
      const currentPlayerState =
        session.currentTurn === DuelTurn.CHALLENGER ? session.challenger : session.opponent;
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`duel:attack:${session.id}`)
          .setLabel('Attack')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`duel:defend:${session.id}`)
          .setLabel('Defend')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`duel:heal:${session.id}`)
          .setLabel(`Heal (${currentPlayerState.healsRemaining})`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(currentPlayerState.healsRemaining <= 0),
        new ButtonBuilder()
          .setCustomId(`duel:forfeit:${session.id}`)
          .setLabel('Forfeit')
          .setStyle(ButtonStyle.Secondary),
      );
      components.push(row);
    }

    return { embeds: [embed], components };
  }
}
