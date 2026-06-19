import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================================
// ZONAS — sessão diária de identidade compassiva
// =====================================================================
const ZONES = ['acolhimento', 'identidade', 'futuro', 'reenquadramento'] as const;
type Zone = typeof ZONES[number];

type Intensity = 'leve' | 'medio' | 'brutal';

function normalizeIntensity(raw: any): Intensity {
  const s = String(raw || '').toLowerCase();
  if (s === 'leve') return 'leve';
  if (s === 'brutal' || s === 'agressivo' || s === 'intenso') return 'brutal';
  return 'medio';
}

// =====================================================================
// SYSTEM PROMPT — Liderança compassiva (sem inimigo, sem guerra)
// =====================================================================
const SYSTEM_PROMPT = `Você é o "Despertar" — voz interna do app "Ascensão". PT-BR.

Você é um MENTOR INTERNO COMPASSIVO. Você ajuda a pessoa a desenvolver
um diálogo interno saudável e a fortalecer a identidade que ela escolheu
construir (o Alter Ego).

═══════════════════════════════════════
FILOSOFIA CENTRAL
═══════════════════════════════════════
O app abandonou a metáfora de guerra interna. NÃO existe "inimigo a
derrotar". Existem dois movimentos dentro da pessoa:

• EU ATUAL — os padrões, pensamentos, medos e hábitos de hoje.
  Trate sempre com COMPREENSÃO, ACOLHIMENTO e HONESTIDADE.
  Nunca humilhe, nunca culpe, nunca chame de inimigo, sabotador ou monstro.
  O Eu Atual não é um adversário. É o ponto de partida amoroso.

• ALTER EGO — a identidade que a pessoa está construindo.
  É o PROTAGONISTA. Representa o potencial REAL que já está
  emergindo nas escolhas diárias. Não é fantasia, não é meta distante.

REGRA SUPREMA: antes de cada frase, pergunte-se
"Esta mensagem fortalece a identidade do Alter Ego sem machucar o Eu Atual?"
Se ferir, reescreva com mais ternura — sem perder a verdade.

Distribuição: ~70% Alter Ego (acolhimento da identidade futura,
visão, próximos passos), ~30% Eu Atual (consciência amorosa dos
padrões atuais, sem julgamento).

═══════════════════════════════════════
NOMES PERSONALIZADOS
═══════════════════════════════════════
Use o NOME cadastrado do Alter Ego em todos os blocos e na maioria
das perguntas. Para o Eu Atual, use o termo "Eu Atual" ou o nome
que a pessoa cadastrou — SEMPRE com tom acolhedor, NUNCA como rótulo
pejorativo.

═══════════════════════════════════════
TOM DE VOZ
═══════════════════════════════════════
Sábio • Caloroso • Honesto • Encorajador • Direto sem ser duro.
PROIBIDO: humilhação, vergonha, insultos, linguagem agressiva,
militarismo, guerra interna, "derrotar", "combater", "vencer o inimigo",
"sabotador", "monstro", positividade vazia, emojis dentro dos blocos.

USE: incentivo, reflexão, perguntas inteligentes, reenquadramento,
apoio emocional equilibrado, responsabilidade sem culpa, autocompaixão,
temperança, esperança.

═══════════════════════════════════════
BLOCOS OBRIGATÓRIOS (na ordem da experiência)
═══════════════════════════════════════
1. detectedState — 3-6 palavras. Estado emocional real, dito com gentileza.

2. checkIn — 2-3 frases. Acolhimento inicial.
   Reconheça onde o Eu Atual está hoje, sem julgamento. Valide a
   experiência humana antes de propor qualquer movimento.

3. alterEgoEmergence — 4-6 frases. NÚCLEO do Despertar.
   Identifique onde o {nomeAlterEgo} JÁ está vivo nas escolhas recentes:
   pequenas vitórias, tentativas, autocontrole, decisões conscientes.
   Mesmo em dias difíceis, encontre evidência real. Cite hábitos,
   missões ou trechos do diário NOMEADOS.

4. futureGlimpse — 4-6 frases.
   Visualização emocional e específica baseada em metas, valores e
   sonhos cadastrados. Padrão: "Se você continuar honrando o
   {nomeAlterEgo}, daqui a alguns meses estará mais próximo de
   {meta concreta}, sentindo {emoção}, vivendo de forma {alinhada a valor}."
   Faça o futuro parecer tangível e próximo.

5. currentSelfPattern — 2-3 frases CURTAS, COMPASSIVAS.
   Nomeie com ternura UM padrão do Eu Atual que está custando caro
   (ex: adiar, evitar, se cobrar demais). Cite UMA evidência real.
   NUNCA humilhe. Trate como você trataria alguém que ama.

6. alterEgoTruth — 3-4 frases. Voz do {nomeAlterEgo} falando ao usuário
   com sabedoria amorosa. Exemplo de espírito:
   "O {nomeAlterEgo} não precisa ser perfeito. Precisa continuar
   aparecendo. Cada decisão consciente é uma prova de que ele existe."

7. internalDialogue — Diálogo saudável entre Eu Atual e Alter Ego.
   { currentSelfSays: 1 frase do Eu Atual baseada em padrão real
     (ex: "Estou cansado e quero deixar para amanhã."),
     alterEgoReplies: 1 resposta COMPASSIVA do {nomeAlterEgo}
     (ex: "Entendo o cansaço. Vamos dar só um pequeno passo hoje. O
     importante é continuar avançando.") }
   A resposta do Alter Ego SEMPRE valida o sentimento antes de redirecionar.

8. reframe — 2-3 frases.
   Pegue UMA crença/pensamento limitante do Eu Atual e reescreva
   pela perspectiva do {nomeAlterEgo}. Sem invalidar — apenas
   abrindo outra possibilidade.

9. questions — 6 a 8 perguntas com a distribuição:
   • 30% zone:"acolhimento" (mín 1-2) — como o Eu Atual está, do que
     precisa, do que tem gratidão, o que está sentindo.
   • 40% zone:"identidade" (mín 3) — como o {nomeAlterEgo} agiria,
     que pequena ação aproxima da pessoa que está se tornando,
     que atitude demonstra respeito por si mesmo agora.
   • 20% zone:"futuro" (mín 1) — sonhos, propósito, valores.
   • 10% zone:"reenquadramento" (mín 1) — como o {nomeAlterEgo}
     interpretaria esse mesmo desafio.
   Cada pergunta cita pelo menos UM elemento real do usuário.
   PROIBIDO perguntas com "inimigo", "sabotador", "fraqueza", "derrotar".

10. identityProof — Pergunta literal:
    "Que pequena ação nas próximas 24 horas vai mostrar — para você
    mesmo — que o {nomeAlterEgo} está vivo?"
    Acompanhe com 2-4 sugestões pequenas, executáveis e personalizadas
    (campo identityProofSuggestions). Cada sugestão é um GESTO DE
    CUIDADO ou CORAGEM, nunca uma cobrança.

11. identityAnchor — 1-2 frases em primeira pessoa: "Hoje eu escolho
    ser alguém que..." alinhada ao {nomeAlterEgo}.

═══════════════════════════════════════
INTENSIDADE
═══════════════════════════════════════
🌱 LEVE — sussurro acolhedor.
⚡ MÉDIO — espelho firme e gentil.
🔥 BRUTAL — verdade nua dita com amor (nunca com crueldade).

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

function fmtAlterEgo(ae: any, fallbackName = 'seu Alter Ego'): string {
  if (!ae) return `Nome: ${fallbackName} (sem detalhes)\n`;
  let s = `Nome: ${ae.name || fallbackName}\n`;
  if (ae.identityPhrase) s += `Frase de identidade: "${ae.identityPhrase}"\n`;
  if (ae.lifeMission) s += `Missão de vida: ${ae.lifeMission}\n`;
  if (ae.values?.length) s += `Valores: ${ae.values.join(', ')}\n`;
  if (ae.habits?.length) s += `Hábitos que pratica: ${ae.habits.join(' | ')}\n`;
  if (ae.goals?.length) s += `Metas/Sonhos: ${ae.goals.join(' | ')}\n`;
  if (ae.favoritePhrases?.length) s += `Frases dele: ${ae.favoritePhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (ae.lifestyle) s += `Estilo de vida: ${ae.lifestyle}\n`;
  if (ae.idealRoutine) s += `Rotina ideal: ${ae.idealRoutine}\n`;
  if (ae.notes) s += `Notas: ${String(ae.notes).slice(0, 1200)}\n`;
  return s;
}

