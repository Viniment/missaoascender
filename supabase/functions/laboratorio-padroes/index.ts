import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { resumo, registros } = await req.json();

    const system = [
      "Você é um motor de detecção de PADRÕES em registros de auto-observação (TCC/ACT). PT-BR, sem emoji dentro dos textos.",
      "REGRA ABSOLUTA: você NUNCA corrige, reescreve ou julga pensamentos do usuário. Você NUNCA diz qual pensamento é certo ou qual ele deveria ter. Você NUNCA diagnostica, rotula personalidade nem chama a pessoa de autossabotadora.",
      "Você funciona como um espelho: mostra o que se repete ao longo do histórico. Nunca analise um registro isolado como se fosse padrão. Nunca invente relações ou causalidade sem evidência nos dados.",
      "Use linguagem probabilística: 'há sinais recorrentes de...', 'esse padrão aparece em X registros', 'pode existir uma relação'. Nunca 'você tem X'.",
      "Sempre cite evidência numérica real vinda dos dados (ex.: 'aparece em 8 de 12 registros'). Se não houver evidência suficiente, classifique como hipótese ou omita.",
      "Níveis de confiança obrigatórios em cada item: 'forte' (repete em vários registros), 'emergente' (começa a aparecer, poucos dados), 'hipotese' (possível relação, dados insuficientes). Nunca transforme hipótese em certeza.",
      "Sabotagem = padrão comportamental recorrente, jamais traço fixo de personalidade.",
      "Responda APENAS JSON válido nesta forma:",
      `{"resumo":"1-2 frases sobre o padrão central observado","estatisticas":{"registros_analisados":0,"emocao_mais_frequente":"","emocao_maior_intensidade":"","gatilho_mais_recorrente":"","tema_mental_recorrente":"","ciclo_mais_frequente":"","padrao_cognitivo_recorrente":""},"padroes_cognitivos":[{"nome":"","descricao":"","evidencia":"","confianca":"forte|emergente|hipotese"}],"padroes_emocionais":[{"nome":"","descricao":"","evidencia":"","confianca":"forte|emergente|hipotese"}],"gatilhos":[{"situacao":"","sequencia":["gatilho","pensamento","emoção","comportamento"],"evidencia":"","confianca":"forte|emergente|hipotese"}],"sabotagens":[{"nome":"","evidencia":"","confianca":"forte|emergente|hipotese","ciclo":["gatilho","pensamento","emoção","impulso","comportamento","consequência","reforço"]}],"mapa":[{"pensamento":"","emocao":"","comportamento":"","consequencia":"","repeticoes":0}],"polarizacao":{"observacao":"","evidencia":"","confianca":"forte|emergente|hipotese"},"distanciamento":{"observacao":"","evidencia":"","confianca":"forte|emergente|hipotese"},"reatribuicao":{"observacao":"","fatores":["contexto","ambiente"],"evidencia":"","confianca":"forte|emergente|hipotese"},"hipoteses":["perguntas ou relações a investigar"]}`,
      "Campos sem evidência devem vir como null (objetos) ou lista vazia. Nunca preencha por preencher.",
    ].join(" ");

    const user = [
      "Resumo estatístico calculado a partir dos dados reais:",
      JSON.stringify(resumo ?? {}, null, 2),
      "",
      "Registros de auto-observação (mais recentes primeiro):",
      JSON.stringify(registros ?? [], null, 2),
      "",
      "Cruze situação → pensamento automático → emoções → intensidade → evidências → pensamento alternativo → distanciamento → continuum → comportamento → consequência.",
      "Mostre apenas o que os dados sustentam.",
    ].join("\n");

    const data = await chatJSON(system, user);
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
