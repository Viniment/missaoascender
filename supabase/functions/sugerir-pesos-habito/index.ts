import { corsHeaders } from "../_shared/cors.ts";
import { chatJSON } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { habito_nome, tipo, inimigo, onboarding } = await req.json();
    const system = `Você é o balanceador de um RPG de reprogramação de identidade (neurociência + TCC).
FILOSOFIA CENTRAL: o jogo é sobre CONSISTÊNCIA e FOCO. Nenhum hábito, por mais importante, pode derrotar o inimigo em uma única execução. A mudança de identidade vem da repetição diária.

Dado um HÁBITO, calcule os PESOS de combate. Considere o inimigo, seu gatilho e o sonho do jogador. Quanto mais o hábito ataca DIRETAMENTE o padrão do inimigo, maiores os valores — mas SEMPRE dentro dos limites abaixo.

Retorne APENAS JSON:
{
  "peso_dano_cura": inteiro 2-15 — HP tirado/curado do inimigo. Trivial=2-4, moderado=5-8, estrutural/frontal=9-15. NUNCA acima de 15 (o inimigo tem 100+ HP, precisa de dias de consistência).
  "peso_xp": inteiro 5-25 — XP ganho/perdido. Proporcional ao esforço REAL.
  "peso_ouro": inteiro 1-6 — ouro recompensado (apenas em positivos). Trivial=1, moderado=2-3, estrutural/frontal=4-6. Mantenha baixo — ouro grande vem do baú diário e conquistas.
}
Retorne SÓ JSON, sem markdown.`;
    const user = JSON.stringify({ habito_nome, tipo, inimigo, onboarding });
    const out = await chatJSON(system, user);
    const peso_dano_cura = Math.max(2, Math.min(15, Number(out.peso_dano_cura) || 6));
    const peso_xp = Math.max(5, Math.min(25, Number(out.peso_xp) || 10));
    const peso_ouro = Math.max(1, Math.min(6, Number(out.peso_ouro) || 2));
    return new Response(JSON.stringify({ peso_dano_cura, peso_xp, peso_ouro }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});