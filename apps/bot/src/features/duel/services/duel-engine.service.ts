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
        // Sophisticated QTE-based probability scaling
        let currentMissChance = DUEL_CONSTANTS.MISS_CHANCE;
        let currentCritChance = DUEL_CONSTANTS.CRITICAL_CHANCE;
        
        if (action.qteResult) {
          if (action.qteResult.multiplier >= 1.3) {
            currentMissChance = 0; // Perfect QTE cannot miss
            currentCritChance = Math.min(0.5, currentCritChance * 2); // Double crit chance
          } else if (action.qteResult.multiplier <= 0.8) {
            currentMissChance = Math.min(0.5, currentMissChance * 3); // High miss chance
            currentCritChance = 0; // Failed QTE cannot crit
          }
        }

        const isMiss = Math.random() < currentMissChance;
        
        if (isMiss) {
          subType = 'miss';
          textCategory = 'attack.miss';
          mediaCategory = 'miss';
          newHp = defender.hp; 
        } else {
          // Tiered Base Damage Roll
          const { damage: baseDamage, tier } = this.rollBaseDamage(action.qteResult?.multiplier);
          damage = baseDamage;

          // QTE Multiplier directly scales final damage too
          if (action.qteResult) {
            damage = Math.floor(damage * action.qteResult.multiplier);
          }

          // Critical Hit
          const isCrit = Math.random() < currentCritChance;
          if (isCrit) {
            damage = Math.floor(damage * DUEL_CONSTANTS.ATTACK_CRITICAL_MULTIPLIER);
            subType = 'critical';
            textCategory = 'attack.critical';
            mediaCategory = 'attack.heavy_mega';
          } else if (tier === 'ONE_HIT_KO') {
            subType = 'critical';
            textCategory = 'attack.one_hit_ko';
            mediaCategory = 'attack.ko';
          } else if (tier === 'MEGA_STRIKE') {
            subType = 'strong';
            textCategory = 'attack.mega';
            mediaCategory = 'attack.heavy_mega';
          } else if (tier === 'HEAVY') {
            subType = 'strong';
            textCategory = 'attack.strong';
            mediaCategory = 'attack.heavy_mega';
          } else if (tier === 'GLANCE') {
            subType = 'weak';
            textCategory = 'attack.weak';
            mediaCategory = 'attack.glance';
          } else {
            // NORMAL or MEDIUM
            subType = 'normal';
            textCategory = tier === 'MEDIUM' ? 'attack.strong' : 'attack.normal';
            mediaCategory = 'attack.normal_med';
          }

          // Apply Defender's defense modifiers
          if (defender.isDefending) {
            let parryChance = DUEL_CONSTANTS.PARRY_CHANCE;
            // If the defender also had a QTE (from previous turn maybe, but we don't have that state easily without storing it). 
            // Wait, we DO have it because the defender takes a turn to 'defend', but their QTE result isn't passed here. 
            // It's fine, we will just use the attacker's QTE or base constants.
            
            const isParry = Math.random() < parryChance;
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
       mediaCategory = 'defeat';
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

  private rollBaseDamage(qteMultiplier?: number): { damage: number; tier: string } {
    let roll = Math.random();
    
    // Shift the roll slightly if QTE is very good or very bad
    if (qteMultiplier) {
      if (qteMultiplier >= 1.3) {
        roll = roll * 0.7; // Push roll towards lower indices (rarer, higher damage tiers)
      } else if (qteMultiplier <= 0.8) {
        roll = Math.min(1.0, roll + 0.3); // Push roll towards higher indices (weaker tiers like GLANCE)
      }
    }

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
