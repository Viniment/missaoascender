import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      situacao, pensamento_automatico, emocao, intensidade_emocao,
      evidencias_favor, evidencias_contra,
      heroi_nome, inimigo_nome, sonho, mentiras,
    } = await req.json();

    const system = [
      "Você é um terapeuta cognitivo treinado em TCC (Beck) e ACT.",
      "Sua tarefa: analisar um pensamento automático do usuário, identificar distorções cognitivas presentes e devolver um pensamento alternativo mais realista — nem otimista falso, nem pessimista.",
      "Distorções válidas: catastrofizacao, tudo_ou_nada, leitura_mental, adivinhacao, personalizacao, filtro_mental, desqualificar_positivo, rotulacao, raciocinio_emocional, deveria, minimizacao, magnificacao, culpa, comparacao_injusta.",
      "Regras: tom firme, humano, sem clichês, sem 'você consegue!'. Nada de emoji. PT-BR.",
      "Nunca minimize a dor. Reconheça o que faz sentido no pensamento antes de reenquadrar.",
      "O pensamento_alternativo NÃO pode ser positividade tóxica. Deve ser preciso e sustentável — algo que o herói acreditaria depois de reler com calma.",
      "Formule também 2-3 perguntas socráticas curtas que ajudem o herói a testar o pensamento na próxima vez.",
      "Responda APENAS JSON válido: {\"distorcoes\":[\"...\"],\"resumo_distorcao\":\"1 frase sobre o padrão\",\"pensamento_alternativo\":\"...\",\"perguntas_socraticas\":[\"...\"],\"proximo_passo\":\"1 micro-ação prática de <=2min para agir com o novo pensamento\"}",
    ].join(" ");

    const user = [
      `Herói: ${heroi_nome ?? "—"}`,
      `Sonho: ${sonho ?? "—"}`,
      `Inimigo interno: ${inimigo_nome ?? "—"}`,
      `Mentiras típicas do inimigo: ${(mentiras ?? []).join(" | ") || "—"}`,
      `Situação: ${situacao ?? "—"}`,
      `Pensamento automático: ${pensamento_automatico ?? "—"}`,
      `Emoção (${intensidade_emocao ?? "?"}/10): ${emocao ?? "—"}`,
      `Evidências a favor do pensamento: ${evidencias_favor ?? "—"}`,
      `Evidências contra o pensamento: ${evidencias_contra ?? "—"}`,
      "Analise e responda.",
    ].join("\n");

    const data = await chatJSON(system, user);
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});