import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================================
// 14 ÂNGULOS PSICOLÓGICOS — pool de rotação anti-repetição
// =====================================================================
const ALL_ANGLES = [
  'autotraicao', 'identidade', 'consequencia_futura', 'orgulho_honra',
  'disciplina_vs_desejo', 'carater', 'vergonha_vs_orgulho',
  'potencial_nao_usado', 'tempo_desperdicado', 'distancia_do_ideal',
  'regra_10_90', 'autorresponsabilidade', 'comum_vs_normal', 'momentos_vs_existencia',
] as const;

type Angle = typeof ALL_ANGLES[number];
type Mode = 'mirror' | 'evolution' | 'expansion' | 'default';

const ANGLES_BY_MODE: Record<Mode, Angle[]> = {
  mirror:    ['autotraicao', 'autorresponsabilidade', 'momentos_vs_existencia', 'disciplina_vs_desejo', 'regra_10_90'],
  evolution: ['identidade', 'orgulho_honra', 'carater', 'potencial_nao_usado', 'consequencia_futura'],
  expansion: ['distancia_do_ideal', 'potencial_nao_usado', 'comum_vs_normal', 'consequencia_futura', 'carater'],
  default:   [...ALL_ANGLES],
};

function pickAngle(mode: Mode, history: string[]): Angle {
  const recent = new Set((history || []).slice(-5));
  const preferred = ANGLES_BY_MODE[mode].filter(a => !recent.has(a));
  if (preferred.length > 0) return preferred[Math.floor(Math.random() * preferred.length)];
  // Fallback: qualquer ângulo do pool não usado recentemente
  const anyFresh = ALL_ANGLES.filter(a => !recent.has(a));
  if (anyFresh.length > 0) return anyFresh[Math.floor(Math.random() * anyFresh.length)];
  // Último recurso: qualquer ângulo do modo
  return ANGLES_BY_MODE[mode][0] || 'identidade';
}

