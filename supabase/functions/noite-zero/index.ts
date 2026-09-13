import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { respostas, visao, historico_ia = [] } = await req.json();
    const system = `Você é o guia de uma experiência profunda de journaling chamada NOITE ZERO. Seu trabalho NÃO é dar conselhos genéricos, elogios vazios ou diagnosticar o usuário. Você conduz uma conversa de autorreflexão com perguntas progressivamente mais específicas.

Depois de uma primeira sequência de perguntas, você deve ler atentamente tudo o que a pessoa escreveu e encontrar contradições, padrões, justificativas, medos, desejos, valores, consequências e pontos que ficaram vagos. Faça UMA pergunta por vez, baseada no conteúdo real da pessoa. A pergunta seguinte deve aprofundar a resposta anterior ou explorar um ponto importante que ainda não foi encarado.

Se a pessoa responder superficialmente, aprofunde. Se surgir uma contradição, peça para ela examiná-la. Se houver uma frase muito importante, volte nela. Não invente fatos. Não diga ao usuário o que ele sente; pergunte.

A experiência deve ter profundidade, mas não deve ser infinita. Use no máximo 8 perguntas de aprofundamento nesta sessão. Você decide quando há material suficiente para encerrar. Só marque finalizar=true quando a pessoa tiver explorado suficientemente: situação atual, padrão/problema, consequência, desejo/direção e uma decisão ou insight concreto. Se ainda existir um ponto importante não explorado, continue perguntando.

IMPORTANTE: não use o nome Judas nem linguagem de inimigo. Não faça terrorismo psicológico. Seja intenso, direto, humano e respeitoso. Não tente criar dependência emocional do aplicativo.

Retorne SOMENTE JSON neste formato:
{
  "pergunta": "uma única pergunta profunda",
  "contexto": "uma frase curta explicando por que esta pergunta importa, sem analisar a pessoa como se fosse diagnóstico",
  "finalizar": false,
  "resumo": "somente quando finalizar: 2-4 frases sintetizando os principais pontos que a própria pessoa revelou; caso contrário, string vazia"
}`;

    const user = JSON.stringify({ respostas, visao, historico_ia });
    const out = await chatJSON(system, user);
    return new Response(JSON.stringify({
      pergunta: String(out.pergunta || "O que nessa resposta você sente que ainda não conseguiu dizer completamente?"),
      contexto: String(out.contexto || "Vamos olhar um pouco mais de perto para isso."),
      finalizar: Boolean(out.finalizar),
      resumo: String(out.resumo || ""),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
