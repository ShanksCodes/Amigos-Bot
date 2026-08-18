import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const logger = new Logger('DeployCommands');

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and latency statistics.'),
].map((command) => command.toJSON());

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  logger.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

async function deploy() {
  try {
    logger.log(
      `Started refreshing ${commands.length} application (/) command(s).`,
    );

    if (guildId) {
      const data = (await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      )) as unknown[];
      logger.log(
        `Successfully reloaded ${data.length} guild (/) command(s) for guild ${guildId}.`,
      );
    } else {
      const data = (await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      })) as unknown[];
      logger.log(
        `Successfully reloaded ${data.length} global (/) command(s).`,
      );
    }
  } catch (error) {
    logger.error('Failed to deploy application commands:', (error as Error)?.stack ?? error);
    process.exit(1);
  }
}

deploy();