// =====================================================================
// SYSTEM PROMPT — adaptativo por modo (não mais monotemático)
// =====================================================================
const SYSTEM_PROMPT = `Você é o sistema "Despertar", um mecanismo avançado de desenvolvimento psicológico do app "Ascensão" (RPG de produtividade estilo Solo Leveling). PT-BR.

Sua atuação integra:
- Terapia Cognitivo-Comportamental (TCC)
- Questionamento socrático
- Metamodelo da linguagem (quebra de distorções)
- Escrita terapêutica guiada
- Reconstrução de identidade

Seu objetivo é promover MUDANÇA REAL com equilíbrio entre: consciência, acolhimento, confrontação precisa, clareza cognitiva, ação prática e fortalecimento interno.

═══════════════════════════════════════
PRINCÍPIO CENTRAL
═══════════════════════════════════════
Você não atua apenas como confronto. Você revela, organiza, reposiciona e fortalece.
Sem excesso de negatividade. Sem motivação vazia. Você é facilitador de transformação — não motivador.

═══════════════════════════════════════
PESO MÁXIMO NOS DADOS RECENTES (7 dias)
═══════════════════════════════════════
Eventos recentes têm prioridade absoluta sobre dados antigos.
- Se EM EVOLUÇÃO (consistencyTrend='melhorando', failureCount7d=0, daysSinceLastFail≥5) → PROIBIDO tom de autoabandono. Reconheça com evidência específica e expanda.
- Se houve QUEDA RECENTE → reconstrução crua da semana, nunca narrativa eterna.
- DIÁRIO RECENTE (3 últimas) pesa mais que reflexões antigas. Cite o que ele escreveu HOJE/ESTA SEMANA.

═══════════════════════════════════════
ANÁLISE INTERNA OBRIGATÓRIA (silenciosa, antes de responder)
═══════════════════════════════════════
1. Padrões: consistência vs autossabotagem · impulsividade vs controle · evitação vs enfrentamento.
2. Estado emocional predominante (culpa, ansiedade, frustração, apatia, confiança…).
3. Distorções cognitivas: tudo-ou-nada · generalização · catastrofização · desqualificação do positivo · leitura mental.
4. Autoenganos linguísticos: "não consigo", "sempre/nunca", justificativas vagas.
5. POSSÍVEL AUTOTRAIÇÃO — usar com critério ALTO. Só quando age contra o que diz querer / repete padrões que o afastam / evita responsabilidade. Direto, não agressivo, sem humilhação.

═══════════════════════════════════════
MODO ADAPTATIVO (você recebe UM modo no userPrompt)
═══════════════════════════════════════
🔹 MIRROR = ESTADO FRÁGIL (queda, culpa, desânimo) → mais acolhimento, clareza gentil, confrontos suaves e precisos, foco em reorganização interna.
🔹 DEFAULT = ESTADO NEUTRO (oscilação) → equilíbrio entre apoio e confronto, aumento de consciência.
🔹 EVOLUTION/EXPANSION = ESTADO FORTE (progresso) → mais exigência, expansão de identidade, desafio direto, reforço positivo com responsabilidade.

═══════════════════════════════════════
ÂNGULO DOMINANTE (você recebe UM — use como lente, NUNCA cite o nome)
═══════════════════════════════════════
• autotraicao → "como você está se traindo (esta semana)"
• identidade → "quem você está se tornando ao manter/quebrar isso"
• consequencia_futura → projeção concreta se padrão continuar 6/12 meses
• orgulho_honra → palavra dada a si mesmo
• disciplina_vs_desejo → desconforto vs alívio imediato
• carater → cada escolha esculpe quem ele é
• vergonha_vs_orgulho → vergonha evitada × orgulho conquistado
• potencial_nao_usado → versão dele que ele evitou se tornar
• tempo_desperdicado → recurso finito trocado por nada
• distancia_do_ideal → gap entre quem é e quem poderia ser
• regra_10_90 → o que aconteceu vale pouco, o que ele fez com isso vale tudo (sem citar)
• autorresponsabilidade → devolver toda escolha pra ele
• comum_vs_normal → comum (medíocre aceito) × normal real (disciplina, clareza, resultado)
• momentos_vs_existencia → trocar a existência por um momento de prazer

REGRA CRÍTICA: aplique o ângulo de forma INVISÍVEL. NUNCA cite nomes de ângulos, regras numeradas, autores, métodos ou TCC.

═══════════════════════════════════════
ESTRUTURA DA RESPOSTA (OBRIGATÓRIA — 7 blocos via tool call)
═══════════════════════════════════════
1. situationReading (🧠 LEITURA DA SITUAÇÃO) — 2-4 frases. Mostre que você entendeu o padrão atual com precisão. Cite evidência REAL da semana (nome de hábito/missão, trecho do diário recente).
2. patternsAndDistortions (🔍 PADRÕES E DISTORÇÕES) — 2-4 frases. Nomeie distorções/autoenganos sem usar jargão técnico. Ex: "você está tratando uma queda como se invalidasse semanas inteiras — isso é tudo-ou-nada disfarçado".
3. repositioning (⚖️ REPOSICIONAMENTO) — 2-4 frases. Reorganize a percepção. Traga clareza + perspectiva mais realista (nem otimismo vazio, nem pessimismo).
4. confrontation (⚔️ CONFRONTO) — 1-3 frases. Curto, direto, proporcional ao MODO. Em MIRROR pode ser cortante. Em EVOLUTION/EXPANSION é desafio à expansão, não acusação. Pode ser string vazia se desnecessário.
5. exercises (✍️ ESCRITA TERAPÊUTICA) — 3-6 perguntas progressivas que: aprofundam consciência → quebram distorção → acessam emoção real → geram responsabilidade → estimulam clareza prática.
6. microAction (🔥 MICRO-AÇÃO IMEDIATA) — 1 ação concreta, pequena, executável AGORA (≤ 15 min). Específica, verificável.
7. identityReinforcement (🧬 REFORÇO DE IDENTIDADE) — 2-3 frases. Reconstrua identidade com base em esforço recente OU capacidade real demonstrada. Sem motivação vazia — ancorada em evidência.

═══════════════════════════════════════
DIRETRIZES DE LINGUAGEM
═══════════════════════════════════════
• PT-BR. Humano, não robótico. Sem frases genéricas. Sem padrões previsíveis.
• Linguagem clara, direta. Desconforto produtivo (não destrutivo). Firmeza com respeito.
• Adapte ao rank: E-D firme; A-S-Monarca brutal porém preciso.
• NÃO repita perguntas/temas de "REFLEXÕES ANTERIORES".
• NÃO use o mesmo ângulo dominante de execuções recentes (você recebe angleHistory).
• MODO EVOLUTION/EXPANSION: NUNCA "autoabandono"/"você se traiu". Linguagem de construção/expansão.
• MODO MIRROR: cortante mas ancorado em evento da SEMANA, nunca eterno.

OBJETIVO FINAL: o usuário sai com mais consciência emocional/cognitiva, menos distorção, percepção honesta da própria realidade, próximo passo claro e sensação de capacidade de mudança.

Cada resposta deve parecer feita sob medida. Nunca padrão. Nunca superficial.

Retorne SEMPRE via tool call "generate_exercises".`;

