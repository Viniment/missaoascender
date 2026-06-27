import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Intensity = 'leve' | 'medio' | 'brutal';

function normalizeIntensity(raw: any): Intensity {
  const s = String(raw || '').toLowerCase();
  if (s === 'leve') return 'leve';
  if (s === 'brutal' || s === 'agressivo' || s === 'intenso') return 'brutal';
  return 'medio';
}

// =====================================================================
// SYSTEM PROMPT — Estrategista psicológico contra o Monstro cadastrado
// =====================================================================
const SYSTEM_PROMPT = `Você é o "Despertar" — estrategista psicológico interno do app "Ascensão". PT-BR.

Existem apenas DOIS personagens nesta intervenção:
  • O USUÁRIO (a pessoa real, com nome, histórico, vitórias e dificuldades).
  • O MONSTRO ATIVO (cadastrado pelo próprio usuário, com nome, descrição,
    fraqueza, áreas afetadas, frases típicas, história, etc.).

NÃO existe "Alter Ego", "Eu Atual", "Inimigo Interno", "Inimigo
Sabotador", "Sombra", "sabotador", "EndMan", "Pai Interior", "Mentor",
nem qualquer outra entidade interna. NÃO invente personagens nem nomes
(NUNCA cite "EndMan" ou nomes parecidos vindos de qualquer payload).
NÃO crie diálogos entre partes do usuário. NUNCA use os termos acima
nos textos. O único nome de antagonista permitido é o nome do Monstro
ativo cadastrado pelo usuário — se não houver Monstro ativo, refira-se
apenas como "o padrão" / "o comportamento", sem inventar personagem.

O ÚNICO antagonista é o MONSTRO cadastrado — e ele representa um
conjunto de padrões reais, não a pessoa. A pessoa É a protagonista.

═══════════════════════════════════════
REGRA ABSOLUTA
═══════════════════════════════════════
A oposição é AO MONSTRO (padrões e comportamentos cadastrados pelo
próprio usuário), NUNCA à identidade, valor, caráter ou autoestima da
pessoa. Firmeza com o padrão. Compaixão com a pessoa.

═══════════════════════════════════════
USE OS DADOS DO MONSTRO COMO CONTEXTO
═══════════════════════════════════════
Antes de escrever, leia os dados do Monstro ativo (nome, emoji,
descrição, fraqueza, áreas afetadas, "como me afeta", "por que preciso
derrotá-lo", frases típicas dele, história, HP atual, combo, tarefas
do dia, histórico de reforços e recaídas) e identifique:

• quais pensamentos esse Monstro costuma induzir no usuário;
• quais emoções ele fortalece;
• quais comportamentos ele incentiva;
• quais áreas da vida ele está prejudicando agora;
• quais ações o alimentam (recaídas, tarefas não feitas);
• quais ações o enfraquecem (a fraqueza cadastrada, tarefas honradas).

Toda intervenção tem que ser COERENTE com esses dados específicos.
Cite o nome do Monstro. Cite a fraqueza dele. Cite as frases dele.
Cite as áreas afetadas. Sem genéricos.

═══════════════════════════════════════
ESTRATÉGIA ADAPTATIVA
═══════════════════════════════════════
Leia o contexto recente (diário, hábitos, missões, tarefas do Monstro,
combo, recaídas, vitórias, emoção dominante) e escolha 1 modo em
"strategyMode":

• "expor" — procrastinação/racionalização: revele os ataques do
  Monstro, mostre como pensamentos recentes batem com o padrão dele,
  proponha 1 ação imediata pequena.
• "reconstruir" — recaída: evite "já estraguei tudo", identifique o
  gatilho, recomprometa com 1 passo pequeno.
• "reforcar" — consistência: destaque evidências reais de evolução,
  aumente o orgulho pelo processo, mostre o Monstro perdendo HP.
• "recurso" — medo/baixa confiança: PAUSE o confronto. Resgate
  vitórias REAIS do app: tarefas honradas, hábitos mantidos, missões
  concluídas, frases de coragem do diário.
• "confrontar" — zona de conforto travada: confronto respeitoso de
  crenças limitantes, sem humilhação.

═══════════════════════════════════════
REVELAR OS ATAQUES DO MONSTRO
═══════════════════════════════════════
Em "revealedAttacks" (1 a 4) aponte, com lucidez e sem culpa, onde o
Monstro vem atacando recentemente. Cada item:
- pattern: o padrão observado (pensamento, racionalização, comportamento).
- evidence: trecho/elemento REAL do contexto (diário, hábito, tarefa,
  missão, recaída).
- howItFeeds: como esse comportamento alimentou o Monstro.

═══════════════════════════════════════
DOIS CAMINHOS
═══════════════════════════════════════
Em "twoPaths" compare HOJE:
• pathFeedsMonster — caminho que fortalece o Monstro.
• pathFeedsUser — caminho que fortalece a vida que a pessoa quer
  construir (referenciando metas/áreas cadastradas).
Pequenas escolhas repetidas viram grandes diferenças.

═══════════════════════════════════════
ESTADO DE RECURSO
═══════════════════════════════════════
Se detectar queda de confiança/ansiedade/incapacidade, preencha
"resourceState" com 2-4 evidências REAIS do app. Caso contrário, deixe
vazio.

═══════════════════════════════════════
TOM DE VOZ
═══════════════════════════════════════
Sábio • Lúcido • Honesto • Caloroso • Direto sem humilhar.
PERMITIDO: nomear o Monstro, falar em "enfraquecer", "tirar combustível
do Monstro", "expor o padrão", "honrar o compromisso".
PROIBIDO: humilhação do usuário, vergonha, insultos, positividade
vazia, mensagens prontas, repetição do mesmo ângulo das reflexões
anteriores. Proibido também usar os termos "Alter Ego", "Eu Atual",
"Inimigo Interno", "Inimigo Sabotador", "Sombra", "Sabotador",
"EndMan" — eles não existem mais.

═══════════════════════════════════════
VARIABILIDADE
═══════════════════════════════════════
Cada intervenção deve parecer ÚNICA. Alterne entre perguntas profundas,
desafios rápidos, reenquadramento, análise de padrões, exercícios breves,
lembrança de vitórias, conexão com valores, visualização, confrontação
respeitosa. Veja "angleHistory" e NÃO repita o mesmo ângulo.

═══════════════════════════════════════
BLOCOS OBRIGATÓRIOS
═══════════════════════════════════════
1. detectedState — 3-6 palavras. Estado emocional real, com gentileza.
2. strategyMode — um dos modos acima.
3. checkIn — 2-3 frases. Acolhimento honesto da pessoa, sem julgamento.
4. monsterRead — 2-4 frases. O que o {Monstro} está explorando AGORA,
   com base nos dados cadastrados e no contexto recente.
5. revealedAttacks — 1 a 4 ataques recentes (padrão + evidência + como
   alimenta o Monstro).
6. twoPaths — caminho que alimenta o Monstro × caminho que fortalece
   a vida que o usuário quer.
7. monsterWeaknessReminder — 1-2 frases. Lembre a FRAQUEZA cadastrada
   do Monstro e como ela se aplica hoje.
8. userStrength — 3-4 frases. Onde o USUÁRIO já está agindo contra o
   Monstro nas últimas semanas — cite evidências REAIS (tarefas
   honradas, hábitos, missões, frases do diário).
9. futureGlimpse — 3-5 frases. Visualização tangível: se a pessoa
   continuar enfraquecendo o {Monstro} nas próximas semanas, que vida
   começa a se abrir (use metas/áreas afetadas reais).
10. resourceState — só se necessário.
11. microChallenge — 1 ação concreta e pequena (5-15 min) para
    enfraquecer o Monstro hoje.
12. reframe — 2-3 frases. Reenquadramento de UMA crença limitante
    recente, sem invalidar o sentimento.
13. questions — 4 a 6 perguntas adaptadas ao strategyMode. Cada
    pergunta cita ao menos UM elemento real (Monstro, tarefa, diário,
    hábito, missão, meta).
14. identityProof — pergunta literal:
    "Que pequena ação nas próximas 24 horas vai tirar combustível do
    {Monstro} e te aproximar da vida que você quer?"
    + 2-4 sugestões pequenas, executáveis, personalizadas.
15. identityAnchor — 1-2 frases em 1ª pessoa: "Hoje eu escolho ser
    alguém que..." alinhada às áreas e metas reais.

═══════════════════════════════════════
INTENSIDADE
═══════════════════════════════════════
🌱 LEVE — voz acolhedora.
⚡ MÉDIO — espelho firme e gentil.
🔥 BRUTAL — verdade nua dita com respeito (nunca crueldade).

Retorne SEMPRE via tool call "generate_awakening".`;

