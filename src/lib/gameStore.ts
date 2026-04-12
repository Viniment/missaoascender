import { useState, useEffect, useCallback, useRef } from 'react';
import { checkNewAchievements, type AchievementDef } from './achievements';
// Types
export type MissionType = 'Tempo' | 'Diária' | 'Contagem';
export type MissionCategory = 'Estudo' | 'Trabalho' | 'Treino' | 'Leitura' | 'Espiritual' | 'Social' | 'Saúde' | 'Mental' | 'Financeiro' | 'Criatividade';
export type MissionDifficulty = 'Fácil' | 'Normal' | 'Difícil';
export type MissionStatus = 'Ativa' | 'Concluída' | 'Falhada';

export interface Mission {
  id: string;
  name: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  missionType: MissionType;
  status: MissionStatus;
  videoUrl?: string;
  description?: string;
  // Time mission
  startedAt?: string | null;
  executedHours?: number;
  // Daily mission
  lastCompletedDate?: string | null;
  dailyXp?: number;
  dailyGold?: number;
  // Count mission
  targetCount?: number;
  currentCount?: number;
  // Results
  xpEarned?: number;
  goldEarned?: number;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  endDate: string;
  difficulty: MissionDifficulty;
  videoUrl?: string;
  history: Record<string, 'done' | 'failed'>;
}

export type FailurePenaltyType = 'Exercício' | 'Meditação' | 'Reflexão' | 'Outro';

export type PunishmentCategory = 'Restrição' | 'Financeira' | 'Física' | 'Esforço' | 'Mental';
export type PunishmentIntensity = 'Leve' | 'Média' | 'Pesada';

export interface Punishment {
  id: string;
  name: string;
  description?: string;
  category: PunishmentCategory;
  intensity: PunishmentIntensity;
  enabled: boolean;
  isCustom?: boolean;
}

export interface FailureProtocol {
  id: string;
  triggeredAt: string;
  deadline: string;
  reason: string;
  penaltyType: FailurePenaltyType;
  customPenalty?: string;
  punishment?: Punishment;
  status: 'Pendente' | 'Concluído';
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  text: string;
  emotion?: string;
  intensity?: number;
  deepMode?: boolean;
}

export interface Challenge {
  id: string;
  name: string;
  steps: { id: string; name: string; completed: boolean }[];
  failed: boolean;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  redeemed: boolean;
}

export interface Reflection {
  id: string;
  question: string;
  answerHtml: string;
  date: string;
}

export interface PlayerState {
  name: string;
  title: string;
  avatar: string | null;
  level: number;
  xp: number;
  xpToNext: number;
  rank: string;
  gold: number;
  streak: number;
  lastLogin: string | null;
  missedDays: number;
  todayCheckedIn: boolean;
  missions: Mission[];
  habits: Habit[];
  journal: JournalEntry[];
  challenges: Challenge[];
  log: { date: string; action: string; xp: number; gold: number }[];
  awakening: { become: string; reject: string; pain: string };
  rewards: Reward[];
  reflections: Reflection[];
  failureProtocols: FailureProtocol[];
  achievements: { id: string; unlockedAt: string }[];
  disabledTabs: string[];
  pomodoroStartedAt: number | null;
  pomodoroDuration: number | null;
  pomodoroMode: string | null;
  punishments: Punishment[];
  randomPunishmentMode: boolean;
}

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'Monarca'] as const;

const TITLES: Record<string, string[]> = {
  E: ['Desperto', 'Iniciante', 'Em Evolução', 'Persistente', 'À Beira da Ascensão'],
  D: ['Renascendo das Cinzas', 'Forjando Disciplina', 'Ritmo Inquebrável', 'Consistência Afiada', 'Prestes a Transcender'],
  C: ['Domínio Inicial', 'Controle Crescente', 'Mente Estruturada', 'Foco Implacável', 'Quase Inabalável'],
  B: ['Força Interior', 'Disciplina Elevada', 'Execução Precisa', 'Alta Performance', 'Elite Emergente'],
  A: ['Presença Dominante', 'Controle Absoluto', 'Mentalidade de Aço', 'Operando no Limite', 'À Beira da Elite'],
  S: ['Além do Comum', 'Força Anormal', 'Instinto Superior', 'Domínio Total', 'Quase Lendário'],
  Monarca: ['Ascendido', 'Portador do Poder', 'Entidade em Evolução', 'Presença Absoluta', 'Forma Final'],
};

function getTitle(rank: string, level: number): string {
  return TITLES[rank]?.[level - 1] || 'Desperto';
}

// Base XP per level, scaled by rank (+20% per rank tier)
const BASE_XP = [100, 200, 350, 550, 800];

