import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { DiscordClientService } from './discord-client.service';
import { CommandRegistryService } from './command-registry.service';
import { InteractionRouterService } from './interaction-router.service';
import { DiscordIdentityService } from './discord-identity.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    DiscordClientService,
    CommandRegistryService,
    InteractionRouterService,
    DiscordIdentityService,
  ],
  exports: [
    DiscordClientService,
    CommandRegistryService,
    InteractionRouterService,
    DiscordIdentityService,
  ],
})
export class DiscordModule {}
