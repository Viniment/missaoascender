import { supabase } from "@/integrations/supabase/client";
import { applyXp, Heroi, MiniVitoria } from "./api";
import { clamp } from "./utils";

export async function concluirMiniVitoria(heroi: Heroi, mv: MiniVitoria) {
  const xp = clamp(mv.recompensa_xp, 5, 10);
  const ouro = clamp(mv.recompensa_ouro, 5, 10);
  const vida = clamp(mv.recompensa_vida, 1, 2);
  const next = applyXp(heroi, xp);
  const vidaAtual = clamp(heroi.vida_atual + vida, 0, heroi.vida_max);
  const ouroAtual = Math.max(0, (heroi.ouro ?? 0) + ouro);

  const { error: heroError } = await supabase.from("users").update({
    xp_atual: next.xp_atual,
    nivel: next.nivel,
    xp_proximo_nivel: next.xp_proximo_nivel,
    vida_atual: vidaAtual,
    ouro: ouroAtual,
  }).eq("id", heroi.id);
  if (heroError) throw heroError;

  const { error: victoryError } = await supabase.from("mini_vitorias").update({
    concluida: true,
    concluida_em: new Date().toISOString(),
    recompensa_xp: xp,
    recompensa_ouro: ouro,
    recompensa_vida: vida,
  }).eq("id", mv.id).eq("user_id", heroi.id).eq("concluida", false);
  if (victoryError) throw victoryError;

  const { error: transactionError } = await supabase.from("transacoes_ouro").insert({
    user_id: heroi.id,
    valor: ouro,
    origem: "mini_vitoria",
    descricao: `${mv.titulo} (+${vida} vida, +${xp} XP)`,
  });
  if (transactionError) throw transactionError;

  if (next.conquistas.length) {
    await supabase.from("conquistas").upsert(
      next.conquistas.map(c => ({ user_id: heroi.id, tipo: c.tipo, titulo: c.titulo, descricao: c.descricao })),
      { onConflict: "user_id,tipo", ignoreDuplicates: true },
    );
  }

  return { xp, ouro, vida };
}
