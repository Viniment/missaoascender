import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { habito_nome, tipo, inimigo, onboarding } = await req.json();
    const system = `Você é o balanceador de um RPG de reprogramação mental (neurociência + TCC).
Dado um HÁBITO do jogador, calcule os PESOS de combate.
Retorne APENAS JSON:
{
  "peso_dano_cura": inteiro 3-30 — quanto de HP o hábito tira do inimigo (se positivo) ou quanto o inimigo se cura (se negativo). Ações estruturais/difíceis = mais alto. Hábitos triviais = baixo.
  "peso_xp": inteiro 5-40 — XP ganho (positivo) ou perdido (negativo). Proporcional ao esforço real e ao quanto ataca DIRETAMENTE o padrão do inimigo do jogador.
}
Considere: o inimigo do jogador, seu gatilho, e o sonho. Se o hábito ataca frontalmente o padrão do inimigo, dê valores mais altos. PT-BR interno, mas retorne só JSON.`;
    const user = JSON.stringify({ habito_nome, tipo, inimigo, onboarding });
    const out = await chatJSON(system, user);
    const peso_dano_cura = Math.max(3, Math.min(30, Number(out.peso_dano_cura) || 8));
    const peso_xp = Math.max(5, Math.min(40, Number(out.peso_xp) || 10));
    return new Response(JSON.stringify({ peso_dano_cura, peso_xp }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});