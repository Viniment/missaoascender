import { useState, useEffect, useCallback } from 'react';

// Types
export interface Mission {
  id: string;
  name: string;
  type: 'Estudo' | 'Treino' | 'Leitura' | 'Trabalho' | 'Pessoal';
  difficulty: 'Fácil' | 'Normal' | 'Difícil';
  startTime: string;
  endTime: string;
  completed: boolean;
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
  rewards: { id: string; name: string; cost: number; icon: string }[];
}

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S', 'Monarca'];

function getRank(level: number): string {
  if (level < 5) return 'E';
  if (level < 10) return 'D';
  if (level < 20) return 'C';
  if (level < 35) return 'B';
  if (level < 50) return 'A';
  if (level < 75) return 'S';
  return 'Monarca';
}

function getXpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.3, level - 1));
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
  rewards: [
    { id: '1', name: 'Tempo Livre (1h)', cost: 150, icon: '🕐' },
    { id: '2', name: 'Jogar', cost: 50, icon: '🎮' },
    { id: '3', name: 'Filme / Série', cost: 100, icon: '🎬' },
    { id: '4', name: 'Lanche Especial', cost: 75, icon: '🍕' },
  ],
};

function loadState(): PlayerState {
  try {
    const saved = localStorage.getItem('ascensao-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check daily reset
      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastLogin && parsed.lastLogin !== today) {
        parsed.todayCheckedIn = false;
      }
      return { ...defaultState, ...parsed };
    }
  } catch {}
  return defaultState;
}

function saveState(state: PlayerState) {
  localStorage.setItem('ascensao-state', JSON.stringify(state));
}

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

      const newRank = getRank(newLevel);

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNext: newXpToNext,
        rank: newRank,
        log: [{ date: new Date().toISOString(), action, xp: amount, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const addGold = useCallback((amount: number, action: string) => {
    setState(prev => ({
      ...prev,
      gold: Math.max(0, prev.gold + amount),
      log: [{ date: new Date().toISOString(), action, xp: 0, gold: amount }, ...prev.log].slice(0, 100),
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

  const addMission = useCallback((mission: Omit<Mission, 'id' | 'completed'>) => {
    setState(prev => ({
      ...prev,
      missions: [...prev.missions, { ...mission, id: crypto.randomUUID(), completed: false }],
    }));
  }, []);

  const completeMission = useCallback((id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.completed) return prev;

      const start = new Date(`2000-01-01T${mission.startTime}`);
      const end = new Date(`2000-01-01T${mission.endTime}`);
      const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);

      const multiplier = mission.difficulty === 'Fácil' ? 0.2 : mission.difficulty === 'Normal' ? 0.5 : 1;
      const xp = Math.floor(minutes * multiplier);
      const gold = Math.floor((minutes / 60) * 50);

      return {
        ...prev,
        xp: prev.xp + xp,
        gold: prev.gold + gold,
        missions: prev.missions.map(m => m.id === id ? { ...m, completed: true, xpEarned: xp, goldEarned: gold } : m),
        log: [{ date: new Date().toISOString(), action: `Missão: ${mission.name}`, xp, gold }, ...prev.log].slice(0, 100),
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

  const redeemReward = useCallback((id: string) => {
    setState(prev => {
      const reward = prev.rewards.find(r => r.id === id);
      if (!reward || prev.gold < reward.cost) return prev;

      return {
        ...prev,
        gold: prev.gold - reward.cost,
        log: [{ date: new Date().toISOString(), action: `Resgate: ${reward.name}`, xp: 0, gold: -reward.cost }, ...prev.log].slice(0, 100),
      };
    });
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
    completeMission,
    deleteMission,
    addHabit,
    markHabit,
    deleteHabit,
    addJournalEntry,
    redeemReward,
    updateAwakening,
    updateProfile,
    addChallenge,
    completeStep,
    failChallenge,
  };
}
