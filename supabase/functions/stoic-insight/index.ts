import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um mentor estoico (estilo Marco Aurélio + Epicteto) em PT-BR. O usuário acabou de responder 3 perguntas estoicas. Gere UM insight final curto:
- 2 a 3 frases no máximo.
- Aponte 1 padrão observado nas respostas (procrastinação, autossabotagem, evitamento, vitimização, perfeccionismo, etc).
- Termine com 1 ação CONCRETA e simples para hoje, alinhada ao "Eu quero me tornar" do usuário.
- Tom firme, fraterno, não condescendente. Sem clichês ("acredite em si").
- Pode usar "você". Sem listas, sem títulos, parágrafo único.

Responda APENAS o insight, sem prefixos como "Insight:" ou aspas.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theme, questions, answers, awakening } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userPrompt = `Tema do dia: ${theme || '—'}\n\n`;
    if (awakening?.become) userPrompt += `Quero me tornar: ${awakening.become}\n`;
    if (awakening?.reject) userPrompt += `Rejeito: ${awakening.reject}\n`;
    userPrompt += `\nReflexão:\n`;
    (questions || []).forEach((q: string, i: number) => {
      userPrompt += `\nP${i + 1}: ${q}\nR${i + 1}: ${answers?.[i] || '(sem resposta)'}\n`;
    });
    userPrompt += `\nGere o insight estoico final.`;

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
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar insight" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ insight: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("stoic-insight error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
