export enum DuelState {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  DECLINED = 'DECLINED',
  TIMEOUT = 'TIMEOUT',
  FORFEITED = 'FORFEITED',
}

export enum DuelTurn {
  CHALLENGER = 'CHALLENGER',
  OPPONENT = 'OPPONENT',
}

export interface PlayerState {
  id: string;
  hp: number;
  healsRemaining: number;
  isDefending: boolean;
}

export interface QteResult {
  multiplier: number; // 0 for fail, 1 for normal, >1 for perfect
  reactionTimeMs?: number;
  text?: string;
}

export interface DuelActionPayload {
  type: 'attack' | 'defend' | 'heal';
  qteResult?: QteResult;
}

export interface CombatResult {
  type: 'attack' | 'defend' | 'heal';
  subType: 'miss' | 'weak' | 'normal' | 'strong' | 'critical' | 'block' | 'parry' | 'heal' | 'max_heal';
  damage?: number;
  healing?: number;
  newHp: number;
  textCategory: string;
  mediaCategory: string;
  isGameOver: boolean;
}

export interface DuelSession {
  id: string;
  challenger: PlayerState;
  opponent: PlayerState;
  state: DuelState;
  currentTurn: DuelTurn;
  mode: string;
  startedAt: Date;
  lastActionAt: Date;
  winnerId?: string;
  forfeitedById?: string;
}
