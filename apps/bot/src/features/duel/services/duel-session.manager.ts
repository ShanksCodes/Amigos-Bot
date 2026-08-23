import { Injectable, Logger } from '@nestjs/common';
import { DuelSession, DuelState, DuelTurn } from '../domain/types.js';
import { DUEL_CONSTANTS } from '../domain/constants.js';

@Injectable()
export class DuelSessionManager {
  private readonly sessions = new Map<string, DuelSession>();
  private readonly timeouts = new Map<string, NodeJS.Timeout>();
  private readonly logger = new Logger(DuelSessionManager.name);

  createSession(id: string, challengerId: string, opponentId: string): DuelSession {
    const session: DuelSession = {
      id,
      challenger: { id: challengerId, hp: DUEL_CONSTANTS.MAX_HP, healsRemaining: DUEL_CONSTANTS.MAX_HEALS, isDefending: false },
      opponent: { id: opponentId, hp: DUEL_CONSTANTS.MAX_HP, healsRemaining: DUEL_CONSTANTS.MAX_HEALS, isDefending: false },
      state: DuelState.PENDING,
      currentTurn: DuelTurn.CHALLENGER,
      mode: 'Regular',
      startedAt: new Date(),
      lastActionAt: new Date(),
    };
    
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): DuelSession | undefined {
    return this.sessions.get(id);
  }

  isUserInActiveDuel(userId: string): boolean {
    for (const session of this.sessions.values()) {
      if (session.state === DuelState.PENDING || session.state === DuelState.ACTIVE) {
        if (session.challenger.id === userId || session.opponent.id === userId) {
          return true;
        }
      }
    }
    return false;
  }

  updateSession(id: string, updates: Partial<DuelSession>): DuelSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    Object.assign(session, updates, { lastActionAt: new Date() });
    return session;
  }

  removeSession(id: string): void {
    this.sessions.delete(id);
    this.clearTimeout(id);
  }

  scheduleTimeout(id: string, ms: number, callback: () => void): void {
    this.clearTimeout(id);
    const timeout = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, ms);
    this.timeouts.set(id, timeout);
  }

  clearTimeout(id: string): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }
}
