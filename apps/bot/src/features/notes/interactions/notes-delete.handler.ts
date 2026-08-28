import { Injectable, Logger } from '@nestjs/common';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { getErrorMessage } from '#app/common';
import { NotesService } from '../notes.service.js';
import { createErrorEmbed, createNoteDeletedEmbed } from '../ui/notes.embeds.js';

@Injectable()
export class NotesDeleteHandler {
  private readonly logger = new Logger(NotesDeleteHandler.name);

  constructor(private readonly notesService: NotesService) {}

  /**
   * Executes the /notes delete command.
   */
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const noteNumber = interaction.options.getInteger('number', true);

    try {
      const { note, count, maxAllowed } = await this.notesService.deleteNoteByNumber(
        interaction.user.id,
        noteNumber,
      );

      await interaction.reply({
        embeds: [createNoteDeletedEmbed(note.title, count, maxAllowed)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete note #${noteNumber} for user ${interaction.user.id}: ${getErrorMessage(error)}`,
      );
      await interaction.reply({
        embeds: [createErrorEmbed(getErrorMessage(error))],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
