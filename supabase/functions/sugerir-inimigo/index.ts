import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { onboarding } = await req.json();
    const system = `Você é um narrador de RPG psicológico. A partir das respostas de onboarding do jogador, materialize o INIMIGO INTERNO que sabota seus sonhos. Retorne SEM markdown apenas JSON com este formato exato:
{
  "nome": "string curto (2-3 palavras, tom sombrio/mitico)",
  "emoji": "um único emoji representando o inimigo",
  "hp_max": número inteiro entre 80 e 150 baseado na força da sabotagem,
  "mentiras": ["3 a 5 frases (em 1ª pessoa) que ele SUSSURRA para o jogador"],
  "gatilho": "situação/objeto/momento que o desperta"
}
Use PT-BR. Seja específico ao jogador (não genérico). Nada de julgamentos morais — apenas nome, mecânica e voz.`;
    const user = JSON.stringify(onboarding);
    const out = await chatJSON(system, user);
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});