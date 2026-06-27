import { useState, useEffect, useCallback, useRef } from 'react';
import { checkNewAchievements, type AchievementDef } from './achievements';
import { getTodayBrasilia } from './utils';
import { defaultAttributes, applyAttributeXp, attributeForCategory, type AttributesMap, type AttributeId } from './attributes';
import { classXpMultiplier, type ChosenClass, type ClassId } from './classes';
import { rollLoot, type LootItem, type ActiveBuff } from './loot';
import { rollDungeonChallenges } from './dungeon';
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
  completedAt?: string;
  repeatable?: boolean;
  completionHistory?: { date: string; xp: number; gold: number; executedHours?: number; failed?: boolean }[];
  // Cooldown anti-misclick: timestamp do último settle (complete OU fail)
  lastSettledAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  /** Intenção emocional — por que esse hábito é um ato de amor-próprio. */
  intention?: string;
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

export interface VisionCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface VisionItem {
  id: string;
  categoryId: string;
  type: 'image' | 'text' | 'card';
  imageUrl?: string;
  text?: string;
  order: number;
  createdAt: string;
}

export interface StoicEntry {
  id: string;
  date: string;           // YYYY-MM-DD
  questions: string[];
  answers: string[];
  theme?: string;
  insight?: string;
  createdAt: string;
}

export type CounselTone = 'direto' | 'analitico' | 'firme';

export interface CounselEntry {
  id: string;
  date: string;          // ISO
  question: string;
  tone: CounselTone;
  advice: string;
  includedJournal: boolean;
}

export type AiIntensity = 'leve' | 'moderado' | 'agressivo';
export type InterventionFrequency = 'baixa' | 'media' | 'alta';

export interface AiSettings {
  intensity: AiIntensity;
  monsterEnabled: boolean;
  interventionFrequency: InterventionFrequency;
}

export interface MonsterState {
  hp: number;          // 0 (morto) — 100 (gigante). Procrastinação cresce o monstro.
  lastChange: string;  // ISO
  lastReason?: string; // ex: "Falhou hábito X" ou "Concluiu missão Y"
}

export interface IdentityFailureReflection {
  date: string;
  action: string;
  pattern: string;
  response?: string;
}

export interface DailyRitualState {
  lastCompletedDate: string;     // YYYY-MM-DD (Brasília)
  identityChosen: string;
  commitment: string;
  streak: number;                // dias consecutivos com ritual feito
}

export interface DisciplineStreakState {
  current: number;
  best: number;
  lastValidDate: string;         // último dia que contou (YYYY-MM-DD)
  lastBreakAt?: string;          // ISO da última quebra
  lastBreakReason?: string;
}

export type SabotagePatternKind = 'fuga_recorrente' | 'evitacao_area' | 'sabotagem_pos_pico';

export interface SabotagePattern {
  id: string;
  kind: SabotagePatternKind;
  pattern: string;               // descrição humana
  detectedAt: string;
  itemRef: string;               // nome do hábito/missão/categoria
  resolved: boolean;
  resolvedAt?: string;
  resolution?: 'agir' | 'refletir';
}

export interface IdentityState {
  enabled: boolean;
  newIdentity: string;
  codeOfConduct: string[];
  dominantTraits: string[];
  oldPatterns: string[];
  oldExcuses: string[];
  stabilityLevel: number;
  alignedActions: number;
  patternRelapses: number;
  lastRitualAt?: string;
  failureReflections: IdentityFailureReflection[];
}

// === EVOLUX — Fase 1: Identidade ===
export interface AlterEgo {
  name: string;
  idealAge?: number | null;
  appearance?: string;
  values: string[];
  lifeMission: string;
  identityPhrase: string;     // "Sou alguém que..."
  habits: string[];
  goals: string[];
  favoritePhrases: string[];
  lifestyle?: string;
  idealRoutine?: string;
  /** Texto livre, sem limite — biografia, história, manifestos, qualquer coisa sobre o Alter Ego. */
  notes?: string;
  completed: boolean;
}

export interface InnerEnemy {
  name: string;
  traits: string[];
  sabotagePhrases: string[];
  /** Texto livre, sem limite — táticas, gatilhos, padrões, história do inimigo. */
  notes?: string;
  completed: boolean;
}

export const defaultAlterEgo: AlterEgo = {
  name: 'Evolux',
  idealAge: null,
  appearance: '',
  values: [],
  lifeMission: '',
  identityPhrase: 'Sou alguém que honra a própria palavra.',
  habits: [],
  goals: [],
  favoritePhrases: [],
  lifestyle: '',
  idealRoutine: '',
  notes: '',
  completed: false,
};

export const defaultInnerEnemy: InnerEnemy = {
  name: '',
  traits: [],
  sabotagePhrases: [],
  notes: '',
  completed: false,
};

// === ÁREAS DE VIDA (Life Areas) ===
export interface LifeArea {
  id: string;
  name: string;
  icon: string;       // emoji
  color: string;      // tailwind text class or hex
  level: number;
  xp: number;
  xpToNext: number;
}

export const DEFAULT_LIFE_AREAS: Omit<LifeArea, 'id'>[] = [
  { name: 'Saúde',           icon: '❤️',  color: '#ef4444', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Mentalidade',     icon: '🧠',  color: '#a855f7', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Financeiro',      icon: '💰',  color: '#eab308', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Estudos',         icon: '📚',  color: '#3b82f6', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Disciplina',      icon: '🏋️',  color: '#f97316', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Sono',            icon: '😴',  color: '#6366f1', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Espiritualidade', icon: '🙏',  color: '#06b6d4', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Relacionamentos', icon: '❤️‍🔥', color: '#ec4899', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Trabalho',        icon: '💼',  color: '#64748b', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Foco',            icon: '🎯',  color: '#10b981', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Autoestima',      icon: '✨',  color: '#facc15', level: 1, xp: 0, xpToNext: 100 },
  { name: 'Liderança',       icon: '👑',  color: '#f59e0b', level: 1, xp: 0, xpToNext: 100 },
];

export function buildDefaultLifeAreas(): LifeArea[] {
  return DEFAULT_LIFE_AREAS.map(a => ({ ...a, id: crypto.randomUUID() }));
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
  visionCategories: VisionCategory[];
  visionItems: VisionItem[];
  visionStreak: number;
  visionLastViewedDate: string | null;
  theme: string;
  difficultyDivisor: number;
  confrontationHistory?: { date: string; trigger: 'mission' | 'habit' | 'protocol_expired'; itemName: string; message: string; dureza: 'leve' | 'medio' | 'brutal' }[];
  stoicEntries?: StoicEntry[];
  monster?: MonsterState;
  aiSettings?: AiSettings;
  counselHistory?: CounselEntry[];
  identity?: IdentityState;
  awakeningConfig?: AwakeningConfig;
  tabsCleanupV2?: boolean;
  // Tony Robbins layer
  dailyRitual?: DailyRitualState;
  disciplineStreak?: DisciplineStreakState;
  sabotagePatterns?: SabotagePattern[];
  honor?: number; // 0..1000
  // Histórico (rolling window) dos últimos ângulos psicológicos usados pela IA — evita repetição
  aiAngleHistory?: string[];
  _penaltyCompensated?: boolean;
  // === EVOLUX — Fase 1 ===
  alterEgo?: AlterEgo;
  innerEnemy?: InnerEnemy;
  // === Mentor Interno (chat IA) ===
  mentorConversations?: MentorConversation[];
  // === Trataka (concentração visual) ===
  tratakaSessions?: TratakaSession[];
  // === Despertar TCC (imersão diária de Terapia Cognitivo-Comportamental) ===
  cbtSessions?: CbtSession[];
  // === LIFE RPG — Atributos, Classes, Quests, Bosses, Dungeons, Loot ===
  attributes?: AttributesMap;
  chosenClass?: ChosenClass | null;
  pendingClassChoice?: boolean;
  bosses?: BossBattle[];
  dungeons?: DungeonDay[];
  inventory?: LootItem[];
  activeBuffs?: ActiveBuff[];
  redemptionQuests?: RedemptionQuest[];
  // === Áreas de Vida ===
  lifeAreas?: LifeArea[];
}


export interface BossTask {
  id: string;
  title: string;
  doneDates: string[]; // YYYY-MM-DD
}

export interface DefeatedBossSummary {
  daysTaken: number;
  totalTasksDone: number;
  xp: number;
  gold: number;
  bestCombo: number;
}

export interface BossBattle {
  id: string;
  name: string;
  emoji: string;
  description: string;
  weakness?: string;
  hp: number;
  maxHp: number;
  createdAt: string;
  defeatedAt?: string;
  // === NEW (sistema de batalha) ===
  days?: number;             // duração planejada
  tasksPerDay?: number;      // qtd de tarefas/dia
  tasks?: BossTask[];        // tarefas personalizadas
  combo?: number;            // combo atual de consistência
  bestCombo?: number;
  lastSettledDate?: string;  // último dia processado (regen/combo)
  defeatStats?: DefeatedBossSummary;
  // === Personalização emocional ===
  imageUrl?: string;
  story?: string;
  affectedAreaIds?: string[];
  howItAffectsMe?: string;
  whyDefeat?: string;
  customPhrases?: string[];
  difficulty?: 'Fácil' | 'Normal' | 'Difícil' | 'Brutal';
  mainColor?: string;
  hpBarColor?: string;
  reinforcementHistory?: { date: string; message: string; taskTitle?: string }[];
  pendingMockery?: { hpRegained: number; missedDays: number; at: string; reason?: 'missed_day' | 'self_betrayal'; taskTitle?: string; xpLost?: number; goldLost?: number };
  mockeryHistory?: { date: string; message: string; missedDays: number }[];
}



export interface DungeonChallengeState {
  id: string;
  title: string;
  desc: string;
  minutes: number;
  attribute: AttributeId;
  xp: number;
  done?: boolean;
}

export interface DungeonDay {
  date: string;
  challenges: DungeonChallengeState[];
  cleared?: boolean;
  lootId?: string;
}

export interface RedemptionQuest {
  id: string;
  reason: string;
  steps: string[];
  createdAt: string;
  completedAt?: string;
  dismissedAt?: string;
}

export type TratakaPoint = 'vela' | 'ponto-branco' | 'ponto-dourado' | 'zen';
export type TratakaSound = 'silencio' | 'chuva' | 'ruido-branco' | 'floresta' | 'tigela';

export interface TratakaSession {
  id: string;
  date: string;          // ISO
  durationSec: number;   // tempo efetivamente praticado
  point: TratakaPoint;
  sound: TratakaSound;
  focusBefore?: number;  // 1..10
  focusAfter?: number;   // 1..10
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface MentorConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: MentorMessage[];
}

export type CbtDistortion =
  | 'tudo-ou-nada' | 'catastrofizacao' | 'generalizacao' | 'leitura-mental'
  | 'adivinhacao' | 'raciocinio-emocional' | 'rotulacao' | 'personalizacao'
  | 'desqualificacao-positivo' | 'deverias';

export type CbtStage =
  | 'check-in' | 'situacao' | 'pensamentos' | 'crencas' | 'distorcoes'
  | 'socratico' | 'reframe' | 'experimento' | 'valores' | 'identidade' | 'concluida';

export interface CbtMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  stage?: CbtStage;
  createdAt: string;
}