function getXpToNext(level: number, rank: string): number {
  const rankIndex = RANKS.indexOf(rank as typeof RANKS[number]);
  const multiplier = Math.pow(1.2, Math.max(0, rankIndex));
  return Math.floor(BASE_XP[level - 1] * multiplier);
}

function processLevelUp(xp: number, level: number, rank: string): { xp: number; level: number; rank: string; title: string; xpToNext: number } {
  let newXp = xp;
  let newLevel = level;
  let newRank = rank;

  while (newXp >= getXpToNext(newLevel, newRank)) {
    newXp -= getXpToNext(newLevel, newRank);
    if (newLevel >= 5) {
      // Rank up
      const rankIdx = RANKS.indexOf(newRank as typeof RANKS[number]);
      if (rankIdx < RANKS.length - 1) {
        newRank = RANKS[rankIdx + 1];
        newLevel = 1;
      } else {
        // Already Monarca max — stay at level 5, cap XP
        newLevel = 5;
        newXp = Math.min(newXp, getXpToNext(5, newRank) - 1);
        break;
      }
    } else {
      newLevel++;
    }
  }

  return {
    xp: newXp,
    level: newLevel,
    rank: newRank,
    title: getTitle(newRank, newLevel),
    xpToNext: getXpToNext(newLevel, newRank),
  };
}

export const VALID_PUNISHMENT_CATEGORIES: PunishmentCategory[] = ['Restrição', 'Financeira', 'Física', 'Esforço', 'Mental'];

export const DEFAULT_PUNISHMENTS: Punishment[] = [
  // Restrição
  { id: 'p1', name: 'Ficar sem redes sociais', category: 'Restrição', intensity: 'Leve', enabled: true },
  { id: 'p5', name: 'Sem celular', category: 'Restrição', intensity: 'Média', enabled: true },
  // Financeira
  { id: 'p6', name: 'Perder dinheiro', category: 'Financeira', intensity: 'Pesada', enabled: true },
  { id: 'p7', name: 'Doar dinheiro', category: 'Financeira', intensity: 'Média', enabled: true },
  // Física
  { id: 'p12', name: '1 minuto de prancha', category: 'Física', intensity: 'Média', enabled: true },
  { id: 'p14', name: 'Banho frio', category: 'Física', intensity: 'Pesada', enabled: true },
  // Esforço
  { id: 'p17', name: 'Limpar algo', category: 'Esforço', intensity: 'Leve', enabled: true },
  // Mental
  { id: 'p20', name: 'Escrever sobre a falha', category: 'Mental', intensity: 'Leve', enabled: true },
  { id: 'p23', name: 'Ficar 5 minutos em silêncio', category: 'Mental', intensity: 'Leve', enabled: true },
];

export const defaultState: PlayerState = {
  name: 'Jogador',
  title: 'Desperto',
  avatar: null,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rank: 'E',
  gold: 0,
  streak: 0,
  lastLogin: null,
  missedDays: 0,
  todayCheckedIn: false,
  missions: [],
  habits: [],
  journal: [],
  challenges: [],
  log: [],
  awakening: { become: '', reject: '', pain: '' },
  rewards: [],
  reflections: [],
  failureProtocols: [],
  achievements: [],
  disabledTabs: [],
  pomodoroStartedAt: null,
  pomodoroDuration: null,
  pomodoroMode: null,
  punishments: DEFAULT_PUNISHMENTS,
  randomPunishmentMode: true,
};

function loadState(): PlayerState {
  try {
    const saved = localStorage.getItem('ascensao-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastLogin && parsed.lastLogin !== today) {
        parsed.todayCheckedIn = false;
      }
      const merged = { ...defaultState, ...parsed };
      if (merged.punishments) {
        merged.punishments = merged.punishments.filter(
          (p: any) => VALID_PUNISHMENT_CATEGORIES.includes(p.category)
        );
      }
      return merged;
    }
  } catch { /* ignore */ }
  return defaultState;
}

function saveState(state: PlayerState) {
  localStorage.setItem('ascensao-state', JSON.stringify(state));
}

// XP per hour by difficulty
const XP_PER_HOUR: Record<MissionDifficulty, number> = {
  'Fácil': 5,
  'Normal': 10,
  'Difícil': 20,
};

const GOLD_PER_HOUR = 20;

