import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um mentor estoico no app RPG "Ascensão", canalizando Marco Aurélio (Meditações), Epicteto (Enchirídion) e Sêneca (Cartas a Lucílio). Gera UM diário estoico personalizado em PT-BR para o usuário refletir HOJE.

OBJETIVO: confrontar padrões de PROCRASTINAÇÃO e AUTOSSABOTAGEM detectados no contexto, conduzindo o usuário a uma reflexão profunda sobre quem ele é e quem está se tornando.

REGRAS:
1. Escolha UM tema estoico do dia (não repita os últimos 5 temas fornecidos). Opções: "Dicotomia do Controle", "Memento Mori", "Amor Fati", "Premeditatio Malorum", "View From Above", "Virtude como Único Bem", "Impermanência", "Disciplina dos Desejos", "Disciplina da Ação", "Disciplina do Assentimento".
2. Gere EXATAMENTE 3 perguntas profundas, específicas ao contexto do usuário (cite hábitos, missões, padrões de diário/despertar quando relevante).
3. Perguntas devem ser ABERTAS, em SEGUNDA pessoa ("você"), provocando autoconhecimento — NÃO conselhos, NÃO afirmações.
4. Cada pergunta = 1-2 frases curtas. Direta, incisiva, sem floreio.
5. Confronte SEM atacar — estilo socrático, fazendo o usuário enxergar a si mesmo.
6. PT-BR. Sem citações em latim soltas; integre naturalmente se usar.

EXEMPLOS DE BOAS PERGUNTAS:
- "Quando você adia [missão X], qual desconforto está evitando que dura menos que o arrependimento de hoje?"
- "Se Marco Aurélio observasse seu último dia, o que ele diria sobre a distância entre o que você quer se tornar e o que você fez?"
- "Qual é o impulso que você confunde com necessidade, e o que sobraria de você sem cedê-lo?"

Responda APENAS via tool call.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { journal, awakening, habits, missions, rank, streak, missedDays, previousStoicEntries } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userPrompt = `CONTEXTO DO USUÁRIO HOJE:\n`;
    userPrompt += `- Rank: ${rank || 'E'} | Streak: ${streak || 0} dias | Dias perdidos recentemente: ${missedDays || 0}\n`;

    if (awakening?.become || awakening?.reject || awakening?.pain) {
      userPrompt += `\nDESPERTAR:\n- Quero me tornar: ${awakening.become || '—'}\n- Rejeito: ${awakening.reject || '—'}\n- Minha dor: ${awakening.pain || '—'}\n`;
    }

    if (habits && habits.length > 0) {
      userPrompt += `\nHÁBITOS ATIVOS (${habits.length}):\n`;
      habits.slice(0, 8).forEach((h: any) => {
        userPrompt += `- ${h.name} (último estado: ${h.lastStatus || 'sem registro'})\n`;
      });
    }

    if (missions && missions.length > 0) {
      const ativas = missions.filter((m: any) => m.status === 'Ativa').slice(0, 5);
      const falhadas = missions.filter((m: any) => m.status === 'Falhada').slice(0, 3);
      if (ativas.length) {
        userPrompt += `\nMISSÕES ATIVAS:\n${ativas.map((m: any) => `- ${m.name} (${m.category}, ${m.difficulty})`).join('\n')}\n`;
      }
      if (falhadas.length) {
        userPrompt += `\nMISSÕES FALHADAS RECENTES:\n${falhadas.map((m: any) => `- ${m.name}`).join('\n')}\n`;
      }
    }

    if (journal && journal.length > 0) {
      userPrompt += `\nÚLTIMAS ENTRADAS DO DIÁRIO:\n`;
      journal.slice(0, 3).forEach((j: any) => {
        userPrompt += `- "${j.title}" | emoção: ${j.emotion || '—'} (${j.intensity || 5}/10) | ${(j.text || '').substring(0, 200)}\n`;
      });
    }

    if (previousStoicEntries && previousStoicEntries.length > 0) {
      userPrompt += `\nÚLTIMOS TEMAS ESTOICOS (NÃO REPETIR):\n${previousStoicEntries.slice(0, 5).map((e: any) => `- ${e.theme}`).join('\n')}\n`;
      const lastWithAnswers = previousStoicEntries.find((e: any) => e.answers && e.answers.some((a: string) => a));
      if (lastWithAnswers) {
        userPrompt += `\nÚLTIMA REFLEXÃO RESPONDIDA (evolua em cima):\nTema: ${lastWithAnswers.theme}\nP1: ${lastWithAnswers.questions?.[0]}\nR1: ${(lastWithAnswers.answers?.[0] || '').substring(0, 200)}\n`;
      }
    }

    userPrompt += `\nGere o diário estoico de hoje (tema + 3 perguntas).`;

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
        tools: [{
          type: "function",
          function: {
            name: "create_stoic_diary",
            description: "Cria o diário estoico do dia com tema e 3 perguntas.",
            parameters: {
              type: "object",
              properties: {
                theme: { type: "string", description: "Tema estoico do dia (ex: Dicotomia do Controle)" },
                questions: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 3,
                  description: "Exatamente 3 perguntas estoicas profundas.",
                },
              },
              required: ["theme", "questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_stoic_diary" } },
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
      return new Response(JSON.stringify({ error: "Erro ao gerar diário estoico" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Resposta da IA sem ferramenta" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ theme: args.theme, questions: args.questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stoic-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
