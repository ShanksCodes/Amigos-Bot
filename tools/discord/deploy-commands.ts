import { Logger } from '@nestjs/common';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

try {
  process.loadEnvFile();
} catch {
  // Ignored if .env does not exist or env vars already provided
}

const logger = new Logger('DeployCommands');

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and latency statistics.'),
  new SlashCommandBuilder()
    .setName('duel')
    .setDescription('Duel commands')
    .addSubcommand(sub =>
      sub
        .setName('challenge')
        .setDescription('Challenge another user to a duel')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('The user to challenge')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('stats')
        .setDescription('View your or another user\'s duel stats')
        .addUserOption(opt =>
          opt
            .setName('user')
            .setDescription('The user to view stats for')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('leaderboard')
        .setDescription('View the duel leaderboard')
    ),
  new SlashCommandBuilder()
    .setName('dadjoke')
    .setDescription('Tells a random dad joke!'),
  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Tells a random joke from JokeAPI!'),
  new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Manage your personal birthday and timezone settings'),
  new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure server settings (Admins only)')
    .setDefaultMemberPermissions(8), // 8 is ManageGuild permission bit
  new SlashCommandBuilder()
    .setName('notes')
    .setDescription('Manage your private personal notes')
    .addSubcommand((sub) =>
      sub.setName('add').setDescription('Create a new private personal note'),
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('List all your private personal notes'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View a private personal note')
        .addIntegerOption((opt) =>
          opt
            .setName('number')
            .setDescription('The note number from /notes list')
            .setRequired(true)
            .setMinValue(1),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Edit an existing private personal note')
        .addIntegerOption((opt) =>
          opt
            .setName('number')
            .setDescription('The note number from /notes list')
            .setRequired(true)
            .setMinValue(1),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a private personal note')
        .addIntegerOption((opt) =>
          opt
            .setName('number')
            .setDescription('The note number from /notes list')
            .setRequired(true)
            .setMinValue(1),
        ),
    ),
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
  const validClientId = clientId as string;
  try {
    logger.log(
      `Started refreshing ${commands.length} application (/) command(s).`,
    );

    if (guildId) {
      const data = (await rest.put(
        Routes.applicationGuildCommands(validClientId, guildId),
        { body: commands },
      )) as unknown[];
      logger.log(
        `Successfully reloaded ${data.length} guild (/) command(s) for guild ${guildId}.`,
      );
    } else {
      const data = (await rest.put(Routes.applicationCommands(validClientId), {
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