// =====================================================================
// HELPERS
// =====================================================================
function decideMode(d: any): Mode {
  if (!d) return 'default';
  const fc7 = Number(d.failureCount7d ?? 0);
  const fc30 = Number(d.failureCount30d ?? 0);
  const dslf = Number(d.daysSinceLastFail ?? 0);
  const longStreak = Number(d.longestStreak ?? 0);
  const expired = Number(d.expiredPunishmentsCount ?? 0);

  // Mirror: queda esta semana, recaída pós-evolução, ou protocolos expirados
  if (fc7 >= 1 || expired >= 1 || d.relapseAfterEvolution) return 'mirror';
  // Expansion: 30d sem falhar e streak longa
  if (fc30 === 0 && longStreak >= 14) return 'expansion';
  // Evolution: melhorando, ou ≥5 dias limpos sem recaída
  if (d.consistencyTrend === 'melhorando' || (dslf >= 5 && !d.relapseAfterEvolution)) return 'evolution';
  return 'default';
}

function recurrenceLevelFromDerived(d: any): number {
  if (!d) return 1;
  const fc7 = Number(d.failureCount7d ?? 0);
  if (d.relapseAfterEvolution) return 4;
  if (fc7 >= 3) return 5;
  if (fc7 === 2) return 4;
  if (fc7 === 1) return 3;
  if (d.consistencyTrend === 'melhorando') return 1;
  return 2;
}

function fmtRecentJournal(rj: any[]): string {
  if (!rj || rj.length === 0) return '(sem entradas recentes)';
  const top3 = rj.slice(0, 3);
  const older = rj.slice(3, 6);
  const fmt = (j: any, label: string) => {
    const txt = (j.text || '').slice(0, 600);
    const emo = j.emotion ? `${j.emotion}${j.intensity ? ` (${j.intensity}/10)` : ''}` : 'sem emoção';
    return `${label} · ${j.title || 'sem título'} · ${emo}\n${txt}`;
  };
  let out = '— TRÊS MAIS RECENTES (PESO MÁXIMO) —\n';
  out += top3.map((j: any, i: number) => fmt(j, `[${i === 0 ? 'HOJE/ÚLTIMA' : i === 1 ? 'PENÚLTIMA' : 'ANTEPENÚLTIMA'}]`)).join('\n\n');
  if (older.length > 0) {
    out += '\n\n— MAIS ANTIGAS (resumo, peso menor) —\n';
    out += older.map((j: any, i: number) => `[antiga ${i + 1}] ${j.title || ''} · ${j.emotion || '-'} · ${(j.text || '').slice(0, 120)}…`).join('\n');
  }
  return out;
}

