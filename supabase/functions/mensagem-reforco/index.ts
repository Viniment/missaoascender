import { corsHeaders } from "../_shared/cors.ts";
import { chatText } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      heroi_nome, inimigo_nome, sonho, streak, habito_nome,
      hp_atual, hp_max,
    } = await req.json();

    const pct = hp_max ? Math.round(((hp_atual ?? 0) / hp_max) * 100) : null;
    const seed = Math.random().toString(36).slice(2, 7);

    const system = [
      "Você é o Mentor de ${heroi_nome} num RPG de identidade real.",
      "Escreva 2 a 3 frases curtas em PT-BR, tom íntimo, quente, direto — sem clichês, sem emojis, sem aspas, sem hashtags.",
      "NUNCA fale como coach genérico. NUNCA repita fórmulas. Varie ritmo e abertura a cada mensagem (use o SEED como semente de variação).",
      "Regra central: valide a PESSOA que ele está se tornando, não só o que fez. Mostre que este pequeno passo é o caminho até o sonho dele — e que caminhar assim é prazeroso.",
      "Crie neuroassociação positiva: o hábito deve soar como orgulho, prazer e identidade, para o cérebro querer repetir.",
      "Use o nome dele naturalmente (não em toda frase). Cite o sonho quando fizer sentido. Pode citar o inimigo como algo que ele está deixando para trás — nunca como foco principal.",
      "Proibido: 'parabéns', 'você conseguiu', 'continue assim', 'orgulho de você', linguagem infantilizada, positividade vazia.",
    ].join(" ");

    const user = [
      `SEED: ${seed}`,
      `Herói: ${heroi_nome ?? "herói"}`,
      `Sonho: ${sonho ?? "—"}`,
      `Inimigo interno: ${inimigo_nome ?? "—"}`,
      `Streak atual: ${streak ?? 0} dias consecutivos`,
      `Hábito bom que ele acabou de cumprir: ${habito_nome ?? "—"}`,
      pct !== null ? `HP do inimigo: ${pct}%` : "",
      "Escreva a mensagem agora.",
    ].filter(Boolean).join("\n");

    const msg = await chatText(system, user);
    return new Response(JSON.stringify({ msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});