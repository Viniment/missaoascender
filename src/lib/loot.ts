// Life RPG — Sistema de Loot e Buffs
export type LootRarity = 'comum' | 'raro' | 'epico' | 'lendario';

export interface LootItem {
  id: string;
  name: string;
  emoji: string;
  rarity: LootRarity;
  description: string;
  buff?: { type: 'xp' | 'gold' | 'focus'; percent: number; durationMin: number };
  obtainedAt: string;
}

export interface ActiveBuff {
  id: string;
  itemName: string;
  type: 'xp' | 'gold' | 'focus';
  percent: number;
  startedAt: string;
  expiresAt: string;
}

export const RARITY_STYLES: Record<LootRarity, { color: string; bg: string; border: string; label: string; weight: number }> = {
  comum:    { color: 'text-slate-300',  bg: 'bg-slate-500/10',   border: 'border-slate-500/40',   label: 'Comum',    weight: 60 },
  raro:     { color: 'text-blue-300',   bg: 'bg-blue-500/15',    border: 'border-blue-500/50',    label: 'Raro',     weight: 25 },
  epico:    { color: 'text-violet-300', bg: 'bg-violet-500/15',  border: 'border-violet-500/50',  label: 'Épico',    weight: 12 },
  lendario: { color: 'text-amber-300',  bg: 'bg-amber-500/15',   border: 'border-amber-500/60',   label: 'Lendário', weight: 3 },
};

const LOOT_TABLE: Omit<LootItem, 'id' | 'obtainedAt'>[] = [
  // Comum
  { name: 'Pena do Cuidado', emoji: '🪶', rarity: 'comum', description: 'Um pequeno gesto seu virou símbolo.' },
  { name: 'Pedrinha Lisa', emoji: '⚪', rarity: 'comum', description: 'Lembrança de que o constante vence o intenso.' },
  { name: 'Folha Seca', emoji: '🍂', rarity: 'comum', description: 'Tudo que cai vira solo do que vem.' },
  // Raro + buff
  { name: 'Poção de Foco', emoji: '🧪', rarity: 'raro', description: '+20% XP por 2 horas.', buff: { type: 'xp', percent: 20, durationMin: 120 } },
  { name: 'Bolsa de Mercador', emoji: '💰', rarity: 'raro', description: '+30% ouro por 1 hora.', buff: { type: 'gold', percent: 30, durationMin: 60 } },
  { name: 'Cristal Sereno', emoji: '💎', rarity: 'raro', description: '+15% foco mental por 3 horas.', buff: { type: 'focus', percent: 15, durationMin: 180 } },
  // Épico
  { name: 'Amuleto do Despertar', emoji: '🌀', rarity: 'epico', description: '+50% XP por 1 hora.', buff: { type: 'xp', percent: 50, durationMin: 60 } },
  { name: 'Pena de Fênix', emoji: '🔥', rarity: 'epico', description: 'Restaura streak quebrada se usada em até 24h.' },
  // Lendário
  { name: 'Coroa do Soberano', emoji: '👑', rarity: 'lendario', description: '+100% XP por 30 min. Um aceno da sua versão mais alta.', buff: { type: 'xp', percent: 100, durationMin: 30 } },
];

export function rollLoot(luckBonus = 0): LootItem | null {
  // 35% chance de dropar algo
  if (Math.random() * 100 > 35 + luckBonus) return null;

  // Sortear raridade ponderada
  const totalWeight = Object.values(RARITY_STYLES).reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * totalWeight;
  let pickedRarity: LootRarity = 'comum';
  for (const [rarity, info] of Object.entries(RARITY_STYLES)) {
    if (roll < info.weight) { pickedRarity = rarity as LootRarity; break; }
    roll -= info.weight;
  }

  const pool = LOOT_TABLE.filter(i => i.rarity === pickedRarity);
  if (pool.length === 0) return null;
  const base = pool[Math.floor(Math.random() * pool.length)];

  const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

  return { ...base, id, obtainedAt: new Date().toISOString() };
}

export function isBuffActive(buff: ActiveBuff): boolean {
  return new Date(buff.expiresAt).getTime() > Date.now();
}

export function activeBuffMultiplier(buffs: ActiveBuff[] | undefined, type: 'xp' | 'gold'): number {
  if (!buffs || buffs.length === 0) return 1;
  let mult = 1;
  for (const b of buffs) {
    if (b.type === type && isBuffActive(b)) {
      mult *= 1 + b.percent / 100;
    }
  }
  return mult;
}
