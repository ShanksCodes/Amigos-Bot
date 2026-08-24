import { Injectable, Logger } from '@nestjs/common';
import { StringSelectMenuInteraction } from 'discord.js';

export interface SettingsHandler {
  readonly featureId: string;
  handleSettingsSelect(interaction: StringSelectMenuInteraction): Promise<void>;
}

@Injectable()
export class SettingsRouterService {
  private readonly logger = new Logger(SettingsRouterService.name);
  private readonly handlers = new Map<string, SettingsHandler>();

  register(handler: SettingsHandler): void {
    if (this.handlers.has(handler.featureId)) {
      this.logger.warn(`Settings handler for feature '${handler.featureId}' is already registered. Overwriting.`);
    }
    this.handlers.set(handler.featureId, handler);
    this.logger.log(`Registered settings handler: ${handler.featureId}`);
  }

  get(featureId: string): SettingsHandler | undefined {
    return this.handlers.get(featureId);
  }
}
