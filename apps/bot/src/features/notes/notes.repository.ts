import { Injectable } from '@nestjs/common';
import { PrismaService } from '#app/database';
import { CreateNoteInput, UpdateNoteInput, UserNote } from './notes.types.js';

@Injectable()
export class NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get userNoteModel() {
    return (this.prisma as any).userNote;
  }

  /**
   * Creates a new note for the specified user.
   */
  async create(userId: string, data: CreateNoteInput): Promise<UserNote> {
    return this.userNoteModel.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
      },
    });
  }

  /**
   * Finds a note by ID, scoped strictly to the given user ID.
   */
  async findById(userId: string, noteId: string): Promise<UserNote | null> {
    return this.userNoteModel.findFirst({
      where: {
        id: noteId,
        userId,
      },
    });
  }

  /**
   * Finds all notes belonging to the specified user, ordered by creation date ascending.
   */
  async findAllByUserId(userId: string): Promise<UserNote[]> {
    return this.userNoteModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Searches notes belonging to the specified user by title matching a query string.
   */
  async searchByTitle(
    userId: string,
    query: string,
    limit = 25,
  ): Promise<UserNote[]> {
    return this.userNoteModel.findMany({
      where: {
        userId,
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Counts the total number of notes for the specified user.
   */
  async countByUserId(userId: string): Promise<number> {
    return this.userNoteModel.count({
      where: { userId },
    });
  }

  /**
   * Updates an existing note, strictly scoped to the specified user ID.
   */
  async update(
    userId: string,
    noteId: string,
    data: UpdateNoteInput,
  ): Promise<UserNote | null> {
    // Ensure note exists and belongs to the user
    const existing = await this.findById(userId, noteId);
    if (!existing) {
      return null;
    }

    return this.userNoteModel.update({
      where: { id: noteId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
      },
    });
  }

  /**
   * Deletes a note, strictly scoped to the specified user ID.
   */
  async delete(userId: string, noteId: string): Promise<UserNote | null> {
    const existing = await this.findById(userId, noteId);
    if (!existing) {
      return null;
    }

    return this.userNoteModel.delete({
      where: { id: noteId },
    });
  }
}
