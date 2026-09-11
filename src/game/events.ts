export type GameEventType =
  | "HABIT_COMPLETED"
  | "HABIT_UNDONE"
  | "MISSION_COMPLETED"
  | "URGE_RESISTED"
  | "THOUGHT_RECORDED"
  | "ENEMY_DEFEATED"
  | "UNLOCK_SKILL"
  | "COMPLETE_CAMPAIGN_STEP";

export interface GameEventBase<T extends GameEventType = GameEventType> {
  type: T;
  timestamp: string;
  source?: string;
}

export interface GameEventPayloads {
  HABIT_COMPLETED: { habitId: string; habitName?: string; xpDelta?: number; goldDelta?: number };
  HABIT_UNDONE: { habitId: string; habitName?: string; xpDelta?: number; goldDelta?: number };
  MISSION_COMPLETED: { missionId: string; missionName?: string; xpDelta?: number; goldDelta?: number };
  URGE_RESISTED: { context?: string; durationSeconds?: number; xpDelta?: number; goldDelta?: number };
  THOUGHT_RECORDED: { recordId: string; category?: string };
  ENEMY_DEFEATED: { enemyId: string; enemyName?: string };
  UNLOCK_SKILL: { skillId: string; skillName?: string };
  COMPLETE_CAMPAIGN_STEP: { campaignId: string; stepId: string };
}

export type GameEvent<T extends GameEventType = GameEventType> = GameEventBase<T> & {
  payload: GameEventPayloads[T];
};

type GameEventListener = (event: GameEvent) => void;

const listeners = new Set<GameEventListener>();

export function emitGameEvent<T extends GameEventType>(
  type: T,
  payload: GameEventPayloads[T],
  source?: string,
): GameEvent<T> {
  const event: GameEvent<T> = {
    type,
    timestamp: new Date().toISOString(),
    ...(source ? { source } : {}),
    payload,
  };

  listeners.forEach((listener) => listener(event));
  return event;
}

export function subscribeToGameEvents(listener: GameEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
