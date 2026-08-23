import { Module } from '@nestjs/common';
import { DuelCommand } from './commands/duel.command.js';
import { DuelComponentHandler } from './handlers/duel-component.handler.js';
import { DuelEngineService } from './services/duel-engine.service.js';
import { DuelMediaService } from './services/duel-media.service.js';
import { DuelRewardService } from './services/duel-reward.service.js';
import { DuelSessionManager } from './services/duel-session.manager.js';
import { DuelStatisticsService } from './services/duel-statistics.service.js';
import { CommandRegistryService } from '../../discord/command-registry.service.js';
import { ComponentRegistryService } from '../../discord/component-registry.service.js';

@Module({
  providers: [
    DuelEngineService,
    DuelMediaService,
    DuelRewardService,
    DuelSessionManager,
    DuelStatisticsService,
    DuelCommand,
    DuelComponentHandler,
  ],
})
export class DuelModule {
  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly componentRegistry: ComponentRegistryService,
    private readonly duelCommand: DuelCommand,
    private readonly duelComponentHandler: DuelComponentHandler,
  ) {
    this.commandRegistry.register(this.duelCommand);
    this.componentRegistry.register(this.duelComponentHandler);
  }
}
