export const DUEL_CONSTANTS = {
  MAX_HP: 100,
  MAX_HEALS: 2,
  CHALLENGE_TIMEOUT_MS: 60 * 1000, // 60 seconds to accept
  TURN_TIMEOUT_MS: 30 * 1000,      // 30 seconds per turn
  BERRY_REWARD: 50,
  
  // Anti-abuse limits
  MAX_RANKED_MATCHES_PER_PAIR_DAILY: 3,
  INSTANT_FORFEIT_THRESHOLD_MS: 10 * 1000, // Instant forfeit (<10s or 0 turns) gives 0 berries
  
  // Base Damage Tiers (chances must sum to 1.0)
  DAMAGE_TIERS: [
    { name: 'ONE_HIT_KO', chance: 0.005, min: 100, max: 100 }, // 0.5% super rare instant knockout
    { name: 'MEGA_STRIKE', chance: 0.025, min: 52, max: 52 },   // 2.5% rare 52 damage
    { name: 'HEAVY', chance: 0.10, min: 32, max: 42 },          // 10% heavy roll (32 to 42)
    { name: 'MEDIUM', chance: 0.25, min: 24, max: 32 },         // 25% medium roll (24 to 32)
    { name: 'NORMAL', chance: 0.57, min: 13, max: 24 },         // 57% normal roll (13 to 24)
    { name: 'GLANCE', chance: 0.05, min: 0, max: 13 },           // 5% low damage roll (0 to 13)
  ],
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
