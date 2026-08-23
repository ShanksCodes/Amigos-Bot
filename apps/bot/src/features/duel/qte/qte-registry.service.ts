import { Injectable, Logger } from '@nestjs/common';
import { QteStrategy } from './qte.interface.js';
import { ReactionTimeQte } from './reaction-time.qte.js';
import { WeakSpotQte } from './strategies/weak-spot.qte.js';
import { PrecisionStrikeQte } from './strategies/precision-strike.qte.js';
import { DefensiveParryQte } from './strategies/defensive-parry.qte.js';

@Injectable()
export class QteRegistryService {
  private readonly logger = new Logger(QteRegistryService.name);
  private readonly strategies = new Map<string, QteStrategy>();

  private readonly attackQtes: string[] = [];
  private readonly defendQtes: string[] = [];

  constructor(
    private readonly reactionTimeQte: ReactionTimeQte,
    private readonly weakSpotQte: WeakSpotQte,
    private readonly precisionStrikeQte: PrecisionStrikeQte,
    private readonly defensiveParryQte: DefensiveParryQte,
  ) {
    this.register(this.reactionTimeQte, ['attack']);
    this.register(this.weakSpotQte, ['attack']);
    this.register(this.precisionStrikeQte, ['attack']);
    this.register(this.defensiveParryQte, ['defend']);
  }

  private register(strategy: QteStrategy, actions: string[]): void {
    this.strategies.set(strategy.name, strategy);
    
    if (actions.includes('attack')) {
      this.attackQtes.push(strategy.name);
    }
    if (actions.includes('defend')) {
      this.defendQtes.push(strategy.name);
    }
  }

  getStrategy(name: string): QteStrategy | undefined {
    return this.strategies.get(name);
  }

  getRandomQte(actionType: string): QteStrategy {
    let pool: string[] = [];
    if (actionType === 'attack') pool = this.attackQtes;
    if (actionType === 'defend') pool = this.defendQtes;

    if (pool.length === 0) {
      // Fallback
      return this.reactionTimeQte;
    }

    const randomName = pool[Math.floor(Math.random() * pool.length)];
    return this.strategies.get(randomName) || this.reactionTimeQte;
  }
}
