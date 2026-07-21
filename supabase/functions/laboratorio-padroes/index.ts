import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      heroi_nome, inimigo_nome, sonho, mentiras,
      resumo, // { fissuras:{total,resolvidas,intensidade_media_inicial,intensidade_media_final,top_emocoes,top_tipos,por_hora,por_diasemana,cedeu_rate}, urge:{total,cedeu,ciclos_medios}, pensamentos:{total,top_distorcoes}, habitos_neg:{top_nomes,frequencia_semanal}, dias_com_recaida }
    } = await req.json();

    const system = [
      "Você é um analista clínico-comportamental treinado em TCC/ACT e ciência da mudança de hábitos.",
      "Sua tarefa: ler estatísticas reais do herói e devolver PADRÕES concretos e ARMADILHAS DE SABOTAGEM que se repetem.",
      "Nada de motivação vazia. Nada de emoji. Tom firme, humano, cirúrgico. PT-BR.",
      "Aponte causas prováveis (horários, gatilhos emocionais, dias específicos, distorções recorrentes), não sintomas.",
      "Cada 'sabotagem' precisa ter: nome curto, evidência numérica (cite os números do resumo), contra-jogada específica de <=2min.",
      "Cada 'insight' precisa ser algo que o herói ainda não formulou sozinho.",
      "Responda APENAS JSON válido: {\"leitura\":\"1-2 frases resumindo o padrão central\",\"insights\":[\"...\",\"...\",\"...\"],\"sabotagens\":[{\"nome\":\"...\",\"evidencia\":\"...\",\"contra_jogada\":\"...\"}],\"proxima_semana\":\"1 experimento comportamental concreto para os próximos 7 dias\"}",
    ].join(" ");

    const user = [
      `Herói: ${heroi_nome ?? "—"}`,
      `Sonho: ${sonho ?? "—"}`,
      `Inimigo interno: ${inimigo_nome ?? "—"}`,
      `Mentiras típicas: ${(mentiras ?? []).join(" | ") || "—"}`,
      `Resumo estatístico:\n${JSON.stringify(resumo ?? {}, null, 2)}`,
      "Analise e responda.",
    ].join("\n");

    const data = await chatJSON(system, user);
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});