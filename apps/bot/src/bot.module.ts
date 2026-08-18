import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { LoggingModule } from '@app/logging';
import { DiscordModule } from './discord/discord.module';
import { UtilityModule } from './features/utility/utility.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    LoggingModule.forRoot({ appName: 'AmigosBot' }),
    DatabaseModule,
    DiscordModule,
    UtilityModule,
  ],
})
export class BotModule {}
