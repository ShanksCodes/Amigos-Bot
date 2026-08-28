import { Module } from '@nestjs/common';
import { DiscordModule } from '../../discord/discord.module.js';
import { BirthdayService } from './birthday.service.js';
import { BirthdayTimezoneService } from './birthday-timezone.service.js';
import { BirthdaySchedulerService } from './birthday-scheduler.service.js';
import { BirthdayAnnouncementService } from './birthday-announcement.service.js';

// We'll import interactions once we create them
import { BirthdayCommand } from './interactions/birthday.command.js';
import { BirthdayButtonHandler } from './interactions/birthday-button.handler.js';
import { BirthdayModalHandler } from './interactions/birthday-modal.handler.js';
import { BirthdayTimezoneHandler } from './interactions/birthday-timezone.handler.js';
import { BirthdaySettingsHandler } from './settings/birthday-settings.handler.js';
import { BirthdayChannelHandler } from './settings/birthday-channel.handler.js';
import { SettingsModule } from '../settings/settings.module.js';

@Module({
  imports: [DiscordModule, SettingsModule],
  providers: [
    BirthdayService,
    BirthdayTimezoneService,
    BirthdaySchedulerService,
    BirthdayAnnouncementService,
    
    // Discord Interactions
    BirthdayCommand,
    BirthdayButtonHandler,
    BirthdayModalHandler,
    BirthdayTimezoneHandler,
    BirthdaySettingsHandler,
    BirthdayChannelHandler,
  ],
})
export class BirthdayModule {}