export interface CbtSessionSummary {
  emotions?: string[];
  situation?: string;
  automaticThoughts?: string[];
  coreBeliefs?: string[];
  distortions?: CbtDistortion[];
  reframe?: string;
  experiment?: string;
  values?: string[];
  identityTrained?: string;
}

export interface CbtSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  stage: CbtStage;
  title: string;
  messages: CbtMessage[];
  summary?: CbtSessionSummary;
}

export type AwakeningIntensity = 'leve' | 'moderado' | 'intenso';
export type AwakeningFocus = 'auto' | 'disciplina' | 'emocao' | 'identidade' | 'clareza' | 'autoconfianca';
export type AwakeningQuantity = 'auto' | 3 | 5;
export type AwakeningMode = 'adaptativo' | 'manual';
export type AwakeningExerciseType = 'consciencia' | 'confronto' | 'reprogramacao' | 'direcionamento' | 'quebra';

export interface AwakeningConfig {
  intensity: AwakeningIntensity;
  focus: AwakeningFocus;
  quantity: AwakeningQuantity;
  mode: AwakeningMode;
  manualType?: AwakeningExerciseType;
}

export const defaultAwakeningConfig: AwakeningConfig = {
  intensity: 'moderado',
  focus: 'auto',
  quantity: 'auto',
  mode: 'adaptativo',
};

export const defaultIdentity: IdentityState = {
  enabled: false,
  newIdentity: '',
  codeOfConduct: [],
  dominantTraits: [],
  oldPatterns: [],
  oldExcuses: [],
  stabilityLevel: 0,
  alignedActions: 0,
  patternRelapses: 0,
  failureReflections: [],
};

