import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a voz interna do diário do app "Ascensão" — sistema emocional de reconstrução interna baseado em AMOR-PRÓPRIO e consciência sobre AUTOTRAIÇÃO. PT-BR.

Sua função: gerar 3 PERGUNTAS DIÁRIAS de AMOR-PRÓPRIO voltadas para o DIA DE HOJE, baseadas na leitura dos últimos 7 dias do usuário.

═══════════════════════════════════════
FOCO OBRIGATÓRIO
═══════════════════════════════════════
• ALGO DO DIA — o que ele viveu, sentiu, fez ou deixou de fazer HOJE
• se VALORIZAR — reconhecer pequenas vitórias, gentilezas internas, escolhas honrosas
• se CONHECER — perceber padrões, desejos, verdade interna
• gentileza consigo mesmo, sempre

═══════════════════════════════════════
TOM (obrigatório)
═══════════════════════════════════════
• cinematográfico, calmo, profundo, elegante
• acolhedor, nunca humilha, nunca ataca, nunca usa culpa tóxica
• segunda pessoa, frases curtas, faz parar 3 segundos
• PROIBIDO: "você consegue", "acredite", "vai dar certo", coach motivacional, citar técnicas

═══════════════════════════════════════
MODO (você escolhe automaticamente)
═══════════════════════════════════════
• "orgulho" — quando há sinais de fidelidade a si (streak, evolução positiva).
  Reforce: orgulho, autoestima, reconhecimento do dia.
  Exemplos:
   - "Qual atitude sua de hoje merece um agradecimento silencioso?"
   - "Em que momento de hoje você se sentiu fiel a si?"
   - "Que pequena escolha de hoje mostrou quem você está se tornando?"

• "reconexao" — quando há recaídas/autotraição recentes.
  Acolha. Voltar para si é amor, não cobrança. Consciência SUAVE.
  Exemplos:
   - "Em qual momento de hoje você se tratou com menos cuidado do que merecia?"
   - "O que você precisou hoje e não se deu?"
   - "Como você gostaria de ter cuidado de si hoje?"

• "neutro" — quando sinais são MISTOS OU INSUFICIENTES (pouco contexto, usuário novo).
  FOCO POSITIVO sempre: autoconhecimento + autovalorização do dia. Ajude a pessoa a se conhecer e se valorizar.
  Exemplos:
   - "Que parte sua hoje pediu para ser ouvida?"
   - "O que de bom em você apareceu hoje, mesmo que pequeno?"
   - "Se você fosse seu próprio melhor amigo, o que diria sobre seu dia?"
   - "O que você quer aprender sobre si essa semana?"

═══════════════════════════════════════
SAÍDA
═══════════════════════════════════════
Retorne SEMPRE via tool call "generate_journal_prompts".
Cada pergunta: title curto (3-6 palavras), prompt (sobre o DIA, profunda e gentil), objective (1 linha sobre o que ele perceberá de si).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = context || {};
    const d = ctx.derived || {};

    let up = `═══ JANELA 7 DIAS ═══\n`;
    up += `Falhas 7d: ${d.failureCount7d ?? 0} | Taxa: ${Math.round((d.failureRate7d ?? 0) * 100)}%\n`;
    up += `Tendência: ${d.consistencyTrend ?? 'estavel'} | Evolução: ${d.behavioralEvolution ?? 'estavel'}\n`;
    up += `Dias sem falhar: ${d.daysSinceLastFail === 9999 ? '∞' : d.daysSinceLastFail} | Maior streak: ${d.longestStreak ?? 0}d\n`;
    up += `Recaída pós-evolução: ${d.relapseAfterEvolution ? 'SIM' : 'não'}\n`;
    up += `Drift emocional: ${d.emotionalDrift ?? 'neutro'}\n`;
    if (d.recentJournalSummary) up += `Resumo diário: ${d.recentJournalSummary}\n`;
    if (d.recurringFailedItems?.length) up += `Itens recorrentes: ${d.recurringFailedItems.join(' | ')}\n`;
    if (d.contradictionSignals?.length) up += `Contradições: ${d.contradictionSignals.join(' || ')}\n`;
    up += `\n`;

    if (ctx.habits?.length) {
      up += `═══ HÁBITOS ═══\n`;
      ctx.habits.slice(0, 6).forEach((h: any) => {
        const flag = h.failed30d > h.done30d ? ' ⚠️ABANDONO' : (h.streak >= 7 ? ' ✅FORTE' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d}/${h.failed30d}${flag}\n`;
      });
      up += `\n`;
    }

    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO RECENTE ═══\n`;
      ctx.recentJournal.slice(0, 4).forEach((j: any, i: number) => {
        up += `[${i + 1}] ${j.title || 'sem título'} · ${j.emotion || '-'}${j.intensity ? ` (${j.intensity}/10)` : ''}\n${(j.text || '').slice(0, 350)}\n\n`;
      });
    }

    up += `═══ INSTRUÇÃO ═══\n`;
    up += `1. Decida o MODO ("orgulho", "reconexao" ou "neutro") a partir dos sinais acima.\n`;
    up += `2. Identifique 1 sinal-chave que justifica o modo (detectedSignal, 1 linha).\n`;
    up += `3. Gere 3 perguntas personalizadas. Cada uma cita pelo menos UM elemento real (hábito, padrão, emoção, trecho).\n`;
    up += `4. Cada pergunta atinge zona diferente: amor-próprio / autotraição / identidade / futuro / reconexão.\n`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: up },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_journal_prompts",
            description: "Retorna 3 perguntas diárias personalizadas para o diário.",
            parameters: {
              type: "object",
              properties: {
                mode: { type: "string", enum: ["orgulho", "reconexao", "neutro"] },
                detectedSignal: { type: "string", description: "1 linha: principal sinal lido nos últimos 7 dias." },
                questions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      prompt: { type: "string" },
                      objective: { type: "string" },
                    },
                    required: ["title", "prompt", "objective"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["mode", "detectedSignal", "questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_journal_prompts" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições. Tente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar perguntas" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = JSON.parse(args);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("journal-prompts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
