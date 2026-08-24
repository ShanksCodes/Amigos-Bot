import { Module, OnModuleInit } from '@nestjs/common';
import { CommandRegistryService } from '../../discord/command-registry.service.js';
import { DadJokeCommand } from './commands/dadjoke.command.js';
import { JokeCommand } from './commands/joke.command.js';

@Module({
  providers: [DadJokeCommand, JokeCommand],
  exports: [DadJokeCommand, JokeCommand],
})
export class FunModule implements OnModuleInit {
  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly dadJokeCommand: DadJokeCommand,
    private readonly jokeCommand: JokeCommand,
  ) {}

  onModuleInit(): void {
    this.commandRegistry.register(this.dadJokeCommand);
    this.commandRegistry.register(this.jokeCommand);
  }
}
