# 🤖 AmigosBot

A modern, production-grade Discord bot built with **NestJS**, **discord.js v14**, and **Prisma ORM (v7)** using pure **Native ECMAScript Modules (ESM)**.

---

## 📑 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [ESM & TypeScript Conventions](#-esm--typescript-conventions)
- [Bot Lifecycle & Execution Flow](#-bot-lifecycle--execution-flow)
- [How to Add a New Slash Command](#-how-to-add-a-new-slash-command)
- [Local Setup & Getting Started](#-local-setup--getting-started)
- [Available Scripts](#-available-scripts)

---

## ⚡ Architecture & Tech Stack

- **Framework**: [NestJS 11](https://nestjs.com/) (Modular architecture, Dependency Injection, Lifecycle hooks)
- **Discord Library**: [discord.js v14](https://discord.js.org/)
- **Database & ORM**: [Prisma 7](https://www.prisma.io/) with PostgreSQL & `@prisma/adapter-pg` driver adapter
- **Logger**: [Winston](https://github.com/winstonjs/winston) via `nest-winston` (colorized console output in dev, JSON in prod, automatic sensitive credential redaction)
- **Runtime & Module System**: Node.js 20+ / 22+ / 24+ with **Native ESM** (`"type": "module"`, `NodeNext`) and Node.js Subpath Imports (`#app/*`)

---

## 📂 Project Structure

```text
AmigosBot/
├── apps/
│   └── bot/                                # Primary NestJS Bot Application
│       ├── src/
│       │   ├── discord/                    # Core Discord services & routing
│       │   │   ├── types/                  # Discord command interfaces
│       │   │   ├── command-registry.service.ts # In-memory registry for slash commands
│       │   │   ├── discord-client.service.ts   # Discord gateway client & event listener setup
│       │   │   ├── discord-identity.service.ts # Syncs guilds, users, & members to PostgreSQL
│       │   │   ├── discord.module.ts       # Global Discord module
│       │   │   └── interaction-router.service.ts # Dispatches incoming slash commands
│       │   ├── features/                   # Bot features & command sets
│       │   │   └── utility/                # Example utility module (/ping)
│       │   │       ├── commands/
│       │   │       │   └── ping.command.ts
│       │   │       └── utility.module.ts
│       │   ├── bot.module.ts               # Root application module
│       │   └── main.ts                     # Application bootstrap entry point
│       └── tsconfig.app.json
│
├── libs/                                   # Shared Monorepo Libraries
│   ├── common/                             # Universal utilities & helpers
│   │   └── src/
│   │       ├── utils/
│   │       │   └── error.util.ts           # Type-safe error message & stack extraction
│   │       └── index.ts
│   ├── config/                             # Global configuration module (@nestjs/config)
│   │   └── src/
│   │       ├── config.module.ts
│   │       └── index.ts
│   ├── database/                           # Prisma Database client & service
│   │   └── src/
│   │       ├── database.module.ts
│   │       ├── prisma.service.ts           # PrismaClient with PrismaPg driver adapter
│   │       └── index.ts
│   └── logging/                            # Winston logger configuration & service
│       └── src/
│           ├── logger.service.ts
│           ├── logging.module.ts
│           ├── winston.config.ts           # Log formats & sensitive key redaction
│           └── index.ts
│
├── prisma/
│   └── schema.prisma                       # Database models (User, UserProfile, Guild, GuildMember)
├── tools/
│   └── discord/
│       └── deploy-commands.ts              # Script to deploy slash commands to Discord API
├── nest-cli.json                           # NestJS CLI configuration
├── package.json                            # ESM package definition & subpath imports
├── prisma.config.ts                        # Prisma configuration
└── tsconfig.json                           # Root TypeScript compiler options (NodeNext / strict)
```

---

## 🛠️ ESM & TypeScript Conventions

This project runs in **native Node.js ESM** (`"type": "module"` and `"moduleResolution": "NodeNext"`). When writing TypeScript code in this codebase, follow these rules:

### 1. Relative Imports Must Include `.js` Extensions
TypeScript's `NodeNext` resolution compiler requires all relative file imports/exports to explicitly specify the `.js` extension (even when pointing to `.ts` source files):
```typescript
// ✅ CORRECT:
import { DiscordCommand } from './types/discord-command.interface.js';
import { PingCommand } from './commands/ping.command.js';

// ❌ INCORRECT (will cause compilation error):
import { DiscordCommand } from './types/discord-command.interface';
```

### 2. Monorepo Library Imports Use Subpath Aliases (`#app/*`)
Internal shared libraries are mapped through Node.js Subpath Imports in `package.json` and `tsconfig.json`:
```typescript
// ✅ CORRECT:
import { PrismaService } from '#app/database';
import { getErrorMessage, getErrorStack } from '#app/common';
import { WinstonModule } from '#app/logging';

// ❌ INCORRECT (Node.js runtime will treat this as an external npm package):
import { PrismaService } from '@app/database';
```

### 3. Type-Safe Catch Blocks
With TypeScript `strict: true`, catch clauses type `error` as `unknown`. Always use the safe error extraction utilities from `#app/common`:
```typescript
import { getErrorMessage, getErrorStack } from '#app/common';

try {
  // ...
} catch (error) {
  this.logger.error(`Operation failed: ${getErrorMessage(error)}`, getErrorStack(error));
}
```

---

## 🔄 Bot Lifecycle & Execution Flow

```mermaid
sequenceDiagram
    autonumber
    participant Main as main.ts
    participant Nest as NestJS IoC
    participant Prisma as PrismaService
    participant Discord as DiscordClientService
    participant Gateway as Discord Gateway
    participant Router as InteractionRouterService
    participant Registry as CommandRegistryService

    Main->>Nest: NestFactory.createApplicationContext(BotModule)
    Nest->>Prisma: onModuleInit() -> $connect() via PrismaPg Adapter
    Nest->>Registry: Features register commands (/ping) onModuleInit()
    Nest->>Discord: onApplicationBootstrap() -> client.login(DISCORD_TOKEN)
    Discord->>Gateway: Connect to Discord Gateway
    Gateway-->>Discord: ClientReady Event
    Discord->>Discord: Sync cached Guilds & Users to PostgreSQL
    
    Note over Gateway,Router: Incoming Interaction Flow
    Gateway->>Discord: InteractionCreate Event (/ping)
    Discord->>Router: handleInteraction(interaction)
    Router->>Router: Sync User & GuildMember to DB
    Router->>Registry: get("ping")
    Registry-->>Router: PingCommand Instance
    Router->>PingCommand: execute(interaction)
    PingCommand->>Gateway: reply({ content: "Pinging...", withResponse: true })
    PingCommand->>Gateway: editReply("🏓 Pong! ...")
```

### Step-by-Step Breakdown:
1. **Bootstrap (`main.ts`)**: Initializes the custom Winston Logger and creates the NestJS Application Context.
2. **Database Initialization (`libs/database`)**: Injects `ConfigService`, instantiates the `@prisma/adapter-pg` driver adapter with `DATABASE_URL`, and connects to PostgreSQL on `onModuleInit`.
3. **Command Registration (`features/*`)**: Feature modules (e.g. `UtilityModule`) inject `CommandRegistryService` and register their command instances during `onModuleInit`.
4. **Discord Login (`DiscordClientService`)**: Logs into the Discord Gateway using `DISCORD_TOKEN` in `onApplicationBootstrap`.
5. **Startup Synchronization (`DiscordIdentityService`)**: When `ClientReady` fires, all guilds and bot members are upserted into PostgreSQL.
6. **Interaction Routing (`InteractionRouterService`)**: On `InteractionCreate`:
   - Checks guild/user membership and ensures records in PostgreSQL are up-to-date.
   - Finds the matching command from `CommandRegistryService`.
   - Executes the command.
7. **Graceful Shutdown**: On process termination (`SIGINT`/`SIGTERM`), NestJS triggers `onApplicationShutdown` (destroys the Discord client) and `onModuleDestroy` (disconnects the Prisma database pool).

---

## ➕ How to Add a New Slash Command

Adding a new slash command is simple and modular. Follow these 3 steps:

### Step 1: Create the Command Class
Create a new file in your feature folder (e.g. `apps/bot/src/features/utility/commands/hello.command.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DiscordCommand } from '../../../discord/types/discord-command.interface.js';

@Injectable()
export class HelloCommand implements DiscordCommand {
  readonly data = new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Says hello to the user!');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply({
      content: `Hello, ${interaction.user.username}! 👋`,
      ephemeral: true,
    });
  }
}
```

### Step 2: Register the Command in the Feature Module
Add the command to your module's `providers` and register it in `onModuleInit` (`apps/bot/src/features/utility/utility.module.ts`):

```typescript
import { Module, OnModuleInit } from '@nestjs/common';
import { CommandRegistryService } from '../../discord/command-registry.service.js';
import { PingCommand } from './commands/ping.command.js';
import { HelloCommand } from './commands/hello.command.js';

@Module({
  providers: [PingCommand, HelloCommand],
  exports: [PingCommand, HelloCommand],
})
export class UtilityModule implements OnModuleInit {
  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly pingCommand: PingCommand,
    private readonly helloCommand: HelloCommand,
  ) {}

  onModuleInit(): void {
    this.commandRegistry.register(this.pingCommand);
    this.commandRegistry.register(this.helloCommand);
  }
}
```

### Step 3: Register the Command Definition with Discord API
Add the slash command builder definition to `tools/discord/deploy-commands.ts`:

```typescript
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and latency statistics.'),
  new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Says hello to the user!'),
].map((command) => command.toJSON());
```

Deploy the updated command definitions to Discord:
```bash
pnpm run deploy:commands
```

---

## 🚀 Local Setup & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20.19+, 22.12+, or 24+)
- [pnpm](https://pnpm.io/) (`corepack enable && corepack prepare pnpm@latest --activate`)
- A running PostgreSQL database instance (or Docker)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the required credentials:
```env
DISCORD_TOKEN="your_bot_token"
CLIENT_ID="your_discord_application_id"
GUILD_ID="your_test_guild_id"          # For instant dev command deployment
DATABASE_URL="postgresql://user:password@localhost:5432/amigos_db?schema=public"
NODE_ENV="development"
LOG_LEVEL="debug"
```

### 3. Database Migration & Prisma Client Generation
```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

### 4. Deploy Slash Commands to Discord
```bash
pnpm run deploy:commands
```

### 5. Start the Bot in Watch Mode
```bash
pnpm run start:dev
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm run start:dev` | Starts the bot in development mode with incremental watch compilation |
| `pnpm run build` | Compiles the TypeScript application into the `dist/` directory |
| `pnpm run start` | Runs the compiled production build from `dist/` |
| `pnpm run deploy:commands` | Deploys slash commands to Discord REST API (instant to `GUILD_ID` or global) |
| `pnpm exec prisma migrate dev` | Applies database schema migrations |
| `pnpm exec prisma generate` | Regenerates Prisma Client types |
| `pnpm exec prisma studio` | Opens Prisma Studio GUI to view/edit database records |
