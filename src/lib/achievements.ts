import type { PlayerState } from './gameStore';

export type AchievementType = 'streak' | 'habit' | 'mission' | 'level' | 'discipline' | 'special' | 'self-love';

export interface AchievementDef {
  id: string;
  type: AchievementType;
  label: string;
  value: number;
  rank: string;
  icon: string;
  description: string;
  requirements: string[];
  check: (state: PlayerState) => boolean;
  progress: (state: PlayerState) => { current: number; target: number };
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

// Helper for completed missions count
const completedMissions = (s: PlayerState) => s.missions.filter(m => m.status === 'Concluída').length;
const hardMissions = (s: PlayerState) => s.missions.filter(m => m.status === 'Concluída' && m.difficulty === 'Difícil').length;
const maxHabitStreak = (s: PlayerState) => {
  return Math.max(0, ...s.habits.map(h => {
    const dates = Object.entries(h.history)
      .filter(([_, v]) => v === 'done')
      .map(([d]) => d)
      .sort();
    if (dates.length === 0) return 0;
    let max = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) { current++; max = Math.max(max, current); }
      else { current = 1; }
    }
    return max;
  }));
};
const protocolsDone = (s: PlayerState) => s.failureProtocols.filter(fp => fp.status === 'Concluído').length;
const RANKS_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'Monarca'];
const rankIdx = (r: string) => RANKS_ORDER.indexOf(r);

