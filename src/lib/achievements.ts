import type { PlayerState } from './gameStore';

export type AchievementType = 'streak' | 'habit' | 'mission' | 'level' | 'discipline' | 'special';

export interface AchievementDef {
  id: string;
  type: AchievementType;
  label: string;
  value: number;
  rank: string;
  icon: string;
  check: (state: PlayerState) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

const RANK_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  E: { bg: 'from-gray-700 to-gray-800', border: 'border-gray-500', glow: '', text: 'text-gray-300' },
  D: { bg: 'from-blue-800 to-blue-900', border: 'border-blue-500', glow: 'shadow-blue-500/30', text: 'text-blue-300' },
  C: { bg: 'from-emerald-800 to-emerald-900', border: 'border-emerald-500', glow: 'shadow-emerald-500/30', text: 'text-emerald-300' },
  B: { bg: 'from-purple-800 to-purple-900', border: 'border-purple-500', glow: 'shadow-purple-500/30', text: 'text-purple-300' },
  A: { bg: 'from-red-800 to-red-900', border: 'border-red-500', glow: 'shadow-red-500/30', text: 'text-red-300' },
  S: { bg: 'from-yellow-700 to-amber-800', border: 'border-yellow-400', glow: 'shadow-yellow-400/40', text: 'text-yellow-300' },
  Monarca: { bg: 'from-gray-900 to-black', border: 'border-purple-400', glow: 'shadow-purple-500/50', text: 'text-purple-300' },
};

export function getRankStyle(rank: string) {
  return RANK_COLORS[rank] || RANK_COLORS.E;
}

// All achievement definitions
export const ACHIEVEMENTS: AchievementDef[] = [
  // Streak
  { id: 'streak-3', type: 'streak', label: '3 Dias de Consistência', value: 3, rank: 'E', icon: '🔥', check: s => s.streak >= 3 },
  { id: 'streak-7', type: 'streak', label: '7 Dias de Disciplina', value: 7, rank: 'D', icon: '🔥', check: s => s.streak >= 7 },
  { id: 'streak-15', type: 'streak', label: '15 Dias Imparável', value: 15, rank: 'C', icon: '🔥', check: s => s.streak >= 15 },
  { id: 'streak-30', type: 'streak', label: '30 Dias de Aço', value: 30, rank: 'B', icon: '🔥', check: s => s.streak >= 30 },
  { id: 'streak-60', type: 'streak', label: '60 Dias Lendário', value: 60, rank: 'A', icon: '🔥', check: s => s.streak >= 60 },
  { id: 'streak-100', type: 'streak', label: '100 Dias — Monarca', value: 100, rank: 'S', icon: '🔥', check: s => s.streak >= 100 },

  // Missions
  { id: 'mission-first', type: 'mission', label: 'Primeira Vitória', value: 1, rank: 'E', icon: '⚔️', check: s => s.missions.filter(m => m.status === 'Concluída').length >= 1 },
  { id: 'mission-5', type: 'mission', label: '5 Missões Concluídas', value: 5, rank: 'D', icon: '⚔️', check: s => s.missions.filter(m => m.status === 'Concluída').length >= 5 },
  { id: 'mission-10', type: 'mission', label: '10 Missões Concluídas', value: 10, rank: 'C', icon: '⚔️', check: s => s.missions.filter(m => m.status === 'Concluída').length >= 10 },
  { id: 'mission-25', type: 'mission', label: '25 Missões Concluídas', value: 25, rank: 'B', icon: '⚔️', check: s => s.missions.filter(m => m.status === 'Concluída').length >= 25 },
  { id: 'mission-50', type: 'mission', label: '50 Missões Concluídas', value: 50, rank: 'A', icon: '⚔️', check: s => s.missions.filter(m => m.status === 'Concluída').length >= 50 },
  { id: 'mission-hard', type: 'mission', label: 'Missão Difícil Concluída', value: 1, rank: 'C', icon: '⚔️', check: s => s.missions.some(m => m.status === 'Concluída' && m.difficulty === 'Difícil') },

  // Habits
  { id: 'habit-first', type: 'habit', label: 'Primeiro Hábito Criado', value: 1, rank: 'E', icon: '🧠', check: s => s.habits.length >= 1 },
  { id: 'habit-done-10', type: 'habit', label: '10 Dias de Hábito', value: 10, rank: 'D', icon: '🧠', check: s => s.habits.some(h => Object.values(h.history).filter(v => v === 'done').length >= 10) },
  { id: 'habit-done-30', type: 'habit', label: '30 Dias de Hábito', value: 30, rank: 'C', icon: '🧠', check: s => s.habits.some(h => Object.values(h.history).filter(v => v === 'done').length >= 30) },

  // Level / Rank
  { id: 'level-5', type: 'level', label: 'Nível 5 Alcançado', value: 5, rank: 'D', icon: '📈', check: s => s.level >= 5 || ['D','C','B','A','S','Monarca'].includes(s.rank) },
  { id: 'rank-D', type: 'level', label: 'Rank D Alcançado', value: 0, rank: 'D', icon: '📈', check: s => ['D','C','B','A','S','Monarca'].includes(s.rank) },
  { id: 'rank-C', type: 'level', label: 'Rank C Alcançado', value: 0, rank: 'C', icon: '📈', check: s => ['C','B','A','S','Monarca'].includes(s.rank) },
  { id: 'rank-B', type: 'level', label: 'Rank B Alcançado', value: 0, rank: 'B', icon: '📈', check: s => ['B','A','S','Monarca'].includes(s.rank) },
  { id: 'rank-A', type: 'level', label: 'Rank A Alcançado', value: 0, rank: 'A', icon: '📈', check: s => ['A','S','Monarca'].includes(s.rank) },
  { id: 'rank-S', type: 'level', label: 'Rank S Alcançado', value: 0, rank: 'S', icon: '📈', check: s => ['S','Monarca'].includes(s.rank) },
  { id: 'rank-Monarca', type: 'level', label: 'Monarca Ascendido', value: 0, rank: 'Monarca', icon: '👑', check: s => s.rank === 'Monarca' },

  // Discipline
  { id: 'protocol-done', type: 'discipline', label: 'Protocolo Concluído', value: 1, rank: 'D', icon: '💀', check: s => s.failureProtocols.some(fp => fp.status === 'Concluído') },
  { id: 'no-fail-7', type: 'discipline', label: '7 Dias Sem Falhar', value: 7, rank: 'C', icon: '💀', check: s => s.streak >= 7 && s.missedDays === 0 },

  // Special
  { id: 'awakening', type: 'special', label: 'Despertar Completo', value: 0, rank: 'E', icon: '👑', check: s => !!(s.awakening.become && s.awakening.reject && s.awakening.pain) },
  { id: 'journal-5', type: 'special', label: '5 Entradas no Diário', value: 5, rank: 'D', icon: '👑', check: s => s.journal.length >= 5 },
  { id: 'gold-500', type: 'special', label: '500 Gold Acumulado', value: 500, rank: 'C', icon: '👑', check: s => s.gold >= 500 },
];

export function checkNewAchievements(state: PlayerState, unlocked: UnlockedAchievement[]): AchievementDef[] {
  const unlockedIds = new Set(unlocked.map(u => u.id));
  return ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id) && a.check(state));
}
