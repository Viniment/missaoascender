import React, { createContext, useContext } from 'react';
import { useGameStore } from './gameStore';

type GameStoreReturn = ReturnType<typeof useGameStore>;

const GameContext = createContext<GameStoreReturn | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const store = useGameStore();
  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
}

export function useGame(): GameStoreReturn {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
