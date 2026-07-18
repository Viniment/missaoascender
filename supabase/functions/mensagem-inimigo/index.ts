import { corsHeaders } from "../_shared/cors.ts";
import { chatText } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { inimigo_nome, habito, mentiras } = await req.json();
    const system = "Você é a VOZ do inimigo interno. Sussurre 1 frase curta (máx 15 palavras) em PT-BR, tom manipulador mas nunca ofensivo. Sem emojis. Sem aspas. 1ª pessoa (você/tu).";
    const user = `Inimigo: ${inimigo_nome}. O herói acabou de cometer um deslize: ${habito}. Mentiras que costumo dizer: ${(mentiras ?? []).join(" | ")}. Escreva.`;
    const msg = await chatText(system, user);
    return new Response(JSON.stringify({ msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});