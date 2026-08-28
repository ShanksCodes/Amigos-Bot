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
import { createAddNoteModal, createNoteViewComponents } from '../ui/notes.components.js';
import { createErrorEmbed, createNoteCreatedEmbed } from '../ui/notes.embeds.js';

@Injectable()
export class NotesAddHandler implements DiscordComponent {
  private readonly logger = new Logger(NotesAddHandler.name);
  readonly customIdPrefix = NOTES_CONSTANTS.MODAL_CUSTOM_ID_ADD;

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly notesService: NotesService,
  ) {
    this.componentRegistry.register(this);
  }

  /**
   * Handles the /notes add slash command by displaying the note creation modal.
   */
  async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const { canAdd, currentCount, maxAllowed } = await this.notesService.canUserAddNote(
      interaction.user.id,
    );

    if (!canAdd) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            `You have reached your maximum limit of ${maxAllowed} notes (${currentCount}/${maxAllowed}). Please delete a note using \`/notes delete\` before creating a new one.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = createAddNoteModal();
    await interaction.showModal(modal);
  }

  /**
   * Handles the submission of the note creation modal.
   */
  async execute(
    interaction: MessageComponentInteraction | ModalSubmitInteraction,
  ): Promise<void> {
    if (!interaction.isModalSubmit()) return;

    try {
      const title = interaction.fields.getTextInputValue('title');
      const content = interaction.fields.getTextInputValue('content');

      const createdNote = await this.notesService.createNote(interaction.user.id, {
        title,
        content,
      });

      const { count, maxAllowed } = await this.notesService.listNotes(interaction.user.id);

      await interaction.reply({
        embeds: [createNoteCreatedEmbed(createdNote, count, maxAllowed)],
        components: [createNoteViewComponents(createdNote.id)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle note add modal for user ${interaction.user.id}: ${getErrorMessage(error)}`,
      );
      await interaction.reply({
        embeds: [createErrorEmbed(getErrorMessage(error))],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
