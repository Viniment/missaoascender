import type { GameEvent } from "./events";

export interface GameConsequences {
  event: GameEvent;
  notifications: string[];
  progression: {
    xpDelta: number;
    goldDelta: number;
  };
}

/**
 * Central, deterministic entry point for game events.
 *
 * Phase 1 intentionally does not mutate Supabase state or replace the
 * existing XP/gold/HP rules. It provides a stable seam for future modules
 * to consume game events without duplicating progression logic.
 */
export function processGameEvent(event: GameEvent): GameConsequences {
  const payload = event.payload as { xpDelta?: number; goldDelta?: number };

  return {
    event,
    notifications: [],
    progression: {
      xpDelta: payload.xpDelta ?? 0,
      goldDelta: payload.goldDelta ?? 0,
    },
  };
}
