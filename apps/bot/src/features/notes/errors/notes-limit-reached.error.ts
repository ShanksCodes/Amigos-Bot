export class NotesLimitReachedError extends Error {
  constructor(
    public readonly currentCount: number,
    public readonly maxAllowed: number,
    message?: string,
  ) {
    super(
      message ??
        `You have reached your maximum limit of ${maxAllowed} notes (${currentCount}/${maxAllowed}). Delete an existing note to create a new one.`,
    );
    this.name = 'NotesLimitReachedError';
  }
}
