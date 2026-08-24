import { Module } from '@nestjs/common';
import { DiscordModule } from '../../discord/discord.module.js';
import { SettingsCommand } from './interactions/settings.command.js';
import { SettingsRouterService } from './settings-router.service.js';
import { SettingsFeatureSelectHandler } from './interactions/settings-feature-select.handler.js';
import { SettingsBackHandler } from './interactions/settings-back.handler.js';

@Module({
  imports: [DiscordModule],
  providers: [
    SettingsRouterService,
    SettingsCommand,
    SettingsFeatureSelectHandler,
    SettingsBackHandler,
  ],
  exports: [SettingsRouterService],
})
export class SettingsModule {}
