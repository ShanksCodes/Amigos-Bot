import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '#app/database';
import { DiscordClientService } from './discord-client.service.js';
import { CommandRegistryService } from './command-registry.service.js';
import { ComponentRegistryService } from './component-registry.service.js';
import { InteractionRouterService } from './interaction-router.service.js';
import { DiscordIdentityService } from './discord-identity.service.js';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    DiscordClientService,
    CommandRegistryService,
    ComponentRegistryService,
    InteractionRouterService,
    DiscordIdentityService,
  ],
  exports: [
    DiscordClientService,
    CommandRegistryService,
    ComponentRegistryService,
    InteractionRouterService,
    DiscordIdentityService,
  ],
})
export class DiscordModule {}
