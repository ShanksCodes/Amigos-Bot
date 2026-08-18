import { Injectable, Logger } from '@nestjs/common';
import { DiscordCommand } from './types/discord-command.interface';

@Injectable()
export class CommandRegistryService {
  private readonly logger = new Logger(CommandRegistryService.name);
  private readonly commands = new Map<string, DiscordCommand>();

  register(command: DiscordCommand): void {
    const name = command.data.name;
    if (this.commands.has(name)) {
      this.logger.warn(`Command "${name}" is already registered. Overwriting registration.`);
    }
    this.commands.set(name, command);
    this.logger.log(`Registered command: /${name}`);
  }

  get(name: string): DiscordCommand | undefined {
    return this.commands.get(name);
  }

  getAll(): DiscordCommand[] {
    return Array.from(this.commands.values());
  }
}
