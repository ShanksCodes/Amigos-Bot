import { Injectable, Logger } from '@nestjs/common';
import { DiscordClientService } from '../../discord/discord-client.service.js';
import { PrismaService } from '#app/database';
import { BIRTHDAY_CONSTANTS } from './birthday.constants.js';
import { EmbedBuilder, TextChannel, userMention } from 'discord.js';

@Injectable()
export class BirthdayAnnouncementService {
  private readonly logger = new Logger(BirthdayAnnouncementService.name);

  constructor(
    private readonly discordClient: DiscordClientService,
    private readonly prisma: PrismaService,
  ) {}

  async announceBirthday(userId: string, guildId: string, localDateStr: string): Promise<void> {
    try {
      // Ensure we haven't already announced for this exact local date
      const localDate = new Date(localDateStr);
      
      const existing = await this.prisma.birthdayAnnouncement.findUnique({
        where: {
          userId_guildId_birthdayDate: {
            userId,
            guildId,
            birthdayDate: localDate,
          }
        }
      });

      if (existing) {
        this.logger.debug(`Already announced birthday for ${userId} in ${guildId} on ${localDateStr}`);
        return;
      }

      const config = await this.prisma.guildBirthdayConfig.findUnique({
        where: { guildId },
      });

      if (!config || !config.enabled || !config.announcementChannelId) {
        return;
      }

      const channel = await this.discordClient.getClient().channels.fetch(config.announcementChannelId).catch(() => null);
      
      if (!channel || !(channel instanceof TextChannel)) {
        this.logger.warn(`Configured birthday channel ${config.announcementChannelId} in guild ${guildId} is not accessible or not a text channel.`);
        return;
      }

      const gifs = BIRTHDAY_CONSTANTS.PLACEHOLDER_GIFS;
      const gifUrl = gifs.length > 0 ? gifs[Math.floor(Math.random() * gifs.length)] : null;

      const embed = new EmbedBuilder()
        .setTitle('🎉 Happy Birthday! 🎉')
        .setDescription(`Wishing a fantastic birthday to ${userMention(userId)}! 🎂🥳\nHope you have a wonderful day!`)
        .setColor('#FF69B4');

      if (gifUrl) {
        embed.setImage(gifUrl);
      }

      await channel.send({ embeds: [embed] });

      await this.prisma.birthdayAnnouncement.create({
        data: {
          userId,
          guildId,
          birthdayDate: localDate,
        }
      });

      this.logger.log(`Announced birthday for ${userId} in ${guildId}`);

    } catch (error) {
      this.logger.error(`Failed to announce birthday for ${userId} in ${guildId}`, error);
    }
  }
}
