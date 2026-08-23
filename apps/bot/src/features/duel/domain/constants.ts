export const DUEL_CONSTANTS = {
  MAX_HP: 100,
  MAX_HEALS: 2,
  CHALLENGE_TIMEOUT_MS: 60 * 1000, // 60 seconds to accept
  TURN_TIMEOUT_MS: 30 * 1000,      // 30 seconds per turn
  BERRY_REWARD: 50,
  
  // Damage ranges
  ATTACK_BASE_MIN: 10,
  ATTACK_BASE_MAX: 20,
  ATTACK_CRITICAL_MULTIPLIER: 1.5,
  
  // Hit probabilities
  CRITICAL_CHANCE: 0.15,
  MISS_CHANCE: 0.05,
  
  // Defend mechanics
  BLOCK_DAMAGE_REDUCTION: 0.5,
  PARRY_CHANCE: 0.2,
  PARRY_DAMAGE_MULTIPLIER: 0.5, // Reflected damage
  
  // Healing
  HEAL_MIN: 15,
  HEAL_MAX: 30,
};
