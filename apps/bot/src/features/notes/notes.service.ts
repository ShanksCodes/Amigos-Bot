import { Injectable, Logger } from '@nestjs/common';
import { DiscordIdentityService } from '../../discord/discord-identity.service.js';
import { NOTES_CONSTANTS } from './notes.constants.js';
import { NoteNotFoundError } from './errors/note-not-found.error.js';
import { NotesLimitReachedError } from './errors/notes-limit-reached.error.js';
import { NoteValidationError } from './errors/note-validation.error.js';
import { NotesLimitService } from './notes-limit.service.js';
import { NotesRepository } from './notes.repository.js';
import { CreateNoteInput, UpdateNoteInput, UserNote } from './notes.types.js';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly limitService: NotesLimitService,
    private readonly identityService: DiscordIdentityService,
  ) {}

  /**
   * Validates title and content length.
   */
  private validateInputs(title?: string, content?: string): void {
    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length < NOTES_CONSTANTS.TITLE_MIN_LENGTH) {
        throw new NoteValidationError('Note title cannot be empty.');
      }
      if (trimmedTitle.length > NOTES_CONSTANTS.TITLE_MAX_LENGTH) {
        throw new NoteValidationError(
          `Note title cannot exceed ${NOTES_CONSTANTS.TITLE_MAX_LENGTH} characters.`,
        );
      }
    }

    if (content !== undefined) {
      const trimmedContent = content.trim();
      if (trimmedContent.length < NOTES_CONSTANTS.CONTENT_MIN_LENGTH) {
        throw new NoteValidationError('Note content cannot be empty.');
      }
      if (trimmedContent.length > NOTES_CONSTANTS.CONTENT_MAX_LENGTH) {
        throw new NoteValidationError(
          `Note content cannot exceed ${NOTES_CONSTANTS.CONTENT_MAX_LENGTH} characters.`,
        );
      }
    }
  }

  /**
   * Checks if the user is allowed to add a new note under their limit.
   */
  async canUserAddNote(
    userId: string,
  ): Promise<{ canAdd: boolean; currentCount: number; maxAllowed: number }> {
    const [currentCount, maxAllowed] = await Promise.all([
      this.notesRepository.countByUserId(userId),
      this.limitService.getMaxNotesForUser(userId),
    ]);

    return {
      canAdd: currentCount < maxAllowed,
      currentCount,
      maxAllowed,
    };
  }

  /**
   * Creates a new private note for the user, enforcing input validation and user limit.
   */
  async createNote(userId: string, input: CreateNoteInput): Promise<UserNote> {
    const title = input.title.trim();
    const content = input.content.trim();

    this.validateInputs(title, content);

    // Enforce note limit inside the service
    const { canAdd, currentCount, maxAllowed } = await this.canUserAddNote(userId);
    if (!canAdd) {
      throw new NotesLimitReachedError(currentCount, maxAllowed);
    }

    // Ensure user identity exists in the database
    await this.identityService.syncUser({ id: userId });

    const createdNote = await this.notesRepository.create(userId, {
      title,
      content,
    });

    this.logger.log(`Created note ${createdNote.id} for user ${userId}`);
    return createdNote;
  }

  /**
   * Retrieves a note by ID, scoped strictly to the specified user.
   */
  async getNote(userId: string, noteId: string): Promise<UserNote> {
    const note = await this.notesRepository.findById(userId, noteId);
    if (!note) {
      throw new NoteNotFoundError();
    }
    return note;
  }

  /**
   * Retrieves a note by its 1-based index from the user's ordered list.
   */
  async getNoteByNumber(userId: string, noteNumber: number): Promise<UserNote> {
    const notes = await this.notesRepository.findAllByUserId(userId);
    if (notes.length === 0) {
      throw new NoteNotFoundError(
        'You do not have any notes yet. Use `/notes add` to create one.',
      );
    }

    const index = noteNumber - 1;
    if (index < 0 || index >= notes.length) {
      throw new NoteNotFoundError(
        `Note #${noteNumber} not found. You currently have ${notes.length} note${notes.length === 1 ? '' : 's'} (valid numbers: 1${notes.length > 1 ? `-${notes.length}` : ''}). Use \`/notes list\` to check your notes.`,
      );
    }

    return notes[index];
  }

  /**
   * Lists all notes for a user along with their current quota.
   */
  async listNotes(
    userId: string,
  ): Promise<{ notes: UserNote[]; count: number; maxAllowed: number }> {
    const [notes, maxAllowed] = await Promise.all([
      this.notesRepository.findAllByUserId(userId),
      this.limitService.getMaxNotesForUser(userId),
    ]);

    return {
      notes,
      count: notes.length,
      maxAllowed,
    };
  }

  /**
   * Lists notes for a user paginated, along with total counts and page metadata.
   */
  async listNotesPaginated(
    userId: string,
    page = 1,
    pageSize = NOTES_CONSTANTS.PAGE_SIZE,
  ): Promise<{
    notes: UserNote[];
    allNotesCount: number;
    maxAllowed: number;
    page: number;
    totalPages: number;
    startIndex: number;
  }> {
    const [allNotes, maxAllowed] = await Promise.all([
      this.notesRepository.findAllByUserId(userId),
      this.limitService.getMaxNotesForUser(userId),
    ]);

    const allNotesCount = allNotes.length;
    const totalPages = Math.max(1, Math.ceil(allNotesCount / pageSize));
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const notesOnPage = allNotes.slice(startIndex, startIndex + pageSize);

    return {
      notes: notesOnPage,
      allNotesCount,
      maxAllowed,
      page: currentPage,
      totalPages,
      startIndex,
    };
  }

  /**
   * Retrieves a note along with its 1-based index in the user's list.
   */
  async getNoteWithNumber(
    userId: string,
    noteId: string,
  ): Promise<{ note: UserNote; noteNumber: number }> {
    const allNotes = await this.notesRepository.findAllByUserId(userId);
    const index = allNotes.findIndex((n) => n.id === noteId);
    if (index === -1) {
      throw new NoteNotFoundError();
    }
    return {
      note: allNotes[index],
      noteNumber: index + 1,
    };
  }

  /**
   * Updates an existing note belonging to the user.
   */
  async updateNote(
    userId: string,
    noteId: string,
    input: UpdateNoteInput,
  ): Promise<UserNote> {
    const title = input.title?.trim();
    const content = input.content?.trim();

    this.validateInputs(title, content);

    const updatedNote = await this.notesRepository.update(userId, noteId, {
      title,
      content,
    });

    if (!updatedNote) {
      throw new NoteNotFoundError();
    }

    this.logger.log(`Updated note ${noteId} for user ${userId}`);
    return updatedNote;
  }

  /**
   * Deletes a note belonging to the user and returns updated quota.
   */
  async deleteNote(
    userId: string,
    noteId: string,
  ): Promise<{ note: UserNote; count: number; maxAllowed: number }> {
    const deletedNote = await this.notesRepository.delete(userId, noteId);
    if (!deletedNote) {
      throw new NoteNotFoundError();
    }

    const [count, maxAllowed] = await Promise.all([
      this.notesRepository.countByUserId(userId),
      this.limitService.getMaxNotesForUser(userId),
    ]);

    this.logger.log(`Deleted note ${noteId} for user ${userId}`);
    return {
      note: deletedNote,
      count,
      maxAllowed,
    };
  }

  /**
   * Deletes a note by its 1-based index from the user's ordered list.
   */
  async deleteNoteByNumber(
    userId: string,
    noteNumber: number,
  ): Promise<{ note: UserNote; count: number; maxAllowed: number }> {
    const note = await this.getNoteByNumber(userId, noteNumber);
    return this.deleteNote(userId, note.id);
  }

  /**
   * Searches notes by title for autocomplete suggestions (returns up to 25 items).
   */
  async searchNotesForAutocomplete(
    userId: string,
    query: string,
  ): Promise<Array<{ id: string; title: string }>> {
    const notes = await this.notesRepository.searchByTitle(
      userId,
      query.trim(),
      NOTES_CONSTANTS.AUTOCOMPLETE_MAX_RESULTS,
    );

    return notes.map((note) => ({
      id: note.id,
      title: note.title,
    }));
  }
}
