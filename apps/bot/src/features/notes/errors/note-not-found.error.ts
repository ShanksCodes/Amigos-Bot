export class NoteNotFoundError extends Error {
  constructor(message = 'Note not found or you do not have permission to access it.') {
    super(message);
    this.name = 'NoteNotFoundError';
  }
}
