import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '#app/database';
import { BIRTHDAY_CONSTANTS } from './birthday.constants.js';
import { SetBirthdayDto } from './birthday.types.js';

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async getGuildSetting(userId: string, guildId: string) {
    return this.prisma.guildBirthdaySetting.findUnique({
      where: {
        userId_guildId: { userId, guildId },
      },
    });
  }

  async toggleGuildSetting(userId: string, guildId: string): Promise<boolean> {
    const existing = await this.getGuildSetting(userId, guildId);
    
    // Make sure user exists in db
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });
    // Make sure guild exists
    await this.prisma.guild.upsert({
      where: { id: guildId },
      update: {},
      create: { id: guildId },
    });

    if (existing) {
      await this.prisma.guildBirthdaySetting.delete({
        where: { id: existing.id },
      });
      return false;
    } else {
      await this.prisma.guildBirthdaySetting.create({
        data: { userId, guildId },
      });
      return true;
    }
  }

  async updateTimezone(userId: string, timezone: string): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    await this.prisma.userProfile.upsert({
      where: { userId },
      update: { timezone },
      create: { userId, timezone },
    });
  }

  async setBirthday(userId: string, dto: SetBirthdayDto): Promise<{ success: boolean; message?: string }> {
    const { day, month, year } = dto;
    
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const isFirstTime = !profile || profile.birthDay === null || profile.birthMonth === null;

    if (!isFirstTime) {
      // Check limits
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - BIRTHDAY_CONSTANTS.CHANGE_WINDOW_MONTHS);

      const recentChanges = await this.prisma.birthdayChange.count({
        where: {
          userId,
          changedAt: {
            gte: threeMonthsAgo,
          },
        },
      });

      if (recentChanges >= BIRTHDAY_CONSTANTS.MAX_CHANGES_PER_WINDOW) {
        return {
          success: false,
          message: `You can only change your birthday ${BIRTHDAY_CONSTANTS.MAX_CHANGES_PER_WINDOW} times within a ${BIRTHDAY_CONSTANTS.CHANGE_WINDOW_MONTHS}-month period.`,
        };
      }

      // Record the change
      await this.prisma.birthdayChange.create({
        data: {
          userId,
          prevDay: profile.birthDay,
          prevMonth: profile.birthMonth,
          prevYear: profile.birthYear,
          newDay: day,
          newMonth: month,
          newYear: year,
        },
      });
    }

    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        birthDay: day,
        birthMonth: month,
        birthYear: year,
      },
      create: {
        userId,
        birthDay: day,
        birthMonth: month,
        birthYear: year,
      },
    });

    return { success: true };
  }
}
