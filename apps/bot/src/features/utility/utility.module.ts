import { Module, OnModuleInit } from '@nestjs/common';
import { CommandRegistryService } from '../../discord/command-registry.service';
import { PingCommand } from './commands/ping.command';

@Module({
  providers: [PingCommand],
  exports: [PingCommand],
})
export class UtilityModule implements OnModuleInit {
  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly pingCommand: PingCommand,
  ) {}

  onModuleInit(): void {
    this.commandRegistry.register(this.pingCommand);
  }
}
