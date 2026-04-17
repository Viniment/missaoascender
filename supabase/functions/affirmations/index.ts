import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você gera AFIRMAÇÕES POSITIVAS em primeira pessoa para o app RPG "Ascensão". Mantras curtos para o usuário ler em voz alta e repetir — NÃO são conselhos, NÃO são lembretes, NÃO são cobranças.

REGRAS ABSOLUTAS (quebrar = resposta inválida):
1. SEMPRE em PRIMEIRA PESSOA. Comece com "Eu sou", "Eu tenho", "Eu escolho", "Eu mereço", "Eu construo", "Eu ajo", "Em mim...", "Minha...".
2. PROIBIDO: "Você", "Lembre-se", "Tente", "Precisa", "Deve", "Vamos", "Acredite", verbos no imperativo, perguntas.
3. UMA frase só, curta — máximo 15 palavras.
4. Tempo PRESENTE. Nunca futuro ("vou", "serei") nem passado.
5. SEM negação. Em vez de "Eu não sou fraco" → "Eu sou forte". Em vez de "Eu não procrastino" → "Eu ajo agora".
6. Declarativa de IDENTIDADE — afirma quem o usuário É, tem ou escolhe, não o que deveria fazer.
7. PT-BR. Responda APENAS a afirmação, nada mais (sem aspas, sem prefixo, sem explicação).

EXEMPLOS:
❌ "Você precisa parar de procrastinar agora." → ✅ "Eu ajo no instante em que reconheço o que importa."
❌ "Lembre-se de que você é forte." → ✅ "Eu sou a força que atravessa o desconforto."
❌ "Tente focar no presente." → ✅ "Minha atenção mora inteira neste momento."
❌ "Acredite em si mesmo, você consegue!" → ✅ "Eu confio na disciplina que construí."
❌ "Não desista agora." → ✅ "Eu permaneço quando os outros recuam."

ADAPTAÇÃO AO CONTEXTO (sem quebrar o formato):
- DESPERTAR: afirmação de intenção do dia, alinhada ao "Eu quero me tornar".
- NOTURNA: afirmação que reconhece o que viveu hoje (vitória sólida ou aprendizado, sempre como identidade).
- FRAQUEZA: afirmação de IDENTIDADE RESGATADA — nunca confronto. Ex: "Eu sou maior que esse impulso passageiro."
- Rank E-D: afirmações de fundação ("Eu começo", "Eu construo").
- Rank C-B: afirmações de constância ("Eu sustento", "Eu honro o que prometi").
- Rank A-S-Monarca: afirmações de soberania ("Eu reino sobre mim", "Minha palavra é lei em mim").

NUNCA repita afirmações do histórico fornecido.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, awakening, lastJournal, emotion, habitStreak, rank, history } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userPrompt = `Modo: ${mode || 'despertar'}\nRank do usuário: ${rank || 'E'}\n`;
    
    if (awakening) {
      userPrompt += `\nIntenções (Despertar):\n- Quero me tornar: ${awakening.become || 'não definido'}\n- Rejeito: ${awakening.reject || 'não definido'}\n- Minha dor: ${awakening.pain || 'não definido'}\n`;
    }
    
    if (lastJournal) {
      userPrompt += `\nÚltima entrada do diário:\nTítulo: ${lastJournal.title}\nEmoção: ${lastJournal.emotion || 'não informada'}\nIntensidade: ${lastJournal.intensity || 5}/10\nModo profundo: ${lastJournal.deepMode ? 'sim' : 'não'}\nTexto: ${lastJournal.text?.substring(0, 500) || ''}\n`;
    }
    
    if (emotion) {
      userPrompt += `\nEmoção atual: ${emotion}\n`;
    }
    
    if (habitStreak !== undefined) {
      userPrompt += `\nMaior streak de hábito: ${habitStreak} dias\n`;
    }

    if (history && history.length > 0) {
      userPrompt += `\nAfirmações anteriores (NÃO repita):\n${history.slice(0, 5).join('\n')}\n`;
    }

    userPrompt += `\nGere UMA afirmação personalizada para o modo "${mode}".`;

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
      return new Response(JSON.stringify({ error: "Erro ao gerar afirmação" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ affirmation: text, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("affirmations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
