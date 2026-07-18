import { corsHeaders } from "../_shared/cors.ts";
import { chatText } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      heroi_nome, inimigo_nome, sonho, streak,
      habito, mentiras,
    } = await req.json();

    const seed = Math.random().toString(36).slice(2, 7);

    const system = [
      "Você é a consciência lúcida do herói — não o inimigo, não um juiz cruel.",
      "Escreva 2 a 3 frases curtas em PT-BR, tom firme e íntimo, sem emojis, sem aspas, sem hashtags, sem clichês.",
      "Ângulo obrigatório: AUTOTRAIÇÃO. Ceder a esse hábito é dar ouvidos ao inimigo interno dele, é aceitar uma vida que ele não merece, é trair o próprio sonho, é dizer a si mesmo que não merece o que tanto quer.",
      "NUNCA culpe o inimigo — a escolha foi dele, contra ele mesmo. Nomeie isso sem humilhar.",
      "NUNCA insulte, xingue, humilhe ou use tom de vergonha destrutiva. Firmeza sim, crueldade não.",
      "Use o nome do herói e cite o sonho ou o inimigo pelo nome quando fizer sentido. Varie ritmo e abertura a cada vez (use o SEED como semente).",
      "Proibido: 'você falhou', 'que pena', 'tudo bem, tente amanhã', positividade vazia, sermão longo.",
    ].join(" ");

    const user = [
      `SEED: ${seed}`,
      `Herói: ${heroi_nome ?? "herói"}`,
      `Sonho: ${sonho ?? "—"}`,
      `Inimigo interno (nome dado por ele): ${inimigo_nome ?? "—"}`,
      `Streak atual: ${streak ?? 0} dias consecutivos`,
      `Hábito ruim que ele acabou de ceder: ${habito ?? "—"}`,
      `Mentiras típicas do inimigo: ${(mentiras ?? []).join(" | ") || "—"}`,
      "Escreva a mensagem agora.",
    ].join("\n");

    const msg = await chatText(system, user);
    return new Response(JSON.stringify({ msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});