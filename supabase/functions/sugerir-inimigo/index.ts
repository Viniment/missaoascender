import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { onboarding } = await req.json();
    const system = `Você é um narrador de RPG psicológico brutal (base: neurociência + TCC). A partir das respostas de onboarding, materialize o INIMIGO INTERNO que sabota o jogador.
Retorne APENAS JSON (sem markdown, sem comentário) neste formato exato:
{
  "nome": "NOME CURTO — 1 a 3 palavras, no máximo 22 caracteres. Ex: 'O Sabotador', 'A Sombra', 'Inércia', 'O Vazio', 'Medo', 'O Comodismo'. NUNCA uma frase, NUNCA descrição.",
  "emoji": "um único emoji sombrio",
  "hp_max": número inteiro entre 80 e 200. QUANTO MAIS FORTE o padrão de sabotagem (mais desculpas, custo alto, sonho grande, função protetora enraizada), MAIOR o HP. Calcule de verdade — não use valor padrão.
  "mentiras": ["3 a 5 frases CURTAS (máx 12 palavras cada), em 1ª pessoa, do jeito CRU que aparecem na cabeça do jogador. Nada de poesia, nada bonitinho, nada motivacional invertido. Fale como um pensamento real de sabotagem. Ex: 'Amanhã eu começo', 'Não adianta, você sempre falha', 'Você não é como eles', 'Só mais 5 minutos', 'Isso não é pra você'."],
  "gatilho": "situação/momento/objeto real que dispara o padrão (curto, direto)"
}
PT-BR. Específico ao jogador. Sem julgamento moral. Nome CURTO é obrigatório.`;
    const user = JSON.stringify(onboarding);
    const out = await chatJSON(system, user);
    return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});