function recalcStability(aligned: number, relapses: number): number {
  const total = aligned + relapses;
  if (total === 0) return 0;
  return Math.round((aligned / total) * 100);
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
const BASE_XP = [1000, 2000, 3500, 5500, 8000];

function getXpToNext(level: number, rank: string, divisor: number = 1): number {
  const rankIndex = RANKS.indexOf(rank as typeof RANKS[number]);
  const multiplier = Math.pow(1.2, Math.max(0, rankIndex));
  return Math.floor(BASE_XP[level - 1] * multiplier / (divisor || 1));
}

function processLevelUp(xp: number, level: number, rank: string, divisor: number = 1): { xp: number; level: number; rank: string; title: string; xpToNext: number } {
  let newXp = xp;
  let newLevel = level;
  let newRank = rank;

  while (newXp >= getXpToNext(newLevel, newRank, divisor)) {
    newXp -= getXpToNext(newLevel, newRank, divisor);
    if (newLevel >= 5) {
      const rankIdx = RANKS.indexOf(newRank as typeof RANKS[number]);
      if (rankIdx < RANKS.length - 1) {
        newRank = RANKS[rankIdx + 1];
        newLevel = 1;
      } else {
        newLevel = 5;
        newXp = Math.min(newXp, getXpToNext(5, newRank, divisor) - 1);
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
    xpToNext: getXpToNext(newLevel, newRank, divisor),
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
  xpToNext: 1000,
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
  visionCategories: [],
  visionItems: [],
  visionStreak: 0,
  visionLastViewedDate: null,
  theme: 'neon-purple',
  difficultyDivisor: 1,
  stoicEntries: [],
  monster: { hp: 0, lastChange: new Date().toISOString() },
  aiSettings: { intensity: 'moderado', monsterEnabled: true, interventionFrequency: 'media' },
  counselHistory: [],
  identity: defaultIdentity,
  awakeningConfig: defaultAwakeningConfig,
  _penaltyCompensated: true,
  honor: 50,
  disciplineStreak: { current: 0, best: 0, lastValidDate: '' },
  sabotagePatterns: [],
  alterEgo: defaultAlterEgo,
  innerEnemy: defaultInnerEnemy,
  mentorConversations: [],
  tratakaSessions: [],
  cbtSessions: [],
  attributes: defaultAttributes,
  chosenClass: null,
  pendingClassChoice: false,
  bosses: [],
  dungeons: [],
  inventory: [],
  activeBuffs: [],
  redemptionQuests: [],
  lifeAreas: buildDefaultLifeAreas(),

};

function clampHp(n: number) { return Math.max(0, Math.min(100, n)); }

/**
 * Compute monster HP from real history of habits and missions.
 * - Window: last 30 days
 * - Weight: events from last 7 days count 2×, days 8-30 count 1×
 * - HP = round(failures / (successes + failures) * 100)
 * - No data → HP = 0 (monster dormant)
 */
export function computeMonsterHp(state: PlayerState): number {
  const now = Date.now();
  const DAY = 86400000;
  const weight = (timestamp: number): number => {
    const ageDays = (now - timestamp) / DAY;
    if (ageDays < 0 || ageDays > 30) return 0;
    return ageDays <= 7 ? 2 : 1;
  };

  let successes = 0;
  let failures = 0;

  // Habits: history is { [yyyy-mm-dd]: 'done' | 'failed' }
  for (const habit of state.habits || []) {
    const history = habit.history || {};
    for (const [dateStr, status] of Object.entries(history)) {
      const ts = new Date(dateStr + 'T12:00:00').getTime();
      const w = weight(ts);
      if (!w) continue;
      if (status === 'done') successes += w;
      else if (status === 'failed') failures += w;
    }
  }

  // Missions: completionHistory entries + final status fallback
  for (const mission of state.missions || []) {
    const ch = mission.completionHistory || [];
    let counted = false;
    for (const entry of ch) {
      const ts = new Date(entry.date).getTime();
      const w = weight(ts);
      if (!w) continue;
      counted = true;
      if (entry.failed) failures += w;
      else successes += w;
    }
    // For non-repeatable missions without history, use final status + completedAt
    if (!counted && mission.completedAt && (mission.status === 'Concluída' || mission.status === 'Falhada')) {
      const ts = new Date(mission.completedAt).getTime();
      const w = weight(ts);
      if (w) {
        if (mission.status === 'Falhada') failures += w;
        else successes += w;
      }
    }
  }

  const total = successes + failures;
  if (total === 0) return 0;
  return clampHp(Math.round((failures / total) * 100));
}

function applyMonsterDelta(prev: PlayerState, _delta: number, reason: string): MonsterState {
  const current = prev.monster ?? { hp: 0, lastChange: new Date().toISOString() };
  if (prev.aiSettings?.monsterEnabled === false) return current;
  // HP is derived from history at read-time (see computeMonsterHp).
  // Here we only record the latest event reason for display.
  return {
    hp: current.hp, // placeholder; the consumer recomputes from history
    lastChange: new Date().toISOString(),
    lastReason: reason,
  };
}

export function normalizePlayerStateForToday(state: PlayerState): PlayerState {
  const today = getTodayBrasilia();

  // Backfill completedAt for missions completed or failed before the update
  if (state.missions) {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    state.missions = state.missions.map(m =>
      (m.status === 'Concluída' || m.status === 'Falhada') && !m.completedAt
        ? { ...m, completedAt: yesterday }
        : m
    );
  }

  if (!state.lastLogin || state.lastLogin === today || !state.todayCheckedIn) {
    return state;
  }

  return {
    ...state,
    todayCheckedIn: false,
  };
}

function loadState(): PlayerState {
  try {
    const saved = localStorage.getItem('ascensao-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = normalizePlayerStateForToday({ ...defaultState, ...parsed });
      if (merged.punishments) {
        merged.punishments = merged.punishments.filter(
          (p: any) => VALID_PUNISHMENT_CATEGORIES.includes(p.category)
        );
      }
      // Merge identity defaults for migration
      merged.identity = { ...defaultIdentity, ...(merged.identity || {}) };
      merged.awakeningConfig = { ...defaultAwakeningConfig, ...(merged.awakeningConfig || {}) };
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
  'Fácil': 3,
  'Normal': 5,
  'Difícil': 8,
};

const GOLD_PER_HOUR: Record<MissionDifficulty, number> = {
  'Fácil': 1,
  'Normal': 2,
  'Difícil': 3,
};

// === Recompensa por tarefa de Boss (mesma régua das missões, com Brutal) ===
const BOSS_XP_BY_DIFF: Record<'Fácil' | 'Normal' | 'Difícil' | 'Brutal', number> = {
  'Fácil': 3, 'Normal': 5, 'Difícil': 8, 'Brutal': 12,
};
const BOSS_GOLD_BY_DIFF: Record<'Fácil' | 'Normal' | 'Difícil' | 'Brutal', number> = {
  'Fácil': 1, 'Normal': 2, 'Difícil': 3, 'Brutal': 5,
};

export function computeBossTaskReward(
  difficulty: 'Fácil' | 'Normal' | 'Difícil' | 'Brutal' | undefined,
  combo: number,
  allDoneAfter: boolean,
) {
  const diff = difficulty || 'Normal';
  const dmg = combo >= 20 ? 4 : combo >= 10 ? 3 : combo >= 5 ? 2 : 1;
  const baseXp = BOSS_XP_BY_DIFF[diff];
  const baseGold = BOSS_GOLD_BY_DIFF[diff];
  const xp = baseXp * dmg + (allDoneAfter ? baseXp * 2 : 0);
  const gold = baseGold * dmg + (allDoneAfter ? baseGold : 0);
  return { dmg, xp, gold, baseXp, baseGold };
}

export function useGameStore() {
  const [state, setState] = useState<PlayerState>(loadState);

  useEffect(() => {
    const syncDailyCheckIn = () => {
      setState(prev => normalizePlayerStateForToday(prev));
    };

    syncDailyCheckIn();

    const interval = window.setInterval(syncDailyCheckIn, 60_000);
    window.addEventListener('focus', syncDailyCheckIn);
    document.addEventListener('visibilitychange', syncDailyCheckIn);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncDailyCheckIn);
      document.removeEventListener('visibilitychange', syncDailyCheckIn);
    };
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addXp = useCallback((amount: number, action: string) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      if (newXp < 0) newXp = 0;

      const result = processLevelUp(newXp, prev.level, prev.rank, prev.difficultyDivisor || 1);

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
      const today = getTodayBrasilia();
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

      // Consciência de autotraição — sem punição destruidora.
      // O custo emocional é nomeado, mas o XP perdido é suave: "uma queda não te apaga".
      let xpPenalty = 0;
      if (missedDays === 1) xpPenalty = -10;
      else if (missedDays >= 2) xpPenalty = -25;

      const xpGain = 10;
      let compensation = 0;
      if (!prev._penaltyCompensated) {
        compensation = 30;
      }
      const totalXp = xpGain + xpPenalty + compensation;

      const prog = processLevelUp(Math.max(0, prev.xp + totalXp), prev.level, prev.rank, prev.difficultyDivisor || 1);
      return {
        ...prev,
        _penaltyCompensated: true,
        todayCheckedIn: true,
        lastLogin: today,
        streak,
        missedDays,
        ...prog,
        log: [
          { date: new Date().toISOString(), action: `Hoje eu me escolhi${xpPenalty < 0 ? ` (${missedDays} dia(s) de distância de mim · ${xpPenalty} XP)` : ''}${compensation > 0 ? ` (+${compensation} XP)` : ''}`, xp: totalXp, gold: 0 },
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
  const startTimeMission = useCallback((id: string, startedAtIso?: string) => {
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m =>
        m.id === id ? { ...m, startedAt: startedAtIso || new Date().toISOString() } : m
      ),
    }));
  }, []);

  // Complete a time-based mission with manually adjusted hours
  const completeTimeMission = useCallback((id: string, executedHours: number) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      if (!mission || mission.status === 'Concluída') return prev;

      const xp = Math.floor(executedHours * XP_PER_HOUR[mission.difficulty]);
      const gold = Math.floor(executedHours * GOLD_PER_HOUR[mission.difficulty]);

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      return {
        ...prev,
        ...prog,
        gold: prev.gold + gold,
        monster: applyMonsterDelta(prev, -Math.max(3, Math.floor(executedHours * 2)), `Concluiu missão: ${mission.name}`),
        missions: prev.missions.map(m =>
          m.id === id ? (m.repeatable
            ? { ...m, executedHours: 0, xpEarned: xp, goldEarned: gold, startedAt: null, lastSettledAt: new Date().toISOString(), completionHistory: [...(m.completionHistory || []), { date: new Date().toISOString(), xp, gold, executedHours }] }
            : { ...m, status: 'Concluída' as const, executedHours, xpEarned: xp, goldEarned: gold, startedAt: null, completedAt: new Date().toISOString(), lastSettledAt: new Date().toISOString() }
          ) : m
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

      const today = getTodayBrasilia();
      if (mission.lastCompletedDate === today) return prev;

      const xp = mission.dailyXp || 5;
      const gold = mission.dailyGold || 5;

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      return {
        ...prev,
        ...prog,
        gold: prev.gold + gold,
        monster: applyMonsterDelta(prev, -3, `Diária: ${mission.name}`),
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

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      return {
        ...prev,
        ...prog,
        gold: prev.gold + gold,
        monster: applyMonsterDelta(prev, isComplete ? -5 : -2, `Contagem: ${mission.name}`),
        missions: prev.missions.map(m =>
          m.id === id ? {
            ...m,
            currentCount: (isComplete && m.repeatable) ? 0 : newCount,
            status: (isComplete && !m.repeatable) ? 'Concluída' as const : 'Ativa' as const,
            xpEarned: (m.xpEarned || 0) + xp,
            ...(isComplete && !m.repeatable ? { completedAt: new Date().toISOString() } : {}),
            ...(isComplete && m.repeatable ? { completionHistory: [...(m.completionHistory || []), { date: new Date().toISOString(), xp: (m.xpEarned || 0) + xp, gold: 0 }] } : {}),
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

      // ===== GUARDAS ANTI FALSO-POSITIVO (bug do jejum) =====
      const now = new Date();
      const nowMs = now.getTime();

      // Guarda 1: cooldown global de 5s após último settle (complete OU fail)
      if (mission.lastSettledAt) {
        const sinceSettle = nowMs - new Date(mission.lastSettledAt).getTime();
        if (sinceSettle < 5000) {
          if (typeof console !== 'undefined') console.warn('[failMission] bloqueado: cooldown pós-settle', mission.name);
          return prev;
        }
      }

      // Guarda 2: missão de Tempo repetível SEM timer rodando = nada para falhar
      if (mission.missionType === 'Tempo' && mission.repeatable && !mission.startedAt) {
        if (typeof console !== 'undefined') console.warn('[failMission] bloqueado: repetível sem timer ativo', mission.name);
        return prev;
      }

      // Guarda 3: entrada recente em completionHistory (< 5s) = acabou de concluir
      if (mission.repeatable && mission.completionHistory && mission.completionHistory.length > 0) {
        const last = mission.completionHistory[mission.completionHistory.length - 1];
        if (last && !last.failed && (nowMs - new Date(last.date).getTime()) < 5000) {
          if (typeof console !== 'undefined') console.warn('[failMission] bloqueado: completion < 5s', mission.name);
          return prev;
        }
      }

      const baseXp = XP_PER_HOUR[mission.difficulty];
      const penaltyXp = -(baseXp * 2);
      const prog = processLevelUp(Math.max(0, prev.xp + penaltyXp), prev.level, prev.rank, prev.difficultyDivisor || 1);

      const deadline = new Date(nowMs + 24 * 60 * 60 * 1000);
      const punishment = pickPunishment(prev);

      const newProtocols = punishment
        ? [...prev.failureProtocols, {
            id: crypto.randomUUID(),
            triggeredAt: now.toISOString(),
            deadline: deadline.toISOString(),
            reason: `Missão falhada: ${mission.name}`,
            penaltyType: 'Exercício' as FailurePenaltyType,
            punishment,
            status: 'Pendente' as const,
          }]
        : prev.failureProtocols;

      return {
        ...prev,
        ...prog,
        monster: applyMonsterDelta(prev, +12, `Falhou missão: ${mission.name}`),
        missions: prev.missions.map(m =>
          m.id === id ? (m.repeatable
            ? {
                ...m,
                startedAt: null,
                executedHours: 0,
                currentCount: m.missionType === 'Contagem' ? 0 : m.currentCount,
                lastSettledAt: now.toISOString(),
                completionHistory: [...(m.completionHistory || []), { date: now.toISOString(), xp: penaltyXp, gold: 0, failed: true }],
              }
            : { ...m, status: 'Falhada' as const, startedAt: null, completedAt: now.toISOString(), lastSettledAt: now.toISOString() }
          ) : m
        ),
        failureProtocols: newProtocols,
        log: [{ date: now.toISOString(), action: `❌ Missão falhada: ${mission.name}`, xp: penaltyXp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, [pickPunishment]);

  const appendAiAngle = useCallback((angle: string) => {
    if (!angle || typeof angle !== 'string') return;
    setState(prev => ({
      ...prev,
      aiAngleHistory: [...((prev.aiAngleHistory || []).slice(-9)), angle],
    }));
  }, []);

  const deleteMission = useCallback((id: string) => {
    setState(prev => {
      const mission = prev.missions.find(m => m.id === id);
      const reasonTag = mission ? `Missão falhada: ${mission.name}` : null;
      const newProtocols = reasonTag
        ? prev.failureProtocols.filter(fp => !(fp.status === 'Pendente' && fp.reason === reasonTag))
        : prev.failureProtocols;
      const cancelled = newProtocols.length < prev.failureProtocols.length;
      return {
        ...prev,
        missions: prev.missions.filter(m => m.id !== id),
        failureProtocols: newProtocols,
        log: cancelled && mission
          ? [{ date: new Date().toISOString(), action: `Protocolo de falha cancelado: ${mission.name}`, xp: 0, gold: 0 }, ...prev.log].slice(0, 100)
          : prev.log,
      };
    });
  }, []);

  const editMission = useCallback((id: string, updates: Partial<Omit<Mission, 'id' | 'status'>>) => {
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  }, []);

  const editHabit = useCallback((id: string, updates: Partial<Omit<Habit, 'id' | 'history'>>) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h),
    }));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'history'>) => {
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { ...habit, id: crypto.randomUUID(), history: {} }],
    }));
  }, []);

  const markHabit = useCallback((id: string, status: 'done' | 'failed', date?: string) => {
    const today = getTodayBrasilia();
    const targetDate = date || today;

    // Validate window: only today, today-1, today-2 allowed
    const todayMs = new Date(today + 'T12:00:00').getTime();
    const targetMs = new Date(targetDate + 'T12:00:00').getTime();
    const diffDays = Math.round((todayMs - targetMs) / 86400000);
    if (diffDays < 0 || diffDays > 2) return;

    setState(prev => {
      const habit = prev.habits.find(h => h.id === id);
      if (!habit) return prev;

      const baseXp = XP_PER_HOUR[habit.difficulty] || 5;
      const baseGold = GOLD_PER_HOUR[habit.difficulty] || 2;
      const previous = habit.history[targetDate];

      // If same status, no-op
      if (previous === status) return prev;

      // Compute net XP / gold delta considering reversal of previous status
      let xpDelta = 0;
      let goldDelta = 0;
      let monsterDelta = 0;

      // Revert previous (if any)
      if (previous === 'done') {
        xpDelta -= baseXp;
        goldDelta -= baseGold;
        monsterDelta += 4; // reverse the -4
      } else if (previous === 'failed') {
        xpDelta += baseXp * 2; // reverse the penalty
        monsterDelta -= 8; // reverse the +8
      }

      // Apply new status
      if (status === 'done') {
        xpDelta += baseXp;
        goldDelta += baseGold;
        monsterDelta -= 4;
      } else {
        xpDelta -= baseXp * 2;
        monsterDelta += 8;
      }

      const prog = processLevelUp(Math.max(0, prev.xp + xpDelta), prev.level, prev.rank, prev.difficultyDivisor || 1);

      // Only trigger failure protocol on first-time fail of TODAY (not corrections / past days)
      let newProtocols = prev.failureProtocols;
      let cancelledProtocol = false;
      // Auto-cancel pending failure protocol when correcting failed → done
      if (previous === 'failed' && status === 'done') {
        const reasonTag = `Hábito falhado: ${habit.name}`;
        const before = newProtocols.length;
        newProtocols = newProtocols.filter(
          fp => !(fp.status === 'Pendente' && fp.reason === reasonTag)
        );
        cancelledProtocol = newProtocols.length < before;
      }
      let activatedProtocol = false;
      const becameFailed = status === 'failed' && previous !== 'failed';
      if (becameFailed) {
        const punishment = pickPunishment(prev);
        if (punishment) {
          const now = new Date();
          const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          newProtocols = [...newProtocols, {
            id: crypto.randomUUID(),
            triggeredAt: now.toISOString(),
            deadline: deadline.toISOString(),
            reason: `Hábito falhado: ${habit.name}`,
            penaltyType: 'Exercício' as FailurePenaltyType,
            punishment,
            status: 'Pendente' as const,
          }];
          activatedProtocol = true;
        }
      }

      const dateLabel = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'ontem' : 'anteontem';
      const actionPrefix = previous ? 'Hábito corrigido' : 'Hábito';

      return {
        ...prev,
        ...prog,
        gold: Math.max(0, prev.gold + goldDelta),
        monster: applyMonsterDelta(prev, monsterDelta, `${actionPrefix} (${dateLabel}): ${habit.name}`),
        habits: prev.habits.map(h =>
          h.id === id ? { ...h, history: { ...h.history, [targetDate]: status } } : h
        ),
        failureProtocols: newProtocols,
        log: [
          ...(cancelledProtocol ? [{ date: new Date().toISOString(), action: `Protocolo de falha cancelado: ${habit.name}`, xp: 0, gold: 0 }] : []),
          ...(activatedProtocol ? [{ date: new Date().toISOString(), action: `Protocolo de falha ativado: ${habit.name}`, xp: 0, gold: 0 }] : []),
          { date: new Date().toISOString(), action: `${actionPrefix} ${status === 'done' ? '✔️' : '❌'} (${dateLabel}): ${habit.name}`, xp: xpDelta, gold: goldDelta },
          ...prev.log,
        ].slice(0, 100),
      };
    });
  }, [pickPunishment]);

  const deleteHabit = useCallback((id: string) => {
    setState(prev => {
      const habit = prev.habits.find(h => h.id === id);
      const reasonTag = habit ? `Hábito falhado: ${habit.name}` : null;
      const newProtocols = reasonTag
        ? prev.failureProtocols.filter(fp => !(fp.status === 'Pendente' && fp.reason === reasonTag))
        : prev.failureProtocols;
      const cancelled = newProtocols.length < prev.failureProtocols.length;
      return {
        ...prev,
        habits: prev.habits.filter(h => h.id !== id),
        failureProtocols: newProtocols,
        log: cancelled && habit
          ? [{ date: new Date().toISOString(), action: `Protocolo de falha cancelado: ${habit.name}`, xp: 0, gold: 0 }, ...prev.log].slice(0, 100)
          : prev.log,
      };
    });
  }, []);

  const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    setState(prev => {
      let xp = 20;
      if (entry.text.length > 500) xp += 10;
      if (entry.deepMode) xp += 30;

      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank, prev.difficultyDivisor || 1);
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
      const prog = processLevelUp(prev.xp + 15, prev.level, prev.rank, prev.difficultyDivisor || 1);
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

  const updateReflection = useCallback((id: string, patch: Partial<Pick<Reflection, 'question' | 'answerHtml'>>) => {
    setState(prev => ({
      ...prev,
      reflections: prev.reflections.map(r => r.id === id ? { ...r, ...patch } : r),
    }));
  }, []);

  const setAwakeningConfig = useCallback((partial: Partial<AwakeningConfig>) => {
    setState(prev => ({
      ...prev,
      awakeningConfig: { ...defaultAwakeningConfig, ...(prev.awakeningConfig || {}), ...partial },
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
      const prog = processLevelUp(Math.max(0, prev.xp + totalPenalty), prev.level, prev.rank, prev.difficultyDivisor || 1);

      return {
        ...prev,
        ...prog,
        streak: 0,
        monster: applyMonsterDelta(prev, +20 * pending.length, `Protocolo expirado x${pending.length}`),
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

  const addCounsel = useCallback((entry: Omit<CounselEntry, 'id' | 'date'>) => {
    setState(prev => {
      const newEntry: CounselEntry = {
        ...entry,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
      };
      const history = [newEntry, ...(prev.counselHistory || [])].slice(0, 50);
      return { ...prev, counselHistory: history };
    });
  }, []);

  const deleteCounsel = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      counselHistory: (prev.counselHistory || []).filter(c => c.id !== id),
    }));
  }, []);

  const updateAiSettings = useCallback((updates: Partial<AiSettings>) => {
    setState(prev => ({
      ...prev,
      aiSettings: { ...(prev.aiSettings || { intensity: 'moderado', monsterEnabled: true, interventionFrequency: 'media' }), ...updates },
    }));
  }, []);

  // ===== Identity System =====
  const updateIdentity = useCallback((updates: Partial<IdentityState>) => {
    setState(prev => {
      const cur = prev.identity || defaultIdentity;
      const next = { ...cur, ...updates };
      next.stabilityLevel = recalcStability(next.alignedActions, next.patternRelapses);
      return { ...prev, identity: next };
    });
  }, []);

  const toggleIdentitySystem = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      identity: { ...(prev.identity || defaultIdentity), enabled },
    }));
  }, []);

  const logAlignedAction = useCallback(() => {
    setState(prev => {
      const cur = prev.identity || defaultIdentity;
      if (!cur.enabled) return prev;
      const aligned = cur.alignedActions + 1;
      return {
        ...prev,
        identity: {
          ...cur,
          alignedActions: aligned,
          stabilityLevel: recalcStability(aligned, cur.patternRelapses),
        },
      };
    });
  }, []);

  const logPatternRelapse = useCallback(() => {
    setState(prev => {
      const cur = prev.identity || defaultIdentity;
      if (!cur.enabled) return prev;
      const relapses = cur.patternRelapses + 1;
      return {
        ...prev,
        identity: {
          ...cur,
          patternRelapses: relapses,
          stabilityLevel: recalcStability(cur.alignedActions, relapses),
        },
      };
    });
  }, []);

  const addFailureReflection = useCallback((reflection: IdentityFailureReflection) => {
    setState(prev => {
      const cur = prev.identity || defaultIdentity;
      const reflections = [reflection, ...cur.failureReflections].slice(0, 50);
      const relapses = cur.patternRelapses + 1;
      return {
        ...prev,
        identity: {
          ...cur,
          failureReflections: reflections,
          patternRelapses: relapses,
          stabilityLevel: recalcStability(cur.alignedActions, relapses),
        },
      };
    });
  }, []);

  const markRitualDone = useCallback(() => {
    setState(prev => ({
      ...prev,
      identity: { ...(prev.identity || defaultIdentity), lastRitualAt: new Date().toISOString() },
    }));
  }, []);

  // ===== Honor =====
  const addHonor = useCallback((delta: number, reason: string) => {
    setState(prev => {
      const cur = typeof prev.honor === 'number' ? prev.honor : 50;
      const next = Math.max(0, Math.min(1000, cur + delta));
      return {
        ...prev,
        honor: next,
        log: [{ date: new Date().toISOString(), action: `Honra ${delta >= 0 ? '+' : ''}${delta}: ${reason}`, xp: 0, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // ===== Discipline streak =====
  const bumpDisciplineStreak = useCallback(() => {
    setState(prev => {
      const today = getTodayBrasilia();
      const ds = prev.disciplineStreak || { current: 0, best: 0, lastValidDate: '' };
      if (ds.lastValidDate === today) return prev;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const isConsecutive = ds.lastValidDate === yesterday;
      const current = isConsecutive ? ds.current + 1 : 1;
      const best = Math.max(ds.best, current);
      return {
        ...prev,
        disciplineStreak: { ...ds, current, best, lastValidDate: today },
      };
    });
  }, []);

  const breakDisciplineStreak = useCallback((reason: string) => {
    setState(prev => {
      const ds = prev.disciplineStreak || { current: 0, best: 0, lastValidDate: '' };
      if (ds.current === 0) return prev;
      return {
        ...prev,
        disciplineStreak: {
          ...ds,
          current: 0,
          lastBreakAt: new Date().toISOString(),
          lastBreakReason: reason,
        },
        log: [{ date: new Date().toISOString(), action: `🩸 Sequência de Disciplina quebrada: ${reason}`, xp: 0, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // ===== Daily ritual =====
  const completeDailyRitual = useCallback((payload: { identityChosen: string; commitment: string }) => {
    setState(prev => {
      const today = getTodayBrasilia();
      const cur = prev.dailyRitual;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const streak = cur?.lastCompletedDate === yesterday ? cur.streak + 1 : 1;
      const honorCur = typeof prev.honor === 'number' ? prev.honor : 50;
      const ds = prev.disciplineStreak || { current: 0, best: 0, lastValidDate: '' };
      const dsToday = ds.lastValidDate === today
        ? ds
        : (() => {
            const isConsec = ds.lastValidDate === yesterday;
            const current = isConsec ? ds.current + 1 : 1;
            return { ...ds, current, best: Math.max(ds.best, current), lastValidDate: today };
          })();

      const xp = 25;
      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank, prev.difficultyDivisor || 1);

      return {
        ...prev,
        ...prog,
        honor: Math.min(1000, honorCur + 5),
        disciplineStreak: dsToday,
        dailyRitual: {
          lastCompletedDate: today,
          identityChosen: payload.identityChosen,
          commitment: payload.commitment,
          streak,
        },
        identity: { ...(prev.identity || defaultIdentity), lastRitualAt: new Date().toISOString() },
        log: [{ date: new Date().toISOString(), action: `🌅 Ritual de Despertar (${payload.identityChosen})`, xp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // ===== Sabotage detector =====
  const detectAndRegisterSabotage = useCallback(() => {
    setState(prev => {
      const now = new Date();
      const nowMs = now.getTime();
      const DAY = 86400000;
      const within7d = (iso: string) => (nowMs - new Date(iso).getTime()) <= 7 * DAY;

      const existing = prev.sabotagePatterns || [];
      const stillActive = existing.filter(p => !p.resolved && within7d(p.detectedAt));
      const additions: SabotagePattern[] = [];

      const isAlreadyActive = (kind: SabotagePatternKind, itemRef: string) =>
        stillActive.some(p => p.kind === kind && p.itemRef === itemRef);

      // 1. fuga_recorrente: hábito falha 3+ vezes em 7d
      for (const h of prev.habits || []) {
        let fails = 0;
        for (const [d, s] of Object.entries(h.history || {})) {
          if (s === 'failed') {
            const ts = new Date(`${d}T12:00:00`).getTime();
            if (nowMs - ts <= 7 * DAY) fails++;
          }
        }
        if (fails >= 3 && !isAlreadyActive('fuga_recorrente', h.name)) {
          additions.push({
            id: crypto.randomUUID(),
            kind: 'fuga_recorrente',
            pattern: `Você falhou "${h.name}" ${fails}× nos últimos 7 dias. Isso não é cansaço — é fuga.`,
            detectedAt: now.toISOString(),
            itemRef: h.name,
            resolved: false,
          });
        }
      }

      // 2. evitacao_area: 4+ missões falhadas mesma categoria em 7d
      const failsByCat: Record<string, number> = {};
      for (const m of prev.missions || []) {
        const events: { date: string; failed: boolean }[] = [];
        if (m.status === 'Falhada' && m.completedAt) events.push({ date: m.completedAt, failed: true });
        for (const h of m.completionHistory || []) if (h.failed) events.push({ date: h.date, failed: true });
        for (const e of events) {
          if (nowMs - new Date(e.date).getTime() <= 7 * DAY) {
            failsByCat[m.category] = (failsByCat[m.category] || 0) + 1;
          }
        }
      }
      for (const [cat, n] of Object.entries(failsByCat)) {
        if (n >= 4 && !isAlreadyActive('evitacao_area', cat)) {
          additions.push({
            id: crypto.randomUUID(),
            kind: 'evitacao_area',
            pattern: `${n} falhas em "${cat}" esta semana. Você está evitando uma área inteira da vida.`,
            detectedAt: now.toISOString(),
            itemRef: cat,
            resolved: false,
          });
        }
      }

      // 3. sabotagem_pos_pico: discipline streak quebrou após >=7
      const ds = prev.disciplineStreak;
      if (ds?.lastBreakAt && ds.lastBreakReason && nowMs - new Date(ds.lastBreakAt).getTime() <= DAY) {
        const wasHigh = (ds.best ?? 0) >= 7;
        const tag = `pico:${ds.lastBreakAt}`;
        if (wasHigh && !existing.some(p => p.itemRef === tag)) {
          additions.push({
            id: crypto.randomUUID(),
            kind: 'sabotagem_pos_pico',
            pattern: `Você chegou a ${ds.best} dias e destruiu tudo em um. Esse padrão se chama autossabotagem pós-pico.`,
            detectedAt: now.toISOString(),
            itemRef: tag,
            resolved: false,
          });
        }
      }

      if (additions.length === 0) return prev;
      return { ...prev, sabotagePatterns: [...existing, ...additions].slice(-50) };
    });
  }, []);

  const resolveSabotagePattern = useCallback((id: string, resolution: 'agir' | 'refletir') => {
    setState(prev => {
      const cur = prev.sabotagePatterns || [];
      const honorCur = typeof prev.honor === 'number' ? prev.honor : 50;
      const honorDelta = resolution === 'agir' ? 10 : 3;
      return {
        ...prev,
        honor: Math.min(1000, honorCur + honorDelta),
        sabotagePatterns: cur.map(p =>
          p.id === id ? { ...p, resolved: true, resolvedAt: new Date().toISOString(), resolution } : p
        ),
      };
    });
  }, []);

  // Sabotage detector + discipline-streak break: roda quando hábitos/missões mudam
  useEffect(() => {
    detectAndRegisterSabotage();
    // Quebra streak de disciplina se houve falha hoje (hábito ou missão)
    const today = getTodayBrasilia();
    let failedToday = false;
    for (const h of state.habits || []) if (h.history?.[today] === 'failed') failedToday = true;
    for (const m of state.missions || []) {
      if (m.completedAt && m.status === 'Falhada' && m.completedAt.slice(0, 10) === today) failedToday = true;
      for (const ch of m.completionHistory || []) if (ch.failed && ch.date.slice(0, 10) === today) failedToday = true;
    }
    if (failedToday && (state.disciplineStreak?.current ?? 0) > 0 && state.disciplineStreak?.lastValidDate !== today) {
      breakDisciplineStreak('Falha registrada hoje');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.habits, state.missions]);


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

  // === EVOLUX — Fase 1: setters ===
  const updateAlterEgo = useCallback((patch: Partial<AlterEgo>) => {
    setState(prev => ({
      ...prev,
      alterEgo: { ...defaultAlterEgo, ...(prev.alterEgo || {}), ...patch },
    }));
  }, []);

  const updateInnerEnemy = useCallback((patch: Partial<InnerEnemy>) => {
    setState(prev => ({
      ...prev,
      innerEnemy: { ...defaultInnerEnemy, ...(prev.innerEnemy || {}), ...patch },
    }));
  }, []);

  const completeIdentityOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      alterEgo: { ...defaultAlterEgo, ...(prev.alterEgo || {}), completed: true },
      innerEnemy: { ...defaultInnerEnemy, ...(prev.innerEnemy || {}), completed: true },
    }));
  }, []);

  // === Mentor Interno: chat conversations ===
  const createMentorConversation = useCallback((firstMessage?: string): string => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    const title = firstMessage
      ? firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '')
      : 'Nova conversa';
    const convo: MentorConversation = { id, title, createdAt: now, updatedAt: now, messages: [] };
    setState(prev => ({
      ...prev,
      mentorConversations: [convo, ...(prev.mentorConversations || [])],
    }));
    return id;
  }, []);

  const appendMentorMessage = useCallback((conversationId: string, msg: Omit<MentorMessage, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => {
    const now = new Date().toISOString();
    const fullMsg: MentorMessage = {
      id: msg.id || ((typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      createdAt: msg.createdAt || now,
      role: msg.role,
      content: msg.content,
    };
    setState(prev => ({
      ...prev,
      mentorConversations: (prev.mentorConversations || []).map(c => {
        if (c.id !== conversationId) return c;
        const messages = [...c.messages, fullMsg];
        const isFirstUser = c.messages.length === 0 && msg.role === 'user';
        return {
          ...c,
          messages,
          updatedAt: now,
          title: isFirstUser ? (msg.content.slice(0, 60) + (msg.content.length > 60 ? '…' : '')) : c.title,
        };
      }),
    }));
  }, []);

  const deleteMentorConversation = useCallback((conversationId: string) => {
    setState(prev => ({
      ...prev,
      mentorConversations: (prev.mentorConversations || []).filter(c => c.id !== conversationId),
    }));
  }, []);

  const deleteMentorMessage = useCallback((conversationId: string, messageId: string) => {
    setState(prev => ({
      ...prev,
      mentorConversations: (prev.mentorConversations || []).map(c =>
        c.id !== conversationId ? c : { ...c, messages: c.messages.filter(m => m.id !== messageId) }
      ),
    }));
  }, []);


  const addTratakaSession = useCallback((session: Omit<TratakaSession, 'id'>) => {
    setState(prev => ({
      ...prev,
      tratakaSessions: [
        { ...session, id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2) },
        ...(prev.tratakaSessions || []),
      ].slice(0, 500),
    }));
  }, []);

  const deleteTratakaSession = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tratakaSessions: (prev.tratakaSessions || []).filter(s => s.id !== id),
    }));
  }, []);

  // === CBT (Despertar TCC) ===
  const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID() : Math.random().toString(36).slice(2);

  const createCbtSession = useCallback((): string => {
    const id = newId();
    const now = new Date().toISOString();
    const session: CbtSession = {
      id, createdAt: now, updatedAt: now, stage: 'check-in',
      title: `Sessão ${new Date(now).toLocaleDateString('pt-BR')}`,
      messages: [],
    };
    setState(prev => ({ ...prev, cbtSessions: [session, ...(prev.cbtSessions || [])] }));
    return id;
  }, []);

  const appendCbtMessage = useCallback((sessionId: string, msg: Omit<CbtMessage, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => {
    const now = new Date().toISOString();
    const full: CbtMessage = { id: msg.id ?? newId(), createdAt: msg.createdAt ?? now, role: msg.role, content: msg.content, stage: msg.stage };
    setState(prev => ({
      ...prev,
      cbtSessions: (prev.cbtSessions || []).map(s =>
        s.id !== sessionId ? s : { ...s, updatedAt: now, messages: [...s.messages, full] }
      ),
    }));
  }, []);

  const updateCbtSession = useCallback((sessionId: string, patch: Partial<Pick<CbtSession, 'stage' | 'summary' | 'completedAt' | 'title'>>) => {
    setState(prev => ({
      ...prev,
      cbtSessions: (prev.cbtSessions || []).map(s =>
        s.id !== sessionId ? s : { ...s, ...patch, updatedAt: new Date().toISOString() }
      ),
    }));
  }, []);

  const deleteCbtSession = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, cbtSessions: (prev.cbtSessions || []).filter(s => s.id !== sessionId) }));
  }, []);

  // ===== LIFE RPG: Atributos =====
  const gainAttributeXp = useCallback((attr: AttributeId, amount: number, reason?: string) => {
    setState(prev => {
      const cur = prev.attributes || defaultAttributes;
      const before = cur[attr] || { xp: 0, level: 1 };
      const { state: after, leveledUp } = applyAttributeXp(before, amount);
      return {
        ...prev,
        attributes: { ...cur, [attr]: after },
        log: leveledUp
          ? [{ date: new Date().toISOString(), action: `🌟 Atributo ${attr.toUpperCase()} subiu para Nv ${after.level}`, xp: 0, gold: 0 }, ...prev.log].slice(0, 100)
          : prev.log,
      };
    });
  }, []);

  // Classe
  const chooseClass = useCallback((id: ClassId) => {
    setState(prev => ({
      ...prev,
      chosenClass: { id, chosenAt: new Date().toISOString() },
      pendingClassChoice: false,
      log: [{ date: new Date().toISOString(), action: `⟐ Tornei-me ${id}`, xp: 0, gold: 0 }, ...prev.log].slice(0, 100),
    }));
  }, []);

  const dismissClassChoice = useCallback(() => {
    setState(prev => ({ ...prev, pendingClassChoice: false }));
  }, []);

  // Trigger pending class choice when reaching level 5+ and no class yet
  useEffect(() => {
    if (!state.chosenClass && state.level >= 5 && state.rank !== 'E' && !state.pendingClassChoice) {
      setState(p => ({ ...p, pendingClassChoice: true }));
    }
    // Also at rank D level 1+ (after rank up)
    if (!state.chosenClass && state.rank !== 'E' && !state.pendingClassChoice) {
      setState(p => ({ ...p, pendingClassChoice: true }));
    }
  }, [state.level, state.rank, state.chosenClass, state.pendingClassChoice]);

  // ===== BOSS BATTLES (sistema completo) =====
  // Dano por tarefa baseado no combo: 0=1, 5=2, 10=3, 20=4 (cap 4)
  const damageFromCombo = (combo: number) => {
    if (combo >= 20) return 4;
    if (combo >= 10) return 3;
    if (combo >= 5) return 2;
    return 1;
  };
  // Regen do boss baseado no % de tarefas feitas no dia
  const regenFromPct = (pct: number) => {
    if (pct >= 1) return 0;
    if (pct >= 0.75) return 1;
    if (pct >= 0.5) return 2;
    if (pct >= 0.25) return 3;
    return 4;
  };

  // Cria boss com tarefas. HP = days * tasks.length
  const addBoss = useCallback((b: {
    name: string; emoji: string; description: string; weakness?: string;
    days: number; tasks: { title: string }[];
    imageUrl?: string; story?: string; affectedAreaIds?: string[];
    howItAffectsMe?: string; whyDefeat?: string; customPhrases?: string[];
    difficulty?: 'Fácil' | 'Normal' | 'Difícil' | 'Brutal';
    mainColor?: string; hpBarColor?: string;
  }) => {
    setState(prev => {
      const tasks: BossTask[] = b.tasks
        .filter(t => t.title.trim())
        .map(t => ({ id: crypto.randomUUID(), title: t.title.trim(), doneDates: [] }));
      const maxHp = Math.max(1, b.days * tasks.length);
      const today = getTodayBrasilia();
      const boss: BossBattle = {
        id: crypto.randomUUID(),
        name: b.name, emoji: b.emoji, description: b.description, weakness: b.weakness,
        hp: maxHp, maxHp,
        createdAt: new Date().toISOString(),
        days: b.days, tasksPerDay: tasks.length, tasks,
        combo: 0, bestCombo: 0,
        lastSettledDate: today,
        imageUrl: b.imageUrl,
        story: b.story,
        affectedAreaIds: b.affectedAreaIds || [],
        howItAffectsMe: b.howItAffectsMe,
        whyDefeat: b.whyDefeat,
        customPhrases: b.customPhrases || [],
        difficulty: b.difficulty,
        mainColor: b.mainColor,
        hpBarColor: b.hpBarColor,
        reinforcementHistory: [],
      };
      return { ...prev, bosses: [...(prev.bosses || []), boss] };
    });
  }, []);


  // Concluir tarefa do dia. Damage = damageFromCombo(combo).
  // Se todas as tarefas do dia ficarem completas, combo +1.
  const completeBossTask = useCallback((bossId: string, taskId: string, date?: string) => {
    setState(prev => {
      const dateISO = date || getTodayBrasilia();
      const bosses = prev.bosses || [];
      const idx = bosses.findIndex(b => b.id === bossId);
      if (idx === -1) return prev;
      const boss = bosses[idx];
      if (boss.defeatedAt || !boss.tasks) return prev;
      const task = boss.tasks.find(t => t.id === taskId);
      if (!task || task.doneDates.includes(dateISO)) return prev;

      const combo = boss.combo || 0;
      const newTasks = boss.tasks.map(t => t.id === taskId
        ? { ...t, doneDates: [...t.doneDates, dateISO] } : t);
      const allDoneToday = newTasks.every(t => t.doneDates.includes(dateISO));
      const newCombo = allDoneToday ? combo + 1 : combo;
      const reward = computeBossTaskReward(boss.difficulty, combo, allDoneToday);
      const dmg = reward.dmg;
      const newHp = Math.max(0, boss.hp - dmg);
      const updated: BossBattle = {
        ...boss,
        tasks: newTasks,
        hp: newHp,
        combo: newCombo,
        bestCombo: Math.max(boss.bestCombo || 0, newCombo),
      };
      const newBosses = [...bosses];
      newBosses[idx] = updated;
      // === Recompensa: tarefa de boss = missão, com base na dificuldade ===
      const xpGain = reward.xp;
      const goldGain = reward.gold;
      const prog = processLevelUp(prev.xp + xpGain, prev.level, prev.rank, prev.difficultyDivisor || 1);

      // === Evoluir áreas de vida afetadas (por mini-ação) ===
      const areas = prev.lifeAreas || buildDefaultLifeAreas();
      const affected = (boss.affectedAreaIds || []).filter(aid => areas.some(a => a.id === aid));
      const perAreaXp = affected.length
        ? Math.max(2, Math.floor(xpGain / Math.max(1, affected.length)))
        : 0;
      const newAreas = affected.length
        ? areas.map(a => {
            if (!affected.includes(a.id)) return a;
            let lvl = a.level;
            let curXp = a.xp + perAreaXp;
            let toNext = a.xpToNext;
            while (curXp >= toNext) {
              curXp -= toNext;
              lvl += 1;
              toNext = Math.floor(toNext * 1.25);
            }
            return { ...a, level: lvl, xp: curXp, xpToNext: toNext };
          })
        : areas;

      return {
        ...prev,
        ...prog,
        gold: prev.gold + goldGain,
        bosses: newBosses,
        lifeAreas: newAreas,
        log: [{ date: new Date().toISOString(), action: `⚔️ ${boss.name}: -${dmg} HP (${task.title})`, xp: xpGain, gold: goldGain }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // Desfazer marca da tarefa (corrige clique errado) — devolve HP equivalente
  const uncompleteBossTask = useCallback((bossId: string, taskId: string, date?: string) => {
    setState(prev => {
      const dateISO = date || getTodayBrasilia();
      const bosses = prev.bosses || [];
      const idx = bosses.findIndex(b => b.id === bossId);
      if (idx === -1) return prev;
      const boss = bosses[idx];
      if (!boss.tasks) return prev;
      const task = boss.tasks.find(t => t.id === taskId);
      if (!task || !task.doneDates.includes(dateISO)) return prev;
      const wasAllDone = boss.tasks.every(t => t.doneDates.includes(dateISO));
      const newTasks = boss.tasks.map(t => t.id === taskId
        ? { ...t, doneDates: t.doneDates.filter(d => d !== dateISO) } : t);
      const combo = boss.combo || 0;
      const newCombo = wasAllDone && combo > 0 ? combo - 1 : combo;
      const refund = damageFromCombo(combo);
      const newHp = Math.min(boss.maxHp, boss.hp + refund);
      const newBosses = [...bosses];
      newBosses[idx] = { ...boss, tasks: newTasks, hp: newHp, combo: newCombo };
      // === Reverter recompensas que o usuário ganhou ao concluir ===
      const comboAtCompletion = Math.max(0, wasAllDone ? combo - 1 : combo);
      const reward = computeBossTaskReward(boss.difficulty, comboAtCompletion, wasAllDone);
      const xpBack = reward.xp;
      const goldBack = reward.gold;
      const newXp = Math.max(0, prev.xp - xpBack);
      const newGold = Math.max(0, prev.gold - goldBack);
      const prog = processLevelUp(newXp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      // Reverter XP das áreas de vida afetadas
      const areas = prev.lifeAreas || buildDefaultLifeAreas();
      const affected = (boss.affectedAreaIds || []).filter(aid => areas.some(a => a.id === aid));
      const perAreaXpBack = affected.length
        ? Math.max(2, Math.floor(xpBack / Math.max(1, affected.length)))
        : 0;
      const newAreas = affected.length
        ? areas.map(a => {
            if (!affected.includes(a.id)) return a;
            let lvl = a.level;
            let curXp = a.xp - perAreaXpBack;
            let toNext = a.xpToNext;
            while (curXp < 0 && lvl > 1) {
              lvl -= 1;
              toNext = Math.max(100, Math.floor(toNext / 1.25));
              curXp += toNext;
            }
            if (curXp < 0) curXp = 0;
            return { ...a, level: lvl, xp: curXp, xpToNext: toNext };
          })
        : areas;
      return {
        ...prev,
        ...prog,
        gold: newGold,
        bosses: newBosses,
        lifeAreas: newAreas,
        log: [{ date: new Date().toISOString(), action: `↩️ ${boss.name}: tarefa desmarcada (${task.title})`, xp: -xpBack, gold: -goldBack }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // CRUD tarefas
  const addBossTask = useCallback((bossId: string, title: string) => {
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => b.id === bossId && b.tasks
        ? { ...b, tasks: [...b.tasks, { id: crypto.randomUUID(), title, doneDates: [] }], tasksPerDay: (b.tasks.length + 1) }
        : b),
    }));
  }, []);
  const editBossTask = useCallback((bossId: string, taskId: string, title: string) => {
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => b.id === bossId && b.tasks
        ? { ...b, tasks: b.tasks.map(t => t.id === taskId ? { ...t, title } : t) }
        : b),
    }));
  }, []);
  const removeBossTask = useCallback((bossId: string, taskId: string) => {
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => b.id === bossId && b.tasks
        ? { ...b, tasks: b.tasks.filter(t => t.id !== taskId), tasksPerDay: Math.max(1, b.tasks.length - 1) }
        : b),
    }));
  }, []);

  // Regen inteligente: roda quando o dia muda. Para cada dia entre lastSettledDate e hoje
  // (exclusivo de hoje), aplica regen se < 100% e zera combo se < 100%.
  const settleBossesForToday = useCallback(() => {
    setState(prev => {
      const today = getTodayBrasilia();
      const bosses = prev.bosses || [];
      let changed = false;
      const newBosses = bosses.map(b => {
        if (b.defeatedAt || !b.tasks || !b.lastSettledDate) return b;
        if (b.lastSettledDate >= today) return b;
        let hp = b.hp;
        let combo = b.combo || 0;
        let regained = 0;
        let missedDays = 0;
        const start = new Date(b.lastSettledDate + 'T00:00:00');
        const end = new Date(today + 'T00:00:00');
        const cursor = new Date(start);
        cursor.setDate(cursor.getDate() + 1);
        while (cursor < end) {
          const d = cursor.toISOString().slice(0, 10);
          const totalTasks = b.tasks.length;
          const doneCount = b.tasks.filter(t => t.doneDates.includes(d)).length;
          const pct = totalTasks ? doneCount / totalTasks : 0;
          if (pct < 1) {
            const gain = regenFromPct(pct);
            const before = hp;
            hp = Math.min(b.maxHp, hp + gain);
            regained += (hp - before);
            if (pct < 0.5) missedDays += 1;
            combo = 0;
          } else {
            combo += 1;
          }
          cursor.setDate(cursor.getDate() + 1);
        }
        changed = true;
        const pendingMockery = regained > 0
          ? { hpRegained: regained, missedDays, at: new Date().toISOString(), reason: 'missed_day' as const }
          : b.pendingMockery;
        return { ...b, hp, combo, bestCombo: Math.max(b.bestCombo || 0, combo), lastSettledDate: today, pendingMockery };
      });
      return changed ? { ...prev, bosses: newBosses } : prev;
    });
  }, []);

  // === Falhar uma tarefa do boss explicitamente (autotraição) ===
  // Recupera HP do boss proporcional ao dano que daria, zera o combo
  // e dispara pendingMockery para a UI gerar a mensagem do inimigo.
  const failBossTask = useCallback((bossId: string, taskId: string, date?: string) => {
    setState(prev => {
      const dateISO = date || getTodayBrasilia();
      const bosses = prev.bosses || [];
      const idx = bosses.findIndex(b => b.id === bossId);
      if (idx === -1) return prev;
      const boss = bosses[idx];
      if (boss.defeatedAt || !boss.tasks) return prev;
      const task = boss.tasks.find(t => t.id === taskId);
      if (!task) return prev;
      // Se estava concluída, desfaz primeiro (devolve HP base)
      const wasDone = task.doneDates.includes(dateISO);
      const combo = boss.combo || 0;
      const dmg = damageFromCombo(combo);
      // Regen: equivalente a dano(combo) + um pequeno bônus do inimigo (mas sem ultrapassar maxHp)
      const regain = dmg + 2;
      const refundDoneHp = wasDone ? dmg : 0;
      const newHp = Math.min(boss.maxHp, boss.hp + refundDoneHp + regain);
      const newTasks = boss.tasks.map(t => t.id === taskId
        ? { ...t, doneDates: wasDone ? t.doneDates.filter(d => d !== dateISO) : t.doneDates }
        : t);
      // === Punição: perde XP/Ouro equivalente ao que ganharia ao completar ===
      const lossReward = computeBossTaskReward(boss.difficulty, combo, false);
      const xpLost = lossReward.xp;
      const goldLost = lossReward.gold;
      const newXp = Math.max(0, prev.xp - xpLost);
      const newGold = Math.max(0, prev.gold - goldLost);
      const prog = processLevelUp(newXp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      // === Punição nas áreas de vida afetadas (mesma quantidade que ganharia) ===
      const areas = prev.lifeAreas || buildDefaultLifeAreas();
      const affected = (boss.affectedAreaIds || []).filter(aid => areas.some(a => a.id === aid));
      const perAreaXpLost = affected.length
        ? Math.max(2, Math.floor(xpLost / Math.max(1, affected.length)))
        : 0;
      const newAreas = affected.length
        ? areas.map(a => {
            if (!affected.includes(a.id)) return a;
            let lvl = a.level;
            let curXp = a.xp - perAreaXpLost;
            let toNext = a.xpToNext;
            while (curXp < 0 && lvl > 1) {
              lvl -= 1;
              toNext = Math.max(100, Math.floor(toNext / 1.25));
              curXp += toNext;
            }
            if (curXp < 0) curXp = 0;
            return { ...a, level: lvl, xp: curXp, xpToNext: toNext };
          })
        : areas;
      const updated: BossBattle = {
        ...boss,
        tasks: newTasks,
        hp: newHp,
        combo: 0,
        pendingMockery: {
          hpRegained: refundDoneHp + regain,
          missedDays: 0,
          at: new Date().toISOString(),
          reason: 'self_betrayal',
          taskTitle: task.title,
          xpLost,
          goldLost,
        },
      };
      const newBosses = [...bosses];
      newBosses[idx] = updated;
      return {
        ...prev,
        ...prog,
        gold: newGold,
        bosses: newBosses,
        lifeAreas: newAreas,
        log: [{ date: new Date().toISOString(), action: `💀 ${boss.name} ri: "${task.title}" — autotraição`, xp: -xpLost, gold: -goldLost }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const defeatBoss = useCallback((id: string) => {
    setState(prev => {
      const boss = (prev.bosses || []).find(b => b.id === id);
      if (!boss) return prev;
      const days = boss.days || 0;
      const totalTasksDone = (boss.tasks || []).reduce((s, t) => s + t.doneDates.length, 0);
      const xp = Math.max(200, totalTasksDone * 10);
      const gold = Math.max(50, totalTasksDone * 3);
      const bestCombo = boss.bestCombo || 0;
      const daysTaken = boss.createdAt
        ? Math.max(1, Math.ceil((Date.now() - new Date(boss.createdAt).getTime()) / 86400000))
        : days;
      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      const loot = rollLoot(40);

      // === Distribuir XP entre as áreas afetadas ===
      const areas = prev.lifeAreas || buildDefaultLifeAreas();
      const affected = (boss.affectedAreaIds || []).filter(aid => areas.some(a => a.id === aid));
      const areaXpPer = affected.length ? Math.max(40, Math.floor(xp / affected.length / 2)) : 0;
      const newAreas = areas.map(a => {
        if (!affected.includes(a.id)) return a;
        let lvl = a.level;
        let curXp = a.xp + areaXpPer;
        let toNext = a.xpToNext;
        while (curXp >= toNext) {
          curXp -= toNext;
          lvl += 1;
          toNext = Math.floor(toNext * 1.25);
        }
        return { ...a, level: lvl, xp: curXp, xpToNext: toNext };
      });

      return {
        ...prev,
        ...prog,
        gold: prev.gold + gold,
        bosses: (prev.bosses || []).map(b => b.id === id ? {
          ...b,
          defeatedAt: new Date().toISOString(),
          defeatStats: { daysTaken, totalTasksDone, xp, gold, bestCombo },
        } : b),
        inventory: loot ? [...(prev.inventory || []), loot] : (prev.inventory || []),
        lifeAreas: newAreas,
        log: [{ date: new Date().toISOString(), action: `🏆 Boss derrotado: ${boss.name}`, xp, gold }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const removeBoss = useCallback((id: string) => {
    setState(prev => ({ ...prev, bosses: (prev.bosses || []).filter(b => b.id !== id) }));
  }, []);

  // Legacy compat — alguns lugares antigos chamam damageBoss(id, dmg)
  const damageBoss = useCallback((id: string, dmg: number) => {
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => b.id === id ? { ...b, hp: Math.max(0, b.hp - dmg) } : b),
    }));
  }, []);

  // === Áreas de Vida — CRUD ===
  const addLifeArea = useCallback((a: { name: string; icon: string; color: string }) => {
    setState(prev => ({
      ...prev,
      lifeAreas: [...(prev.lifeAreas || []), {
        id: crypto.randomUUID(),
        name: a.name, icon: a.icon, color: a.color,
        level: 1, xp: 0, xpToNext: 100,
      }],
    }));
  }, []);
  const updateLifeArea = useCallback((id: string, patch: Partial<LifeArea>) => {
    setState(prev => ({
      ...prev,
      lifeAreas: (prev.lifeAreas || []).map(a => a.id === id ? { ...a, ...patch } : a),
    }));
  }, []);
  const removeLifeArea = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      lifeAreas: (prev.lifeAreas || []).filter(a => a.id !== id),
      bosses: (prev.bosses || []).map(b => ({
        ...b,
        affectedAreaIds: (b.affectedAreaIds || []).filter(x => x !== id),
      })),
    }));
  }, []);

  // === Reforço pós-ataque ===
  const recordBossReinforcement = useCallback((bossId: string, message: string, taskTitle?: string) => {
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => b.id === bossId ? {
        ...b,
        reinforcementHistory: [
          { date: new Date().toISOString(), message, taskTitle },
          ...(b.reinforcementHistory || []),
        ].slice(0, 50),
      } : b),
    }));
  }, []);

  // === Editar boss existente ===
  const updateBoss = useCallback((bossId: string, patch: Partial<BossBattle>) => {
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => {
        if (b.id !== bossId) return b;
        const next: BossBattle = { ...b, ...patch };
        // Se mudaram tasks/days, recalcular maxHp preservando proporção
        if (patch.tasks || patch.days) {
          const tasks = next.tasks || [];
          const newMax = Math.max(1, (next.days || b.days || 1) * tasks.length);
          const ratio = b.maxHp > 0 ? b.hp / b.maxHp : 1;
          next.maxHp = newMax;
          next.hp = Math.round(newMax * ratio);
          next.tasksPerDay = tasks.length;
        }
        return next;
      }),
    }));
  }, []);

  // === Limpar deboche pendente após exibir ===
  const clearBossMockery = useCallback((bossId: string, message?: string) => {
    setState(prev => ({
      ...prev,
      bosses: (prev.bosses || []).map(b => {
        if (b.id !== bossId) return b;
        const next: BossBattle = { ...b, pendingMockery: undefined };
        if (message && b.pendingMockery) {
          next.mockeryHistory = [
            { date: new Date().toISOString(), message, missedDays: b.pendingMockery.missedDays },
            ...(b.mockeryHistory || []),
          ].slice(0, 30);
        }
        return next;
      }),
    }));
  }, []);





  // Dungeon
  const ensureTodayDungeon = useCallback((date: string) => {
    setState(prev => {
      const dungeons = prev.dungeons || [];
      if (dungeons.some(d => d.date === date)) return prev;
      const challenges = rollDungeonChallenges(date);
      return { ...prev, dungeons: [...dungeons, { date, challenges }] };
    });
  }, []);

  const regenerateDungeon = useCallback((date: string) => {
    setState(prev => {
      const challenges = rollDungeonChallenges(date + '-' + Math.random());
      return {
        ...prev,
        dungeons: [...(prev.dungeons || []).filter(d => d.date !== date), { date, challenges }],
      };
    });
  }, []);

  // Trocar UM desafio específico da dungeon (se o usuário não curtiu)
  const regenerateDungeonChallenge = useCallback((date: string, challengeId: string) => {
    setState(prev => {
      const dungeons = prev.dungeons || [];
      const idx = dungeons.findIndex(d => d.date === date);
      if (idx === -1) return prev;
      const dungeon = dungeons[idx];
      const target = dungeon.challenges.find(c => c.id === challengeId);
      if (!target || target.done) return prev;
      const existingTitles = new Set(dungeon.challenges.map(c => c.title));
      // gerar pool de candidatos diferente
      let attempt = 0;
      let pick = null as null | (typeof dungeon.challenges)[number];
      while (attempt < 10 && !pick) {
        const fresh = rollDungeonChallenges(date + '-swap-' + challengeId + '-' + Math.random());
        const candidate = fresh.find(c => !existingTitles.has(c.title));
        if (candidate) pick = { ...candidate, id: crypto.randomUUID() } as any;
        attempt++;
      }
      if (!pick) return prev;
      const newChallenges = dungeon.challenges.map(c => c.id === challengeId ? pick! : c);
      const newDungeons = [...dungeons];
      newDungeons[idx] = { ...dungeon, challenges: newChallenges };
      return { ...prev, dungeons: newDungeons };
    });
  }, []);


  const completeDungeonChallenge = useCallback((date: string, challengeId: string) => {
    setState(prev => {
      const dungeons = prev.dungeons || [];
      const idx = dungeons.findIndex(d => d.date === date);
      if (idx === -1) return prev;
      const dungeon = dungeons[idx];
      const challenge = dungeon.challenges.find(c => c.id === challengeId);
      if (!challenge || challenge.done) return prev;

      // Apply XP + attribute XP
      const prog = processLevelUp(prev.xp + challenge.xp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      const attrs = prev.attributes || defaultAttributes;
      const cur = attrs[challenge.attribute] || { xp: 0, level: 1 };
      const { state: attrAfter } = applyAttributeXp(cur, Math.floor(challenge.xp / 2));

      const updatedChallenges = dungeon.challenges.map(c => c.id === challengeId ? { ...c, done: true } : c);
      const cleared = updatedChallenges.every(c => c.done);
      const newInventory = prev.inventory || [];
      let lootId = dungeon.lootId;
      if (cleared && !lootId) {
        const loot = rollLoot(25);
        if (loot) {
          newInventory.push(loot);
          lootId = loot.id;
        }
      }

      const newDungeons = [...dungeons];
      newDungeons[idx] = { ...dungeon, challenges: updatedChallenges, cleared: cleared || dungeon.cleared, lootId };

      return {
        ...prev,
        ...prog,
        gold: prev.gold + Math.floor(challenge.xp / 5),
        attributes: { ...attrs, [challenge.attribute]: attrAfter },
        dungeons: newDungeons,
        inventory: cleared ? newInventory : prev.inventory,
        log: [{ date: new Date().toISOString(), action: `🗝️ Dungeon: ${challenge.title}`, xp: challenge.xp, gold: Math.floor(challenge.xp / 5) }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // Inventário
  const removeInventoryItem = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      inventory: (prev.inventory || []).filter(i => i.id !== id),
    }));
  }, []);

  const useInventoryItem = useCallback((id: string) => {
    setState(prev => {
      const item = (prev.inventory || []).find(i => i.id === id);
      if (!item || !item.buff) return prev;
      const now = Date.now();
      const buff: ActiveBuff = {
        id: crypto.randomUUID(),
        itemName: item.name,
        type: item.buff.type,
        percent: item.buff.percent,
        startedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + item.buff.durationMin * 60000).toISOString(),
      };
      return {
        ...prev,
        inventory: (prev.inventory || []).filter(i => i.id !== id),
        activeBuffs: [...(prev.activeBuffs || []), buff],
        log: [{ date: new Date().toISOString(), action: `✨ Item usado: ${item.name}`, xp: 0, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  // Quest de redenção — gerada quando streak quebra
  const createRedemption = useCallback((reason: string, steps: string[]) => {
    setState(prev => {
      // Evita duplicação se já existe uma ativa
      const hasActive = (prev.redemptionQuests || []).some(q => !q.completedAt && !q.dismissedAt);
      if (hasActive) return prev;
      const q: RedemptionQuest = {
        id: crypto.randomUUID(), reason, steps, createdAt: new Date().toISOString(),
      };
      return { ...prev, redemptionQuests: [q, ...(prev.redemptionQuests || [])] };
    });
  }, []);

  const completeRedemption = useCallback((id: string) => {
    setState(prev => {
      const xp = 80;
      const prog = processLevelUp(prev.xp + xp, prev.level, prev.rank, prev.difficultyDivisor || 1);
      return {
        ...prev,
        ...prog,
        streak: Math.max(prev.streak, 1),
        redemptionQuests: (prev.redemptionQuests || []).map(q => q.id === id ? { ...q, completedAt: new Date().toISOString() } : q),
        log: [{ date: new Date().toISOString(), action: '🕊️ Quest de Redenção concluída — você voltou pra si', xp, gold: 0 }, ...prev.log].slice(0, 100),
      };
    });
  }, []);

  const dismissRedemption = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      redemptionQuests: (prev.redemptionQuests || []).map(q => q.id === id ? { ...q, dismissedAt: new Date().toISOString() } : q),
    }));
  }, []);

  // Auto-trigger redemption when streak just broke (discipline streak break)
  useEffect(() => {
    const ds = state.disciplineStreak;
    if (!ds?.lastBreakAt) return;
    const breakAge = Date.now() - new Date(ds.lastBreakAt).getTime();
    if (breakAge > 5 * 60_000) return; // só recente
    const hasActive = (state.redemptionQuests || []).some(q => !q.completedAt && !q.dismissedAt);
    if (hasActive) return;
    const hasRecent = (state.redemptionQuests || []).some(q => Date.now() - new Date(q.createdAt).getTime() < 24 * 3600_000);
    if (hasRecent) return;
    createRedemption(
      `Você quebrou ${ds.best >= 7 ? 'uma sequência forte' : 'sua sequência'}. Sem julgamento. Vamos voltar com leveza.`,
      [
        'Beba um copo de água e respire fundo 3 vezes',
        'Escolha 1 hábito pequeno pra fazer hoje (5 min basta)',
        'Escreva 2 linhas no diário: o que aconteceu, o que aprende com isso',
      ]
    );
  }, [state.disciplineStreak?.lastBreakAt, state.redemptionQuests, createRedemption]);

  // Auto-attribute XP + loot piggyback on log entries (simples)
  const lastLogActionRef = useRef<string>('');
  useEffect(() => {
    const latest = state.log?.[0];
    if (!latest) return;
    if (latest.action === lastLogActionRef.current) return;
    lastLogActionRef.current = latest.action;
    if (latest.xp <= 0) return;
    // Try to derive attribute
    let attr: AttributeId = 'disciplina';
    const a = latest.action.toLowerCase();
    if (a.startsWith('hábito')) attr = 'disciplina';
    else if (a.startsWith('missão') || a.startsWith('diária') || a.startsWith('contagem')) {
      // try to map by category name in action
      const cats: { key: string; v: AttributeId }[] = [
        { key: 'treino', v: 'forca' }, { key: 'saúde', v: 'vitalidade' },
        { key: 'estudo', v: 'mente' }, { key: 'leitura', v: 'mente' }, { key: 'trabalho', v: 'mente' },
        { key: 'mental', v: 'mente' }, { key: 'criatividade', v: 'mente' },
        { key: 'espiritual', v: 'espirito' }, { key: 'social', v: 'social' },
        { key: 'financeiro', v: 'disciplina' },
      ];
      for (const c of cats) if (a.includes(c.key)) { attr = c.v; break; }
    } else if (a.includes('diário') || a.includes('despertar') || a.includes('trataka') || a.includes('reflexão') || a.includes('ritual')) {
      attr = 'espirito';
    } else if (a.includes('dungeon')) {
      return; // dungeon já dá attr XP direto
    }
    // attribute XP = floor(xp * 0.4)
    const amount = Math.max(1, Math.floor(latest.xp * 0.4));
    if (amount > 0) {
      // Apply class multiplier
      const mult = classXpMultiplier(state.chosenClass?.id, { source: a.includes('hábito') ? 'habit' : a.includes('trataka') ? 'trataka' : 'mission' });
      gainAttributeXp(attr, Math.floor(amount * mult));
    }
    // Random loot roll on positive xp events
    if (latest.xp >= 10) {
      const loot = rollLoot();
      if (loot) {
        setState(p => ({ ...p, inventory: [...(p.inventory || []), loot] }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.log]);




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
    editMission,
    addHabit,
    markHabit,
    deleteHabit,
    editHabit,
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
    updateReflection,
    setAwakeningConfig,
    completeFailureProtocol,
    updateFailureProtocolPenalty,
    checkExpiredProtocols,
    updateAiSettings,
    addCounsel,
    deleteCounsel,
    updateIdentity,
    toggleIdentitySystem,
    logAlignedAction,
    logPatternRelapse,
    addFailureReflection,
    markRitualDone,
    appendAiAngle,
    addHonor,
    bumpDisciplineStreak,
    breakDisciplineStreak,
    completeDailyRitual,
    detectAndRegisterSabotage,
    resolveSabotagePattern,
    newlyUnlocked,
    dismissAchievement,
    updateAlterEgo,
    updateInnerEnemy,
    completeIdentityOnboarding,
    createMentorConversation,
    appendMentorMessage,
    deleteMentorConversation,
    deleteMentorMessage,
    addTratakaSession,
    deleteTratakaSession,
    createCbtSession,
    appendCbtMessage,
    updateCbtSession,
    deleteCbtSession,
    // Life RPG
    gainAttributeXp,
    chooseClass,
    dismissClassChoice,
    addBoss,
    updateBoss,
    clearBossMockery,
    damageBoss,
    defeatBoss,
    removeBoss,
    recordBossReinforcement,
    addLifeArea,
    updateLifeArea,
    removeLifeArea,

    completeBossTask,
    uncompleteBossTask,
    failBossTask,
    addBossTask,
    editBossTask,
    removeBossTask,
    settleBossesForToday,
    ensureTodayDungeon,
    regenerateDungeon,
    regenerateDungeonChallenge,
    completeDungeonChallenge,

    removeInventoryItem,
    useInventoryItem,
    createRedemption,
    completeRedemption,
    dismissRedemption,
  };
}
