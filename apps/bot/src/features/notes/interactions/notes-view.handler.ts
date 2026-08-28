import { Injectable, Logger } from '@nestjs/common';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { getErrorMessage } from '#app/common';
import { NotesService } from '../notes.service.js';
import { createNoteViewComponents } from '../ui/notes.components.js';
import { createErrorEmbed, createNoteViewEmbed } from '../ui/notes.embeds.js';

@Injectable()
export class NotesViewHandler {
  private readonly logger = new Logger(NotesViewHandler.name);

  constructor(private readonly notesService: NotesService) {}

  /**
   * Executes the /notes view command.
   */
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const noteNumber = interaction.options.getInteger('number', true);

    try {
      const note = await this.notesService.getNoteByNumber(interaction.user.id, noteNumber);
      const embed = createNoteViewEmbed(note, noteNumber);
      const components = [createNoteViewComponents(note.id)];

      await interaction.reply({
        embeds: [embed],
        components,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      this.logger.error(
        `Failed to view note #${noteNumber} for user ${interaction.user.id}: ${getErrorMessage(error)}`,
      );
      await interaction.reply({
        embeds: [createErrorEmbed(getErrorMessage(error))],
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
