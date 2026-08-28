import { Module } from '@nestjs/common';
import { DiscordModule } from '../../discord/discord.module.js';
import { NotesAddHandler } from './interactions/notes-add.handler.js';
import { NotesButtonHandler } from './interactions/notes-button.handler.js';
import { NotesDeleteHandler } from './interactions/notes-delete.handler.js';
import { NotesEditHandler } from './interactions/notes-edit.handler.js';
import { NotesListHandler } from './interactions/notes-list.handler.js';
import { NotesViewHandler } from './interactions/notes-view.handler.js';
import { NotesLimitService } from './notes-limit.service.js';
import { NotesRepository } from './notes.repository.js';
import { NotesService } from './notes.service.js';
import { NotesCommand } from './notes.command.js';

@Module({
  imports: [DiscordModule],
  providers: [
    NotesRepository,
    NotesLimitService,
    NotesService,
    NotesAddHandler,
    NotesButtonHandler,
    NotesListHandler,
    NotesViewHandler,
    NotesEditHandler,
    NotesDeleteHandler,
    NotesCommand,
  ],
  exports: [NotesService, NotesRepository],
})
export class NotesModule {}
