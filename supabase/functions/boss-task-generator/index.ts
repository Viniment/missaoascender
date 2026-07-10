import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Você é o designer de combate do app "Ascensão" — um Life RPG.
Sua função: transformar uma ideia curta do jogador em uma TAREFA DE BATALHA contra o Boss (padrão negativo).

REGRAS
- PT-BR sempre.
- Título CURTO (máx 6 palavras), sem ponto final, sem aspas, começando com verbo no infinitivo quando possível.
- Calibre os campos com base em quanto essa ação enfraquece ESTE boss específico.
- Nunca invente URLs de vídeo. Só devolva videoUrl se o jogador colar um link real.
- description é opcional (HTML curto, máx 2 parágrafos) — só preencha se agregar clareza.
- Responda APENAS JSON puro, sem markdown, sem comentário.

VALORES PERMITIDOS
- impact: "baixo" | "medio" | "alto" | "transformador"
- resistance: "nunca" | "as_vezes" | "frequentemente" | "quase_sempre" | "sempre"
  (quão frequente o boss vence essa ação hoje; mais alto = mais dano quando você cumprir)
- priority: 1..5 (5 = alavanca máxima)

FORMATO EXATO:
{
  "title": "string",
  "impact": "medio",
  "resistance": "as_vezes",
  "priority": 3,
  "description": "" ,
  "videoUrl": ""
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { seed = "", boss = {}, player = {} } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `IDEIA DO JOGADOR: "${seed}"

BOSS ALVO:
${JSON.stringify(boss, null, 2)}

CONTEXTO DO JOGADOR:
${JSON.stringify(player, null, 2)}

Gere a tarefa de batalha em JSON válido.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("boss-task-generator upstream:", r.status, t);
      return new Response(JSON.stringify({ error: "Falha na IA", status: r.status }), {
        status: r.status === 429 || r.status === 402 ? r.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const impactAllowed = new Set(["baixo", "medio", "alto", "transformador"]);
    const resistAllowed = new Set(["nunca", "as_vezes", "frequentemente", "quase_sempre", "sempre"]);

    const title = String(parsed.title || seed || "Nova tarefa").trim().slice(0, 80);
    const impact = impactAllowed.has(String(parsed.impact)) ? String(parsed.impact) : "medio";
    const resistance = resistAllowed.has(String(parsed.resistance)) ? String(parsed.resistance) : "as_vezes";
    let priority = Number(parsed.priority);
    if (!Number.isFinite(priority)) priority = 3;
    priority = Math.min(5, Math.max(1, Math.round(priority)));
    const description = typeof parsed.description === "string" ? parsed.description.slice(0, 2000) : "";
    const videoUrl = typeof parsed.videoUrl === "string" && /^https?:\/\//.test(parsed.videoUrl) ? parsed.videoUrl : "";

    return new Response(
      JSON.stringify({ title, impact, resistance, priority, description, videoUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("boss-task-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});