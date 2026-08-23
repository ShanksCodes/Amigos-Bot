import { Injectable } from '@nestjs/common';

@Injectable()
export class DuelMediaService {
  private readonly TEXTS: Record<string, string[]> = {
    'attack.weak': ['landed a weak blow on', 'glanced', 'barely scratched'],
    'attack.normal': ['struck', 'hit', 'punched'],
    'attack.strong': ['smashed', 'crushed', 'landed a heavy blow on'],
    'attack.mega': ['unleashed an EXTREME strike on', 'demolished', 'landed a massive bone-crushing blow on'],
    'attack.one_hit_ko': ['landed a LEGENDARY ONE-HIT KNOCKOUT blow on', 'unleashed a mythical finishing strike on', 'COMPLETELY OBLITERATED'],
    'attack.critical': ['annihilated', 'devastated', 'landed a CRITICAL hit on'],
    'attack.miss': ['missed', 'swung wide against', 'failed to hit'],
    'defend.block': ['blocked the attack from', 'raised their guard against'],
    'defend.parry': ['parried the attack and countered', 'flawlessly deflected'],
    'heal': ['drank a potion', 'patched themselves up', 'used a healing spell'],
    'heal.max': ['tried to heal but is already at full health'],
    'low_health': ['is looking severely injured!', 'is on the brink of defeat!'],
    'knockout': ['has been knocked out!', 'was defeated!', 'has fallen!'],
    'victory': ['stands victorious!', 'is the ultimate champion!'],
  };

  private readonly GIFS: Record<string, string[]> = {
    'start': [],
    'attack': [],
    'attack_critical': [],
    'attack_miss': [],
    'defend': [],
    'parry': [],
    'heal': [],
    'knockout': [],
    'victory': [],
    'defeat': [],
  };

  getRandomText(category: string, defaultText: string = ''): string {
    const pool = this.TEXTS[category];
    if (!pool || pool.length === 0) return defaultText;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getRandomGif(category: string): string | null {
    const pool = this.GIFS[category];
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
