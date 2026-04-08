import { useState, useEffect, useCallback } from 'react';

// Types
export type MissionType = 'Tempo' | 'Diária' | 'Contagem';
export type MissionCategory = 'Estudo' | 'Trabalho' | 'Treino' | 'Leitura' | 'Espiritual' | 'Social' | 'Saúde' | 'Mental' | 'Financeiro' | 'Criatividade';
export type MissionDifficulty = 'Fácil' | 'Normal' | 'Difícil';
export type MissionStatus = 'Ativa' | 'Concluída';

export interface Mission {
  id: string;
  name: string;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  missionType: MissionType;
  status: MissionStatus;
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
  history: Record<string, 'done' | 'failed'>;
}

export interface JournalEntry {
  id: string;
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
}

function getRank(level: number): string {
  if (level < 5) return 'E';
  if (level < 10) return 'D';
  if (level < 20) return 'C';
  if (level < 35) return 'B';
  if (level < 50) return 'A';
  if (level < 75) return 'S';
  return 'Monarca';
}

// New escalating XP curve
function getXpToNext(level: number): number {
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 900;
  // After level 4: each level adds ~60% more
  return Math.floor(900 * Math.pow(1.6, level - 4));
}

const defaultState: PlayerState = {
  name: 'Jogador',
  title: 'Renascendo das Cinzas',
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
      return { ...defaultState, ...parsed };
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
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;

      while (newXp >= newXpToNext && amount > 0) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = getXpToNext(newLevel);
      }

      if (newXp < 0) newXp = 0;

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNext: newXpToNext,
        rank: getRank(newLevel),
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

      return {
        ...prev,
        todayCheckedIn: true,
        lastLogin: today,
        streak,
        missedDays,
        xp: Math.max(0, prev.xp + totalXp),
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

      return {
        ...prev,
        xp: prev.xp + xp,
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

      return {
        ...prev,
        xp: prev.xp + xp,
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

      return {
        ...prev,
        xp: prev.xp + xp,
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
      const xp = status === 'done' ? 50 : -100;
      return {
        ...prev,
        xp: Math.max(0, prev.xp + xp),
        habits: prev.habits.map(h =>
          h.id === id ? { ...h, history: { ...h.history, [today]: status } } : h
        ),
        log: [{ date: new Date().toISOString(), action: `Hábito ${status === 'done' ? '✔️' : '❌'}`, xp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

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

      return {
        ...prev,
        xp: prev.xp + xp,
        journal: [{ ...entry, id: crypto.randomUUID() }, ...prev.journal],
        log: [{ date: new Date().toISOString(), action: `Diário${entry.deepMode ? ' (Modo Profundo)' : ''}`, xp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // Custom rewards
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

  return {
    state,
    addXp,
    addGold,
    dailyCheckIn,
    addMission,
    startTimeMission,
    completeTimeMission,
    completeDailyMission,
    incrementCountMission,
    deleteMission,
    addHabit,
    markHabit,
    deleteHabit,
    addJournalEntry,
    addReward,
    redeemReward,
    deleteReward,
    updateAwakening,
    updateProfile,
    addChallenge,
    completeStep,
    failChallenge,
  };
}
