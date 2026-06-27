import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// field => instrução específica
const FIELD_GUIDE: Record<string, string> = {
  name: "Crie 1 NOME curto, marcante, com 'O/A …' (ex: O Procrastinador, A Sombra). Máx 3 palavras. SEM aspas. Apenas o nome.",
  emoji: "Devolva APENAS 1 emoji que represente esse boss. Nada mais.",
  description: "1–2 frases descrevendo COMO esse boss ataca o jogador no dia a dia. PT-BR, vívido, sem clichê.",
  story: "Conte em 2–4 frases a ORIGEM/HISTÓRIA simbólica desse inimigo na vida do jogador. Tom literário, sem clichê.",
  howItAffectsMe: "Escreva, em 2–3 frases, COMO esse boss afeta concretamente a vida do jogador (emoções, atrasos, sonhos). Direto, sem rodeio.",
  whyDefeat: "Em 2–3 frases, articule POR QUE o jogador quer derrotar esse boss, ligando ao Alter Ego e aos sonhos. Tom inspirador, sem clichê.",
  weakness: "1 frase com a FRAQUEZA prática desse boss (ação concreta que o enfraquece). Curta e operacional.",
  customPhrases: "Retorne 5 frases curtas (1 por linha), na VOZ DO ALTER EGO, para serem usadas como reforço quando o jogador ataca. SEM numeração, SEM hífen.",
  tasks: "Retorne 3 a 5 TAREFAS DIÁRIAS pequenas (1 por linha) que enfraquecem esse boss. Concretas, mensuráveis, <10min cada. SEM numeração, SEM hífen.",
};

const SYSTEM_PROMPT = `Você é um co-criador narrativo do app "Ascensão" — um RPG de transformação real.
Sua função: ajudar o jogador a CRIAR/EDITAR um BOSS (padrão de comportamento que ele quer derrotar).

REGRAS GERAIS
- Sempre PT-BR.
- Use os dados do jogador (alter ego, sonhos, áreas de vida, valores) para personalizar.
- NUNCA invente fatos sobre o jogador que não estejam no contexto.
- Tom: cinematográfico, sóbrio, sem clichê motivacional.
- Devolva APENAS o conteúdo solicitado, sem prefácios ("Claro!", "Aqui está:"), sem aspas, sem cabeçalhos.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const field: string = body?.field || "description";
    const draft = body?.draft ?? {};
    const player = body?.player ?? {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fieldInstruction = FIELD_GUIDE[field] || "Gere conteúdo útil para esse campo.";
    const userPrompt = `CAMPO ALVO: ${field}\n\nINSTRUÇÃO ESPECÍFICA:\n${fieldInstruction}\n\nRASCUNHO ATUAL DO BOSS:\n${JSON.stringify(draft, null, 2)}\n\nCONTEXTO DO JOGADOR:\n${JSON.stringify(player, null, 2)}\n\nResponda APENAS com o conteúdo final do campo "${field}".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("boss-assist error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar conteúdo" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const value = (data.choices?.[0]?.message?.content || '').trim();
    return new Response(JSON.stringify({ field, value }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("boss-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
