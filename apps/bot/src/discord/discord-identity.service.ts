import { Injectable, Logger } from '@nestjs/common';
import {
  Guild as DiscordGuild,
  GuildMember as DiscordGuildMember,
  PartialGuildMember,
  User as DiscordUser,
} from 'discord.js';
import { PrismaService } from '@app/database';

export type SyncGuildInput =
  | DiscordGuild
  | {
      id: string;
      name?: string | null;
    };

export type SyncUserInput =
  | DiscordUser
  | {
      id: string;
      bot?: boolean;
    };

export type SyncGuildMemberInput =
  | DiscordGuildMember
  | {
      guild: SyncGuildInput;
      user: SyncUserInput;
      joinedAt?: Date | null;
      joinedTimestamp?: number | null;
    };

export type GuildMemberLeftInput =
  | DiscordGuildMember
  | PartialGuildMember
  | {
      guild: SyncGuildInput;
      user: SyncUserInput;
    };

@Injectable()
export class DiscordIdentityService {
  private readonly logger = new Logger(DiscordIdentityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Synchronizes a Discord Guild entity with the database.
   */
  async syncGuild(guild: SyncGuildInput): Promise<void> {
    try {
      await this.prisma.guild.upsert({
        where: { id: guild.id },
        create: {
          id: guild.id,
          name: guild.name ?? null,
        },
        update: {
          name: guild.name ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to sync guild ${guild.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronizes a Discord User entity with the database.
   * Note: UserProfile is NOT automatically created. It will only be created when profile data is provided.
   */
  async syncUser(user: SyncUserInput): Promise<void> {
    try {
      await this.prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          isBot: user.bot ?? false,
        },
        update: {
          isBot: user.bot ?? false,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to sync user ${user.id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronizes GuildMember, ensuring both Guild and User exist first.
   * Uses Discord's actual joinedAt when available.
   * On rejoin/sync, updates membership data and clears leftAt.
   */
  async syncGuildMember(member: SyncGuildMemberInput): Promise<void> {
    try {
      await this.syncGuild(member.guild);
      await this.syncUser(member.user);

      const joinedAt =
        member.joinedAt ??
        (member.joinedTimestamp ? new Date(member.joinedTimestamp) : null);

      await this.prisma.guildMember.upsert({
        where: {
          guildId_userId: {
            guildId: member.guild.id,
            userId: member.user.id,
          },
        },
        create: {
          guildId: member.guild.id,
          userId: member.user.id,
          joinedAt: joinedAt ?? undefined,
          leftAt: null,
        },
        update: {
          ...(joinedAt ? { joinedAt } : {}),
          leftAt: null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to sync guild member ${member.user.id} in guild ${member.guild.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Marks a GuildMember as left by setting leftAt timestamp without deleting the record.
   */
  async markGuildMemberLeft(member: GuildMemberLeftInput): Promise<void> {
    try {
      await this.syncGuild(member.guild);
      if (member.user) {
        await this.syncUser(member.user);
      }

      await this.prisma.guildMember.upsert({
        where: {
          guildId_userId: {
            guildId: member.guild.id,
            userId: member.user.id,
          },
        },
        create: {
          guildId: member.guild.id,
          userId: member.user.id,
          leftAt: new Date(),
        },
        update: {
          leftAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to mark guild member ${member.user?.id} as left in guild ${member.guild.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