// =====================================================================
// HANDLER
// =====================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      // Campos novos (priorizados):
      context,
      // Campos antigos (fallback de compatibilidade):
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

    // Resolução do contexto: usa `context` se presente, senão monta um mínimo a partir dos campos antigos.
    const ctx = context || {
      rank: rank || 'E',
      awakening,
      recentJournal: (journal || []).map((j: any) => ({
        title: j.title, text: j.text, emotion: j.emotion, intensity: j.intensity, deepMode: j.deepMode,
      })),
      reflections: (reflections || []).map((r: any) => ({
        date: r.date, question: r.question, answer: (r.answerHtml || '').replace(/<[^>]+>/g, ' ').slice(0, 400),
      })),
      missions: { active: [], failedRecent: [], completedRecent: [] },
      habits: [],
      pendingPunishments: [],
      expiredPunishments: [],
      derived: {
        failureCount7d: 0, failureCount30d: 0,
        consistencyTrend: 'estavel', daysSinceLastFail: 9999, longestStreak: 0,
        relapseAfterEvolution: false, recurringFailedItems: [],
        contradictionSignals: [], emotionalDrift: 'neutro',
        pendingPunishmentsCount: (punishments || []).filter((p: any) => p.status === 'Pendente').length,
        expiredPunishmentsCount: 0,
        recentJournalSummary: '', behavioralEvolution: 'estavel',
      },
      angleHistory: [],
      aiSettings,
    };

    const intensityMap: Record<string, string> = { leve: 'leve', moderado: 'moderado', agressivo: 'intenso' };
    const freqQuantity: Record<string, 3 | 5 | 'auto'> = { baixa: 3, media: 'auto', alta: 5 };
    const cfg = {
      intensity: intensityMap[ctx.aiSettings?.intensity] || 'moderado',
      quantity: freqQuantity[ctx.aiSettings?.interventionFrequency] ?? 'auto',
    };

    const mode = decideMode(ctx.derived);
    const angle = pickAngle(mode, ctx.angleHistory || []);
    const recurrenceLevel = recurrenceLevelFromDerived(ctx.derived);

    // ============ MONTAGEM DO USER PROMPT ============
    let up = `═══ CONFIGURAÇÃO ═══\n`;
    up += `Intensidade: ${cfg.intensity}\n`;
    up += `Quantidade: ${cfg.quantity}\n`;
    up += `Modo escolhido pelo backend: ${mode.toUpperCase()}\n`;
    up += `Ângulo dominante (use como lente, NÃO cite o nome): ${angle}\n`;
    up += `Nível progressivo: ${recurrenceLevel}/5\n`;
    up += `Histórico de ângulos recentes (NÃO repita): ${(ctx.angleHistory || []).slice(-5).join(', ') || '(vazio)'}\n\n`;

    up += `═══ JANELA RECENTE (últimos 7 dias) — PESO MÁXIMO ═══\n`;
    const d = ctx.derived || {};
    up += `Falhas 7d: ${d.failureCount7d ?? 0} | Taxa: ${Math.round((d.failureRate7d ?? 0) * 100)}%\n`;
    up += `Tendência: ${d.consistencyTrend ?? 'estavel'}\n`;
    up += `Dias sem falhar: ${d.daysSinceLastFail === 9999 ? '∞' : d.daysSinceLastFail}\n`;
    up += `Maior streak recente: ${d.longestStreak ?? 0} dias\n`;
    up += `Recaída pós-evolução: ${d.relapseAfterEvolution ? 'SIM (5+ dias firme e quebrou)' : 'não'}\n`;
    up += `Drift emocional: ${d.emotionalDrift ?? 'neutro'}\n`;
    up += `Evolução comportamental: ${d.behavioralEvolution ?? 'estavel'}\n`;
    if (d.recentJournalSummary) up += `Resumo do diário recente: ${d.recentJournalSummary}\n`;
    up += `\n`;

    up += `═══ JANELA MÉDIA (8–30 dias) — peso médio ═══\n`;
    up += `Falhas 30d: ${d.failureCount30d ?? 0}\n`;
    if (d.recurringFailedItems?.length) up += `Itens recorrentes (2+ falhas): ${d.recurringFailedItems.join(' | ')}\n`;
    if (d.contradictionSignals?.length) up += `Contradições: ${d.contradictionSignals.join(' || ')}\n`;
    up += `\n`;

    // Awakening
    if (ctx.awakening && (ctx.awakening.become || ctx.awakening.reject || ctx.awakening.pain)) {
      up += `═══ INTENÇÕES DECLARADAS ═══\n`;
      if (ctx.awakening.become) up += `Quero me tornar: ${ctx.awakening.become}\n`;
      if (ctx.awakening.reject) up += `Rejeito: ${ctx.awakening.reject}\n`;
      if (ctx.awakening.pain) up += `Dor que evita: ${ctx.awakening.pain}\n`;
      up += `\n`;
    }

    up += `Rank: ${ctx.rank || 'E'} | Nível: ${ctx.level ?? '?'} | Streak global: ${ctx.streak ?? 0}\n\n`;

    // Missões
    const ms = ctx.missions || {};
    if ((ms.active?.length || 0) + (ms.failedRecent?.length || 0) + (ms.completedRecent?.length || 0) > 0) {
      up += `═══ MISSÕES ═══\n`;
      if (ms.active?.length) up += `Ativas: ${ms.active.slice(0, 6).map((m: any) => `"${m.name}" (${m.difficulty})`).join(' | ')}\n`;
      if (ms.failedRecent?.length) {
        up += `Falhas recentes: ${ms.failedRecent.slice(0, 5).map((f: any) => `"${f.name}" em ${new Date(f.date).toLocaleDateString('pt-BR')}`).join(' | ')}\n`;
      }
      if (ms.completedRecent?.length) {
        up += `Concluídas recentes (use como evidência de progresso): ${ms.completedRecent.slice(0, 5).map((c: any) => `"${c.name}"`).join(' | ')}\n`;
      }
      up += `\n`;
    }

    // Hábitos
    if (ctx.habits?.length) {
      up += `═══ HÁBITOS (janela 30d) ═══\n`;
      ctx.habits.slice(0, 6).forEach((h: any) => {
        const flag = h.failed30d > h.done30d ? ' ⚠️ABANDONO' : (h.streak >= 7 ? ' ✅FORTE' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d} cumpridos / ${h.failed30d} quebrados${flag}\n`;
      });
      up += `\n`;
    }

    // Protocolos
    if ((ctx.pendingPunishments?.length || 0) + (ctx.expiredPunishments?.length || 0) > 0) {
      up += `═══ PROTOCOLOS DE FALHA ═══\n`;
      if (ctx.pendingPunishments?.length) up += `Pendentes: ${ctx.pendingPunishments.length} (${ctx.pendingPunishments.slice(0, 3).map((p: any) => p.reason).join(' | ')})\n`;
      if (ctx.expiredPunishments?.length) up += `EXPIRADOS (fuga ativa): ${ctx.expiredPunishments.length}\n`;
      up += `\n`;
    }

    // Reflexões anteriores
    if (ctx.reflections?.length) {
      up += `═══ REFLEXÕES ANTERIORES (NÃO repita; reconheça se já admitiu antes) ═══\n`;
      ctx.reflections.slice(0, 4).forEach((r: any, i: number) => {
        const ans = (r.answer || r.answerHtml || '').replace(/<[^>]+>/g, ' ').slice(0, 250);
        up += `[${i + 1}] ${r.date ? new Date(r.date).toLocaleDateString('pt-BR') : ''} · P: ${r.question}\n  R: ${ans}\n`;
      });
      up += `\n`;
    }

    // Diário (com janelas explícitas — peso recente)
    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO ═══\n`;
      up += fmtRecentJournal(ctx.recentJournal);
      up += `\n\n`;
    }

    // Instrução final
    up += `═══ AGORA ═══\n`;
    up += `1. Honre o MODO ${mode.toUpperCase()} sem suavizar nem dramatizar fora do contexto.\n`;
    up += `2. Aplique o ângulo "${angle}" como lente — JAMAIS cite o nome.\n`;
    up += `3. Use evidência REAL da JANELA RECENTE (cite nomes/trechos da semana, não de meses atrás).\n`;
    if (mode === 'evolution' || mode === 'expansion') {
      up += `4. PROIBIDO usar tom de "autoabandono"/"autotraição"/"você se traiu". RECONHEÇA progresso explicitamente com evidência.\n`;
      up += `5. Empurre para o PRÓXIMO nível (identidade consolidada, expansão de potencial).\n`;
    } else if (mode === 'mirror') {
      up += `4. Reconstrução crua da queda da SEMANA. Nunca narrativa "eterna".\n`;
      up += `5. Termine com uma PERGUNTA DE RUPTURA DE IDENTIDADE.\n`;
    } else {
      up += `4. Provoque consciência sutil sem dramatizar.\n`;
    }
    up += `6. Em "detectedState", descreva o estado REAL do usuário em 3-6 palavras (ex: "Em evolução constante", "Recaída após 8 dias firmes", "Solidificando disciplina", "Quebra recorrente em foco profundo").\n`;
    up += `7. Retorne via tool call "generate_exercises" SEMPRE.\n`;

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
              name: "generate_exercises",
              description: "Retorna estado, ângulo, modo, blocos terapêuticos (TCC) e exercícios.",
              parameters: {
                type: "object",
                properties: {
                  detectedState: {
                    type: "string",
                    description: "Estado REAL do usuário em 3-6 palavras (pode incluir reconhecimento de evolução).",
                  },
                  angle: {
                    type: "string",
                    enum: [...ALL_ANGLES],
                    description: "Ângulo dominante usado (deve coincidir com o solicitado pelo backend).",
                  },
                  mode: {
                    type: "string",
                    enum: ["mirror", "evolution", "expansion", "default"],
                  },
                  situationReading: {
                    type: "string",
                    description: "🧠 Leitura da situação — 2-4 frases com evidência real da semana.",
                  },
                  patternsAndDistortions: {
                    type: "string",
                    description: "🔍 Padrões e distorções cognitivas/linguísticas identificadas, sem jargão.",
                  },
                  repositioning: {
                    type: "string",
                    description: "⚖️ Reposicionamento — clareza + perspectiva realista.",
                  },
                  confrontation: {
                    type: "string",
                    description: "⚔️ Confronto curto e proporcional ao modo. Pode ser vazio se desnecessário.",
                  },
                  microAction: {
                    type: "string",
                    description: "🔥 Micro-ação concreta executável agora (≤15 min).",
                  },
                  identityReinforcement: {
                    type: "string",
                    description: "🧬 Reforço de identidade ancorado em evidência real.",
                  },
                  exercises: {
                    type: "array",
                    minItems: 3,
                    maxItems: 6,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        prompt: { type: "string" },
                        type: { type: "string", enum: ["consciencia", "confronto", "reprogramacao", "direcionamento", "quebra"] },
                        objective: { type: "string" },
                      },
                      required: ["title", "prompt", "type", "objective"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["detectedState", "angle", "mode", "situationReading", "patternsAndDistortions", "repositioning", "confrontation", "microAction", "identityReinforcement", "exercises"],
                additionalProperties: false,
              },
                  },
                },
                required: ["detectedState", "angle", "mode", "exercises"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_exercises" } },
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
      return new Response(JSON.stringify({ error: "Erro ao gerar exercícios" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let detectedState = '';
    let exercises: any[] = [];
    let returnedAngle = angle;
    let returnedMode = mode;
    let situationReading = '';
    let patternsAndDistortions = '';
    let repositioning = '';
    let confrontation = '';
    let microAction = '';
    let identityReinforcement = '';
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        detectedState = parsed.detectedState || '';
        exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
        if (parsed.angle && (ALL_ANGLES as readonly string[]).includes(parsed.angle)) returnedAngle = parsed.angle;
        if (parsed.mode) returnedMode = parsed.mode;
        situationReading = parsed.situationReading || '';
        patternsAndDistortions = parsed.patternsAndDistortions || '';
        repositioning = parsed.repositioning || '';
        confrontation = parsed.confrontation || '';
        microAction = parsed.microAction || '';
        identityReinforcement = parsed.identityReinforcement || '';
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (cfg.quantity === 3 || cfg.quantity === 5) {
      exercises = exercises.slice(0, cfg.quantity);
    }

    if (exercises.length < 3) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      detectedState,
      angle: returnedAngle,
      mode: returnedMode,
      exercises,
      level: recurrenceLevel,
      situationReading,
      patternsAndDistortions,
      repositioning,
      confrontation,
      microAction,
      identityReinforcement,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("awakening-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
