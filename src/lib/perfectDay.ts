// Perfect Day loot chest — rolls rewards when the player closes a day with
// every habit marked "done" (and none failed).

import { SHOP_THEMES, SHOP_FRAMES } from './shopCatalog';

export type LootRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface PerfectDayLoot {
  rarity: LootRarity;
  gold?: number;
  xp?: number;
  theme?: string;   // themeId granted
  frame?: string;   // frameId granted
  title: string;
  message: string;
}

function pick<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollPerfectDayLoot(
  ownedThemes: string[],
  ownedFrames: string[],
): PerfectDayLoot {
  const roll = Math.random();
  const unlockedTheme = pick(SHOP_THEMES.filter(t => t.cost > 0 && !ownedThemes.includes(t.id)));
  const unlockedFrame = pick(SHOP_FRAMES.filter(f => f.cost > 0 && !ownedFrames.includes(f.id)));

  // 3% legendary — moldura rara se sobrar, senão ouro épico
  if (roll < 0.03) {
    if (unlockedFrame) {
      return {
        rarity: 'legendary',
        frame: unlockedFrame.id,
        title: 'Baú Lendário',
        message: `Uma moldura rara emergiu: ${unlockedFrame.name}.`,
      };
    }
    return {
      rarity: 'legendary',
      gold: 800,
      xp: 200,
      title: 'Baú Lendário',
      message: 'Ouro e experiência épicos por um dia impecável.',
    };
  }

  // 12% rare — tema desbloqueado se sobrar, senão ouro grande
  if (roll < 0.15) {
    if (unlockedTheme) {
      return {
        rarity: 'rare',
        gold: 100,
        theme: unlockedTheme.id,
        title: 'Baú Raro',
        message: `Novo tema desbloqueado: ${unlockedTheme.name}.`,
      };
    }
    return {
      rarity: 'rare',
      gold: 400,
      xp: 80,
      title: 'Baú Raro',
      message: 'Um dia perfeito rende recompensa nobre.',
    };
  }

  // 25% uncommon
  if (roll < 0.40) {
    return {
      rarity: 'uncommon',
      gold: 200,
      xp: 40,
      title: 'Baú Superior',
      message: 'Sua consistência forjou recompensa acima da média.',
    };
  }

  // 60% common
  const goldPool = [60, 90, 120, 150];
  return {
    rarity: 'common',
    gold: pick(goldPool) ?? 80,
    title: 'Baú Comum',
    message: 'Todo dia perfeito conta. Guarde o ouro.',
  };
}

export function rarityStyle(r: LootRarity) {
  switch (r) {
    case 'legendary': return { text: 'text-gold', border: 'border-gold', glow: 'shadow-[0_0_40px_hsl(var(--gold)/0.6)]', bg: 'from-gold/20 to-background' };
    case 'rare':      return { text: 'text-neon-cyan', border: 'border-neon-cyan', glow: 'shadow-[0_0_30px_hsl(var(--neon-cyan)/0.5)]', bg: 'from-neon-cyan/20 to-background' };
    case 'uncommon':  return { text: 'text-neon-blue', border: 'border-neon-blue', glow: 'shadow-[0_0_25px_hsl(var(--neon-blue)/0.5)]', bg: 'from-neon-blue/15 to-background' };
    default:          return { text: 'text-primary', border: 'border-primary', glow: 'glow-purple', bg: 'from-primary/15 to-background' };
  }
}