import { Injectable, Logger } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { CommandRegistryService } from '../../discord/command-registry.service.js';
import { DiscordCommand } from '../../discord/types/discord-command.interface.js';
import { NotesAddHandler } from './interactions/notes-add.handler.js';
import { NotesDeleteHandler } from './interactions/notes-delete.handler.js';
import { NotesEditHandler } from './interactions/notes-edit.handler.js';
import { NotesListHandler } from './interactions/notes-list.handler.js';
import { NotesViewHandler } from './interactions/notes-view.handler.js';
import { NotesService } from './notes.service.js';

@Injectable()
export class NotesCommand implements DiscordCommand {
  private readonly logger = new Logger(NotesCommand.name);

  readonly data = new SlashCommandBuilder()
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
    );

  constructor(
    private readonly commandRegistry: CommandRegistryService,
    private readonly notesService: NotesService,
    private readonly addHandler: NotesAddHandler,
    private readonly listHandler: NotesListHandler,
    private readonly viewHandler: NotesViewHandler,
    private readonly editHandler: NotesEditHandler,
    private readonly deleteHandler: NotesDeleteHandler,
  ) {
    this.commandRegistry.register(this);
  }

  /**
   * Executes the /notes slash commands and dispatches to appropriate handlers.
   */
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'add':
        await this.addHandler.handleCommand(interaction);
        break;
      case 'list':
        await this.listHandler.execute(interaction);
        break;
      case 'view':
        await this.viewHandler.execute(interaction);
        break;
      case 'edit':
        await this.editHandler.handleCommand(interaction);
        break;
      case 'delete':
        await this.deleteHandler.execute(interaction);
        break;
      default:
        this.logger.warn(`Unknown notes subcommand: ${subcommand}`);
        break;
    }
  }
}
