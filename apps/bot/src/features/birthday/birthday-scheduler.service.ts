import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '#app/database';
import { DateTime } from 'luxon';
import { BIRTHDAY_CONSTANTS } from './birthday.constants.js';
import { BirthdayAnnouncementService } from './birthday-announcement.service.js';

@Injectable()
export class BirthdaySchedulerService {
  private readonly logger = new Logger(BirthdaySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly announcementService: BirthdayAnnouncementService,
  ) {}

  @Cron('0 */15 * * * *')
  async checkBirthdays() {
    this.logger.debug('Running birthday scheduler...');
    
    // We check UTC yesterday, today, and tomorrow to cover all possible timezones.
    const nowUtc = DateTime.utc();
    const candidateDates = [
      nowUtc.minus({ days: 1 }),
      nowUtc,
      nowUtc.plus({ days: 1 })
    ];

    const candidateMonths = [...new Set(candidateDates.map(d => d.month))];
    const candidateDays = [...new Set(candidateDates.map(d => d.day))];

    // Find profiles with timezone != null and matching month/day combinations
    const profiles = await this.prisma.userProfile.findMany({
      where: {
        timezone: { not: null },
        birthMonth: { in: candidateMonths },
        birthDay: { in: candidateDays },
        user: {
          guildBirthdaySettings: {
            some: {} // At least one opt-in
          }
        }
      },
      include: {
        user: {
          include: {
            guildBirthdaySettings: true
          }
        }
      }
    });

    for (const profile of profiles) {
      if (!profile.timezone || !profile.birthMonth || !profile.birthDay) continue;

      const localTime = nowUtc.setZone(profile.timezone);
      
      // Validation to ensure timezone is valid Luxon string
      if (!localTime.isValid) continue;

      // Check if it's currently their birthday locally
      // Leap year handling: if their birthday is Feb 29 and this is not a leap year, celebrate on Feb 28
      let targetMonth = profile.birthMonth;
      let targetDay = profile.birthDay;

      if (targetMonth === 2 && targetDay === 29 && !localTime.isInLeapYear) {
        targetDay = 28;
      }

      const isBirthdayToday = localTime.month === targetMonth && localTime.day === targetDay;
      const isRightHour = localTime.hour === BIRTHDAY_CONSTANTS.ANNOUNCEMENT_HOUR;

      if (isBirthdayToday && isRightHour) {
        const localDateStr = localTime.toISODate(); // YYYY-MM-DD
        if (!localDateStr) continue;

        for (const setting of profile.user.guildBirthdaySettings) {
          await this.announcementService.announceBirthday(profile.userId, setting.guildId, localDateStr);
        }
      }
    }
  }
}
