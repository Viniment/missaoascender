// Builder único de contexto rico para todas as IAs do app (Despertar, Conselho, Confronto).
// Centraliza dados brutos + sinais derivados (consistencyTrend, recurringFailedItems, etc.)
// para que cada edge function receba um payload uniforme e tome decisões adaptativas.

import type { PlayerState, Mission, Habit } from './gameStore';

const DAY_MS = 86_400_000;

const stripHtml = (s: string): string =>
  (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const daysAgo = (iso: string): number =>
  (Date.now() - new Date(iso).getTime()) / DAY_MS;

export type ConsistencyTrend = 'melhorando' | 'estavel' | 'piorando';
export type EmotionalDrift = 'apatia' | 'raiva' | 'esperanca' | 'culpa' | 'tristeza' | 'neutro';
export type BehavioralEvolution = 'progredindo' | 'estavel' | 'regredindo';

export interface AiContextDerived {
  failureRate7d: number;          // 0..1 (proporção de tentativas falhadas nos últimos 7d)
  failureCount7d: number;
  failureCount30d: number;
  consistencyTrend: ConsistencyTrend;
  daysSinceLastFail: number;       // Infinity se nunca falhou
  longestStreak: number;
  relapseAfterEvolution: boolean;  // teve >=5 dias sem falhar e quebrou recentemente
  recurringFailedItems: string[];  // itens que falharam >=2x nos últimos 30d
  contradictionSignals: string[];  // ex: "Diário diz 'vou parar' mas 3 falhas mesma semana"
  emotionalDrift: EmotionalDrift;
  pendingPunishmentsCount: number;
  expiredPunishmentsCount: number;
  // NOVO: detecção de evolução cruzando comportamento + diário recente
  recentJournalSummary: string;    // 1 linha: emoção dominante + mudança vs entradas mais antigas
  behavioralEvolution: BehavioralEvolution;
}

export interface AiContext {
  // Identidade ascendente
  rank: string;
  level: number;
  streak: number;
  xp: number;
  awakening: { become?: string; reject?: string; pain?: string };

  // Histórico denso
  recentJournal: Array<{
    date: string;
    title: string;
    emotion?: string;
    intensity?: number;
    deepMode?: boolean;
    text: string; // já strip + truncado
  }>;
  reflections: Array<{
    date: string;
    question: string;
    answer: string; // strip + truncado
  }>;

  // Comportamento
  missions: {
    active: Array<{ name: string; difficulty: string; type: string }>;
    failedRecent: Array<{ name: string; date: string }>;
    completedRecent: Array<{ name: string; date: string }>;
  };
  habits: Array<{
    name: string;
    streak: number;
    done30d: number;
    failed30d: number;
    lastFailDate?: string;
  }>;
  pendingPunishments: Array<{ reason: string; deadline: string }>;
  expiredPunishments: Array<{ reason: string; deadline: string }>;

  monster?: { hp: number; lastReason?: string };

  // Sinais derivados (calculados aqui no client)
  derived: AiContextDerived;

  // Histórico dos últimos ângulos psicológicos usados pela IA — para EVITAR repetição
  angleHistory: string[];

  // Configuração global da IA
  aiSettings: {
    intensity: 'leve' | 'moderado' | 'agressivo';
    interventionFrequency: 'baixa' | 'media' | 'alta';
  };
}

function detectEmotionalDrift(recentEmotions: Array<{ emotion?: string; intensity?: number }>): EmotionalDrift {
  if (!recentEmotions || recentEmotions.length === 0) return 'neutro';
  const counts: Record<string, number> = {};
  for (const e of recentEmotions) {
    const k = (e.emotion || '').toLowerCase();
    if (!k) continue;
    counts[k] = (counts[k] || 0) + 1;
  }
  // mapeamento simples PT-BR → drift
  const map: Array<[RegExp, EmotionalDrift]> = [
    [/raiva|irrita|frustr|ódio|odio/, 'raiva'],
    [/triste|abat|chor|sozinho|solid/, 'tristeza'],
    [/culpa|vergonha|remor/, 'culpa'],
    [/apático|apatic|vazio|nada|cans|exaust/, 'apatia'],
    [/esperan|gratid|alegr|orgul|feliz/, 'esperanca'],
  ];
  let best: { drift: EmotionalDrift; score: number } = { drift: 'neutro', score: 0 };
  for (const [emotion, n] of Object.entries(counts)) {
    for (const [re, drift] of map) {
      if (re.test(emotion) && n > best.score) best = { drift, score: n };
    }
  }
  return best.drift;
}

function detectContradictions(
  journalTexts: string[],
  failureCount7d: number,
  recurringItems: string[],
): string[] {
  const out: string[] = [];
  const blob = journalTexts.join(' ').toLowerCase();
  const promiseRegexes: Array<[RegExp, string]> = [
    [/vou parar|nunca mais|chega de|de hoje em diante/i, 'promessa de parada'],
    [/vou começar|começo amanh|a partir de amanh/i, 'promessa de início futuro'],
    [/dessa vez é diferente|agora vai/i, 'promessa de "dessa vez vai"'],
    [/sou disciplinad|tenho foco|sou focad/i, 'autoafirmação de disciplina'],
  ];
  for (const [re, label] of promiseRegexes) {
    if (re.test(blob)) {
      if (failureCount7d >= 2) {
        out.push(`Você escreveu uma ${label} no diário, mas falhou ${failureCount7d}x nos últimos 7 dias.`);
      }
      if (recurringItems.length > 0) {
        out.push(`Você se afirmou no diário e ainda assim "${recurringItems[0]}" continua falhando.`);
      }
    }
  }
  return out.slice(0, 2);
}

export function buildAiContext(state: PlayerState): AiContext {
  const now = Date.now();

  // ===== Falhas (missões + hábitos + protocolos expirados) =====
  type FailEvent = { name: string; date: string; type: 'mission' | 'habit' | 'protocol' };
  const failEvents: FailEvent[] = [];
  const completeEvents: Array<{ name: string; date: string }> = [];

  for (const m of state.missions || []) {
    if (m.status === 'Falhada' && m.completedAt) {
      failEvents.push({ name: m.name, date: m.completedAt, type: 'mission' });
    }
    if (m.status === 'Concluída' && m.completedAt) {
      completeEvents.push({ name: m.name, date: m.completedAt });
    }
    if (m.repeatable && m.completionHistory) {
      for (const h of m.completionHistory) {
        if (h.failed) failEvents.push({ name: m.name, date: h.date, type: 'mission' });
        else completeEvents.push({ name: m.name, date: h.date });
      }
    }
  }

  for (const h of state.habits || []) {
    for (const [date, status] of Object.entries(h.history || {})) {
      const iso = `${date}T12:00:00`;
      if (status === 'failed') failEvents.push({ name: h.name, date: iso, type: 'habit' });
      else if (status === 'done') completeEvents.push({ name: h.name, date: iso });
    }
  }

  for (const fp of state.failureProtocols || []) {
    if (fp.status === 'Pendente' && new Date(fp.deadline).getTime() < now) {
      failEvents.push({ name: fp.reason, date: fp.deadline, type: 'protocol' });
    }
  }

  failEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  completeEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const failsLast7d = failEvents.filter(f => daysAgo(f.date) <= 7);
  const failsLast30d = failEvents.filter(f => daysAgo(f.date) <= 30);
  const failsPrev7to14 = failEvents.filter(f => {
    const d = daysAgo(f.date);
    return d > 7 && d <= 14;
  });

  const completesLast7d = completeEvents.filter(e => daysAgo(e.date) <= 7);
  const totalAttempts7d = failsLast7d.length + completesLast7d.length;
  const failureRate7d = totalAttempts7d > 0 ? failsLast7d.length / totalAttempts7d : 0;

  // Trend: comparar 7d atual vs 7-14d
  let consistencyTrend: ConsistencyTrend = 'estavel';
  if (failsLast7d.length < failsPrev7to14.length - 1) consistencyTrend = 'melhorando';
  else if (failsLast7d.length > failsPrev7to14.length + 1) consistencyTrend = 'piorando';

  const daysSinceLastFail = failEvents.length > 0 ? daysAgo(failEvents[0].date) : Infinity;

  // longestStreak: maior gap consecutivo entre falhas (em dias) considerando só os últimos 90d
  let longestStreak = 0;
  const recent90 = failEvents.filter(f => daysAgo(f.date) <= 90).map(f => new Date(f.date).getTime()).sort((a, b) => a - b);
  if (recent90.length === 0) {
    longestStreak = Math.min(90, Math.floor(daysSinceLastFail));
  } else {
    for (let i = 1; i < recent90.length; i++) {
      const gap = (recent90[i] - recent90[i - 1]) / DAY_MS;
      if (gap > longestStreak) longestStreak = Math.floor(gap);
    }
    const tailGap = (now - recent90[recent90.length - 1]) / DAY_MS;
    if (tailGap > longestStreak) longestStreak = Math.floor(tailGap);
  }

  // relapseAfterEvolution: ficou >=5 dias sem falhar E voltou a falhar nos últimos 3 dias
  const relapseAfterEvolution = (() => {
    if (failEvents.length < 2) return false;
    const last = failEvents[0];
    const prev = failEvents[1];
    const gap = (new Date(last.date).getTime() - new Date(prev.date).getTime()) / DAY_MS;
    return gap >= 5 && daysAgo(last.date) <= 3;
  })();

  // Recurring: mesmo nome falhando >=2x em 30d
  const failCounts: Record<string, number> = {};
  for (const f of failsLast30d) failCounts[f.name] = (failCounts[f.name] || 0) + 1;
  const recurringFailedItems = Object.entries(failCounts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // ===== Hábitos formatados =====
  const habitsCtx = (state.habits || []).map(h => {
    const entries = Object.entries(h.history || {});
    let done30 = 0, failed30 = 0;
    let lastFailDate: string | undefined;
    for (const [d, s] of entries) {
      const iso = `${d}T12:00:00`;
      if (daysAgo(iso) <= 30) {
        if (s === 'done') done30++;
        else if (s === 'failed') {
          failed30++;
          if (!lastFailDate || d > lastFailDate) lastFailDate = d;
        }
      }
    }
    // streak: dias consecutivos 'done' a partir de hoje
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
      const s = h.history?.[d];
      if (s === 'done') streak++;
      else if (s === 'failed') break;
      else if (i > 0) break;
    }
    return { name: h.name, streak, done30d: done30, failed30d: failed30, lastFailDate };
  });

  // ===== Diário =====
  const journalSorted = [...(state.journal || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
  const recentJournal = journalSorted.map(j => ({
    date: j.date,
    title: j.title,
    emotion: j.emotion,
    intensity: j.intensity,
    deepMode: j.deepMode,
    text: stripHtml(j.text || '').slice(0, 600),
  }));

  // ===== Reflexões (Despertar) =====
  const reflectionsSorted = [...(state.reflections || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
  const reflections = reflectionsSorted.map(r => ({
    date: r.date,
    question: r.question,
    answer: stripHtml((r as any).answerHtml || (r as any).answer || '').slice(0, 400),
  }));

  // ===== Missões para contexto =====
  const active = (state.missions || [])
    .filter(m => m.status === 'Ativa')
    .slice(0, 8)
    .map(m => ({ name: m.name, difficulty: m.difficulty, type: m.missionType }));

  const failedRecent = failEvents
    .filter(f => f.type === 'mission')
    .slice(0, 8)
    .map(f => ({ name: f.name, date: f.date }));

  const completedRecent = completeEvents.slice(0, 8).map(c => ({ name: c.name, date: c.date }));

  // ===== Protocolos =====
  const pending = (state.failureProtocols || []).filter(fp => fp.status === 'Pendente');
  const pendingPunishments = pending
    .filter(fp => new Date(fp.deadline).getTime() >= now)
    .slice(0, 5)
    .map(fp => ({ reason: fp.reason, deadline: fp.deadline }));
  const expiredPunishments = pending
    .filter(fp => new Date(fp.deadline).getTime() < now)
    .slice(0, 5)
    .map(fp => ({ reason: fp.reason, deadline: fp.deadline }));

  // ===== Sinais emocionais e contradições =====
  const emotionalDrift = detectEmotionalDrift(
    recentJournal.map(j => ({ emotion: j.emotion, intensity: j.intensity }))
  );
  const contradictionSignals = detectContradictions(
    recentJournal.map(j => j.text),
    failsLast7d.length,
    recurringFailedItems,
  );

  return {
    rank: state.rank,
    level: state.level,
    streak: state.streak,
    xp: state.xp,
    awakening: state.awakening || { become: '', reject: '', pain: '' },
    recentJournal,
    reflections,
    missions: { active, failedRecent, completedRecent },
    habits: habitsCtx,
    pendingPunishments,
    expiredPunishments,
    monster: state.monster ? { hp: state.monster.hp, lastReason: state.monster.lastReason } : undefined,
    derived: {
      failureRate7d: Math.round(failureRate7d * 100) / 100,
      failureCount7d: failsLast7d.length,
      failureCount30d: failsLast30d.length,
      consistencyTrend,
      daysSinceLastFail: isFinite(daysSinceLastFail) ? Math.floor(daysSinceLastFail) : 9999,
      longestStreak,
      relapseAfterEvolution,
      recurringFailedItems: recurringFailedItems.slice(0, 5),
      contradictionSignals,
      emotionalDrift,
      pendingPunishmentsCount: pendingPunishments.length,
      expiredPunishmentsCount: expiredPunishments.length,
    },
    angleHistory: (state.aiAngleHistory || []).slice(-10),
    aiSettings: {
      intensity: (state.aiSettings?.intensity as any) || 'moderado',
      interventionFrequency: (state.aiSettings?.interventionFrequency as any) || 'media',
    },
  };
}
