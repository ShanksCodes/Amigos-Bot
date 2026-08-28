import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ButtonInteraction,
  MessageComponentInteraction,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';
import { getErrorMessage } from '#app/common';
import { ComponentRegistryService } from '../../../discord/component-registry.service.js';
import { DiscordComponent } from '../../../discord/types/discord-component.interface.js';
import { NOTES_CONSTANTS } from '../notes.constants.js';
import { NotesService } from '../notes.service.js';
import { createAddNoteModal, createEditNoteModal } from '../ui/notes.components.js';
import { createErrorEmbed } from '../ui/notes.embeds.js';
import { NotesListHandler } from './notes-list.handler.js';

@Injectable()
export class NotesButtonHandler implements DiscordComponent {
  private readonly logger = new Logger(NotesButtonHandler.name);
  readonly customIdPrefix = NOTES_CONSTANTS.COMPONENT_BTN_PREFIX;

  constructor(
    private readonly componentRegistry: ComponentRegistryService,
    private readonly notesService: NotesService,
    @Inject(forwardRef(() => NotesListHandler))
    private readonly listHandler: NotesListHandler,
  ) {
    this.componentRegistry.register(this);
  }

  async execute(
    interaction: MessageComponentInteraction | ModalSubmitInteraction,
  ): Promise<void> {
    if (!interaction.isButton()) return;

    const action = interaction.customId.replace(this.customIdPrefix, '');
    const parts = action.split(':');
    const actionType = parts[0];

    try {
      if (actionType === 'add') {
        await this.handleAddButton(interaction);
      } else if (actionType === 'edit') {
        const noteId = parts[1];
        await this.handleEditButton(interaction, noteId);
      } else if (actionType === 'delete') {
        const noteId = parts[1];
        const page = parseInt(parts[2] ?? '1', 10);
        await this.handleDeleteButton(interaction, noteId, page);
      } else if (actionType === 'back') {
        const page = parseInt(parts[1] ?? '1', 10);
        await this.listHandler.renderListPage(interaction, page);
      }
    } catch (error) {
      this.logger.error(
        `Error executing notes button action '${action}': ${getErrorMessage(error)}`,
      );
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          embeds: [createErrorEmbed(getErrorMessage(error))],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          embeds: [createErrorEmbed(getErrorMessage(error))],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }

  private async handleAddButton(interaction: ButtonInteraction): Promise<void> {
    const { canAdd, currentCount, maxAllowed } = await this.notesService.canUserAddNote(
      interaction.user.id,
    );

    if (!canAdd) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            `You have reached your maximum limit of ${maxAllowed} notes (${currentCount}/${maxAllowed}). Delete an existing note to create a new one.`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = createAddNoteModal();
    await interaction.showModal(modal);
  }

  private async handleEditButton(
    interaction: ButtonInteraction,
    noteId: string,
  ): Promise<void> {
    const note = await this.notesService.getNote(interaction.user.id, noteId);
    const modal = createEditNoteModal(note);
    await interaction.showModal(modal);
  }

  private async handleDeleteButton(
    interaction: ButtonInteraction,
    noteId: string,
    page: number,
  ): Promise<void> {
    await this.notesService.deleteNote(interaction.user.id, noteId);
    // After deletion, re-render the list on the current page
    await this.listHandler.renderListPage(interaction, page);
  }
}