export function useGameStore() {
  const [state, setState] = useState<PlayerState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addXp = useCallback((amount: number, action: string) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      if (newXp < 0) newXp = 0;

      const result = processLevelUp(newXp, prev.level, prev.rank);

      return {
        ...prev,
        ...result,
        log: [{ date: new Date().toISOString(), action, xp: amount, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const addGold = useCallback((_amount: number, _action: string) => {
    setState(prev => ({
      ...prev,
      gold: Math.max(0, prev.gold + _amount),
      log: [{ date: new Date().toISOString(), action: _action, xp: 0, gold: _amount }, ...prev.log].slice(0, 100),
    }));
  }, []);

  const dailyCheckIn = useCallback(() => {
    setState(prev => {
      const today = new Date().toISOString().split('T')[0];
      if (prev.todayCheckedIn) return prev;

      let missedDays = 0;
      let streak = prev.streak;

      if (prev.lastLogin) {
        const lastDate = new Date(prev.lastLogin);
        const todayDate = new Date(today);
        const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak++;
        } else if (diff > 1) {
          missedDays = diff - 1;
          streak = 1;
        }
      } else {
        streak = 1;
      }

      let xpPenalty = 0;
      if (missedDays === 1) xpPenalty = -50;
      else if (missedDays >= 2) xpPenalty = -100;

      const xpGain = 10;
      const totalXp = xpGain + xpPenalty;

      const prog = processLevelUp(Math.max(0, prev.xp + totalXp), prev.level, prev.rank);
      return {
        ...prev,
        todayCheckedIn: true,
        lastLogin: today,
        streak,
        missedDays,
        ...prog,
        log: [
          { date: new Date().toISOString(), action: `Check-in diário${xpPenalty < 0 ? ` (penalidade: ${xpPenalty} XP)` : ''}`, xp: totalXp, gold: 0 },
          ...prev.log
        ].slice(0, 100),
      };
    });
  }, []);

  const addMission = useCallback((mission: Omit<Mission, 'id' | 'status'>) => {
    setState(prev => ({
      ...prev,
      missions: [...prev.missions, { ...mission, id: crypto.randomUUID(), status: 'Ativa' }],
    }));
  }, []);

  // Start a time-based mission
  const startTimeMission = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m =>
        m.id === id ? { ...m, startedAt: new Date().toISOString() } : m
      ),
    }));
  }, []);

  // Complete a time-based mission with manually adjusted hours
  const completeTimeMission = useCallback((id: string, executedHours: number) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.status === 'Concluída') return prev;

      const xp = Math.floor(executedHours * XP_PER_HOUR[mission.difficulty]);
      const gold = Math.floor(executedHours * GOLD_PER_HOUR);

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank);
      return {
        ...prev,
        ...prog,
        gold: prev.gold + gold,
        missions: prev.missions.map(m =>
          m.id === id ? { ...m, status: 'Concluída' as const, executedHours, xpEarned: xp, goldEarned: gold, startedAt: null } : m
        ),
        log: [{ date: new Date().toISOString(), action: `Missão: ${mission.name} (${executedHours.toFixed(1)}h)`, xp, gold }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // Complete a daily mission
  const completeDailyMission = useCallback((id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.status === 'Concluída') return prev;

      const today = new Date().toISOString().split('T')[0];
      if (mission.lastCompletedDate === today) return prev;

      const xp = mission.dailyXp || 5;
      const gold = mission.dailyGold || 5;

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank);
      return {
        ...prev,
        ...prog,
        gold: prev.gold + gold,
        missions: prev.missions.map(m =>
          m.id === id ? { ...m, lastCompletedDate: today, xpEarned: xp, goldEarned: gold } : m
        ),
        log: [{ date: new Date().toISOString(), action: `Diária: ${mission.name}`, xp, gold }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // Increment count mission
  const incrementCountMission = useCallback((id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.status === 'Concluída') return prev;

      const newCount = (mission.currentCount || 0) + 1;
      const target = mission.targetCount || 1;
      const isComplete = newCount >= target;

      let xp = 2; // Each execution
      let gold = 0;
      if (isComplete) {
        xp += 5; // Bonus for completing all
      }

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank);
      return {
        ...prev,
        ...prog,
        gold: prev.gold + gold,
        missions: prev.missions.map(m =>
          m.id === id ? {
            ...m,
            currentCount: newCount,
            status: isComplete ? 'Concluída' as const : 'Ativa' as const,
            xpEarned: (m.xpEarned || 0) + xp,
          } : m
        ),
        log: [{ date: new Date().toISOString(), action: `Contagem: ${mission.name} (${newCount}/${target})${isComplete ? ' ✔️' : ''}`, xp, gold }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const pickPunishment = useCallback((prev: PlayerState): Punishment | undefined => {
    const enabled = (prev.punishments || []).filter(
      p => p.enabled && VALID_PUNISHMENT_CATEGORIES.includes(p.category)
    );
    if (enabled.length === 0) return undefined;
    if (prev.randomPunishmentMode) {
      return enabled[Math.floor(Math.random() * enabled.length)];
    }
    return enabled[0];
  }, []);

  const failMission = useCallback((id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.status !== 'Ativa') return prev;

      const baseXp = XP_PER_HOUR[mission.difficulty];
      const penaltyXp = -(baseXp * 2);
      const prog = processLevelUp(Math.max(0, prev.xp + penaltyXp), prev.level, prev.rank);

      const now = new Date();
      const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const punishment = pickPunishment(prev);

      return {
        ...prev,
        ...prog,
        missions: prev.missions.map(m =>
          m.id === id ? { ...m, status: 'Falhada' as const, startedAt: null } : m
        ),
        failureProtocols: [...prev.failureProtocols, {
          id: crypto.randomUUID(),
          triggeredAt: now.toISOString(),
          deadline: deadline.toISOString(),
          reason: `Missão falhada: ${mission.name}`,
          penaltyType: 'Exercício' as FailurePenaltyType,
          punishment,
          status: 'Pendente' as const,
        }],
        log: [{ date: now.toISOString(), action: `❌ Missão falhada: ${mission.name}`, xp: penaltyXp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, [pickPunishment]);

  const deleteMission = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      missions: prev.missions.filter(m => m.id !== id),
    }));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'history'>) => {
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { ...habit, id: crypto.randomUUID(), history: {} }],
    }));
  }, []);

  const markHabit = useCallback((id: string, status: 'done' | 'failed') => {
    const today = new Date().toISOString().split('T')[0];
    setState(prev => {
      const habit = prev.habits.find(h => h.id === id);
      if (!habit) return prev;

      const baseXp = XP_PER_HOUR[habit.difficulty] || 10;
      const xp = status === 'done' ? baseXp : -(baseXp * 2);
      const prog = processLevelUp(Math.max(0, prev.xp + xp), prev.level, prev.rank);

      let newProtocols = prev.failureProtocols;
      if (status === 'failed') {
        const now = new Date();
        const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const punishment = pickPunishment(prev);
        newProtocols = [...prev.failureProtocols, {
          id: crypto.randomUUID(),
          triggeredAt: now.toISOString(),
          deadline: deadline.toISOString(),
          reason: `Hábito falhado: ${habit.name}`,
          penaltyType: 'Exercício' as FailurePenaltyType,
          punishment,
          status: 'Pendente' as const,
        }];
      }

      return {
        ...prev,
        ...prog,
        habits: prev.habits.map(h =>
          h.id === id ? { ...h, history: { ...h.history, [today]: status } } : h
        ),
        failureProtocols: newProtocols,
        log: [{ date: new Date().toISOString(), action: `Hábito ${status === 'done' ? '✔️' : '❌'}: ${habit.name}`, xp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, [pickPunishment]);

  const deleteHabit = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
    }));
  }, []);

  const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    setState(prev => {
      let xp = 20;
      if (entry.text.length > 500) xp += 10;
      if (entry.deepMode) xp += 30;

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank);
      return {
        ...prev,
        ...prog,
        journal: [{ ...entry, id: crypto.randomUUID() }, ...prev.journal],
        log: [{ date: new Date().toISOString(), action: `Diário${entry.deepMode ? ' (Modo Profundo)' : ''}`, xp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const updateJournalEntry = useCallback((id: string, updates: Partial<Omit<JournalEntry, 'id'>>) => {
    setState(prev => ({
      ...prev,
      journal: prev.journal.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      journal: prev.journal.filter(e => e.id !== id),
    }));
  }, []);


  const addReward = useCallback((reward: Omit<Reward, 'id' | 'redeemed'>) => {
    setState(prev => ({
      ...prev,
      rewards: [...prev.rewards, { ...reward, id: crypto.randomUUID(), redeemed: false }],
    }));
  }, []);

  const redeemReward = useCallback((id: string) => {
    setState(prev => {
      const reward = prev.rewards.find(r => r.id === id);
      if (!reward || prev.gold < reward.cost || reward.redeemed) return prev;

      return {
        ...prev,
        gold: prev.gold - reward.cost,
        rewards: prev.rewards.map(r => r.id === id ? { ...r, redeemed: true } : r),
        log: [{ date: new Date().toISOString(), action: `Resgate: ${reward.name}`, xp: 0, gold: -reward.cost }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const deleteReward = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.filter(r => r.id !== id),
    }));
  }, []);

  const updateAwakening = useCallback((field: 'become' | 'reject' | 'pain', value: string) => {
    setState(prev => ({
      ...prev,
      awakening: { ...prev.awakening, [field]: value },
    }));
  }, []);

  const updateProfile = useCallback((updates: Partial<Pick<PlayerState, 'name' | 'title' | 'avatar'>>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const addChallenge = useCallback((challenge: Omit<Challenge, 'id' | 'failed'>) => {
    setState(prev => ({
      ...prev,
      challenges: [...prev.challenges, { ...challenge, id: crypto.randomUUID(), failed: false }],
    }));
  }, []);

  const completeStep = useCallback((challengeId: string, stepId: string) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => c.id === challengeId ? {
        ...c,
        steps: c.steps.map(s => s.id === stepId ? { ...s, completed: true } : s),
      } : c),
    }));
  }, []);

  const failChallenge = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => c.id === id ? {
        ...c,
        failed: true,
        steps: c.steps.map(s => ({ ...s, completed: false })),
      } : c),
    }));
  }, []);

  const addReflection = useCallback((entry: Omit<Reflection, 'id'>) => {
    setState(prev => {
      const prog = processLevelUp(prev.xp + 15, prev.level, prev.rank);
      return {
        ...prev,
        ...prog,
        reflections: [{ ...entry, id: crypto.randomUUID() }, ...prev.reflections],
        log: [{ date: new Date().toISOString(), action: 'Reflexão (Despertar)', xp: 15, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const deleteReflection = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      reflections: prev.reflections.filter(r => r.id !== id),
    }));
  }, []);

  const completeFailureProtocol = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      failureProtocols: prev.failureProtocols.map(fp =>
        fp.id === id ? { ...fp, status: 'Concluído' as const } : fp
      ),
      log: [{ date: new Date().toISOString(), action: 'Protocolo de Falha concluído', xp: 0, gold: 0 }, ...prev.log].slice(0, 100),
    }));
  }, []);

  const updateFailureProtocolPenalty = useCallback((id: string, penaltyType: FailurePenaltyType, customPenalty?: string) => {
    setState(prev => ({
      ...prev,
      failureProtocols: prev.failureProtocols.map(fp =>
        fp.id === id ? { ...fp, penaltyType, customPenalty } : fp
      ),
    }));
  }, []);

  // Check and apply expired failure protocols
  const checkExpiredProtocols = useCallback(() => {
    setState(prev => {
      const now = new Date();
      const pending = prev.failureProtocols.filter(fp => fp.status === 'Pendente' && new Date(fp.deadline) < now);
      if (pending.length === 0) return prev;

      // Apply heavy penalties: reset streak, lose 200 XP per expired protocol
      const totalPenalty = pending.length * -200;
      const prog = processLevelUp(Math.max(0, prev.xp + totalPenalty), prev.level, prev.rank);

      return {
        ...prev,
        ...prog,
        streak: 0,
        failureProtocols: prev.failureProtocols.map(fp =>
          fp.status === 'Pendente' && new Date(fp.deadline) < now
            ? { ...fp, status: 'Concluído' as const }
            : fp
        ),
        log: [
          { date: now.toISOString(), action: `💀 Protocolo(s) de Falha expirado(s): ${totalPenalty} XP, streak resetado`, xp: totalPenalty, gold: 0 },
          ...prev.log
        ].slice(0, 100),
      };
    });
  }, []);

  // Achievement checking
  const pendingAchievementRef = useRef<AchievementDef | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementDef | null>(null);

  useEffect(() => {
    const newOnes = checkNewAchievements(state, state.achievements || []);
    if (newOnes.length > 0) {
      const now = new Date().toISOString();
      const newAchievements = newOnes.map(a => ({ id: a.id, unlockedAt: now }));
      setState(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), ...newAchievements],
      }));
      // Show first new one as overlay
      setNewlyUnlocked(newOnes[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.streak, state.level, state.rank, state.missions, state.habits, state.journal, state.gold, state.failureProtocols, state.awakening]);

  const dismissAchievement = useCallback(() => setNewlyUnlocked(null), []);

  return {
    state,
    setState,
    defaultState,
    addXp,
    addGold,
    dailyCheckIn,
    addMission,
    startTimeMission,
    completeTimeMission,
    completeDailyMission,
    incrementCountMission,
    failMission,
    deleteMission,
    addHabit,
    markHabit,
    deleteHabit,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addReward,
    redeemReward,
    deleteReward,
    updateAwakening,
    updateProfile,
    addChallenge,
    completeStep,
    failChallenge,
    addReflection,
    deleteReflection,
    completeFailureProtocol,
    updateFailureProtocolPenalty,
    checkExpiredProtocols,
    newlyUnlocked,
    dismissAchievement,
  };
}
