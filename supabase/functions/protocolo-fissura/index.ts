import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      intensidade, emocao, contexto, desejo, duracao,
      heroi_nome, inimigo_nome, sonho, mentiras,
    } = await req.json();

    const system = [
      "Você é um mentor terapêutico do herói, treinado em TCC, ACT, Mindfulness, formação de hábitos e prevenção de recaídas.",
      "Sua tarefa: dado o estado de fissura do usuário, escolha o TIPO mais provável e monte um PROTOCOLO breve (3 a 5 passos, cada um baseado em técnicas com evidência).",
      "Tipos válidos: dopamina, ansiedade, medo, tedio, exaustao, perfeccionismo, procrastinacao, impulsividade, compulsao, raiva, tristeza.",
      "Cada passo do protocolo deve ter: titulo curto, tecnica (respiracao|mindfulness|reestruturacao|defusao|urge_surfing|acao_minima|questionamento_socratico|exposicao|aterramento|movimento|estoicismo|visualizacao), descricao (2-4 frases práticas, tom firme e humano, sem clichês, sem 'você consegue!'), duracao_min (1 a 10).",
      "Termine com uma MISSÃO IMEDIATA: uma micro-ação de no máximo 2 minutos que reduz a resistência a quase zero. Concreta, física, verificável.",
      "Escreva TUDO em PT-BR. Nada de emoji nos títulos e descrições. Sem hashtags.",
      "Priorize TCC/ACT/Mindfulness/formação de hábitos. Estoicismo/visualização só quando encaixar naturalmente.",
      "Responda APENAS JSON válido no formato: {\"tipo\":\"...\",\"resumo\":\"1 frase que nomeia o que ele está sentindo sem julgar\",\"protocolo\":[{\"titulo\":\"...\",\"tecnica\":\"...\",\"descricao\":\"...\",\"duracao_min\":n}],\"missao_imediata\":\"...\"}",
    ].join(" ");

    const user = [
      `Herói: ${heroi_nome ?? "—"}`,
      `Sonho: ${sonho ?? "—"}`,
      `Inimigo interno: ${inimigo_nome ?? "—"}`,
      `Mentiras típicas do inimigo: ${(mentiras ?? []).join(" | ") || "—"}`,
      `Intensidade da fissura (1-10): ${intensidade ?? "—"}`,
      `Emoção predominante: ${emocao ?? "—"}`,
      `Contexto (o que aconteceu): ${contexto ?? "—"}`,
      `Desejo neste momento: ${desejo ?? "—"}`,
      `Duração já sentida: ${duracao ?? "—"}`,
      "Gere o protocolo agora.",
    ].join("\n");

    const data = await chatJSON(system, user);
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});