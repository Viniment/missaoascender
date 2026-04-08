import React, { createContext, useContext } from 'react';
import { useGameStore } from './gameStore';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useAuth } from '@/hooks/useAuth';

type GameStoreReturn = ReturnType<typeof useGameStore>;

interface GameContextType extends GameStoreReturn {
  resetProgress: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const store = useGameStore();
  
  const { resetProgress, deleteAccount } = usePlayerData(
    store.state,
    store.setState,
    store.defaultState,
  );

  return (
    <GameContext.Provider value={{ ...store, resetProgress, deleteAccount }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
