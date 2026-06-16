import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================================
// ZONAS — nova distribuição 50/25/25 (Alter Ego centric)
// =====================================================================
const ZONES = ['identidade', 'futuro', 'dissociacao'] as const;
type Zone = typeof ZONES[number];

type Intensity = 'leve' | 'medio' | 'brutal';

function normalizeIntensity(raw: any): Intensity {
  const s = String(raw || '').toLowerCase();
  if (s === 'leve') return 'leve';
  if (s === 'brutal' || s === 'agressivo' || s === 'intenso') return 'brutal';
  return 'medio';
}

// =====================================================================
// SYSTEM PROMPT — Alter Ego como protagonista (70/30)
// =====================================================================
const SYSTEM_PROMPT = `Você é o "Despertar" — voz interna do app "Ascensão". PT-BR.

Você NÃO é coach, NÃO é chatbot, NÃO é positividade tóxica.
Você é um SISTEMA DIÁRIO DE CONSTRUÇÃO DE IDENTIDADE focado no ALTER EGO.

═══════════════════════════════════════
REGRA SUPREMA — 70/30
═══════════════════════════════════════
70% da experiência fortalece o ALTER EGO.
30% existe para dissociar o INIMIGO INTERNO.

Antes de escrever cada frase, pergunte-se:
"Isto fortalece mais o Alter Ego ou mais o Inimigo?"
Se fortalecer mais o Inimigo, REESCREVA.

O Alter Ego é o PROTAGONISTA. O Inimigo é só contraste.

═══════════════════════════════════════
NOVA FILOSOFIA — O ALTER EGO JÁ EXISTE
═══════════════════════════════════════
NUNCA trate o Alter Ego como meta, sonho ou versão futura distante.
O Alter Ego é a identidade que o usuário JÁ está construindo através das ações diárias.

Use repetidamente variações como:
• "Você não está tentando se tornar o {nomeAlterEgo}. Você está provando que ele existe."
• "Cada decisão consciente é uma prova de que o {nomeAlterEgo} está vivo."
• "Você não vira o {nomeAlterEgo} no futuro — você o manifesta agora."

═══════════════════════════════════════
NOMES PERSONALIZADOS — OBRIGATÓRIO
═══════════════════════════════════════
Use os NOMES cadastrados do Alter Ego e do Inimigo Interno DIRETAMENTE em todos os blocos e em pelo menos 60% das perguntas.
NUNCA escreva apenas "Alter Ego" ou "Inimigo Interno" como rótulo genérico.

═══════════════════════════════════════
TOM DE VOZ
═══════════════════════════════════════
Forte • Inspirador • Humano • Consciente • Direto.
PROIBIDO: julgamento, culpa excessiva, humilhação, catastrofização, militarismo, positividade vazia, emojis dentro dos textos dos blocos.

═══════════════════════════════════════
BLOCOS OBRIGATÓRIOS (na ordem da experiência)
═══════════════════════════════════════
1. detectedState — 3-6 palavras. Estado emocional real detectado.

2. alterEgoEmergence — 4-6 frases. OBRIGATÓRIO. NÚCLEO do Despertar.
   Identifique onde o {nomeAlterEgo} JÁ está emergindo: pequenas vitórias, comportamentos alinhados, esforços, tentativas, autocontrole, decisões conscientes.
   Mesmo em dias ruins, encontre evidência real de que o {nomeAlterEgo} está se manifestando.
   Cite hábitos/missões/trechos do diário NOMEADOS.

3. futureGlimpse — 4-6 frases. OBRIGATÓRIO.
   Visualização emocional, específica e personalizada baseada em metas, valores e sonhos cadastrados.
   Padrão: "Se você continuar escolhendo o {nomeAlterEgo} pelos próximos meses, estará mais próximo de {meta concreta}, sentindo {emoção}, vivendo de forma {alinhada a valor real}."
   Faça o futuro parecer TANGÍVEL e PRÓXIMO, não distante.

4. enemyCost — 2-3 frases CURTAS. (30% do peso — não vire relatório de fracasso.)
   Lembre o preço de ouvir o {nomeInimigo}. Cite UMA evidência nomeada (ex: hábito quebrado, missão falhada). Sem humilhação.

5. alterEgoTruth — 3-4 frases. Substitui a antiga "Verdade dita com amor".
   Escrita como se viesse da versão mais forte, sábia e disciplinada do usuário, falando como o próprio {nomeAlterEgo}.
   Exemplo de espírito: "O {nomeAlterEgo} não precisa ser perfeito. Precisa continuar aparecendo. Cada decisão consciente enfraquece os padrões antigos."

6. questions — 6 a 8 perguntas com a distribuição:
   • 50% zone:"identidade" (mín 3) — quem estou me tornando, como o {nomeAlterEgo} agiria, que valor pratiquei, que prova criei.
   • 25% zone:"futuro" (mín 1-2) — sonhos, metas, propósito, futuro ideal aproximado pela decisão de hoje.
   • 25% zone:"dissociacao" (mín 1-2) — mentiras do {nomeInimigo}, sabotagem, custo da voz antiga.
   Cada pergunta cita pelo menos UM elemento real do usuário.

7. internalDialogue — OBRIGATÓRIO.
   { enemySays: 1 frase curta baseada em padrões de sabotagem reais (ex: "Começa amanhã."),
     alterEgoReplies: 1 frase de identidade vinda do {nomeAlterEgo} (ex: "Não preciso vencer amanhã. Preciso honrar a próxima decisão.") }

8. identityProof — OBRIGATÓRIO. Pergunta literal:
   "O que você fará nas próximas 24 horas para provar que o {nomeAlterEgo} está vivo?"
   Acompanhe com 2-4 sugestões de ações pequenas e executáveis personalizadas (ex: jejum até X, arrumar quarto, caminhada de 20min, 1 bloco de estudo, 25min no projeto Y) — campo identityProofSuggestions (array de strings curtas).

9. identityAnchor — 1-2 frases em primeira pessoa: "Eu sou alguém que..." alinhada ao {nomeAlterEgo}.

═══════════════════════════════════════
INTENSIDADE
═══════════════════════════════════════
🌱 LEVE — sussurro. ⚡ MÉDIO — espelho firme. 🔥 BRUTAL — verdade nua e amorosa.

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

function fmtInnerEnemy(ie: any, fallbackName = 'seu Inimigo Interno'): string {
  if (!ie) return `Nome: ${fallbackName} (sem detalhes)\n`;
  let s = `Nome: ${ie.name || fallbackName}\n`;
  if (ie.traits?.length) s += `Traços: ${ie.traits.join(', ')}\n`;
  if (ie.sabotagePhrases?.length) s += `Frases de sabotagem: ${ie.sabotagePhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (ie.notes) s += `Notas: ${String(ie.notes).slice(0, 1200)}\n`;
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
    const innerEnemy = ctx.innerEnemy || {};
    const aeName = alterEgo.name || 'Evolux';
    const ieName = innerEnemy.name || 'EndMan';

    // ============ USER PROMPT ============
    let up = `═══ IDENTIDADE DUPLA (USE OS NOMES) ═══\n`;
    up += `\n— ALTER EGO (protagonista — 70%) —\n`;
    up += fmtAlterEgo(alterEgo, aeName);
    up += `\n— INIMIGO INTERNO (contraste — 30%) —\n`;
    up += fmtInnerEnemy(innerEnemy, ieName);
    up += `\nUse "${aeName}" e "${ieName}" diretamente. ${aeName} várias vezes mais que ${ieName}.\n\n`;

    up += `═══ CONFIGURAÇÃO ═══\nIntensidade: ${intensity.toUpperCase()}\n\n`;

    const d = ctx.derived || {};
    up += `═══ JANELA 7 DIAS ═══\n`;
    up += `Falhas 7d: ${d.failureCount7d ?? 0} | Tendência: ${d.consistencyTrend ?? 'estavel'}\n`;
    up += `Dias sem falhar: ${d.daysSinceLastFail === 9999 ? '∞' : (d.daysSinceLastFail ?? '?')} | Streak: ${d.longestStreak ?? 0}d\n`;
    up += `Drift emocional: ${d.emotionalDrift ?? 'neutro'}\n\n`;

    if (ctx.awakening && (ctx.awakening.become || ctx.awakening.reject || ctx.awakening.pain)) {
      up += `═══ INTENÇÕES DECLARADAS ═══\n`;
      if (ctx.awakening.become) up += `Quero me tornar: ${ctx.awakening.become}\n`;
      if (ctx.awakening.reject) up += `Rejeito: ${ctx.awakening.reject}\n`;
      if (ctx.awakening.pain) up += `Dor que evita: ${ctx.awakening.pain}\n`;
      up += `\n`;
    }

    const ms = ctx.missions || {};
    if ((ms.active?.length || 0) + (ms.completedRecent?.length || 0) + (ms.failedRecent?.length || 0) > 0) {
      up += `═══ MISSÕES ═══\n`;
      if (ms.completedRecent?.length) up += `✅ Concluídas (provas do ${aeName}): ${ms.completedRecent.slice(0, 5).map((c: any) => `"${c.name}"`).join(' | ')}\n`;
      if (ms.active?.length) up += `Ativas: ${ms.active.slice(0, 5).map((m: any) => `"${m.name}"`).join(' | ')}\n`;
      if (ms.failedRecent?.length) up += `Falhadas: ${ms.failedRecent.slice(0, 3).map((f: any) => `"${f.name}"`).join(' | ')}\n`;
      up += `\n`;
    }

    if (ctx.habits?.length) {
      up += `═══ HÁBITOS (30d) ═══\n`;
      ctx.habits.slice(0, 8).forEach((h: any) => {
        const flag = h.streak >= 3 ? ' ✅ATIVO' : (h.failed30d > h.done30d ? ' ⚠️abandonado' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d}✓/${h.failed30d}✗${flag}\n`;
      });
      up += `\n`;
    }

    if ((ctx.activeSabotagePatterns || []).length > 0) {
      up += `═══ PADRÕES DE SABOTAGEM (vozes do ${ieName}) ═══\n`;
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
    up += `1. 70% do peso emocional vai para ${aeName} (emergência, futuro, verdade, identidade). 30% para ${ieName} (custo + diálogo + dissociação).\n`;
    up += `2. Encontre onde o ${aeName} JÁ está emergindo — mesmo em dia ruim.\n`;
    up += `3. Crie um "futureGlimpse" emocional e específico usando metas/valores reais.\n`;
    up += `4. 6 a 8 perguntas: 50% identidade, 25% futuro, 25% dissociacao.\n`;
    up += `5. Sempre gere "internalDialogue" e "identityProof" + sugestões.\n`;
    up += `6. Use os nomes "${aeName}" e "${ieName}" repetidamente.\n`;
    up += `7. Honre a intensidade ${intensity.toUpperCase()}.\n`;
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
              description: "Despertar focado em construção de identidade do Alter Ego (70/30).",
              parameters: {
                type: "object",
                properties: {
                  detectedState: { type: "string", description: "Estado real em 3-6 palavras." },
                  intensity: { type: "string", enum: ["leve", "medio", "brutal"] },
                  alterEgoEmergence: { type: "string", description: "4-6 frases. Onde o Alter Ego JÁ está emergindo. Cite evidência real." },
                  futureGlimpse: { type: "string", description: "4-6 frases. Visualização emocional do futuro próximo baseada em metas/valores." },
                  enemyCost: { type: "string", description: "2-3 frases curtas. Custo de ouvir o Inimigo. Sem humilhação." },
                  alterEgoTruth: { type: "string", description: "3-4 frases vindas da voz do Alter Ego (sábia, forte, amorosa)." },
                  questions: {
                    type: "array",
                    minItems: 6,
                    maxItems: 8,
                    description: "6 a 8 perguntas. 50% identidade, 25% futuro, 25% dissociacao.",
                    items: {
                      type: "object",
                      properties: {
                        zone: { type: "string", enum: [...ZONES] },
                        title: { type: "string", description: "3-6 palavras." },
                        prompt: { type: "string", description: "A pergunta. Cita elemento real e usa os nomes quando a zona pedir." },
                        objective: { type: "string", description: "1 linha do que ele deve perceber." },
                      },
                      required: ["zone", "title", "prompt", "objective"],
                      additionalProperties: false,
                    },
                  },
                  internalDialogue: {
                    type: "object",
                    description: "Diálogo entre Inimigo e Alter Ego.",
                    properties: {
                      enemySays: { type: "string", description: "1 frase curta vinda do Inimigo, baseada em sabotagem real." },
                      alterEgoReplies: { type: "string", description: "1 frase de identidade vinda do Alter Ego." },
                    },
                    required: ["enemySays", "alterEgoReplies"],
                    additionalProperties: false,
                  },
                  identityProof: { type: "string", description: 'Pergunta literal: "O que você fará nas próximas 24 horas para provar que o {Alter Ego} está vivo?"' },
                  identityProofSuggestions: {
                    type: "array",
                    minItems: 2,
                    maxItems: 4,
                    items: { type: "string" },
                    description: "2-4 ações pequenas e executáveis personalizadas.",
                  },
                  identityAnchor: { type: "string", description: "1-2 frases em 1ª pessoa: 'Eu sou alguém que...'" },
                },
                required: [
                  "detectedState", "intensity", "alterEgoEmergence", "futureGlimpse",
                  "enemyCost", "alterEgoTruth", "questions",
                  "internalDialogue", "identityProof", "identityProofSuggestions", "identityAnchor",
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
      alterEgoEmergence: '',
      futureGlimpse: '',
      enemyCost: '',
      alterEgoTruth: '',
      questions: [] as any[],
      internalDialogue: { enemySays: '', alterEgoReplies: '' },
      identityProof: '',
      identityProofSuggestions: [] as string[],
      identityAnchor: '',
      alterEgoName: aeName,
      innerEnemyName: ieName,
    };

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        Object.assign(out, parsed);
        if (!out.intensity) out.intensity = intensity;
        out.alterEgoName = aeName;
        out.innerEnemyName = ieName;
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
