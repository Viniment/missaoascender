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
      "Você é um mentor real do usuário — como um amigo próximo que conhece a história dele. Nada de narrador épico, nada de coach.",
      "Escreva 2 a 3 frases curtas em PT-BR, tom humano, direto, concreto. Sem emojis, aspas, hashtags ou clichês.",
      "REGRA CENTRAL: valide a pessoa que ele está se tornando ao fazer ESTE hábito hoje. Cite o hábito específico e conecte de forma literal e direta com o sonho/objetivo dele (ex.: treinar → os 10kg; ler → virar quem ele quer virar).",
      "IDEIA-CHAVE que precisa transparecer: o objetivo final é só a consequência. O que importa é o hábito de hoje — porque ele JÁ É a mudança acontecendo agora, não um meio para chegar nela. É esse ato de hoje que merece ser comemorado, não o número lá na frente.",
      "PROIBIDO: metáforas épicas/fantasia (espada, sombra, luz, trevas, guerreiro, impostor como entidade, marche, batalha, jornada), linguagem arcaica ou grandiloquente, tom de narrador de filme, frases genéricas de motivação de internet que serviriam para qualquer hábito, 'parabéns', 'continue assim', 'orgulho de você', positividade vazia.",
      "Use o nome dele com naturalidade (não em toda frase). Pode citar o inimigo de leve como algo que fica pequeno diante desse hábito, nunca como foco. Varie ritmo e abertura a cada vez (use o SEED).",
      "Referência de tom (NÃO copiar): 'Você treinou hoje. Isso não é um passo até os seus 10kg — isso já é a mudança acontecendo agora. É esse treino que você comemora, não o número da balança lá na frente.'",
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