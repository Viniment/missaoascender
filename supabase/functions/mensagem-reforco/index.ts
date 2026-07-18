import { corsHeaders } from "../_shared/cors.ts";
import { chatText } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { heroi_nome, inimigo_nome, hp_atual, hp_max } = await req.json();
    const pct = Math.round((hp_atual / hp_max) * 100);
    const system = "Você é o Mentor. Fala como um sábio guerreiro. 1 frase curta (máx 18 palavras), em PT-BR, sem emojis, sem aspas. Foco: motivar o herói contra o inimigo interno.";
    const user = `Herói: ${heroi_nome}. Inimigo: ${inimigo_nome}. HP do inimigo: ${pct}%. Escreva a frase de reforço.`;
    const msg = await chatText(system, user);
    return new Response(JSON.stringify({ msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});