import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NOTES_CONSTANTS } from './notes.constants.js';

@Injectable()
export class NotesLimitService {
  private readonly defaultMaxNotes: number;

  constructor(private readonly configService: ConfigService) {
    const rawLimit = this.configService.get<string | number>('NOTES_MAX_PER_USER');
    const parsed =
      typeof rawLimit === 'number'
        ? rawLimit
        : parseInt(rawLimit ?? String(NOTES_CONSTANTS.DEFAULT_MAX_NOTES_PER_USER), 10);

    this.defaultMaxNotes =
      !isNaN(parsed) && parsed > 0 ? parsed : NOTES_CONSTANTS.DEFAULT_MAX_NOTES_PER_USER;
  }

  /**
   * Resolves the maximum allowed notes for a given user.
   * Isolates limit resolution to easily accommodate future tier/subscription checks.
   */
  async getMaxNotesForUser(userId: string): Promise<number> {
    // Current behavior resolves from environment configuration.
    // In the future, this can query user membership/tier or subscription status.
    return this.defaultMaxNotes;
  }
}
