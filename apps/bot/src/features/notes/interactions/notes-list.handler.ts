import { Injectable, Logger } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';
import { getErrorMessage } from '#app/common';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { NOTES_CONSTANTS } from '../notes.constants.js';
import { NotesService } from '../notes.service.js';
import { createNoteListComponents, createNoteViewComponents } from '../ui/notes.components.js';
import { createErrorEmbed, createNoteListEmbed, createNoteViewEmbed } from '../ui/notes.embeds.js';

@Injectable()
export class NotesListHandler implements DiscordComponent {
  private readonly logger = new Logger(NotesListHandler.name);
  readonly customIdPrefix = NOTES_CONSTANTS.COMPONENT_LIST_PREFIX;

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly notesService: NotesService,
  ) {
    this.componentRegistry.register(this);
  }

  /**
   * Renders a specific page of the notes list with dropdown and pagination buttons.
   */
  async renderListPage(interaction: any, page = 1): Promise<void> {
    try {
      const [paginated, limitCheck] = await Promise.all([
        this.notesService.listNotesPaginated(interaction.user.id, page),
        this.notesService.canUserAddNote(interaction.user.id),
      ]);

      const embed = createNoteListEmbed(
        paginated.notes,
        paginated.allNotesCount,
        paginated.maxAllowed,
        paginated.page,
        paginated.totalPages,
        paginated.startIndex,
      );

      const components = createNoteListComponents(
        paginated.notes,
        paginated.page,
        paginated.totalPages,
        limitCheck.canAdd,
        paginated.startIndex,
      );

      const options = {
        embeds: [embed],
        components,
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(options);
      } else if (interaction.isMessageComponent?.()) {
        await interaction.update(options);
      } else {
        await interaction.reply(options);
      }
    } catch (error) {
      this.logger.error(
        `Failed to render notes list for user ${interaction.user.id}: ${getErrorMessage(error)}`,
      );
      const errorEmbed = createErrorEmbed(getErrorMessage(error));
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed], components: [] });
      } else if (interaction.isMessageComponent?.()) {
        await interaction.update({ embeds: [errorEmbed], components: [] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      }
    }
  }

  /**
   * Handles component interactions matching 'notes:list:' (dropdown selection and page navigation).
   */
  async execute(
    interaction: MessageComponentInteraction | ModalSubmitInteraction | ChatInputCommandInteraction,
  ): Promise<void> {
    if (interaction.isChatInputCommand()) {
      await this.renderListPage(interaction, 1);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      const parts = interaction.customId.split(':');
      const page = parseInt(parts[3] ?? '1', 10);
      const noteId = interaction.values[0];

      try {
        const { note, noteNumber } = await this.notesService.getNoteWithNumber(
          interaction.user.id,
          noteId,
        );

        const embed = createNoteViewEmbed(note, noteNumber);
        const components = [createNoteViewComponents(note.id, page)];

        await interaction.update({
          embeds: [embed],
          components,
        });
      } catch (error) {
        this.logger.error(
          `Failed to display note ${noteId} from select menu: ${getErrorMessage(error)}`,
        );
        await interaction.update({
          embeds: [createErrorEmbed(getErrorMessage(error))],
          components: [],
        });
      }
      return;
    }

    if (interaction.isButton()) {
      const pageStr = interaction.customId.replace(`${this.customIdPrefix}page:`, '');
      const page = parseInt(pageStr, 10) || 1;
      await this.renderListPage(interaction, page);
    }
  }
}
