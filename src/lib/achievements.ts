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
  { id: 'protocol-done', type: 'discipline', label: 'Voltei pra mim depois da queda', value: 1, rank: 'D', icon: '🕊️',
    description: 'Cair faz parte. Voltar pra você é o que importa — e você voltou.',
    requirements: ['Concluir 1 Protocolo de Falha dentro do prazo'],
    check: s => protocolsDone(s) >= 1, progress: s => ({ current: Math.min(protocolsDone(s), 1), target: 1 }) },
  { id: 'protocol-3', type: 'discipline', label: '3 vezes que me reencontrei', value: 3, rank: 'B', icon: '🕊️',
    description: 'Três quedas, três voltas. Você está aprendendo a não se largar.',
    requirements: ['Concluir 3 Protocolos de Falha'],
    check: s => protocolsDone(s) >= 3, progress: s => ({ current: Math.min(protocolsDone(s), 3), target: 3 }) },
  { id: 'protocol-10', type: 'discipline', label: '10 vezes que escolhi me perdoar e voltar', value: 10, rank: 'A', icon: '🕊️',
    description: 'Dez retornos. Você se tornou alguém que sempre encontra o caminho de volta pra si.',
    requirements: ['Concluir 10 Protocolos de Falha'],
    check: s => protocolsDone(s) >= 10, progress: s => ({ current: Math.min(protocolsDone(s), 10), target: 10 }) },
  { id: 'no-fail-7', type: 'discipline', label: '7 dias sem me trair', value: 7, rank: 'C', icon: '🤍',
    description: 'Sete dias inteiros honrando você. Sem fugas, sem desculpas.',
    requirements: ['Manter streak de 7 dias', 'Nenhum dia perdido'],
    check: s => s.streak >= 7 && s.missedDays === 0, progress: s => ({ current: Math.min(s.streak, 7), target: 7 }) },
  { id: 'no-fail-30', type: 'discipline', label: '30 dias sem me trair', value: 30, rank: 'A', icon: '🤍',
    description: 'Um mês inteiro sendo leal a você. Isso muda como você se vê no espelho.',
    requirements: ['Manter streak de 30 dias', 'Nenhum dia perdido'],
    check: s => s.streak >= 30 && s.missedDays === 0, progress: s => ({ current: Math.min(s.streak, 30), target: 30 }) },

  // ========== SPECIAL ==========
  { id: 'awakening', type: 'special', label: 'Despertar Completo', value: 0, rank: 'E', icon: '🌅',
    description: 'Você olhou pra dentro e respondeu: quem quero virar, o que rejeito, o que dói. Isso é coragem.',
    requirements: ['Preencher "O que quero me tornar"', 'Preencher "O que rejeito"', 'Preencher "Minha dor"'],
    check: s => !!(s.awakening.become && s.awakening.reject && s.awakening.pain),
    progress: s => ({ current: [s.awakening.become, s.awakening.reject, s.awakening.pain].filter(Boolean).length, target: 3 }) },
  { id: 'journal-1', type: 'special', label: 'Primeira escuta de mim', value: 1, rank: 'E', icon: '📓',
    description: 'A primeira vez que você sentou consigo e ouviu. Esse já é um ato raro.',
    requirements: ['Criar 1 entrada no diário'],
    check: s => s.journal.length >= 1, progress: s => ({ current: Math.min(s.journal.length, 1), target: 1 }) },
  { id: 'journal-5', type: 'special', label: '5 conversas honestas comigo', value: 5, rank: 'D', icon: '📓',
    description: 'Cinco vezes que você não fugiu de você. Está virando hábito.',
    requirements: ['Criar 5 entradas no diário'],
    check: s => s.journal.length >= 5, progress: s => ({ current: Math.min(s.journal.length, 5), target: 5 }) },
  { id: 'journal-20', type: 'special', label: '20 vezes que parei pra me ouvir', value: 20, rank: 'C', icon: '🪞',
    description: 'Vinte mergulhos em você. Tá conhecendo alguém importante: você mesmo.',
    requirements: ['Criar 20 entradas no diário'],
    check: s => s.journal.length >= 20, progress: s => ({ current: Math.min(s.journal.length, 20), target: 20 }) },
  { id: 'journal-50', type: 'special', label: '50 conversas comigo', value: 50, rank: 'B', icon: '🪞',
    description: 'Cinquenta vezes que você virou um lugar seguro pra você mesmo.',
    requirements: ['Criar 50 entradas no diário'],
    check: s => s.journal.length >= 50, progress: s => ({ current: Math.min(s.journal.length, 50), target: 50 }) },
  { id: 'journal-100', type: 'special', label: 'Aprendi a me escutar', value: 100, rank: 'A', icon: '💜',
    description: 'Cem entradas. Você se tornou íntimo de você mesmo — isso muda tudo.',
    requirements: ['Criar 100 entradas no diário'],
    check: s => s.journal.length >= 100, progress: s => ({ current: Math.min(s.journal.length, 100), target: 100 }) },
  { id: 'gold-100', type: 'special', label: 'Mereci minhas primeiras recompensas', value: 100, rank: 'E', icon: '🎁',
    description: 'Cem moedas guardadas em atos de cuidado. Você merece colher.',
    requirements: ['Acumular 100 Gold'],
    check: s => s.gold >= 100, progress: s => ({ current: Math.min(s.gold, 100), target: 100 }) },
  { id: 'gold-500', type: 'special', label: 'Frutos do meu próprio cuidado', value: 500, rank: 'C', icon: '🎁',
    description: 'Quinhentas moedas vindas de você cuidando de você. Bonito de ver.',
    requirements: ['Acumular 500 Gold'],
    check: s => s.gold >= 500, progress: s => ({ current: Math.min(s.gold, 500), target: 500 }) },
  { id: 'gold-2000', type: 'special', label: 'Tesouro do meu amor-próprio', value: 2000, rank: 'A', icon: '🎁',
    description: 'Duas mil moedas. Cada uma é prova de que você apareceu pra você.',
    requirements: ['Acumular 2000 Gold'],
    check: s => s.gold >= 2000, progress: s => ({ current: Math.min(s.gold, 2000), target: 2000 }) },
  { id: 'gold-5000', type: 'special', label: 'Riqueza interna de verdade', value: 5000, rank: 'S', icon: '🎁',
    description: 'Cinco mil moedas em atos de cuidado. Isso é riqueza que ninguém te tira.',
    requirements: ['Acumular 5000 Gold'],
    check: s => s.gold >= 5000, progress: s => ({ current: Math.min(s.gold, 5000), target: 5000 }) },
  { id: 'challenge-1', type: 'special', label: 'Fiz uma promessa grande comigo', value: 1, rank: 'E', icon: '🎯',
    description: 'Você criou um desafio — uma promessa de cuidado de médio prazo consigo.',
    requirements: ['Criar 1 desafio'],
    check: s => s.challenges.length >= 1, progress: s => ({ current: Math.min(s.challenges.length, 1), target: 1 }) },
  { id: 'reward-1', type: 'special', label: 'Soube me presentear', value: 1, rank: 'E', icon: '🎁',
    description: 'A primeira vez que você se deu algo bom de propósito. Você merece.',
    requirements: ['Resgatar 1 recompensa na loja'],
    check: s => s.rewards.filter(r => r.redeemed).length >= 1, progress: s => ({ current: Math.min(s.rewards.filter(r => r.redeemed).length, 1), target: 1 }) },
  { id: 'reward-5', type: 'special', label: '5 vezes que me presenteei', value: 5, rank: 'C', icon: '🎁',
    description: 'Cinco vezes que você lembrou: eu também mereço receber.',
    requirements: ['Resgatar 5 recompensas na loja'],
    check: s => s.rewards.filter(r => r.redeemed).length >= 5, progress: s => ({ current: Math.min(s.rewards.filter(r => r.redeemed).length, 5), target: 5 }) },

  // ========== NEW: HABITS ==========
  { id: 'habits-10', type: 'habit', label: '10 formas de cuidar de mim', value: 10, rank: 'B', icon: '💐',
    description: 'Dez cuidados ativos ao mesmo tempo. Sua vida virou um jardim que você rega.',
    requirements: ['Ter 10 hábitos criados simultaneamente'],
    check: s => s.habits.length >= 10, progress: s => ({ current: Math.min(s.habits.length, 10), target: 10 }) },
  { id: 'habit-perfect-week', type: 'habit', label: 'Uma semana inteira sem me abandonar', value: 7, rank: 'C', icon: '🤍',
    description: 'Sete dias seguidos honrando cada cuidado seu. Você não se largou nenhum dia.',
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
  { id: 'habit-perfect-month', type: 'habit', label: 'Um mês inteiro sem me abandonar', value: 30, rank: 'A', icon: '💖',
    description: 'Trinta dias sem virar as costas pra você em nenhum cuidado. Isso é amor diário.',
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

  // ========== NEW: MISSIONS ==========
  { id: 'mission-200', type: 'mission', label: '200 vezes que apareci pra mim', value: 200, rank: 'Monarca', icon: '💖',
    description: 'Duzentas escolhas a favor de você. Você reescreveu sua relação consigo.',
    requirements: ['Concluir 200 missões no total'],
    check: s => completedMissions(s) >= 200, progress: s => ({ current: Math.min(completedMissions(s), 200), target: 200 }) },
  { id: 'mission-day-5', type: 'mission', label: 'Um dia inteiro me priorizando', value: 5, rank: 'C', icon: '🌷',
    description: 'Cinco escolhas por você num mesmo dia. Esse dia foi seu.',
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
  { id: 'mission-day-10', type: 'mission', label: 'Um dia 100% por mim', value: 10, rank: 'B', icon: '💗',
    description: 'Dez escolhas por você no mesmo dia. Esse dia foi inteiramente seu.',
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
  { id: 'mission-category-master', type: 'mission', label: 'Cuidei de mim em todas as áreas', value: 10, rank: 'A', icon: '💞',
    description: 'Você não negligenciou nenhuma parte da sua vida. Amor-próprio inteiro.',
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
  { id: 'journal-deep-10', type: 'special', label: '10 mergulhos honestos em mim', value: 10, rank: 'C', icon: '🪞',
    description: 'Dez vezes que você foi até o fundo sem fugir. Isso constrói intimidade consigo.',
    requirements: ['Criar 10 entradas no diário em modo profundo'],
    check: s => s.journal.filter(j => j.deepMode).length >= 10,
    progress: s => ({ current: Math.min(s.journal.filter(j => j.deepMode).length, 10), target: 10 }) },
  { id: 'journal-week-streak', type: 'special', label: '7 dias me escutando', value: 7, rank: 'D', icon: '💜',
    description: 'Uma semana inteira sentando com você todo dia. Você merecia essa escuta.',
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
  { id: 'journal-month-streak', type: 'special', label: '30 dias me escutando', value: 30, rank: 'A', icon: '💜',
    description: 'Um mês inteiro sentando com você. Você virou um lugar seguro pra você mesmo.',
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
  { id: 'reflections-10', type: 'special', label: '10 vezes que parei pra me ver', value: 10, rank: 'D', icon: '🌷',
    description: 'Dez pausas pra olhar pra dentro. Quem faz isso muda.',
    requirements: ['Responder 10 reflexões no Despertar'],
    check: s => (s.reflections?.length || 0) >= 10,
    progress: s => ({ current: Math.min(s.reflections?.length || 0, 10), target: 10 }) },
  { id: 'reflections-50', type: 'special', label: '50 vezes que me olhei com honestidade', value: 50, rank: 'A', icon: '💐',
    description: 'Cinquenta encontros com você. A pessoa que se conhece é a que mais se ama.',
    requirements: ['Responder 50 reflexões no Despertar'],
    check: s => (s.reflections?.length || 0) >= 50,
    progress: s => ({ current: Math.min(s.reflections?.length || 0, 50), target: 50 }) },

  // ========== NEW: GOLD / REWARDS ==========
  { id: 'gold-10000', type: 'special', label: 'Acervo do meu próprio cuidado', value: 10000, rank: 'Monarca', icon: '🎁',
    description: 'Dez mil moedas vindas de cuidar de você. Isso é riqueza interna de verdade.',
    requirements: ['Acumular 10000 Gold'],
    check: s => s.gold >= 10000, progress: s => ({ current: Math.min(s.gold, 10000), target: 10000 }) },
  { id: 'reward-20', type: 'special', label: '20 vezes que me dei carinho', value: 20, rank: 'B', icon: '🎁',
    description: 'Vinte presentes pra você. Aprender a receber também é amor-próprio.',
    requirements: ['Resgatar 20 recompensas na loja'],
    check: s => s.rewards.filter(r => r.redeemed).length >= 20,
    progress: s => ({ current: Math.min(s.rewards.filter(r => r.redeemed).length, 20), target: 20 }) },

  // ========== NEW: CHALLENGES ==========
  { id: 'challenge-complete-1', type: 'special', label: 'Mantive uma promessa grande comigo', value: 1, rank: 'D', icon: '🤍',
    description: 'Você cumpriu, do começo ao fim, algo que prometeu pra você. Isso fica.',
    requirements: ['Concluir 100% dos passos de 1 desafio'],
    check: s => s.challenges.some(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed),
    progress: s => ({ current: s.challenges.filter(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed).length > 0 ? 1 : 0, target: 1 }) },
  { id: 'challenge-complete-5', type: 'special', label: '5 promessas grandes cumpridas comigo', value: 5, rank: 'A', icon: '💖',
    description: 'Cinco vezes que você foi até o fim por você. Sua palavra com você vale ouro.',
    requirements: ['Concluir 100% dos passos de 5 desafios'],
    check: s => s.challenges.filter(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed).length >= 5,
    progress: s => ({ current: Math.min(s.challenges.filter(c => c.steps.length > 0 && c.steps.every(st => st.completed) && !c.failed).length, 5), target: 5 }) },

  // ========== NEW: DISCIPLINE ==========
  { id: 'protocol-30', type: 'discipline', label: '30 vezes que voltei pra mim', value: 30, rank: 'S', icon: '🕊️',
    description: 'Trinta retornos. Você se tornou alguém que sempre encontra o caminho de volta pra si.',
    requirements: ['Concluir 30 Protocolos de Falha'],
    check: s => protocolsDone(s) >= 30, progress: s => ({ current: Math.min(protocolsDone(s), 30), target: 30 }) },
  { id: 'comeback', type: 'discipline', label: 'Voltei pra mim depois de me perder', value: 7, rank: 'C', icon: '🕊️',
    description: 'Você sumiu de você por dias — e voltou. Isso é amor que não desiste.',
    requirements: ['Após perder 3 ou mais dias, alcançar streak ≥ 7 novamente'],
    check: s => s.streak >= 7 && s.missedDays >= 3,
    progress: s => ({ current: s.missedDays >= 3 ? Math.min(s.streak, 7) : 0, target: 7 }) },

  // ========== AMOR-PRÓPRIO / ORGULHO ==========
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
      mk('self-first-act', 'Primeiro ato de amor por mim', 'E', '❤️',
        'O primeiro gesto de cuidado consigo. Pequeno por fora, enorme por dentro.', 1,
        s => totalHabitsDone(s), ['Concluir 1 hábito']),
      mk('self-promise-7', 'Cumpri minha palavra comigo 7 vezes', 'D', '🤍',
        'Sete promessas pequenas honradas. Você está virando alguém em quem você confia.', 7,
        s => totalHabitsDone(s), ['Concluir hábitos 7 vezes no total']),
      mk('self-promise-30', '30 promessas cumpridas comigo', 'C', '💗',
        'Trinta atos de lealdade a si. Não é disciplina — é amor em forma de hábito.', 30,
        s => totalHabitsDone(s), ['Concluir hábitos 30 vezes no total']),
      mk('self-promise-100', '100 vezes que escolhi a mim', 'B', '💖',
        'Cem escolhas a favor de você. Isso é uma vida sendo reconstruída por dentro.', 100,
        s => totalHabitsDone(s), ['Concluir hábitos 100 vezes no total']),
      mk('self-pride-week', 'Uma semana de orgulho silencioso', 'D', '✨',
        'Sete dias seguidos cuidando de si. Sem precisar contar pra ninguém.', 7,
        s => s.streak, ['Manter streak de 7 dias']),
      mk('self-pride-month', 'Um mês me honrando', 'B', '👑',
        'Trinta dias se tratando como alguém que importa. Porque importa.', 30,
        s => s.streak, ['Manter streak de 30 dias']),
      mk('self-journal-first', 'Primeira escuta de mim', 'E', '📓',
        'Você sentou consigo e ouviu. Esse já é um ato de amor raro.', 1,
        s => journalCount(s), ['Escrever 1 entrada no diário']),
      mk('self-journal-10', '10 conversas honestas comigo', 'C', '🪞',
        'Dez vezes que você não fugiu de si mesmo. Isso muda uma pessoa.', 10,
        s => journalCount(s), ['Escrever 10 entradas no diário']),
      mk('self-journal-30', '30 dias me escutando', 'B', '💜',
        'Trinta entradas. Você virou um lugar seguro pra você mesmo.', 30,
        s => journalCount(s), ['Escrever 30 entradas no diário']),
      mk('self-back-from-fail', 'Voltei pra mim depois da queda', 'C', '🕊️',
        'Cair e voltar não é fraqueza — é a forma mais alta de amor-próprio.', 1,
        s => protocolsDone(s), ['Concluir 1 Protocolo de Falha']),
      {
        id: 'self-love-identity', type: 'self-love' as const, label: 'Aprendi a me amar', value: 1, rank: 'S', icon: '💖',
        description: 'Não é mais esforço. É quem você é. Você se ama e isso aparece em cada dia.',
        requirements: ['Streak ≥ 60 dias', 'Concluir hábitos 30+ vezes'],
        check: (s: PlayerState) => s.streak >= 60 && totalHabitsDone(s) >= 30,
        progress: (s: PlayerState) => ({ current: Math.min(1, s.streak >= 60 && totalHabitsDone(s) >= 30 ? 1 : 0), target: 1 }),
      } as AchievementDef,

      // Novas conquistas de amor-próprio
      mk('self-promise-300', '300 promessas cumpridas comigo', 'A', '💞',
        'Trezentas vezes que sua palavra contigo valeu. Você é confiável pra você mesmo agora.', 300,
        s => totalHabitsDone(s), ['Concluir hábitos 300 vezes no total']),
      mk('self-promise-1000', 'Mil atos de amor-próprio', 'Monarca', '💖',
        'Mil. Mil pequenos gestos de cuidado. Uma vida sendo construída por dentro, dia após dia.', 1000,
        s => totalHabitsDone(s), ['Concluir hábitos 1000 vezes no total']),
      mk('self-deep-reflection', 'Mergulhei fundo em mim', 'D', '🪞',
        'A primeira vez que você foi até o fundo sem se proteger. Coragem rara.', 1,
        s => (s.journal || []).filter(j => j.deepMode).length, ['Criar 1 entrada no diário em modo profundo']),
      mk('self-deep-30', '30 mergulhos honestos em mim', 'A', '🪞',
        'Trinta vezes encarando o que mora dentro. Você se conhece como pouca gente se conhece.', 30,
        s => (s.journal || []).filter(j => j.deepMode).length, ['Criar 30 entradas no diário em modo profundo']),
      mk('self-pride-3months', 'Três meses me honrando', 'S', '👑',
        'Noventa dias seguidos sendo gentil consigo. Isso reescreve quem você é.', 90,
        s => s.streak, ['Manter streak de 90 dias']),
      mk('self-pride-year', 'Um ano me amando', 'Monarca', '💖',
        'Um ano inteiro do seu lado, sem te abandonar nenhum dia. Isso muda uma alma.', 365,
        s => s.streak, ['Manter streak de 365 dias']),
      {
        id: 'self-rebirth', type: 'self-love' as const, label: 'Renasci dentro de mim', value: 1, rank: 'B', icon: '🕊️',
        description: 'Você sumiu de você por uma semana inteira — e voltou. Isso é amor que insiste.',
        requirements: ['Voltar a um streak de 7+ dias após perder 7 ou mais dias'],
        check: (s: PlayerState) => s.streak >= 7 && s.missedDays >= 7,
        progress: (s: PlayerState) => ({ current: s.missedDays >= 7 ? Math.min(s.streak, 7) : 0, target: 7 }),
      } as AchievementDef,
      {
        id: 'self-gentle-care', type: 'self-love' as const, label: 'Aprendi a me tratar com carinho', value: 1, rank: 'C', icon: '🤍',
        description: 'Cuidar de si virou rotina, escutar-se virou hábito. Que jeito bonito de viver.',
        requirements: ['Streak ≥ 14 dias', 'Escrever 14 entradas no diário'],
        check: (s: PlayerState) => s.streak >= 14 && journalCount(s) >= 14,
        progress: (s: PlayerState) => ({ current: Math.min(2, (s.streak >= 14 ? 1 : 0) + (journalCount(s) >= 14 ? 1 : 0)), target: 2 }),
      } as AchievementDef,
      {
        id: 'self-soft-power', type: 'self-love' as const, label: 'Força que vem de me amar', value: 1, rank: 'A', icon: '💪',
        description: 'Você descobriu uma força nova — a que nasce de se cuidar, não de se cobrar.',
        requirements: ['Streak ≥ 30 dias', 'Concluir hábitos 50+ vezes', 'Escrever 10+ entradas'],
        check: (s: PlayerState) => s.streak >= 30 && totalHabitsDone(s) >= 50 && journalCount(s) >= 10,
        progress: (s: PlayerState) => ({
          current: Math.min(3, (s.streak >= 30 ? 1 : 0) + (totalHabitsDone(s) >= 50 ? 1 : 0) + (journalCount(s) >= 10 ? 1 : 0)),
          target: 3,
        }),
      } as AchievementDef,
      {
        id: 'self-mirror-day', type: 'self-love' as const, label: 'Um dia inteiro me amando', value: 1, rank: 'E', icon: '🌷',
        description: 'Um dia em que você se cuidou e se ouviu. Esse dia foi um presente seu pra você.',
        requirements: ['Concluir 1 hábito e escrever no diário no mesmo dia'],
        check: (s: PlayerState) => s.habits.some(h => Object.values(h.history).some(v => v === 'done')) && journalCount(s) >= 1,
        progress: (s: PlayerState) => {
          const did = s.habits.some(h => Object.values(h.history).some(v => v === 'done')) && journalCount(s) >= 1;
          return { current: did ? 1 : 0, target: 1 };
        },
      } as AchievementDef,
      {
        id: 'self-home', type: 'self-love' as const, label: 'Virei um lar pra mim', value: 1, rank: 'Monarca', icon: '🏠',
        description: 'Streak grande, cuidados profundos, escuta diária. Você se tornou o lugar mais seguro pra você.',
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