export const ACHIEVEMENTS: AchievementDef[] = [
  // ========== STREAK ==========
  { id: 'streak-3', type: 'streak', label: 'Faísca Acesa', value: 3, rank: 'E', icon: '🔥',
    description: 'Três dias seguidos de login. A fagulha do seu RPG real começou a queimar.',
    requirements: ['Manter streak de 3 dias consecutivos no app'],
    check: s => s.streak >= 3, progress: s => ({ current: Math.min(s.streak, 3), target: 3 }) },
  { id: 'streak-7', type: 'streak', label: 'Primeira Semana de Jogo', value: 7, rank: 'D', icon: '🗡️',
    description: 'Sete dias consecutivos no campo de batalha. Seu personagem ganhou ritmo.',
    requirements: ['Manter streak de 7 dias consecutivos'],
    check: s => s.streak >= 7, progress: s => ({ current: Math.min(s.streak, 7), target: 7 }) },
  { id: 'streak-15', type: 'streak', label: 'Caçador Consistente', value: 15, rank: 'C', icon: '⚔️',
    description: 'Quinze dias de XP diário. Você está virando um jogador sério da própria vida.',
    requirements: ['Manter streak de 15 dias consecutivos'],
    check: s => s.streak >= 15, progress: s => ({ current: Math.min(s.streak, 15), target: 15 }) },
  { id: 'streak-30', type: 'streak', label: 'Veterano de 30 Dias', value: 30, rank: 'B', icon: '🛡️',
    description: 'Um mês inteiro grindando. Esse build não é mais beta — é versão final.',
    requirements: ['Manter streak de 30 dias consecutivos'],
    check: s => s.streak >= 30, progress: s => ({ current: Math.min(s.streak, 30), target: 30 }) },
  { id: 'streak-60', type: 'streak', label: 'Bicampeão da Persistência', value: 60, rank: 'A', icon: '🏆',
    description: 'Sessenta dias de loop diário. Seu sistema de XP virou rotina sagrada.',
    requirements: ['Manter streak de 60 dias consecutivos'],
    check: s => s.streak >= 60, progress: s => ({ current: Math.min(s.streak, 60), target: 60 }) },
  { id: 'streak-100', type: 'streak', label: 'Lendário — 100 Dias', value: 100, rank: 'S', icon: '🌟',
    description: 'Cem dias seguidos. A maioria desinstalou no dia 5. Você virou outlier.',
    requirements: ['Manter streak de 100 dias consecutivos'],
    check: s => s.streak >= 100, progress: s => ({ current: Math.min(s.streak, 100), target: 100 }) },
  { id: 'streak-200', type: 'streak', label: 'Imortal da Disciplina', value: 200, rank: 'Monarca', icon: '👑',
    description: 'Duzentos dias. Você não joga o jogo — você É o jogo.',
    requirements: ['Manter streak de 200 dias consecutivos'],
    check: s => s.streak >= 200, progress: s => ({ current: Math.min(s.streak, 200), target: 200 }) },
  { id: 'streak-365', type: 'streak', label: 'Ano Sagrado', value: 365, rank: 'Monarca', icon: '👑',
    description: 'Um ano completo no RPG da vida real. O personagem do ano passado seria seu NPC.',
    requirements: ['Manter streak de 365 dias consecutivos'],
    check: s => s.streak >= 365, progress: s => ({ current: Math.min(s.streak, 365), target: 365 }) },

  // ========== MINI VITÓRIAS ==========
  { id: 'mission-first', type: 'mission', label: 'Primeira Quest Limpa', value: 1, rank: 'E', icon: '⚔️',
    description: 'Sua primeira mini vitória registrada. O log do herói começou.',
    requirements: ['Concluir 1 mini vitória de qualquer tipo'],
    check: s => completedMissions(s) >= 1, progress: s => ({ current: Math.min(completedMissions(s), 1), target: 1 }) },
  { id: 'mission-5', type: 'mission', label: 'Side Quest Master Jr.', value: 5, rank: 'D', icon: '🗡️',
    description: 'Cinco mini vitórias farmadas. O inventário de XP começa a pesar.',
    requirements: ['Concluir 5 mini vitórias no total'],
    check: s => completedMissions(s) >= 5, progress: s => ({ current: Math.min(completedMissions(s), 5), target: 5 }) },
  { id: 'mission-10', type: 'mission', label: 'Grinder Iniciante', value: 10, rank: 'C', icon: '⚔️',
    description: 'Dez mini vitórias batidas. Você descobriu como funciona o loop do jogo.',
    requirements: ['Concluir 10 mini vitórias no total'],
    check: s => completedMissions(s) >= 10, progress: s => ({ current: Math.min(completedMissions(s), 10), target: 10 }) },
  { id: 'mission-25', type: 'mission', label: 'Caçador de Quests', value: 25, rank: 'B', icon: '🏹',
    description: 'Vinte e cinco vitórias no log. Seu nome aparece nas estatísticas do servidor.',
    requirements: ['Concluir 25 mini vitórias no total'],
    check: s => completedMissions(s) >= 25, progress: s => ({ current: Math.min(completedMissions(s), 25), target: 25 }) },
  { id: 'mission-50', type: 'mission', label: 'Farmer de Elite', value: 50, rank: 'A', icon: '🛡️',
    description: 'Cinquenta vitórias acumuladas. Você dropa loot mítico no dia a dia.',
    requirements: ['Concluir 50 mini vitórias no total'],
    check: s => completedMissions(s) >= 50, progress: s => ({ current: Math.min(completedMissions(s), 50), target: 50 }) },
  { id: 'mission-100', type: 'mission', label: 'Lenda das 100 Quests', value: 100, rank: 'S', icon: '🌟',
    description: 'Cem vitórias registradas. Seu personagem é referência no clã.',
    requirements: ['Concluir 100 mini vitórias no total'],
    check: s => completedMissions(s) >= 100, progress: s => ({ current: Math.min(completedMissions(s), 100), target: 100 }) },
  { id: 'mission-hard', type: 'mission', label: 'Hard Mode Ativado', value: 1, rank: 'C', icon: '💀',
    description: 'Você bateu uma quest em "Difícil". Buff de XP triplo merecidíssimo.',
    requirements: ['Concluir 1 mini vitória com dificuldade "Difícil"'],
    check: s => hardMissions(s) >= 1, progress: s => ({ current: Math.min(hardMissions(s), 1), target: 1 }) },
  { id: 'mission-hard-5', type: 'mission', label: 'Boss Hunter Júnior', value: 5, rank: 'A', icon: '💀',
    description: 'Cinco quests Difíceis vencidas. Você farmou no modo nightmare.',
    requirements: ['Concluir 5 mini vitórias com dificuldade "Difícil"'],
    check: s => hardMissions(s) >= 5, progress: s => ({ current: Math.min(hardMissions(s), 5), target: 5 }) },
  { id: 'mission-hard-10', type: 'mission', label: 'Speedrunner do Difícil', value: 10, rank: 'S', icon: '💀',
    description: 'Dez quests Difíceis no histórico. NPCs te chamam de Senhor(a).',
    requirements: ['Concluir 10 mini vitórias com dificuldade "Difícil"'],
    check: s => hardMissions(s) >= 10, progress: s => ({ current: Math.min(hardMissions(s), 10), target: 10 }) },

  // ========== HÁBITOS — PASSIVAS ATIVAS ==========
  { id: 'habit-first', type: 'habit', label: 'Primeira Passiva Desbloqueada', value: 1, rank: 'E', icon: '✨',
    description: 'Você equipou seu primeiro hábito. Passivas dão buff todo dia que você loga.',
    requirements: ['Criar 1 hábito'],
    check: s => s.habits.length >= 1, progress: s => ({ current: Math.min(s.habits.length, 1), target: 1 }) },
  { id: 'habit-3', type: 'habit', label: 'Build com 3 Passivas', value: 3, rank: 'D', icon: '✨',
    description: 'Três hábitos equipados ao mesmo tempo. Sua build está tomando forma.',
    requirements: ['Ter 3 hábitos criados simultaneamente'],
    check: s => s.habits.length >= 3, progress: s => ({ current: Math.min(s.habits.length, 3), target: 3 }) },
  { id: 'habit-5', type: 'habit', label: 'Build Tier-S', value: 5, rank: 'C', icon: '🌟',
    description: 'Cinco passivas ativas. Seu personagem está scaling bonito.',
    requirements: ['Ter 5 hábitos criados simultaneamente'],
    check: s => s.habits.length >= 5, progress: s => ({ current: Math.min(s.habits.length, 5), target: 5 }) },
  { id: 'habit-done-5', type: 'habit', label: 'Streak de 5 num Hábito', value: 5, rank: 'E', icon: '🔥',
    description: 'Cinco dias seguidos numa passiva. O combo está vivo.',
    requirements: ['Completar 1 hábito por 5 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 5, progress: s => ({ current: Math.min(maxHabitStreak(s), 5), target: 5 }) },
  { id: 'habit-done-10', type: 'habit', label: 'Combo x10 num Hábito', value: 10, rank: 'D', icon: '🔥',
    description: 'Dez dias batendo a mesma passiva. Multiplicador subindo.',
    requirements: ['Completar 1 hábito por 10 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 10, progress: s => ({ current: Math.min(maxHabitStreak(s), 10), target: 10 }) },
  { id: 'habit-done-15', type: 'habit', label: 'Combo x15 — Streak Sólido', value: 15, rank: 'D', icon: '🔥',
    description: 'Quinze dias seguidos. A passiva virou padrão de gameplay.',
    requirements: ['Completar 1 hábito por 15 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 15, progress: s => ({ current: Math.min(maxHabitStreak(s), 15), target: 15 }) },
  { id: 'habit-done-20', type: 'habit', label: 'Combo x20 — Build Travada', value: 20, rank: 'C', icon: '⚡',
    description: 'Vinte dias seguidos. Esse hábito tá hardcoded no personagem.',
    requirements: ['Completar 1 hábito por 20 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 20, progress: s => ({ current: Math.min(maxHabitStreak(s), 20), target: 20 }) },
  { id: 'habit-done-25', type: 'habit', label: 'Combo x25 — Quase Lendário', value: 25, rank: 'C', icon: '⚡',
    description: 'Vinte e cinco dias. O sistema te respeita.',
    requirements: ['Completar 1 hábito por 25 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 25, progress: s => ({ current: Math.min(maxHabitStreak(s), 25), target: 25 }) },
  { id: 'habit-done-30', type: 'habit', label: 'Combo x30 — Mês Limpo', value: 30, rank: 'C', icon: '⚡',
    description: 'Trinta dias seguidos. Você desbloqueou skill point permanente.',
    requirements: ['Completar 1 hábito por 30 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 30, progress: s => ({ current: Math.min(maxHabitStreak(s), 30), target: 30 }) },
  { id: 'habit-done-60', type: 'habit', label: 'Combo x60 — Buff Permanente', value: 60, rank: 'B', icon: '🛡️',
    description: 'Sessenta dias. Esse hábito virou stat base do seu char.',
    requirements: ['Completar 1 hábito por 60 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 60, progress: s => ({ current: Math.min(maxHabitStreak(s), 60), target: 60 }) },
  { id: 'habit-done-100', type: 'habit', label: 'Combo x100 — Lenda Viva', value: 100, rank: 'A', icon: '🏆',
    description: 'Cem dias seguidos numa passiva. Você quebrou o jogo.',
    requirements: ['Completar 1 hábito por 100 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 100, progress: s => ({ current: Math.min(maxHabitStreak(s), 100), target: 100 }) },
  { id: 'habit-done-200', type: 'habit', label: 'Combo x200 — Mítico', value: 200, rank: 'S', icon: '👑',
    description: 'Duzentos dias na mesma skill. Você passou de jogador pra desenvolvedor da sua vida.',
    requirements: ['Completar 1 hábito por 200 dias seguidos sem falhar'],
    check: s => maxHabitStreak(s) >= 200, progress: s => ({ current: Math.min(maxHabitStreak(s), 200), target: 200 }) },

  // ========== LEVEL / RANK ==========
  { id: 'level-e3', type: 'level', label: 'Tutorial Concluído', value: 3, rank: 'E', icon: '🌱',
    description: 'Nível 3 no Rank E. Você passou da intro e entendeu como funciona a UI.',
    requirements: ['Alcançar Nível 3 no Rank E'],
    check: s => (s.rank === 'E' && s.level >= 3) || rankIdx(s.rank) > 0, progress: s => ({ current: rankIdx(s.rank) > 0 ? 3 : Math.min(s.level, 3), target: 3 }) },
  { id: 'level-e5', type: 'level', label: 'Pronto para o Patch 1', value: 5, rank: 'E', icon: '🌱',
    description: 'Nível 5 atingido. Sua build inicial está sólida — partiu Rank D.',
    requirements: ['Alcançar Nível 5 no Rank E'],
    check: s => rankIdx(s.rank) >= 1, progress: s => ({ current: rankIdx(s.rank) >= 1 ? 5 : Math.min(s.level, 5), target: 5 }) },
  { id: 'rank-D', type: 'level', label: 'Rank D — Aventureiro', value: 0, rank: 'D', icon: '🗡️',
    description: 'Você subiu de rank. O sistema agora libera quests mais sérias.',
    requirements: ['Alcançar o Rank D'],
    check: s => rankIdx(s.rank) >= 1, progress: s => ({ current: rankIdx(s.rank) >= 1 ? 1 : 0, target: 1 }) },
  { id: 'rank-C', type: 'level', label: 'Rank C — Caçador', value: 0, rank: 'C', icon: '⚔️',
    description: 'Status de Caçador. O mundo abriu áreas com loot melhor.',
    requirements: ['Alcançar o Rank C'],
    check: s => rankIdx(s.rank) >= 2, progress: s => ({ current: rankIdx(s.rank) >= 2 ? 1 : 0, target: 1 }) },
  { id: 'rank-B', type: 'level', label: 'Rank B — Veterano', value: 0, rank: 'B', icon: '🛡️',
    description: 'Veterano confirmado. Bosses de elite começaram a notar você.',
    requirements: ['Alcançar o Rank B'],
    check: s => rankIdx(s.rank) >= 3, progress: s => ({ current: rankIdx(s.rank) >= 3 ? 1 : 0, target: 1 }) },
  { id: 'level-b3', type: 'level', label: 'Veterano Estabilizado', value: 3, rank: 'B', icon: '🛡️',
    description: 'Rank B nível 3. Você sabe seu kit de cor — gameplay no automático.',
    requirements: ['Alcançar Nível 3 no Rank B'],
    check: s => (s.rank === 'B' && s.level >= 3) || rankIdx(s.rank) > 3, progress: s => ({ current: rankIdx(s.rank) > 3 ? 3 : s.rank === 'B' ? Math.min(s.level, 3) : 0, target: 3 }) },
  { id: 'rank-A', type: 'level', label: 'Rank A — Cavaleiro', value: 0, rank: 'A', icon: '🏆',
    description: 'Rank A desbloqueado. Você está no top tier do servidor.',
    requirements: ['Alcançar o Rank A'],
    check: s => rankIdx(s.rank) >= 4, progress: s => ({ current: rankIdx(s.rank) >= 4 ? 1 : 0, target: 1 }) },
  { id: 'rank-S', type: 'level', label: 'Rank S — Lendário', value: 0, rank: 'S', icon: '🌟',
    description: 'Status S. Devs colocaram seu nome no changelog.',
    requirements: ['Alcançar o Rank S'],
    check: s => rankIdx(s.rank) >= 5, progress: s => ({ current: rankIdx(s.rank) >= 5 ? 1 : 0, target: 1 }) },
  { id: 'level-s5', type: 'level', label: 'S5 — Pré-endgame', value: 5, rank: 'S', icon: '🌟',
    description: 'Você está a um passo do endgame. Forja Monarca te aguarda.',
    requirements: ['Alcançar Nível 5 no Rank S'],
    check: s => (s.rank === 'S' && s.level >= 5) || s.rank === 'Monarca', progress: s => ({ current: s.rank === 'Monarca' ? 5 : s.rank === 'S' ? Math.min(s.level, 5) : 0, target: 5 }) },
  { id: 'rank-Monarca', type: 'level', label: 'Rank Monarca — Endgame', value: 0, rank: 'Monarca', icon: '👑',
    description: 'Endgame. Você é o NPC mítico do seu próprio servidor.',
    requirements: ['Alcançar o Rank Monarca'],
    check: s => s.rank === 'Monarca', progress: s => ({ current: s.rank === 'Monarca' ? 1 : 0, target: 1 }) },
  { id: 'level-m5', type: 'level', label: 'Monarca N5 — World Boss', value: 5, rank: 'Monarca', icon: '👑',
    description: 'Nível 5 do Rank Monarca. Você virou world boss da própria vida.',
    requirements: ['Alcançar Nível 5 no Rank Monarca'],
    check: s => s.rank === 'Monarca' && s.level >= 5, progress: s => ({ current: s.rank === 'Monarca' ? Math.min(s.level, 5) : 0, target: 5 }) },

  // ========== DISCIPLINE ==========
  { id: 'protocol-done', type: 'discipline', label: 'Respawn Confirmado', value: 1, rank: 'D', icon: '🕊️',
    description: 'Você morreu, deu respawn e voltou pro grind. Game design clássico.',
    requirements: ['Concluir 1 Protocolo de Falha dentro do prazo'],
    check: s => protocolsDone(s) >= 1, progress: s => ({ current: Math.min(protocolsDone(s), 1), target: 1 }) },
  { id: 'protocol-3', type: 'discipline', label: 'Triple Respawn', value: 3, rank: 'B', icon: '🕊️',
    description: 'Três wipes, três retornos. Sua barra de resiliência tá no max.',
    requirements: ['Concluir 3 Protocolos de Falha'],
    check: s => protocolsDone(s) >= 3, progress: s => ({ current: Math.min(protocolsDone(s), 3), target: 3 }) },
  { id: 'protocol-10', type: 'discipline', label: 'Phoenix Mode', value: 10, rank: 'A', icon: '🕊️',
    description: 'Dez retornos pós-derrota. Você dropou o achievement raro "Insistência".',
    requirements: ['Concluir 10 Protocolos de Falha'],
    check: s => protocolsDone(s) >= 10, progress: s => ({ current: Math.min(protocolsDone(s), 10), target: 10 }) },
  { id: 'no-fail-7', type: 'discipline', label: 'No-Death Run 7d', value: 7, rank: 'C', icon: '🤍',
    description: 'Sete dias sem perder run. HP no max, sem game over.',
    requirements: ['Manter streak de 7 dias', 'Nenhum dia perdido'],
    check: s => s.streak >= 7 && s.missedDays === 0, progress: s => ({ current: Math.min(s.streak, 7), target: 7 }) },
  { id: 'no-fail-30', type: 'discipline', label: 'No-Death Run 30d', value: 30, rank: 'A', icon: '🤍',
    description: 'Mês inteiro sem morrer. Speedrun decente de virar outra pessoa.',
    requirements: ['Manter streak de 30 dias', 'Nenhum dia perdido'],
    check: s => s.streak >= 30 && s.missedDays === 0, progress: s => ({ current: Math.min(s.streak, 30), target: 30 }) },

  // ========== SPECIAL ==========
  { id: 'awakening', type: 'special', label: 'Lore do Personagem Escrita', value: 0, rank: 'E', icon: '📜',
    description: 'Você preencheu a backstory do herói: objetivo, anti-objetivo e ferida central. Lore canônica.',
    requirements: ['Preencher "O que quero me tornar"', 'Preencher "O que rejeito"', 'Preencher "Minha dor"'],
    check: s => !!(s.awakening.become && s.awakening.reject && s.awakening.pain),
    progress: s => ({ current: [s.awakening.become, s.awakening.reject, s.awakening.pain].filter(Boolean).length, target: 3 }) },
  { id: 'journal-1', type: 'special', label: 'Save Log Iniciado', value: 1, rank: 'E', icon: '📓',
    description: 'Primeira entrada no diário. O save log do RPG da sua vida começou.',
    requirements: ['Criar 1 entrada no diário'],
    check: s => s.journal.length >= 1, progress: s => ({ current: Math.min(s.journal.length, 1), target: 1 }) },
  { id: 'journal-5', type: 'special', label: '5 Saves no Diário', value: 5, rank: 'D', icon: '📓',
    description: 'Cinco entradas. Seu progresso tá sendo logado direitinho.',
    requirements: ['Criar 5 entradas no diário'],
    check: s => s.journal.length >= 5, progress: s => ({ current: Math.min(s.journal.length, 5), target: 5 }) },
  { id: 'journal-20', type: 'special', label: '20 Saves — Patch Notes Pessoais', value: 20, rank: 'C', icon: '🪞',
    description: 'Vinte entradas. Dá pra ler suas patch notes e ver o que mudou em você.',
    requirements: ['Criar 20 entradas no diário'],
    check: s => s.journal.length >= 20, progress: s => ({ current: Math.min(s.journal.length, 20), target: 20 }) },
  { id: 'journal-50', type: 'special', label: '50 Saves — Lore Robusta', value: 50, rank: 'B', icon: '🪞',
    description: 'Cinquenta entradas. Sua lore tem mais arco que muita campanha de RPG.',
    requirements: ['Criar 50 entradas no diário'],
    check: s => s.journal.length >= 50, progress: s => ({ current: Math.min(s.journal.length, 50), target: 50 }) },
  { id: 'journal-100', type: 'special', label: '100 Saves — Game Master Interno', value: 100, rank: 'A', icon: '💜',
    description: 'Cem entradas. Você virou o GM da sua própria campanha.',
    requirements: ['Criar 100 entradas no diário'],
    check: s => s.journal.length >= 100, progress: s => ({ current: Math.min(s.journal.length, 100), target: 100 }) },
  { id: 'gold-100', type: 'special', label: 'Primeiras 100 Moedas', value: 100, rank: 'E', icon: '💰',
    description: 'Cem moedas no inventário. Já dá pra comprar uma poção decente na loja.',
    requirements: ['Acumular 100 Gold'],
    check: s => s.gold >= 100, progress: s => ({ current: Math.min(s.gold, 100), target: 100 }) },
  { id: 'gold-500', type: 'special', label: 'Cofrinho de 500', value: 500, rank: 'C', icon: '💰',
    description: 'Meio milhar de ouro acumulado. Você farma melhor que muito player.',
    requirements: ['Acumular 500 Gold'],
    check: s => s.gold >= 500, progress: s => ({ current: Math.min(s.gold, 500), target: 500 }) },
  { id: 'gold-2000', type: 'special', label: 'Mochila Cheia (2k)', value: 2000, rank: 'A', icon: '💰',
    description: 'Duas mil moedas. Cuidado pra não ultrapassar o weight limit.',
    requirements: ['Acumular 2000 Gold'],
    check: s => s.gold >= 2000, progress: s => ({ current: Math.min(s.gold, 2000), target: 2000 }) },
  { id: 'gold-5000', type: 'special', label: 'Baú do Tesouro (5k)', value: 5000, rank: 'S', icon: '💰',
    description: 'Cinco mil moedas. Você poderia comprar uma cidade inteira de NPCs.',
    requirements: ['Acumular 5000 Gold'],
    check: s => s.gold >= 5000, progress: s => ({ current: Math.min(s.gold, 5000), target: 5000 }) },
  { id: 'challenge-1', type: 'special', label: 'Quest Épica Aceita', value: 1, rank: 'E', icon: '🎯',
    description: 'Você aceitou uma quest épica. Bem-vindo à dificuldade de verdade.',
    requirements: ['Criar 1 desafio'],
    check: s => s.challenges.length >= 1, progress: s => ({ current: Math.min(s.challenges.length, 1), target: 1 }) },
  { id: 'reward-1', type: 'special', label: 'Primeiro Loot Resgatado', value: 1, rank: 'E', icon: '🎁',
    description: 'Você abriu o primeiro baú de recompensa. O ciclo de loot começou.',
    requirements: ['Resgatar 1 recompensa na loja'],
    check: s => s.rewards.filter(r => r.redeemed).length >= 1, progress: s => ({ current: Math.min(s.rewards.filter(r => r.redeemed).length, 1), target: 1 }) },
  { id: 'reward-5', type: 'special', label: '5 Loots Resgatados', value: 5, rank: 'C', icon: '🎁',
    description: 'Cinco itens dropados da loja. O farmer virou consumidor consciente.',
    requirements: ['Resgatar 5 recompensas na loja'],
    check: s => s.rewards.filter(r => r.redeemed).length >= 5, progress: s => ({ current: Math.min(s.rewards.filter(r => r.redeemed).length, 5), target: 5 }) },

  // ========== NEW: HABITS ==========
  { id: 'habits-10', type: 'habit', label: 'Skill Tree Completa (10 Passivas)', value: 10, rank: 'B', icon: '🌟',
    description: 'Dez passivas ativas simultâneas. Sua árvore de skills tá full build.',
    requirements: ['Ter 10 hábitos criados simultaneamente'],
    check: s => s.habits.length >= 10, progress: s => ({ current: Math.min(s.habits.length, 10), target: 10 }) },
  { id: 'habit-perfect-week', type: 'habit', label: 'Semana Perfeita — 7 Dias 100%', value: 7, rank: 'C', icon: '⚡',
    description: 'Sete dias seguidos batendo 100% de todos os hábitos. Run perfeita.',
    requirements: ['Concluir 100% dos hábitos por 7 dias seguidos'],
    check: s => {
      if (s.habits.length === 0) return false;
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const allDone = s.habits.every(h => h.history[key] === 'done');
        if (allDone) { streak++; if (streak >= 7) return true; } else break;
      }
      return false;
    },
    progress: s => {
      if (s.habits.length === 0) return { current: 0, target: 7 };
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const allDone = s.habits.every(h => h.history[key] === 'done');
        if (allDone) streak++; else break;
      }
      return { current: Math.min(streak, 7), target: 7 };
    } },
  { id: 'habit-perfect-month', type: 'habit', label: 'Mês Perfeito — 30 Dias 100%', value: 30, rank: 'A', icon: '🏆',
    description: 'Trinta dias batendo 100% das passivas. World record local.',
    requirements: ['Concluir 100% dos hábitos por 30 dias seguidos'],
    check: s => {
      if (s.habits.length === 0) return false;
      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const allDone = s.habits.every(h => h.history[key] === 'done');
        if (allDone) { streak++; if (streak >= 30) return true; } else break;
      }
      return false;
    },
    progress: s => {
      if (s.habits.length === 0) return { current: 0, target: 30 };
      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const allDone = s.habits.every(h => h.history[key] === 'done');
        if (allDone) streak++; else break;
      }
      return { current: Math.min(streak, 30), target: 30 };
    } },

  // ========== NEW: MINI VITÓRIAS ==========
  { id: 'mission-200', type: 'mission', label: '200 Quests no Histórico', value: 200, rank: 'Monarca', icon: '👑',
    description: 'Duzentas mini vitórias batidas. Você é hall of fame.',
    requirements: ['Concluir 200 missões no total'],
    check: s => completedMissions(s) >= 200, progress: s => ({ current: Math.min(completedMissions(s), 200), target: 200 }) },
  { id: 'mission-day-5', type: 'mission', label: 'Combo Diário x5', value: 5, rank: 'C', icon: '⚔️',
    description: 'Cinco mini vitórias no mesmo dia. Esse dia rendeu loot triplo.',
    requirements: ['Concluir 5 missões em um único dia'],
    check: s => {
      const counts: Record<string, number> = {};
      s.missions.forEach(m => {
        if (m.completedAt) {
          const d = m.completedAt.slice(0, 10);
          counts[d] = (counts[d] || 0) + 1;
        }
        (m.completionHistory || []).forEach(h => {
          if (!h.failed) {
            const d = h.date.slice(0, 10);
            counts[d] = (counts[d] || 0) + 1;
          }
        });
      });
      return Object.values(counts).some(c => c >= 5);
    },
    progress: s => {
      const counts: Record<string, number> = {};
      s.missions.forEach(m => {
        if (m.completedAt) { const d = m.completedAt.slice(0, 10); counts[d] = (counts[d] || 0) + 1; }
        (m.completionHistory || []).forEach(h => { if (!h.failed) { const d = h.date.slice(0, 10); counts[d] = (counts[d] || 0) + 1; } });
      });
      return { current: Math.min(Math.max(0, ...Object.values(counts)), 5), target: 5 };
    } },
  { id: 'mission-day-10', type: 'mission', label: 'Raid Diária x10', value: 10, rank: 'B', icon: '🔥',
    description: 'Dez vitórias num único dia. Esse dia foi uma raid solo.',
    requirements: ['Concluir 10 missões em um único dia'],
    check: s => {
      const counts: Record<string, number> = {};
      s.missions.forEach(m => {
        if (m.completedAt) { const d = m.completedAt.slice(0, 10); counts[d] = (counts[d] || 0) + 1; }
        (m.completionHistory || []).forEach(h => { if (!h.failed) { const d = h.date.slice(0, 10); counts[d] = (counts[d] || 0) + 1; } });
      });
      return Object.values(counts).some(c => c >= 10);
    },
    progress: s => {
      const counts: Record<string, number> = {};
      s.missions.forEach(m => {
        if (m.completedAt) { const d = m.completedAt.slice(0, 10); counts[d] = (counts[d] || 0) + 1; }
        (m.completionHistory || []).forEach(h => { if (!h.failed) { const d = h.date.slice(0, 10); counts[d] = (counts[d] || 0) + 1; } });
      });
      return { current: Math.min(Math.max(0, ...Object.values(counts)), 10), target: 10 };
    } },
  { id: 'mission-category-master', type: 'mission', label: 'Multi-Class Master', value: 10, rank: 'A', icon: '🌈',
    description: 'Concluiu quest em todas as categorias. Você é multi-classe de verdade.',
    requirements: ['Concluir missão em Estudo, Trabalho, Treino, Leitura, Espiritual, Social, Saúde, Mental, Financeiro, Criatividade'],
    check: s => {
      const cats = new Set(s.missions.filter(m => m.status === 'Concluída' || (m.completionHistory && m.completionHistory.some(h => !h.failed))).map(m => m.category));
      return cats.size >= 10;
    },
    progress: s => {
      const cats = new Set(s.missions.filter(m => m.status === 'Concluída' || (m.completionHistory && m.completionHistory.some(h => !h.failed))).map(m => m.category));
      return { current: cats.size, target: 10 };
    } },

  // ========== NEW: JOURNAL ==========
  { id: 'journal-deep-10', type: 'special', label: 'Deep Dive x10', value: 10, rank: 'C', icon: '🪞',
    description: 'Dez entradas em modo profundo. Você desceu até a área secreta do mapa.',
    requirements: ['Criar 10 entradas no diário em modo profundo'],
    check: s => s.journal.filter(j => j.deepMode).length >= 10,
    progress: s => ({ current: Math.min(s.journal.filter(j => j.deepMode).length, 10), target: 10 }) },
  { id: 'journal-week-streak', type: 'special', label: 'Save Diário x7', value: 7, rank: 'D', icon: '💜',
    description: 'Sete dias seguidos salvando o jogo. Backup garantido.',
    requirements: ['Escrever no diário 7 dias seguidos'],
    check: s => {
      const dates = new Set(s.journal.map(j => j.date.slice(0, 10)));
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (dates.has(key)) { streak++; if (streak >= 7) return true; } else break;
      }
      return false;
    },
    progress: s => {
      const dates = new Set(s.journal.map(j => j.date.slice(0, 10)));
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (dates.has(key)) streak++; else break;
      }
      return { current: Math.min(streak, 7), target: 7 };
    } },
  { id: 'journal-month-streak', type: 'special', label: 'Save Diário x30', value: 30, rank: 'A', icon: '💜',
    description: 'Trinta dias seguidos salvando. Cloud save de verdade.',
    requirements: ['Escrever no diário 30 dias seguidos'],
    check: s => {
      const dates = new Set(s.journal.map(j => j.date.slice(0, 10)));
      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (dates.has(key)) { streak++; if (streak >= 30) return true; } else break;
      }
      return false;
    },
    progress: s => {
      const dates = new Set(s.journal.map(j => j.date.slice(0, 10)));
      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (dates.has(key)) streak++; else break;
      }
      return { current: Math.min(streak, 30), target: 30 };
    } },

  // ========== NEW: REFLECTIONS (Despertar) ==========
  { id: 'reflections-10', type: 'special', label: '10 Reflexões — Skill Insight', value: 10, rank: 'D', icon: '🧠',
    description: 'Dez reflexões respondidas. Você ganhou pontos passivos de Sabedoria.',
    requirements: ['Responder 10 reflexões no Despertar'],
    check: s => (s.reflections?.length || 0) >= 10,
    progress: s => ({ current: Math.min(s.reflections?.length || 0, 10), target: 10 }) },
  { id: 'reflections-50', type: 'special', label: '50 Reflexões — Mestre do Insight', value: 50, rank: 'A', icon: '🧠',
    description: 'Cinquenta reflexões. Stat de Sabedoria maximizado.',
    requirements: ['Responder 50 reflexões no Despertar'],
    check: s => (s.reflections?.length || 0) >= 50,
    progress: s => ({ current: Math.min(s.reflections?.length || 0, 50), target: 50 }) },

  // ========== NEW: GOLD / REWARDS ==========
  { id: 'gold-10000', type: 'special', label: 'Cofre do Dragão (10k)', value: 10000, rank: 'Monarca', icon: '🐉',
    description: 'Dez mil moedas. Você é o dragão guardando o próprio tesouro.',
    requirements: ['Acumular 10000 Gold'],
    check: s => s.gold >= 10000, progress: s => ({ current: Math.min(s.gold, 10000), target: 10000 }) },
  { id: 'reward-20', type: 'special', label: '20 Loots Resgatados', value: 20, rank: 'B', icon: '🎁',
    description: 'Vinte baús abertos. Você sabe gastar XP em si.',
    requirements: ['Resgatar 20 recompensas na loja'],
    check: s => s.rewards.filter(r => r.redeemed).length >= 20,
    progress: s => ({ current: Math.min(s.rewards.filter(r => r.redeemed).length, 20), target: 20 }) },

  // ========== NEW: CHALLENGES ==========
  { id: 'challenge-complete-1', type: 'special', label: 'Quest Épica Completa', value: 1, rank: 'D', icon: '🏅',
    description: 'Você fechou uma quest épica do começo ao fim. Cutscene desbloqueada.',
    requirements: ['Concluir 100% dos passos de 1 desafio'],
    check: s => s.challenges.some(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed),
    progress: s => ({ current: s.challenges.filter(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed).length > 0 ? 1 : 0, target: 1 }) },
  { id: 'challenge-complete-5', type: 'special', label: '5 Quests Épicas Completas', value: 5, rank: 'A', icon: '🏅',
    description: 'Cinco quests longas vencidas. Você tem build de completionist.',
    requirements: ['Concluir 100% dos passos de 5 desafios'],
    check: s => s.challenges.filter(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed).length >= 5,
    progress: s => ({ current: Math.min(s.challenges.filter(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed).length, 5), target: 5 }) },

  // ========== NEW: DISCIPLINE ==========
  { id: 'protocol-30', type: 'discipline', label: '30 Respawns — Imortal', value: 30, rank: 'S', icon: '🕊️',
    description: 'Trinta respawns concluídos. Game over não existe pra você.',
    requirements: ['Concluir 30 Protocolos de Falha'],
    check: s => protocolsDone(s) >= 30, progress: s => ({ current: Math.min(protocolsDone(s), 30), target: 30 }) },
  { id: 'comeback', type: 'discipline', label: 'Comeback Lendário', value: 7, rank: 'C', icon: '🔥',
    description: 'Você sumiu por dias e voltou pra um streak de 7. Plot twist do herói.',
    requirements: ['Após perder 3 ou mais dias, alcançar streak ≥ 7 novamente'],
    check: s => s.streak >= 7 && s.missedDays >= 3,
    progress: s => ({ current: s.missedDays >= 3 ? Math.min(s.streak, 7) : 0, target: 7 }) },

  // ========== JORNADA DO HERÓI ==========
  ...(() => {
    const totalHabitsDone = (s: PlayerState) =>
      s.habits.reduce((acc, h) => acc + Object.values(h.history).filter(v => v === 'done').length, 0);
    const journalCount = (s: PlayerState) => (s.journal || []).length;

    const mk = (id: string, label: string, rank: string, icon: string, description: string, target: number, getCurrent: (s: PlayerState) => number, requirements: string[]): AchievementDef => ({
      id, type: 'self-love' as const, label, value: target, rank, icon, description, requirements,
      check: s => getCurrent(s) >= target,
      progress: s => ({ current: Math.min(getCurrent(s), target), target }),
    });

    return [
      mk('self-first-act', 'Primeira Skill Treinada', 'E', '🌱',
        'Primeiro hábito concluído. Você ativou o primeiro skill drill do jogo.', 1,
        s => totalHabitsDone(s), ['Concluir 1 hábito']),
      mk('self-promise-7', 'Skill Drill x7', 'D', '🗡️',
        'Sete treinos completados. A barra de skill começou a subir.', 7,
        s => totalHabitsDone(s), ['Concluir hábitos 7 vezes no total']),
      mk('self-promise-30', 'Skill Drill x30', 'C', '⚔️',
        'Trinta treinos. Sua build começa a destoar do free-to-play médio.', 30,
        s => totalHabitsDone(s), ['Concluir hábitos 30 vezes no total']),
      mk('self-promise-100', 'Skill Drill x100', 'B', '🛡️',
        'Cem treinos. Stat permanente desbloqueado no personagem.', 100,
        s => totalHabitsDone(s), ['Concluir hábitos 100 vezes no total']),
      mk('self-pride-week', 'Streak de 7 — Disciplina Ativa', 'D', '⚡',
        'Sete dias seguidos no jogo. Buff de Disciplina ativado.', 7,
        s => s.streak, ['Manter streak de 7 dias']),
      mk('self-pride-month', 'Streak de 30 — Disciplina Sólida', 'B', '👑',
        'Trinta dias logados. Buff de Disciplina nível 2.', 30,
        s => s.streak, ['Manter streak de 30 dias']),
      mk('self-journal-first', 'Save Slot 1', 'E', '📓',
        'Primeira entrada criada. Você ocupou o primeiro slot de save.', 1,
        s => journalCount(s), ['Escrever 1 entrada no diário']),
      mk('self-journal-10', '10 Saves no Diário', 'C', '🪞',
        'Dez saves no log. Histórico do herói sendo escrito.', 10,
        s => journalCount(s), ['Escrever 10 entradas no diário']),
      mk('self-journal-30', '30 Saves — Crônica Pessoal', 'B', '💜',
        'Trinta entradas. Sua crônica já dá um livro.', 30,
        s => journalCount(s), ['Escrever 30 entradas no diário']),
      mk('self-back-from-fail', 'Revive Usado', 'C', '🕊️',
        'Você usou um Revive (Protocolo). Voltou pro combate sem perder o item raro.', 1,
        s => protocolsDone(s), ['Concluir 1 Protocolo de Falha']),
      {
        id: 'self-love-identity', type: 'self-love' as const, label: 'Personagem Forjado', value: 1, rank: 'S', icon: '🌟',
        description: 'Streak 60+ e 30+ skill drills. Seu personagem agora é único no servidor.',
        requirements: ['Streak ≥ 60 dias', 'Concluir hábitos 30+ vezes'],
        check: (s: PlayerState) => s.streak >= 60 && totalHabitsDone(s) >= 30,
        progress: (s: PlayerState) => ({ current: Math.min(1, s.streak >= 60 && totalHabitsDone(s) >= 30 ? 1 : 0), target: 1 }),
      } as AchievementDef,

      mk('self-promise-300', 'Skill Drill x300', 'A', '⚡',
        'Trezentos treinos. Sua build está oficialmente OP.', 300,
        s => totalHabitsDone(s), ['Concluir hábitos 300 vezes no total']),
      mk('self-promise-1000', 'Skill Drill x1000 — Mítico', 'Monarca', '👑',
        'Mil treinos. Você é o boss final da própria história.', 1000,
        s => totalHabitsDone(s), ['Concluir hábitos 1000 vezes no total']),
      mk('self-deep-reflection', 'Primeira Side-Area Secreta', 'D', '🪞',
        'Primeiro deep dive no diário. Você abriu uma área secreta do mapa interno.', 1,
        s => (s.journal || []).filter(j => j.deepMode).length, ['Criar 1 entrada no diário em modo profundo']),
      mk('self-deep-30', 'Mapa Interno Completo (30 deep dives)', 'A', '🪞',
        'Trinta deep dives. Você explorou cada canto da masmorra interior.', 30,
        s => (s.journal || []).filter(j => j.deepMode).length, ['Criar 30 entradas no diário em modo profundo']),
      mk('self-pride-3months', 'Streak 90d — Hardcore Mode', 'S', '🔥',
        'Noventa dias seguidos jogando hardcore. Você não morreu uma vez.', 90,
        s => s.streak, ['Manter streak de 90 dias']),
      mk('self-pride-year', 'Speedrun Anual', 'Monarca', '👑',
        'Trezentos e sessenta e cinco dias no servidor. Recorde global.', 365,
        s => s.streak, ['Manter streak de 365 dias']),
      {
        id: 'self-rebirth', type: 'self-love' as const, label: 'New Game+', value: 1, rank: 'B', icon: '🕊️',
        description: 'Você sumiu por uma semana e voltou pra um streak de 7+. Reset com tudo no inventário.',
        requirements: ['Voltar a um streak de 7+ dias após perder 7 ou mais dias'],
        check: (s: PlayerState) => s.streak >= 7 && s.missedDays >= 7,
        progress: (s: PlayerState) => ({ current: s.missedDays >= 7 ? Math.min(s.streak, 7) : 0, target: 7 }),
      } as AchievementDef,
      {
        id: 'self-gentle-care', type: 'self-love' as const, label: 'Dual Class — Disciplina + Reflexão', value: 1, rank: 'C', icon: '🤍',
        description: 'Streak 14 + 14 saves. Build híbrida desbloqueada.',
        requirements: ['Streak ≥ 14 dias', 'Escrever 14 entradas no diário'],
        check: (s: PlayerState) => s.streak >= 14 && journalCount(s) >= 14,
        progress: (s: PlayerState) => ({ current: Math.min(2, (s.streak >= 14 ? 1 : 0) + (journalCount(s) >= 14 ? 1 : 0)), target: 2 }),
      } as AchievementDef,
      {
        id: 'self-soft-power', type: 'self-love' as const, label: 'Triple Class — Build Completa', value: 1, rank: 'A', icon: '💪',
        description: 'Streak 30 + 50 skill drills + 10 saves. Triple class unlocked.',
        requirements: ['Streak ≥ 30 dias', 'Concluir hábitos 50+ vezes', 'Escrever 10+ entradas'],
        check: (s: PlayerState) => s.streak >= 30 && totalHabitsDone(s) >= 50 && journalCount(s) >= 10,
        progress: (s: PlayerState) => ({
          current: Math.min(3, (s.streak >= 30 ? 1 : 0) + (totalHabitsDone(s) >= 50 ? 1 : 0) + (journalCount(s) >= 10 ? 1 : 0)),
          target: 3,
        }),
      } as AchievementDef,
      {
        id: 'self-mirror-day', type: 'self-love' as const, label: 'Daily Combo', value: 1, rank: 'E', icon: '🌟',
        description: 'Um hábito + uma entrada no mesmo dia. Combo diário básico ativado.',
        requirements: ['Concluir 1 hábito e escrever no diário no mesmo dia'],
        check: (s: PlayerState) => s.habits.some(h => Object.values(h.history).some(v => v === 'done')) && journalCount(s) >= 1,
        progress: (s: PlayerState) => {
          const did = s.habits.some(h => Object.values(h.history).some(v => v === 'done')) && journalCount(s) >= 1;
          return { current: did ? 1 : 0, target: 1 };
        },
      } as AchievementDef,
      {
        id: 'self-home', type: 'self-love' as const, label: 'Endgame Build', value: 1, rank: 'Monarca', icon: '🏰',
        description: 'Streak 100 + 100 skill drills + 30 saves. Endgame completo, world boss farmável.',
        requirements: ['Streak ≥ 100 dias', 'Concluir hábitos 100+ vezes', 'Escrever 30+ entradas'],
        check: (s: PlayerState) => s.streak >= 100 && totalHabitsDone(s) >= 100 && journalCount(s) >= 30,
        progress: (s: PlayerState) => ({
          current: Math.min(3, (s.streak >= 100 ? 1 : 0) + (totalHabitsDone(s) >= 100 ? 1 : 0) + (journalCount(s) >= 30 ? 1 : 0)),
          target: 3,
        }),
      } as AchievementDef,
    ];
  })(),
];

export function checkNewAchievements(state: PlayerState, unlocked: UnlockedAchievement[]): AchievementDef[] {
  const unlockedIds = new Set(unlocked.map(u => u.id));
  return ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id) && a.check(state));
}
