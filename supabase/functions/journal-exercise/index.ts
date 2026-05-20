import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você gera UM exercício curto (≤5 minutos) para o diário do app "Ascensão" — sistema de amor-próprio. PT-BR.

FOCO sempre voltado para o DIA DE HOJE:
• se valorizar (reconhecer algo do dia)
• se conhecer (perceber algo sobre si hoje)
• fortalecer amor-próprio e autorrespeito
• reconexão interna gentil

SE houver poucos dados (usuário novo) → foco POSITIVO de autoconhecimento e autovalorização.
SE houver fidelidade a si (streak, evolução) → exercícios de orgulho e reconhecimento do dia.
SE houver recaídas → exercício gentil de reconexão, nunca culpa.

TIPOS possíveis:
• listar 3 coisas que você fez bem hoje
• escrever uma promessa curta para si para hoje/amanhã
• 3 gentilezas que você merece receber hoje
• mini carta sua para sua versão de hoje
• reconhecer 1 momento do dia em que foi fiel a si
• visualização da versão futura de si
• gesto físico simbólico (mão no peito, respiração lenta)

TOM:
• cinematográfico, acolhedor, elegante
• jamais humilha, jamais usa culpa tóxica
• passos claros, executáveis, verificáveis, curtos
• segunda pessoa

Retorne SEMPRE via tool call "generate_journal_exercise".`;

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

    let up = `═══ ESTADO ATUAL ═══\n`;
    up += `Falhas 7d: ${d.failureCount7d ?? 0} | Evolução: ${d.behavioralEvolution ?? 'estavel'} | Drift: ${d.emotionalDrift ?? 'neutro'}\n`;
    up += `Dias sem falhar: ${d.daysSinceLastFail === 9999 ? '∞' : d.daysSinceLastFail} | Tendência: ${d.consistencyTrend ?? 'estavel'}\n`;
    if (d.recentJournalSummary) up += `Diário: ${d.recentJournalSummary}\n`;
    if (d.recurringFailedItems?.length) up += `Recorrentes: ${d.recurringFailedItems.join(' | ')}\n`;
    up += `\n`;

    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO RECENTE ═══\n`;
      ctx.recentJournal.slice(0, 3).forEach((j: any) => {
        up += `• ${j.title || ''} · ${j.emotion || '-'} · ${(j.text || '').slice(0, 200)}\n`;
      });
      up += `\n`;
    }

    up += `Escolha UM exercício curto (≤5 min) ideal para este estado. Passos claros e executáveis.\n`;

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
            name: "generate_journal_exercise",
            description: "Retorna um exercício curto personalizado para o diário.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título curto do exercício (3-6 palavras)." },
                description: { type: "string", description: "1-2 frases sobre o que é e por quê." },
                steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5, description: "Passos numerados, executáveis." },
                purpose: { type: "string", description: "1 linha: o que ele deve sentir ao fazer." },
              },
              required: ["title", "description", "steps", "purpose"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_journal_exercise" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições. Tente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar exercício" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(args, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("journal-exercise error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
