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

// Linguagem emocional — "quem você está se tornando" em vez de rótulos de performance.
export const IDENTITY_LEVELS: IdentityLevelDef[] = [
  {
    id: 'fugitivo',
    label: 'Aprendendo a me ouvir',
    short: 'Me ouvindo',
    description: 'Você está começando a notar quando se abandona. Esse olhar já é amor.',
    min: 0, max: 24,
    color: 'text-neon-blue',
    bg: 'bg-neon-blue/10 border-neon-blue/40',
  },
  {
    id: 'desperto',
    label: 'Me reconectando comigo',
    short: 'Me reconectando',
    description: 'Você está voltando pra si depois de muito tempo longe. Cada gesto conta.',
    min: 25, max: 49,
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10 border-neon-cyan/40',
  },
  {
    id: 'disciplinado',
    label: 'Alguém que se escolhe',
    short: 'Me escolhendo',
    description: 'Você está mantendo promessas pequenas com você. Sua palavra contigo vale.',
    min: 50, max: 74,
    color: 'text-primary',
    bg: 'bg-primary/15 border-primary/50',
  },
  {
    id: 'soberano',
    label: 'Alguém que se honra',
    short: 'Me honrando',
    description: 'Cuidar de si é quem você é agora. Você confia em você de novo.',
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