// =====================================================================
// HELPERS
// =====================================================================
function fmtRecentJournal(rj: any[]): string {
  if (!rj || rj.length === 0) return '(sem entradas recentes)';
  const top3 = rj.slice(0, 3);
  const fmt = (j: any, label: string) => {
    const txt = (j.text || '').slice(0, 500);
    const emo = j.emotion ? `${j.emotion}${j.intensity ? ` (${j.intensity}/10)` : ''}` : 'sem emoção';
    return `${label} · ${j.title || 'sem título'} · ${emo}\n${txt}`;
  };
  return top3.map((j: any, i: number) => fmt(j, `[${i === 0 ? 'HOJE' : i === 1 ? 'ONTEM' : 'ANTERIOR'}]`)).join('\n\n');
}

function fmtBoss(b: any): string {
  if (!b) return '';
  let s = `Nome: ${b.emoji || ''} ${b.name}\n`;
  s += `HP atual: ${b.hp}/${b.maxHp}${b.combo ? ` · combo ${b.combo}` : ''}\n`;
  if (b.difficulty) s += `Dificuldade: ${b.difficulty}\n`;
  if (b.description) s += `Descrição: ${b.description}\n`;
  if (b.story) s += `História: ${String(b.story).slice(0, 600)}\n`;
  if (b.weakness) s += `FRAQUEZA CADASTRADA: ${b.weakness}\n`;
  if (b.howItAffectsMe) s += `Como me afeta: ${b.howItAffectsMe}\n`;
  if (b.whyDefeat) s += `Por que preciso enfraquecê-lo: ${b.whyDefeat}\n`;
  if (b.affectedAreas?.length) s += `Áreas afetadas: ${b.affectedAreas.join(', ')}\n`;
  if (b.customPhrases?.length) s += `Frases típicas dele (desculpas, racionalizações): ${b.customPhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (b.tasks?.length) {
    const today = new Date().toISOString().slice(0, 10);
    const todayDone = b.tasks.filter((t: any) => (t.doneDates || []).includes(today)).length;
    s += `Tarefas (hoje): ${todayDone}/${b.tasks.length} feitas\n`;
    s += `Tarefas: ${b.tasks.slice(0, 6).map((t: any) => `"${t.title}"`).join(' | ')}\n`;
  }
  if (b.reinforcementHistory?.length) {
    const last = b.reinforcementHistory.slice(-3).map((r: any) => r.taskTitle || r.message?.slice(0, 60)).filter(Boolean);
    if (last.length) s += `Ações recentes que o enfraqueceram: ${last.join(' | ')}\n`;
  }
  if (b.mockeryHistory?.length) {
    const last = b.mockeryHistory.slice(-3).map((r: any) => `${r.date} (faltou ${r.missedDays}d)`);
    s += `Recaídas recentes (Monstro se recuperou): ${last.join(' | ')}\n`;
  }
  return s;
}

// =====================================================================
// HANDLER
// =====================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      context,
      intensity: rawIntensity,
      journal, rank, reflections,
      aiSettings,
      activeBoss,
    } = body || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = context || {
      rank: rank || 'E',
      recentJournal: (journal || []).map((j: any) => ({
        title: j.title, text: j.text, emotion: j.emotion, intensity: j.intensity, deepMode: j.deepMode,
      })),
      reflections: (reflections || []).map((r: any) => ({
        date: r.date, question: r.question, answer: (r.answerHtml || '').replace(/<[^>]+>/g, ' ').slice(0, 300),
      })),
      missions: { active: [], failedRecent: [], completedRecent: [] },
      habits: [],
      derived: {},
      aiSettings,
    };

    const intensity: Intensity = rawIntensity
      ? normalizeIntensity(rawIntensity)
      : normalizeIntensity(ctx.aiSettings?.intensity);

    const boss = activeBoss || ctx.activeBoss || null;
    const bossName = boss?.name || 'Monstro';
    const bossLabel = boss ? `${boss.emoji || ''} ${boss.name}`.trim() : 'Monstro';

    // ============ USER PROMPT ============
    let up = '';

    if (boss) {
      up += `═══ MONSTRO ATIVO (único antagonista — use TODOS os dados) ═══\n`;
      up += fmtBoss(boss);
      up += `\n`;
    } else {
      up += `═══ MONSTRO ATIVO ═══\n`;
      up += `Nenhum Monstro cadastrado/ativo no momento. Trate o "Monstro" como o conjunto de padrões observados no contexto recente — mas SEM inventar personagens internos.\n\n`;
    }

    up += `═══ CONFIGURAÇÃO ═══\nIntensidade: ${intensity.toUpperCase()}\n\n`;

    const d = ctx.derived || {};
    up += `═══ JANELA 7 DIAS ═══\n`;
    up += `Dificuldades 7d: ${d.failureCount7d ?? 0} | Tendência: ${d.consistencyTrend ?? 'estavel'}\n`;
    up += `Dias sem tropeçar: ${d.daysSinceLastFail === 9999 ? '∞' : (d.daysSinceLastFail ?? '?')} | Maior sequência: ${d.longestStreak ?? 0}d\n`;
    up += `Clima emocional: ${d.emotionalDrift ?? 'neutro'}\n\n`;

    if (ctx.awakening && (ctx.awakening.become || ctx.awakening.reject || ctx.awakening.pain)) {
      up += `═══ INTENÇÕES DECLARADAS ═══\n`;
      if (ctx.awakening.become) up += `Quero me tornar: ${ctx.awakening.become}\n`;
      if (ctx.awakening.reject) up += `Quero deixar para trás: ${ctx.awakening.reject}\n`;
      if (ctx.awakening.pain) up += `Dor que evita: ${ctx.awakening.pain}\n`;
      up += `\n`;
    }

    const ms = ctx.missions || {};
    if ((ms.active?.length || 0) + (ms.completedRecent?.length || 0) + (ms.failedRecent?.length || 0) > 0) {
      up += `═══ MISSÕES ═══\n`;
      if (ms.completedRecent?.length) up += `✅ Honradas (tirou combustível do ${bossLabel}): ${ms.completedRecent.slice(0, 5).map((c: any) => `"${c.name}"`).join(' | ')}\n`;
      if (ms.active?.length) up += `Ativas: ${ms.active.slice(0, 5).map((m: any) => `"${m.name}"`).join(' | ')}\n`;
      if (ms.failedRecent?.length) up += `Em aberto (alimentou o ${bossLabel}): ${ms.failedRecent.slice(0, 3).map((f: any) => `"${f.name}"`).join(' | ')}\n`;
      up += `\n`;
    }

    if (ctx.habits?.length) {
      up += `═══ HÁBITOS (30d) ═══\n`;
      ctx.habits.slice(0, 8).forEach((h: any) => {
        const flag = h.streak >= 3 ? ' ✅ativo' : (h.failed30d > h.done30d ? ' ⚠️em retomada' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d}✓/${h.failed30d}✗${flag}\n`;
      });
      up += `\n`;
    }

    if (ctx.reflections?.length) {
      up += `═══ REFLEXÕES ANTERIORES (NÃO repita perguntas nem ângulo) ═══\n`;
      ctx.reflections.slice(0, 4).forEach((r: any, i: number) => {
        up += `[${i + 1}] P: ${r.question}\n  R: ${(r.answer || '').slice(0, 150)}\n`;
      });
      up += `\n`;
    }

    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO RECENTE ═══\n${fmtRecentJournal(ctx.recentJournal)}\n\n`;
    }

    if (ctx.angleHistory?.length) {
      up += `═══ ÂNGULOS RECENTES (EVITAR repetir) ═══\n${ctx.angleHistory.slice(-6).join(' | ')}\n\n`;
    }

    up += `═══ INSTRUÇÕES FINAIS ═══\n`;
    up += `1. O ÚNICO antagonista é o ${bossLabel}. NÃO use "Alter Ego", "Eu Atual", "Inimigo Interno", "Sombra", "Sabotador" — esses termos não existem mais.\n`;
    up += `2. Cite o ${bossLabel} pelo nome. Use a fraqueza cadastrada e as frases típicas dele quando relevante.\n`;
    up += `3. Escolha o "strategyMode" com base no contexto recente.\n`;
    up += `4. "revealedAttacks" precisa de evidências REAIS (diário, hábito, missão, tarefa, recaída).\n`;
    up += `5. "twoPaths.pathFeedsUser" usa metas/áreas reais.\n`;
    up += `6. "userStrength" cita 1-3 evidências reais de ação contra o ${bossLabel}.\n`;
    up += `7. 4-6 perguntas adaptadas ao strategyMode. Cada uma cita algo real.\n`;
    up += `8. Firmeza com o padrão. Compaixão com a pessoa. Nunca humilhar.\n`;
    up += `9. Honre a intensidade ${intensity.toUpperCase()}.\n`;
    up += `10. Retorne via tool "generate_awakening".\n`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: up },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_awakening",
              description: "Despertar diário: intervenção psicológica usando o Monstro cadastrado como único antagonista.",
              parameters: {
                type: "object",
                properties: {
                  detectedState: { type: "string", description: "Estado real em 3-6 palavras, com gentileza." },
                  intensity: { type: "string", enum: ["leve", "medio", "brutal"] },
                  strategyMode: {
                    type: "string",
                    enum: ["expor", "reconstruir", "reforcar", "recurso", "confrontar"],
                    description: "Modo estratégico escolhido pelo contexto recente.",
                  },
                  checkIn: { type: "string", description: "2-3 frases de acolhimento honesto à pessoa." },
                  monsterRead: { type: "string", description: "2-4 frases. O que o Monstro está explorando AGORA, com base nos dados cadastrados." },
                  revealedAttacks: {
                    type: "array",
                    minItems: 1,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string", description: "Padrão observado (pensamento, racionalização, comportamento)." },
                        evidence: { type: "string", description: "Evidência REAL do contexto (diário, hábito, missão, tarefa)." },
                        howItFeeds: { type: "string", description: "Como isso alimenta o Monstro." },
                      },
                      required: ["pattern", "evidence", "howItFeeds"],
                      additionalProperties: false,
                    },
                  },
                  twoPaths: {
                    type: "object",
                    properties: {
                      pathFeedsMonster: { type: "string", description: "1-2 frases. Caminho que fortalece o Monstro hoje." },
                      pathFeedsUser: { type: "string", description: "1-2 frases. Caminho que fortalece a vida que o usuário quer (metas/áreas reais)." },
                    },
                    required: ["pathFeedsMonster", "pathFeedsUser"],
                    additionalProperties: false,
                  },
                  monsterWeaknessReminder: {
                    type: "string",
                    description: "1-2 frases. Lembre a fraqueza cadastrada do Monstro e como aplicar hoje.",
                  },
                  userStrength: {
                    type: "string",
                    description: "3-4 frases. Onde o usuário já está agindo contra o Monstro — citando evidências REAIS.",
                  },
                  futureGlimpse: {
                    type: "string",
                    description: "3-5 frases. Vida que começa a se abrir se o Monstro continuar perdendo HP.",
                  },
                  resourceState: {
                    type: "object",
                    description: "Só preencher quando houver queda de confiança. Caso contrário, omitir ou deixar vazio.",
                    properties: {
                      message: { type: "string", description: "1-2 frases de reconexão com a força real." },
                      evidences: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-4 vitórias/evidências REAIS do app.",
                      },
                    },
                    required: ["message", "evidences"],
                    additionalProperties: false,
                  },
                  microChallenge: {
                    type: "string",
                    description: "1 ação concreta e pequena (5-15 min) para enfraquecer o Monstro hoje.",
                  },
                  reframe: {
                    type: "string",
                    description: "2-3 frases. Reenquadramento de uma crença limitante, sem invalidar o sentimento.",
                  },
                  questions: {
                    type: "array",
                    minItems: 4,
                    maxItems: 6,
                    description: "4 a 6 perguntas adaptadas ao strategyMode.",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "3-6 palavras." },
                        prompt: { type: "string", description: "A pergunta. Cita elemento real (Monstro, tarefa, diário, hábito, missão, meta)." },
                        objective: { type: "string", description: "1 linha do que a pessoa deve perceber." },
                      },
                      required: ["title", "prompt", "objective"],
                      additionalProperties: false,
                    },
                  },
                  identityProof: {
                    type: "string",
                    description: "Pergunta literal: 'Que pequena ação nas próximas 24 horas vai tirar combustível do {Monstro} e te aproximar da vida que você quer?'",
                  },
                  identityProofSuggestions: {
                    type: "array",
                    minItems: 2,
                    maxItems: 4,
                    items: { type: "string" },
                    description: "2-4 ações pequenas, executáveis, personalizadas.",
                  },
                  identityAnchor: {
                    type: "string",
                    description: "1-2 frases em 1ª pessoa: 'Hoje eu escolho ser alguém que...' alinhada às áreas/metas reais.",
                  },
                },
                required: [
                  "detectedState", "intensity", "strategyMode", "checkIn",
                  "monsterRead", "revealedAttacks", "twoPaths",
                  "monsterWeaknessReminder", "userStrength", "futureGlimpse",
                  "microChallenge", "reframe", "questions",
                  "identityProof", "identityProofSuggestions", "identityAnchor",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_awakening" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar despertar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    const out: any = {
      detectedState: '',
      intensity,
      strategyMode: '',
      checkIn: '',
      monsterRead: '',
      revealedAttacks: [] as any[],
      twoPaths: { pathFeedsMonster: '', pathFeedsUser: '' },
      monsterWeaknessReminder: '',
      userStrength: '',
      futureGlimpse: '',
      resourceState: null,
      microChallenge: '',
      reframe: '',
      questions: [] as any[],
      identityProof: '',
      identityProofSuggestions: [] as string[],
      identityAnchor: '',
      bossName,
      bossEmoji: boss?.emoji || '',
    };

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        Object.assign(out, parsed);
        if (!out.intensity) out.intensity = intensity;
        out.bossName = bossName;
        out.bossEmoji = boss?.emoji || '';
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (!Array.isArray(out.questions) || out.questions.length < 3) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA (perguntas insuficientes)" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("awakening-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});