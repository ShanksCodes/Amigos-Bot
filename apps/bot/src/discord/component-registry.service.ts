import { Injectable, Logger } from '@nestjs/common';
import { DiscordComponent } from './types/discord-component.interface.js';

@Injectable()
export class ComponentRegistryService {
  private readonly components = new Map<string, DiscordComponent>();
  private readonly logger = new Logger(ComponentRegistryService.name);

  register(component: DiscordComponent): void {
    if (this.components.has(component.customIdPrefix)) {
      this.logger.warn(
        `Component handler for prefix '${component.customIdPrefix}' is already registered. Overwriting.`,
      );
    }
    this.components.set(component.customIdPrefix, component);
    this.logger.log(`Registered component handler: ${component.customIdPrefix}`);
  }

  get(customId: string): DiscordComponent | undefined {
    // Find the longest registered prefix that matches the start of the customId
    let bestMatch: DiscordComponent | undefined;
    let longestMatchLength = 0;

    for (const [prefix, component] of this.components.entries()) {
      if (customId.startsWith(prefix) && prefix.length > longestMatchLength) {
        bestMatch = component;
        longestMatchLength = prefix.length;
      }
    }

    return bestMatch;
  }

  getAll(): DiscordComponent[] {
    return Array.from(this.components.values());
  }
}
