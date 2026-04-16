import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um mentor estilo Solo Leveling para um app RPG de produtividade chamado "Ascensão".

Sua missão: gerar 5 perguntas de reflexão PROFUNDAS, CONFRONTADORAS e ESPECÍFICAS baseadas no contexto do usuário (diário, intenções do despertar e REFLEXÕES ANTERIORES).

REGRAS:
- Em PORTUGUÊS BRASILEIRO.
- NUNCA perguntas genéricas ("Como você se sente?", "O que aprendeu hoje?").
- Cada pergunta deve referenciar algo específico do contexto fornecido (uma emoção, padrão, intenção, dor, contradição).
- Tom: firme, direto, como um treinador que quer destravar o usuário — não terapeuta passivo.
- Pergunta deve forçar autoconhecimento ou ação concreta.
- Adapte ao rank: iniciante (E-D) mais acolhedor; avançado (A-S-Monarca) mais confrontador.
- Cada pergunta com no máximo 2 frases.

EVOLUÇÃO DO AUTOCONHECIMENTO (quando houver reflexões anteriores):
- Identifique PADRÕES EVOLUTIVOS: o que mudou entre o passado e agora?
- Detecte TEMAS RECORRENTES: medos, desculpas, vitórias que se repetem — nomeie-os.
- NÃO repita perguntas que já foram exploradas. APROFUNDE ou CONFRONTE contradições.
- Se notar evolução: reconheça e provoque o próximo passo.
- Se notar estagnação ou auto-engano: confronte sem rodeios.

Retorne SEMPRE via tool call "generate_questions" com array de exatamente 5 perguntas.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { journal, awakening, rank, reflections } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    let userPrompt = `Rank do usuário: ${rank || 'E'}\n\n`;

    if (awakening) {
      userPrompt += `=== INTENÇÕES DO DESPERTAR ===\n`;
      userPrompt += `Quero me tornar: ${awakening.become || '(não definido)'}\n`;
      userPrompt += `Rejeito: ${awakening.reject || '(não definido)'}\n`;
      userPrompt += `Minha dor: ${awakening.pain || '(não definido)'}\n\n`;
    }

    if (reflections && reflections.length > 0) {
      userPrompt += `=== REFLEXÕES ANTERIORES DO DESPERTAR (memória — use para evoluir, não repetir) ===\n`;
      reflections.slice(0, 5).forEach((r: any, idx: number) => {
        const ans = stripHtml(r.answerHtml || '').substring(0, 500);
        const dateStr = r.date ? new Date(r.date).toLocaleDateString('pt-BR') : '';
        userPrompt += `\n[${idx + 1}] ${dateStr}\nPergunta: ${r.question}\nResposta: ${ans}\n`;
      });
      userPrompt += `\n`;
    }

    if (journal && journal.length > 0) {
      userPrompt += `=== ÚLTIMAS ENTRADAS DO DIÁRIO ===\n`;
      journal.slice(0, 3).forEach((j: any, idx: number) => {
        userPrompt += `\n[${idx + 1}] ${j.title}\n`;
        if (j.emotion) userPrompt += `Emoção: ${j.emotion} (intensidade ${j.intensity || 5}/10)\n`;
        if (j.deepMode) userPrompt += `(Modo profundo)\n`;
        userPrompt += `Texto: ${(j.text || '').substring(0, 600)}\n`;
      });
    } else if (!reflections || reflections.length === 0) {
      userPrompt += `(Sem entradas de diário nem reflexões anteriores — gere perguntas baseadas apenas nas intenções do despertar.)\n`;
    }

    userPrompt += `\nGere 5 perguntas profundas e específicas para destravar este usuário.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Retorna exatamente 5 perguntas profundas de reflexão",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 5,
                    maxItems: 5,
                    description: "Array de exatamente 5 perguntas",
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
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
      return new Response(JSON.stringify({ error: "Erro ao gerar perguntas" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let questions: string[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 5) : [];
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (questions.length < 5) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("awakening-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
