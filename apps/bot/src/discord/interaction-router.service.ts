import { Injectable, Logger } from '@nestjs/common';
import {
  AutocompleteInteraction,
  GuildMember,
  Interaction,
  InteractionReplyOptions,
  MessageFlags,
} from 'discord.js';
import { getErrorMessage, getErrorStack } from '#app/common';
import { CommandRegistryService } from './command-registry.service.js';
import { ComponentRegistryService } from './component-registry.service.js';
import { DiscordIdentityService } from './discord-identity.service.js';

@Injectable()
export class InteractionRouterService {
  private readonly logger = new Logger(InteractionRouterService.name);

  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly componentRegistry: ComponentRegistryService,
    private readonly identityService: DiscordIdentityService,
  ) {}

  async handleInteraction(interaction: Interaction): Promise<void> {
    try {
      if (interaction.isChatInputCommand()) {
        await this.handleChatInputCommand(interaction);
      } else if (interaction.isAutocomplete()) {
        await this.handleAutocomplete(interaction);
      } else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
        await this.handleMessageComponent(interaction);
      }
    } catch (error) {
      this.logger.error(
        `Error executing interaction: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (interaction.isRepliable()) {
        const errorResponse: InteractionReplyOptions = {
          content: 'An error occurred while executing this interaction.',
          flags: MessageFlags.Ephemeral,
        };

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(errorResponse).catch(() => {});
        } else {
          await interaction.reply(errorResponse).catch(() => {});
        }
      }
    }
  }

  private async handleChatInputCommand(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    // Centrally ensure/sync identity before command execution
    await this.syncIdentity(interaction);

    this.logger.debug(
      `Routing command /${interaction.commandName} from user ${interaction.user.id} in ${interaction.guildId ?? 'DM'}`,
    );

    const command = this.commandRegistry.get(interaction.commandName);
    if (!command) {
      this.logger.warn(`No command registered for /${interaction.commandName}`);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'This command is not recognized or is currently unavailable.',
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    await command.execute(interaction);
  }

  private async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const command = this.commandRegistry.get(interaction.commandName);
    if (!command || !command.autocomplete) {
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      this.logger.error(
        `Error executing autocomplete for /${interaction.commandName}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      if (!interaction.responded) {
        await interaction.respond([]).catch(() => {});
      }
    }
  }

  private async handleMessageComponent(interaction: Interaction): Promise<void> {
    if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) return;

    // Centrally ensure/sync identity before component execution
    await this.syncIdentity(interaction);

    this.logger.debug(
      `Routing component ${interaction.customId} from user ${interaction.user.id} in ${interaction.guildId ?? 'DM'}`,
    );

    const component = this.componentRegistry.get(interaction.customId);
    if (!component) {
      this.logger.warn(`No component registered for customId ${interaction.customId}`);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: 'This component is not recognized or is currently unavailable.',
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    await component.execute(interaction);
  }

  private async syncIdentity(interaction: Interaction): Promise<void> {
    if (interaction.inGuild() && interaction.guild) {
      if (interaction.member instanceof GuildMember) {
        await this.identityService.syncGuildMember(interaction.member);
      } else if (interaction.member) {
        const joinedAt =
          'joined_at' in interaction.member && interaction.member.joined_at
            ? new Date(interaction.member.joined_at)
            : null;

        await this.identityService.syncGuild(interaction.guild);
        await this.identityService.syncUser(interaction.user);
        await this.identityService.syncGuildMember({
          guild: interaction.guild,
          user: interaction.user,
          joinedAt,
        });
      } else {
        await this.identityService.syncGuild(interaction.guild);
        await this.identityService.syncUser(interaction.user);
      }
    } else {
      await this.identityService.syncUser(interaction.user);
    }
  }
}
