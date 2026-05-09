// Níveis de Identidade — progressão paralela ao Rank, baseada em consistência comportamental.
// Lê IdentityState (stabilityLevel) + sinais de discipline streak para classificar quem o usuário
// está se tornando neste momento. Não armazenado: derivado.

import type { PlayerState } from './gameStore';

export type IdentityLevelId = 'fugitivo' | 'desperto' | 'disciplinado' | 'soberano';

export interface IdentityLevelDef {
  id: IdentityLevelId;
  label: string;
  short: string;
  description: string;
  min: number;
  max: number;
  color: string; // tailwind text class
  bg: string;    // tailwind bg class
}

export const IDENTITY_LEVELS: IdentityLevelDef[] = [
  {
    id: 'fugitivo',
    label: 'O que Foge',
    short: 'Fugitivo',
    description: 'Você está obedecendo o impulso. Cada fuga reforça quem você não quer ser.',
    min: 0, max: 24,
    color: 'text-destructive',
    bg: 'bg-destructive/15 border-destructive/40',
  },
  {
    id: 'desperto',
    label: 'O Desperto',
    short: 'Desperto',
    description: 'Você já vê a corrente. Agora é hora de quebrá-la com ação consistente.',
    min: 25, max: 49,
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10 border-neon-cyan/40',
  },
  {
    id: 'disciplinado',
    label: 'O Disciplinado',
    short: 'Disciplinado',
    description: 'Sua palavra começa a valer. Você age mesmo sem vontade — isso é poder real.',
    min: 50, max: 74,
    color: 'text-primary',
    bg: 'bg-primary/15 border-primary/50',
  },
  {
    id: 'soberano',
    label: 'O Soberano',
    short: 'Soberano',
    description: 'Você comanda a si mesmo. Procrastinar gera desconforto. Agir é quem você é.',
    min: 75, max: 100,
    color: 'text-gold',
    bg: 'bg-gold/15 border-gold/50',
  },
];

export interface IdentityLevelComputation {
  current: IdentityLevelDef;
  next?: IdentityLevelDef;
  stability: number;       // 0-100
  toNext: number;          // pontos até o próximo nível (0 se no topo)
  progressInLevel: number; // 0-1 dentro do nível atual
}

export function computeIdentityLevel(state: PlayerState): IdentityLevelComputation {
  const stability = state.identity?.stabilityLevel ?? 0;
  // Bônus leve por discipline streak (até +10) e penalidade por padrões de sabotagem ativos (até -10)
  const dsBonus = Math.min(10, Math.floor((state.disciplineStreak?.current ?? 0) / 3));
  const sabotagePenalty = Math.min(10, ((state.sabotagePatterns || []).filter(p => !p.resolved).length) * 3);
  const adjusted = Math.max(0, Math.min(100, stability + dsBonus - sabotagePenalty));

  const current = IDENTITY_LEVELS.find(l => adjusted >= l.min && adjusted <= l.max) || IDENTITY_LEVELS[0];
  const idx = IDENTITY_LEVELS.indexOf(current);
  const next = idx < IDENTITY_LEVELS.length - 1 ? IDENTITY_LEVELS[idx + 1] : undefined;

  const span = current.max - current.min || 1;
  const progressInLevel = Math.max(0, Math.min(1, (adjusted - current.min) / span));
  const toNext = next ? Math.max(0, next.min - adjusted) : 0;

  return { current, next, stability: adjusted, toNext, progressInLevel };
}

export function getIdentityLevelById(id: IdentityLevelId) {
  return IDENTITY_LEVELS.find(l => l.id === id) || IDENTITY_LEVELS[0];
}
