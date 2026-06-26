// Life RPG — Atributos de Vida
// 6 stats que evoluem com toda ação do usuário.

import type { MissionCategory } from './gameStore';

export type AttributeId = 'forca' | 'mente' | 'espirito' | 'social' | 'disciplina' | 'vitalidade';

export interface AttributeDef {
  id: AttributeId;
  label: string;
  short: string;
  emoji: string;
  description: string;
  color: string;     // tailwind text class
  bg: string;        // tailwind bg class
  border: string;
}

export const ATTRIBUTES: AttributeDef[] = [
  { id: 'forca',       label: 'Força',       short: 'FOR', emoji: '⚔️', description: 'Exercício, esforço físico, ação concreta no mundo.', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/40' },
  { id: 'mente',       label: 'Mente',       short: 'MEN', emoji: '🧠', description: 'Estudo, leitura, foco profundo, aprendizado.',     color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/40' },
  { id: 'espirito',    label: 'Espírito',    short: 'ESP', emoji: '✨', description: 'Meditação, journaling, práticas contemplativas.',  color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/40' },
  { id: 'social',      label: 'Social',      short: 'SOC', emoji: '🤝', description: 'Conexões, conversas, vínculos, generosidade.',    color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/40' },
  { id: 'disciplina',  label: 'Disciplina',  short: 'DIS', emoji: '🛡️', description: 'Hábitos mantidos, promessas com você cumpridas.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40' },
  { id: 'vitalidade',  label: 'Vitalidade',  short: 'VIT', emoji: '❤️‍🔥', description: 'Sono, alimentação, água, autocuidado corporal.',  color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/40' },
];

export const ATTRIBUTE_MAP: Record<AttributeId, AttributeDef> = ATTRIBUTES.reduce((acc, a) => {
  acc[a.id] = a; return acc;
}, {} as Record<AttributeId, AttributeDef>);

export type AttributeState = { xp: number; level: number };
export type AttributesMap = Record<AttributeId, AttributeState>;

export const defaultAttributes: AttributesMap = {
  forca: { xp: 0, level: 1 },
  mente: { xp: 0, level: 1 },
  espirito: { xp: 0, level: 1 },
  social: { xp: 0, level: 1 },
  disciplina: { xp: 0, level: 1 },
  vitalidade: { xp: 0, level: 1 },
};

// Curva de XP por nível de atributo (até nível 100)
// Crescimento suave: nivel * 100 XP
export function xpForAttrLevel(level: number): number {
  return level * 100;
}

export function applyAttributeXp(state: AttributeState, gain: number): { state: AttributeState; leveledUp: boolean; newLevel: number } {
  let xp = state.xp + gain;
  let level = state.level;
  let leveledUp = false;
  while (xp >= xpForAttrLevel(level) && level < 100) {
    xp -= xpForAttrLevel(level);
    level++;
    leveledUp = true;
  }
  return { state: { xp, level }, leveledUp, newLevel: level };
}

// Mapeia categoria de missão → atributo principal
export function attributeForCategory(category?: MissionCategory): AttributeId {
  switch (category) {
    case 'Treino':       return 'forca';
    case 'Saúde':        return 'vitalidade';
    case 'Estudo':       return 'mente';
    case 'Leitura':      return 'mente';
    case 'Trabalho':     return 'mente';
    case 'Mental':       return 'mente';
    case 'Criatividade': return 'mente';
    case 'Espiritual':   return 'espirito';
    case 'Social':       return 'social';
    case 'Financeiro':   return 'disciplina';
    default:             return 'disciplina';
  }
}

export function totalAttributeLevel(attrs: AttributesMap | undefined): number {
  if (!attrs) return 6;
  return ATTRIBUTES.reduce((sum, a) => sum + (attrs[a.id]?.level || 1), 0);
}

export function dominantAttribute(attrs: AttributesMap | undefined): AttributeId {
  if (!attrs) return 'disciplina';
  let best: AttributeId = 'disciplina';
  let bestVal = -1;
  for (const a of ATTRIBUTES) {
    const s = attrs[a.id];
    const v = (s?.level || 1) * 1000 + (s?.xp || 0);
    if (v > bestVal) { bestVal = v; best = a.id; }
  }
  return best;
}
