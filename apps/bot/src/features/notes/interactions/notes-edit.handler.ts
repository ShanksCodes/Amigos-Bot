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
import { createEditNoteModal, createNoteViewComponents } from '../ui/notes.components.js';
import { createErrorEmbed, createNoteUpdatedEmbed } from '../ui/notes.embeds.js';

@Injectable()
export class NotesEditHandler implements DiscordComponent {
  private readonly logger = new Logger(NotesEditHandler.name);
  readonly customIdPrefix = NOTES_CONSTANTS.MODAL_CUSTOM_ID_EDIT_PREFIX;

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly notesService: NotesService,
  ) {
    this.componentRegistry.register(this);
  }

  /**
   * Handles the /notes edit command by fetching the note and presenting the prefilled edit modal.
   */
  async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const noteNumber = interaction.options.getInteger('number', true);

    try {
      const note = await this.notesService.getNoteByNumber(interaction.user.id, noteNumber);
      const modal = createEditNoteModal(note);
      await interaction.showModal(modal);
    } catch (error) {
      this.logger.error(
        `Failed to open edit modal for note #${noteNumber} for user ${interaction.user.id}: ${getErrorMessage(error)}`,
      );
      await interaction.reply({
        embeds: [createErrorEmbed(getErrorMessage(error))],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  /**
   * Handles submission of the note edit modal.
   */
  async execute(
    interaction: MessageComponentInteraction | ModalSubmitInteraction,
  ): Promise<void> {
    if (!interaction.isModalSubmit()) return;

    const noteId = interaction.customId.slice(this.customIdPrefix.length);

    try {
      const title = interaction.fields.getTextInputValue('title');
      const content = interaction.fields.getTextInputValue('content');

      const updatedNote = await this.notesService.updateNote(interaction.user.id, noteId, {
        title,
        content,
      });

      await interaction.reply({
        embeds: [createNoteUpdatedEmbed(updatedNote)],
        components: [createNoteViewComponents(updatedNote.id)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update note ${noteId} for user ${interaction.user.id}: ${getErrorMessage(error)}`,
      );
      await interaction.reply({
        embeds: [createErrorEmbed(getErrorMessage(error))],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
