import { Injectable } from '@nestjs/common';
import { CombatResult, DuelActionPayload, DuelSession, DuelTurn } from '../domain/types.js';
import { DUEL_CONSTANTS } from '../domain/constants.js';

@Injectable()
export class DuelEngineService {
  /**
   * Processes a combat action and returns the result state.
   * Does NOT mutate the session directly; returns what the new state SHOULD be.
   */
  processAction(session: DuelSession, action: DuelActionPayload): CombatResult {
    const isChallenger = session.currentTurn === DuelTurn.CHALLENGER;
    const attacker = isChallenger ? session.challenger : session.opponent;
    const defender = isChallenger ? session.opponent : session.challenger;

    let damage = 0;
    let healing = 0;
    let newHp = attacker.hp;
    let textCategory = '';
    let mediaCategory = '';
    let subType: CombatResult['subType'] = 'normal';

    switch (action.type) {
      case 'heal': {
        if (attacker.hp >= DUEL_CONSTANTS.MAX_HP) {
          subType = 'max_heal';
          textCategory = 'heal.max';
          mediaCategory = 'heal';
        } else {
          healing =
            Math.floor(Math.random() * (DUEL_CONSTANTS.HEAL_MAX - DUEL_CONSTANTS.HEAL_MIN + 1)) +
            DUEL_CONSTANTS.HEAL_MIN;

          // Apply QTE multiplier if present
          if (action.qteResult) {
            healing = Math.floor(healing * action.qteResult.multiplier);
          }

          newHp = Math.min(DUEL_CONSTANTS.MAX_HP, attacker.hp + healing);
          subType = 'heal';
          textCategory = 'heal';
          mediaCategory = 'heal';
        }
        break;
      }
      case 'defend': {
        // Defending doesn't have an immediate output damage/heal, it just sets a flag for next turn.
        // The session manager handles setting `isDefending = true`.
        subType = 'block';
        textCategory = 'defend.block';
        mediaCategory = 'defend';
        break;
      }
      case 'attack': {
        const isMiss = Math.random() < DUEL_CONSTANTS.MISS_CHANCE;
        
        if (isMiss) {
          subType = 'miss';
          textCategory = 'attack.miss';
          mediaCategory = 'attack_miss';
          newHp = defender.hp; 
        } else {
          // Tiered Base Damage Roll
          const { damage: baseDamage, tier } = this.rollBaseDamage();
          damage = baseDamage;

          // QTE Multiplier
          if (action.qteResult) {
            damage = Math.floor(damage * action.qteResult.multiplier);
          }

          // Critical Hit
          const isCrit = Math.random() < DUEL_CONSTANTS.CRITICAL_CHANCE;
          if (isCrit) {
            damage = Math.floor(damage * DUEL_CONSTANTS.ATTACK_CRITICAL_MULTIPLIER);
            subType = 'critical';
            textCategory = 'attack.critical';
            mediaCategory = 'attack_critical';
          } else if (tier === 'ONE_HIT_KO') {
            subType = 'critical';
            textCategory = 'attack.one_hit_ko';
            mediaCategory = 'attack_critical';
          } else if (tier === 'MEGA_STRIKE') {
            subType = 'strong';
            textCategory = 'attack.mega';
            mediaCategory = 'attack';
          } else {
            // Determine flavor text based on damage dealt
            if (damage < 15) {
              subType = 'weak';
              textCategory = 'attack.weak';
            } else if (damage > 25) {
              subType = 'strong';
              textCategory = 'attack.strong';
            } else {
              subType = 'normal';
              textCategory = 'attack.normal';
            }
            mediaCategory = 'attack';
          }

          // Apply Defender's defense modifiers (if they defended last turn)
          if (defender.isDefending) {
            const isParry = Math.random() < DUEL_CONSTANTS.PARRY_CHANCE;
            if (isParry) {
              subType = 'parry';
              textCategory = 'defend.parry';
              mediaCategory = 'parry';
              
              // Reflected damage back to attacker!
              const reflectedDamage = Math.floor(damage * DUEL_CONSTANTS.PARRY_DAMAGE_MULTIPLIER);
              newHp = Math.max(0, attacker.hp - reflectedDamage); // Attacker takes damage
              damage = 0; // Defender takes none
            } else {
              subType = 'block';
              textCategory = 'defend.block';
              mediaCategory = 'defend';
              
              damage = Math.floor(damage * DUEL_CONSTANTS.BLOCK_DAMAGE_REDUCTION);
              newHp = Math.max(0, defender.hp - damage); // Defender takes reduced damage
            }
          } else {
             newHp = Math.max(0, defender.hp - damage); // Defender takes full damage
          }
        }
        break;
      }
    }

    const isGameOver = newHp <= 0;
    if (isGameOver && subType !== 'parry') {
       textCategory = 'knockout';
       mediaCategory = 'knockout';
    }

    return {
      type: action.type,
      subType,
      damage,
      healing,
      newHp,
      textCategory,
      mediaCategory,
      isGameOver,
    };
  }

  private rollBaseDamage(): { damage: number; tier: string } {
    const roll = Math.random();
    let cumulative = 0;

    for (const tier of DUEL_CONSTANTS.DAMAGE_TIERS) {
      cumulative += tier.chance;
      if (roll <= cumulative) {
        const damage =
          Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
        return { damage, tier: tier.name };
      }
    }

    return {
      damage: Math.floor(Math.random() * 11) + 10,
      tier: 'NORMAL',
    };
  }
}
