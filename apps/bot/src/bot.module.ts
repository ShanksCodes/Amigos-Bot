import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '#app/database';
import { LoggingModule } from '#app/logging';
import { DiscordModule } from './discord/discord.module.js';
import { UtilityModule } from './features/utility/utility.module.js';
import { DuelModule } from './features/duel/duel.module.js';
import { FunModule } from './features/fun/fun.module.js';
import { SettingsModule } from './features/settings/settings.module.js';
import { BirthdayModule } from './features/birthday/birthday.module.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    LoggingModule.forRoot({ appName: 'AmigosBot' }),
    DatabaseModule,
    DiscordModule,
    UtilityModule,
    DuelModule,
    FunModule,
    SettingsModule,
    BirthdayModule,
  ],
})
export class BotModule {}
