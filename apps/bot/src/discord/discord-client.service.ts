import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  Events,
  GatewayIntentBits,
} from 'discord.js';
import { getErrorMessage, getErrorStack } from '@app/common';
import { DiscordIdentityService } from './discord-identity.service.js';
import { InteractionRouterService } from './interaction-router.service.js';

@Injectable()
export class DiscordClientService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DiscordClientService.name);
  private readonly client: Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly identityService: DiscordIdentityService,
    private readonly interactionRouter: InteractionRouterService,
  ) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.registerEventListeners();
  }

  getClient(): Client {
    return this.client;
  }

  private registerEventListeners(): void {
    this.client.once(Events.ClientReady, async (readyClient) => {
      this.logger.log(`Discord client ready! Logged in as ${readyClient.user.tag}`);

      try {
        let syncedCount = 0;
        for (const [, guild] of readyClient.guilds.cache) {
          await this.identityService.syncGuild(guild);
          syncedCount++;
        }
        this.logger.log(`Synced ${syncedCount} guild(s) on startup`);
      } catch (error) {
        this.logger.error(
          `Error syncing guilds on startup: ${getErrorMessage(error)}`,
          getErrorStack(error),
        );
      }
    });

    this.client.on(Events.GuildCreate, async (guild) => {
      this.logger.log(`Joined new guild: ${guild.name} (${guild.id})`);
      try {
        await this.identityService.syncGuild(guild);
      } catch (error) {
        this.logger.error(
          `Error syncing joined guild ${guild.id}: ${getErrorMessage(error)}`,
          getErrorStack(error),
        );
      }
    });

    this.client.on(Events.GuildMemberAdd, async (member) => {
      try {
        await this.identityService.syncGuildMember(member);
      } catch (error) {
        this.logger.error(
          `Error syncing added member ${member.user.id} in guild ${member.guild.id}: ${getErrorMessage(error)}`,
          getErrorStack(error),
        );
      }
    });

    this.client.on(Events.GuildMemberRemove, async (member) => {
      try {
        await this.identityService.markGuildMemberLeft(member);
      } catch (error) {
        this.logger.error(
          `Error marking member ${member.user?.id} left in guild ${member.guild.id}: ${getErrorMessage(error)}`,
          getErrorStack(error),
        );
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      try {
        await this.interactionRouter.handleInteraction(interaction);
      } catch (error) {
        this.logger.error(
          `Unhandled interaction router error: ${getErrorMessage(error)}`,
          getErrorStack(error),
        );
      }
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      const token = this.configService.getOrThrow<string>('DISCORD_TOKEN');
      this.logger.log('Logging in to Discord...');
      await this.client.login(token);
    } catch (error) {
      this.logger.error(
        `Failed to login to Discord: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Destroying Discord client connection...');
    await this.client.destroy();
    this.logger.log('Discord client disconnected.');
  }
}
