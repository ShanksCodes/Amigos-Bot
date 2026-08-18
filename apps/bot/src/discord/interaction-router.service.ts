import { Injectable, Logger } from '@nestjs/common';
import { GuildMember, Interaction } from 'discord.js';
import { CommandRegistryService } from './command-registry.service';
import { DiscordIdentityService } from './discord-identity.service';

@Injectable()
export class InteractionRouterService {
  private readonly logger = new Logger(InteractionRouterService.name);

  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly identityService: DiscordIdentityService,
  ) {}

  async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    try {
      // Centrally ensure/sync identity before command execution
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

      this.logger.debug(
        `Routing command /${interaction.commandName} from user ${interaction.user.id} in ${interaction.guildId ?? 'DM'}`,
      );

      const command = this.commandRegistry.get(interaction.commandName);
      if (!command) {
        this.logger.warn(`No command registered for /${interaction.commandName}`);
        if (interaction.isRepliable()) {
          await interaction.reply({
            content: 'This command is not recognized or is currently unavailable.',
            ephemeral: true,
          });
        }
        return;
      }

      await command.execute(interaction);
    } catch (error) {
      this.logger.error(
        `Error executing command /${interaction.commandName}: ${error.message}`,
        error.stack,
      );

      if (interaction.isRepliable()) {
        const errorResponse = {
          content: 'An error occurred while executing this command.',
          ephemeral: true,
        };

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(errorResponse);
        } else {
          await interaction.reply(errorResponse);
        }
      }
    }
  }
}