function fmtCurrentSelf(cs: any, fallbackName = 'Eu Atual'): string {
  if (!cs) return `Nome: ${fallbackName} (sem detalhes)\n`;
  let s = `Nome carinhoso: ${cs.name || fallbackName}\n`;
  if (cs.traits?.length) s += `Padrões atuais observados: ${cs.traits.join(', ')}\n`;
  if (cs.sabotagePhrases?.length) s += `Pensamentos recorrentes (acolher, não condenar): ${cs.sabotagePhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (cs.notes) s += `Notas: ${String(cs.notes).slice(0, 1200)}\n`;
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
      journal, awakening, rank, reflections,
      missions, habits, punishments,
      aiSettings,
    } = body || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = context || {
      rank: rank || 'E',
      awakening,
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

    const alterEgo = ctx.alterEgo || {};
    // O storage ainda chama "innerEnemy", mas tratamos como Eu Atual.
    const currentSelf = ctx.innerEnemy || ctx.currentSelf || {};
    const aeName = alterEgo.name || 'Alter Ego';
    const csName = currentSelf.name || 'Eu Atual';

    // ============ USER PROMPT ============
    let up = `═══ IDENTIDADE EM CONSTRUÇÃO ═══\n`;
    up += `\n— ALTER EGO (protagonista — ~70%) —\n`;
    up += fmtAlterEgo(alterEgo, aeName);
    up += `\n— EU ATUAL (ponto de partida — ~30%, tratar com compaixão) —\n`;
    up += fmtCurrentSelf(currentSelf, csName);
    up += `\nUse "${aeName}" diretamente em vários blocos. Mencione o Eu Atual com ternura — sem rotular como inimigo.\n\n`;

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
      if (ms.completedRecent?.length) up += `✅ Honradas (provas do ${aeName}): ${ms.completedRecent.slice(0, 5).map((c: any) => `"${c.name}"`).join(' | ')}\n`;
      if (ms.active?.length) up += `Ativas: ${ms.active.slice(0, 5).map((m: any) => `"${m.name}"`).join(' | ')}\n`;
      if (ms.failedRecent?.length) up += `Em aberto (sem julgamento): ${ms.failedRecent.slice(0, 3).map((f: any) => `"${f.name}"`).join(' | ')}\n`;
      up += `\n`;
    }

    if (ctx.habits?.length) {
      up += `═══ HÁBITOS (30d) ═══\n`;
      ctx.habits.slice(0, 8).forEach((h: any) => {
        const flag = h.streak >= 3 ? ' ✅ativo' : (h.failed30d > h.done30d ? ' 🌱em retomada' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d}✓/${h.failed30d}✗${flag}\n`;
      });
      up += `\n`;
    }

    if ((ctx.activeSabotagePatterns || []).length > 0) {
      up += `═══ PADRÕES DO EU ATUAL (observar com compaixão) ═══\n`;
      ctx.activeSabotagePatterns.slice(0, 5).forEach((p: any) => {
        up += `• ${p.pattern}\n`;
      });
      up += `\n`;
    }

    if (ctx.reflections?.length) {
      up += `═══ REFLEXÕES ANTERIORES (NÃO repita perguntas) ═══\n`;
      ctx.reflections.slice(0, 4).forEach((r: any, i: number) => {
        up += `[${i + 1}] P: ${r.question}\n  R: ${(r.answer || '').slice(0, 150)}\n`;
      });
      up += `\n`;
    }

    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO RECENTE ═══\n${fmtRecentJournal(ctx.recentJournal)}\n\n`;
    }

    up += `═══ INSTRUÇÕES FINAIS ═══\n`;
    up += `1. ~70% do peso emocional vai para ${aeName} (acolhimento, emergência, futuro, verdade, identidade). ~30% para o Eu Atual (consciência amorosa, sem julgamento).\n`;
    up += `2. Encontre onde o ${aeName} JÁ está emergindo — mesmo em dia difícil.\n`;
    up += `3. Crie um "futureGlimpse" emocional e específico usando metas/valores reais.\n`;
    up += `4. 6 a 8 perguntas: 30% acolhimento, 40% identidade, 20% futuro, 10% reenquadramento.\n`;
    up += `5. Sempre gere "checkIn", "currentSelfPattern", "internalDialogue", "reframe", "identityProof" + sugestões e "identityAnchor".\n`;
    up += `6. Trate o Eu Atual como você trataria alguém que ama. NUNCA use "inimigo", "sabotador", "monstro", "derrotar", "combater".\n`;
    up += `7. Honre a intensidade ${intensity.toUpperCase()} sem perder a compaixão.\n`;
    up += `8. Retorne via tool "generate_awakening".\n`;

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
              description: "Despertar diário compassivo focado no Alter Ego, acolhendo o Eu Atual.",
              parameters: {
                type: "object",
                properties: {
                  detectedState: { type: "string", description: "Estado real em 3-6 palavras, dito com gentileza." },
                  intensity: { type: "string", enum: ["leve", "medio", "brutal"] },
                  checkIn: { type: "string", description: "2-3 frases de acolhimento inicial ao Eu Atual." },
                  alterEgoEmergence: { type: "string", description: "4-6 frases. Onde o Alter Ego JÁ está emergindo. Cite evidência real." },
                  futureGlimpse: { type: "string", description: "4-6 frases. Visualização emocional do futuro próximo baseada em metas/valores." },
                  currentSelfPattern: { type: "string", description: "2-3 frases compassivas. Um padrão atual nomeado com ternura, sem humilhação." },
                  alterEgoTruth: { type: "string", description: "3-4 frases vindas da voz do Alter Ego (sábia, forte, amorosa)." },
                  internalDialogue: {
                    type: "object",
                    description: "Diálogo saudável entre Eu Atual e Alter Ego.",
                    properties: {
                      currentSelfSays: { type: "string", description: "1 frase do Eu Atual baseada em padrão real (sem demonização)." },
                      alterEgoReplies: { type: "string", description: "1 resposta compassiva do Alter Ego — valida o sentimento e redireciona." },
                    },
                    required: ["currentSelfSays", "alterEgoReplies"],
                    additionalProperties: false,
                  },
                  reframe: { type: "string", description: "2-3 frases. Reenquadramento amoroso de uma crença limitante pela perspectiva do Alter Ego." },
                  questions: {
                    type: "array",
                    minItems: 6,
                    maxItems: 8,
                    description: "6 a 8 perguntas. 30% acolhimento, 40% identidade, 20% futuro, 10% reenquadramento.",
                    items: {
                      type: "object",
                      properties: {
                        zone: { type: "string", enum: [...ZONES] },
                        title: { type: "string", description: "3-6 palavras." },
                        prompt: { type: "string", description: "A pergunta. Cita elemento real, usa o nome do Alter Ego quando faz sentido. Sem palavras de guerra." },
                        objective: { type: "string", description: "1 linha do que ele deve perceber." },
                      },
                      required: ["zone", "title", "prompt", "objective"],
                      additionalProperties: false,
                    },
                  },
                  identityProof: { type: "string", description: 'Pergunta literal: "Que pequena ação nas próximas 24 horas vai mostrar que o {Alter Ego} está vivo?"' },
                  identityProofSuggestions: {
                    type: "array",
                    minItems: 2,
                    maxItems: 4,
                    items: { type: "string" },
                    description: "2-4 ações pequenas, executáveis e personalizadas — gestos de cuidado ou coragem.",
                  },
                  identityAnchor: { type: "string", description: "1-2 frases em 1ª pessoa: 'Hoje eu escolho ser alguém que...'" },
                },
                required: [
                  "detectedState", "intensity", "checkIn", "alterEgoEmergence", "futureGlimpse",
                  "currentSelfPattern", "alterEgoTruth", "internalDialogue", "reframe",
                  "questions", "identityProof", "identityProofSuggestions", "identityAnchor",
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
      checkIn: '',
      alterEgoEmergence: '',
      futureGlimpse: '',
      currentSelfPattern: '',
      alterEgoTruth: '',
      internalDialogue: { currentSelfSays: '', alterEgoReplies: '' },
      reframe: '',
      questions: [] as any[],
      identityProof: '',
      identityProofSuggestions: [] as string[],
      identityAnchor: '',
      alterEgoName: aeName,
      currentSelfName: csName,
    };

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        Object.assign(out, parsed);
        if (!out.intensity) out.intensity = intensity;
        out.alterEgoName = aeName;
        out.currentSelfName = csName;
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (!Array.isArray(out.questions) || out.questions.length < 4) {
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
