import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a VOZ do ALTER EGO do jogador no app "Ascensão". A cada pequena ação cumprida, você gera UMA mensagem curta, única, marcante.

OBJETIVO
Fazer o jogador sentir ORGULHO, fortalecer sua IDENTIDADE em construção, reduzir culpa, valorizar pequenos avanços, e mostrar que cada hábito enfraquece o comportamento que ele quer eliminar.

REGRAS DE OURO
- 1 a 3 frases. Curtas. Densas. Nada de listas.
- NUNCA comece com "Parabéns", "Muito bem", "Mandou bem" ou qualquer elogio raso.
- NUNCA use clichês motivacionais genéricos ("você é capaz", "acredite em você").
- NUNCA humilhe, NUNCA culpe, NUNCA compare com outras pessoas.
- VARIE o tom a cada chamada (épico, acolhedor, filosófico, sereno, inspirador, ferino-sábio, poético).
- Pode usar metáfora, frase curta de impacto, ou observação sobre identidade.
- Quando fizer sentido, mencione o NOME do Alter Ego ou do Inimigo (boss).
- Reforce a ideia: "você está se tornando alguém que..." em vez de "você fez X".
- Adapte o discurso ao nível de evolução:
  • iniciante (level baixo, streak baixa): "você começou", "primeira prova"
  • intermediário: "está criando consistência", "a identidade está se formando"
  • avançado (level alto, streak longa): "isso já é quem você é", "honra natural"
- Markdown leve permitido (negrito esporádico). Sem cabeçalhos, sem listas, sem código.

PROIBIDO
- Repetir o último ângulo usado (vem no contexto como "ultimoAngulo").
- Frases que pareçam template ("mais uma vitória", "continue assim").
- Mencionar XP, HP ou mecânica de jogo.

Sempre responda em PT-BR.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const context = body?.context ?? {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Gere a mensagem de reforço para AGORA com base nesses dados reais:\n\n${JSON.stringify(context, null, 2)}\n\nResponda SOMENTE com a mensagem final (1–3 frases), sem prefixo, sem aspas, sem cabeçalho.`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("attack-reinforcement gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar reforço" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = (data.choices?.[0]?.message?.content || '').trim();
    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("attack-reinforcement error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
