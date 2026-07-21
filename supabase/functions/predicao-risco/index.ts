import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      heroi_nome, inimigo_nome, sonho,
      // resumo com: janelas_risco (top horas/dias), tecnicas_eficacia [{nome, usos, queda_media_intensidade, taxa_sucesso}], contexto_atual {hora, dia_semana, ultima_fissura_horas, streak_sem_ceder}
      resumo,
    } = await req.json();

    const system = [
      "Você é um coach comportamental adaptativo. Recebe estatísticas reais e o CONTEXTO ATUAL do herói.",
      "Sua tarefa: prever risco imediato (próximas 6h), identificar a técnica mais eficaz PRA ESSE HERÓI (não a média), e sugerir uma ação de blindagem ANTES da fissura chegar.",
      "Nada de motivação vazia, nada de emoji. Firme, humano, específico. PT-BR.",
      "Use os números do resumo pra justificar (cite hora/dia, taxa, queda média).",
      "Responda APENAS JSON válido: {\"risco_nivel\":\"baixo|medio|alto\",\"risco_score\":0-100,\"janela\":\"texto curto tipo 'hoje 21h-23h' ou 'terça à noite'\",\"leitura\":\"1-2 frases do porquê\",\"tecnica_recomendada\":{\"nome\":\"Reestruturação|Urge Surfing|Protocolo de Fissura|Ação incompatível\",\"motivo\":\"por que essa funciona pra ele com base nos números\"},\"blindagem\":[\"ação preventiva 1 de <=2min\",\"ação 2\",\"ação 3\"],\"gatilho_provavel\":\"emoção/situação mais provável agora\"}",
    ].join(" ");

    const user = [
      `Herói: ${heroi_nome ?? "—"}`,
      `Sonho: ${sonho ?? "—"}`,
      `Inimigo interno: ${inimigo_nome ?? "—"}`,
      `Resumo + contexto atual:\n${JSON.stringify(resumo ?? {}, null, 2)}`,
      "Prediga e recomende.",
    ].join("\n");

    const data = await chatJSON(system, user);
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});