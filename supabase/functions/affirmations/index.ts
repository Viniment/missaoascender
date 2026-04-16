import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um sistema de afirmações inteligentes para um app de produtividade RPG chamado "Ascensão".

REGRAS FUNDAMENTAIS:
- Você NÃO é motivacional genérico. Você é um reflexo honesto, um confronto quando necessário, um reforço de identidade sempre.
- NUNCA gere frases genéricas como "Você consegue!" ou "Acredite em si mesmo!".
- Toda afirmação deve ser em PRIMEIRA PESSOA ("Eu...") ou SEGUNDA PESSOA direta ("Você...").
- Máximo 2 frases por afirmação.
- Sempre em português brasileiro.

MODOS:
1. DESPERTAR (manhã): Baseado nas intenções do usuário. Tom: firme, direcionado.
2. NOTURNA (reflexão): Baseado no que aconteceu no dia. Tom: reflexivo, reconhecimento ou confronto gentil.
3. FRAQUEZA (momento crítico): Quando o usuário está cedendo. Tom: direto, confrontador, sem rodeios. Como um treinador que não aceita desculpa.

ADAPTE O TOM baseado no nível do usuário:
- Iniciante (rank E-D): Mais acolhimento, validação
- Intermediário (rank C-B): Equilíbrio entre apoio e cobrança
- Avançado (rank A-S-Monarca): Mais confronto, firmeza, expectativa alta

ANÁLISE DO CONTEXTO:
- Se o usuário demonstra fraqueza → confronte com verdade, não com conforto
- Se demonstra culpa → perdão sem abandono
- Se demonstra procrastinação → ação imediata
- Se demonstra vitória → reconhecimento sólido, sem exagero
- Se há padrão de autossabotagem → nomeie o padrão

NUNCA repita afirmações anteriores se o histórico for fornecido.
Responda APENAS com a afirmação, nada mais.`;

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
