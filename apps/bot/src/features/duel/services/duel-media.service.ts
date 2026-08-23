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
    'attack.glance': [
      'https://media.discordapp.net/attachments/1541092200241307850/1541125449168592979/esubzAHjLdcIRJ3.gif?ex=6a8c746b&is=6a8b22eb&hm=f1aa041f717ad24550744ff278c673e6178880066b5e93f17f77697cd53510cb&=',
    ],
    'attack.normal_med': [
      'https://media.discordapp.net/attachments/1541092200241307850/1541125449168592979/esubzAHjLdcIRJ3.gif?ex=6a8c746b&is=6a8b22eb&hm=f1aa041f717ad24550744ff278c673e6178880066b5e93f17f77697cd53510cb&=',
    ],
    'attack.heavy_mega': [
      'https://media.discordapp.net/attachments/1541092200241307850/1541125449168592979/esubzAHjLdcIRJ3.gif?ex=6a8c746b&is=6a8b22eb&hm=f1aa041f717ad24550744ff278c673e6178880066b5e93f17f77697cd53510cb&=',
    ],
    'attack.ko': [],
    'parry': [],
    'defend': [],
    'heal': [],
    'miss': [],
    'victory': [],
    'defeat': [],
    'forfeit': [],
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
