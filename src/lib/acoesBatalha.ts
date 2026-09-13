import { supabase } from "@/integrations/supabase/client";
import { clamp, todayISO } from "./utils";
import { applyXp, checkConquistas, rollLifeReward, type Habito, type Heroi, type Inimigo } from "./api";
import { getPetSkill } from "./itens";
import { emitGameEvent } from "@/game/events";

export type LogQuantidade = { quantidadeAtual: number; completado: boolean };

export async function fetchQuantidadeAcoes(userId: string, data: string): Promise<Map<string, LogQuantidade>> {
  const { data: rows, error } = await supabase
    .from("habito_logs")
    .select("habito_id, quantidade_atual, completado")
    .eq("user_id", userId)
    .eq("data", data);
  if (error) throw error;
  return new Map((rows ?? []).map((r: any) => [r.habito_id, {
    quantidadeAtual: Math.max(0, Number(r.quantidade_atual ?? 1)),
    completado: !!r.completado,
  }]));
}

export async function executarAcaoBatalha(opts: {
  heroi: Heroi;
  inimigo: Inimigo | null;
  habito: Habito;
  data?: string;
  quantidadeAtual: number;
  marcado: boolean;
}) {
  const { heroi, inimigo, habito, marcado } = opts;
  const dia = opts.data ?? todayISO();
  const meta = Math.max(1, Number((habito as any).quantidade_meta ?? 1));
  const porQuantidade = (habito as any).tipo_tarefa === "quantidade" && meta > 1;
  const positivo = habito.tipo === "positivo";
  const skill = getPetSkill(heroi.avatar_equipado?.pet);
  const atual = Math.max(0, opts.quantidadeAtual ?? 0);

  if (porQuantidade) {
    if (atual >= meta) throw new Error("Esta ação já atingiu a meta de hoje.");
    const novaQuantidade = atual + 1;
    if (atual === 0) {
      const { error } = await supabase.from("habito_logs").insert({
        user_id: heroi.id, habito_id: habito.id, data: dia,
        completado: novaQuantidade >= meta, quantidade_atual: novaQuantidade,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("habito_logs")
        .update({ quantidade_atual: novaQuantidade, completado: novaQuantidade >= meta })
        .eq("habito_id", habito.id).eq("data", dia);
      if (error) throw error;
    }
    const efeito = await aplicarEfeitoBatalha({ heroi, inimigo, habito, positivo, skill, sign: 1 });
    return { ...efeito, quantidadeAtual: novaQuantidade, quantidadeMeta: meta, completouMeta: novaQuantidade >= meta };
  }

  const sign = marcado ? -1 : 1;
  if (marcado) {
    const { error } = await supabase.from("habito_logs").delete().eq("habito_id", habito.id).eq("data", dia);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("habito_logs").insert({
      user_id: heroi.id, habito_id: habito.id, data: dia, completado: true, quantidade_atual: 1,
    });
    if (error) throw error;
  }

  const efeito = await aplicarEfeitoBatalha({ heroi, inimigo, habito, positivo, skill, sign });
  return { ...efeito, quantidadeAtual: sign > 0 ? 1 : 0, quantidadeMeta: 1, completouMeta: sign > 0 };
}

async function aplicarEfeitoBatalha(opts: {
  heroi: Heroi;
  inimigo: Inimigo | null;
  habito: Habito;
  positivo: boolean;
  skill: ReturnType<typeof getPetSkill>;
  sign: number;
}) {
  const { heroi, inimigo, habito, positivo, skill, sign } = opts;
  let xpBase = positivo ? habito.peso_xp : -habito.peso_xp;
  if (positivo && skill.xpBonusPct) xpBase = Math.round(xpBase * (1 + skill.xpBonusPct));
  const xpDelta = sign * xpBase;

  let vidaBase = 0;
  if (positivo) vidaBase = rollLifeReward();
  else {
    const perda = Math.max(2, Math.round(habito.peso_dano_cura / 3));
    const reduzida = skill.danoReducaoPct ? Math.round(perda * (1 - skill.danoReducaoPct)) : perda;
    vidaBase = -Math.max(1, reduzida);
  }
  const vidaDelta = sign * vidaBase;

  let ouroBase = positivo ? (habito.peso_ouro ?? 0) : 0;
  if (positivo && skill.ouroBonusPct && ouroBase > 0) ouroBase += Math.max(1, Math.round(ouroBase * skill.ouroBonusPct));
  const ouroDelta = sign * ouroBase;
  const { xp_atual, nivel, xp_proximo_nivel, conquistas } = applyXp(heroi, xpDelta);
  const vida_atual = clamp(heroi.vida_atual + vidaDelta, 0, heroi.vida_max);
  const ouro = Math.max(0, (heroi.ouro ?? 0) + ouroDelta);

  const { error: userError } = await supabase.from("users").update({ xp_atual, nivel, xp_proximo_nivel, vida_atual, ouro }).eq("id", heroi.id);
  if (userError) throw userError;
  if (ouroDelta !== 0) {
    const { error } = await supabase.from("transacoes_ouro").insert({ user_id: heroi.id, valor: ouroDelta, origem: "habito", descricao: habito.nome });
    if (error) throw error;
  }

  let enemyDefeated = false;
  if (inimigo) {
    const hpDelta = sign * (positivo ? -habito.peso_dano_cura : habito.peso_dano_cura);
    const hp_atual = clamp(inimigo.hp_atual + hpDelta, 0, inimigo.hp_max);
    enemyDefeated = inimigo.hp_atual > 0 && hp_atual <= 0;
    const { error } = await supabase.from("inimigo").update({ hp_atual }).eq("id", inimigo.id);
    if (error) throw error;
  }

  if (conquistas.length) await checkConquistas(heroi.id, conquistas);
  emitGameEvent(sign > 0 ? "HABIT_COMPLETED" : "HABIT_UNDONE", {
    habitId: habito.id, habitName: habito.nome, xpDelta, goldDelta: ouroDelta,
  }, "executarAcaoBatalha");
  if (enemyDefeated && inimigo) emitGameEvent("ENEMY_DEFEATED", {
    enemyId: inimigo.id, enemyName: inimigo.nome,
  }, "executarAcaoBatalha");

  return { xpDelta, positivo, ouroDelta, vidaDelta, enemyDefeated };
}
