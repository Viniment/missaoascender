// Life RPG — Classes (desbloqueadas no Nível 5+)
import type { AttributeId } from './attributes';

export type ClassId = 'guerreiro' | 'sabio' | 'mistico' | 'diplomata' | 'monge' | 'curandeiro';

export interface ClassDef {
  id: ClassId;
  label: string;
  emoji: string;
  attribute: AttributeId;
  description: string;
  passive: string;
  color: string;
  glow: string;
}

export const CLASSES: ClassDef[] = [
  { id: 'guerreiro',  label: 'Guerreiro',  emoji: '⚔️', attribute: 'forca',      description: 'Aquele que age, treina, esforça-se.',           passive: '+15% XP em missões de Treino e Saúde.',          color: 'text-red-400',     glow: 'shadow-[0_0_30px_rgba(239,68,68,0.4)]' },
  { id: 'sabio',      label: 'Sábio',      emoji: '📜', attribute: 'mente',      description: 'Aquele que estuda, lê, pensa fundo.',           passive: '+15% XP em Estudo, Leitura e Trabalho.',         color: 'text-blue-400',    glow: 'shadow-[0_0_30px_rgba(96,165,250,0.4)]' },
  { id: 'mistico',    label: 'Místico',    emoji: '🔮', attribute: 'espirito',   description: 'Aquele que contempla, medita, escuta dentro.',  passive: '+25% XP em Trataka, Despertar TCC e Diário.',    color: 'text-violet-400',  glow: 'shadow-[0_0_30px_rgba(167,139,250,0.4)]' },
  { id: 'diplomata',  label: 'Diplomata',  emoji: '🤝', attribute: 'social',     description: 'Aquele que constrói pontes, conecta, escuta.', passive: '+20% XP em missões Sociais.',                    color: 'text-amber-400',   glow: 'shadow-[0_0_30px_rgba(251,191,36,0.4)]' },
  { id: 'monge',      label: 'Monge',      emoji: '🛡️', attribute: 'disciplina', description: 'Aquele que mantém a palavra consigo.',          passive: '+1 ouro extra por hábito feito + bônus streak.', color: 'text-emerald-400', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.4)]' },
  { id: 'curandeiro', label: 'Curandeiro', emoji: '❤️‍🔥', attribute: 'vitalidade', description: 'Aquele que cuida do corpo como templo.',        passive: '+20% XP em Saúde + recuperação suave de falhas.', color: 'text-pink-400',    glow: 'shadow-[0_0_30px_rgba(244,114,182,0.4)]' },
];

export const CLASS_MAP: Record<ClassId, ClassDef> = CLASSES.reduce((acc, c) => {
  acc[c.id] = c; return acc;
}, {} as Record<ClassId, ClassDef>);

export interface ChosenClass {
  id: ClassId;
  chosenAt: string;
}

import type { MissionCategory } from './gameStore';

// Multiplicador de XP aplicado em ganhos baseados em categoria/contexto
export function classXpMultiplier(classId: ClassId | undefined, ctx: { category?: MissionCategory; source?: 'habit' | 'trataka' | 'cbt' | 'journal' | 'mission' | 'ritual' }): number {
  if (!classId) return 1;
  const c = CLASS_MAP[classId];
  if (!c) return 1;
  if (c.id === 'guerreiro' && (ctx.category === 'Treino' || ctx.category === 'Saúde')) return 1.15;
  if (c.id === 'sabio' && (ctx.category === 'Estudo' || ctx.category === 'Leitura' || ctx.category === 'Trabalho')) return 1.15;
  if (c.id === 'mistico' && (ctx.source === 'trataka' || ctx.source === 'cbt' || ctx.source === 'journal')) return 1.25;
  if (c.id === 'diplomata' && ctx.category === 'Social') return 1.20;
  if (c.id === 'monge' && ctx.source === 'habit') return 1.10;
  if (c.id === 'curandeiro' && ctx.category === 'Saúde') return 1.20;
  return 1;
}
