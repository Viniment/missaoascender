import { supabase } from "@/integrations/supabase/client";
import { todayISO, xpForLevel, clamp } from "./utils";
import { AvatarEquipado, ITENS_INICIAIS, getItem } from "./itens";
import { getPetSkill } from "./itens";

export type Habito = {
  id: string;
  nome: string;
  tipo: "positivo" | "negativo";
  peso_dano_cura: number;
  peso_xp: number;
  peso_ouro: number;
  ativo: boolean;
};

export type Inimigo = {
  id: string;
  nome: string;
  avatar_config: { emoji?: string } | null;
  hp_max: number;
  hp_atual: number;
  mentiras: string[];
  gatilho: string | null;
  ativo: boolean;
};

export type Heroi = {
  id: string;
  nome: string;
  nivel: number;
  xp_atual: number;
  xp_proximo_nivel: number;
  ouro: number;
  vida_atual: number;
  vida_max: number;
  streak_atual: number;
  ultimo_bau_data: string | null;
  avatar_equipado: AvatarEquipado;
  itens_desbloqueados: string[];
  titulo: string | null;
};

export type MiniVitoria = {
  id: string;
  titulo: string;
  recompensa_ouro: number;
  recompensa_xp: number;
  recompensa_vida: number;
  concluida: boolean;
  concluida_em: string | null;
};

export type Conquista = {
  id: string;
  tipo: string;
  titulo: string | null;
  descricao: string | null;
  desbloqueada_em: string;
};

export async function fetchHeroi(userId: string): Promise<Heroi | null> {
  const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (!data) return null;
  return {
    ...(data as any),
    avatar_equipado: (data as any).avatar_equipado ?? { base: "warrior", hat: null, armor: null, aura: null },
    itens_desbloqueados: (data as any).itens_desbloqueados ?? [],
  } as Heroi;
}

/** Compra ou desbloqueia item; retorna lista atualizada. */
export async function comprarItem(userId: string, heroi: Heroi, itemId: string) {
  const item = getItem(itemId);
  if (!item) throw new Error("Item inexistente");
  if (heroi.itens_desbloqueados.includes(itemId)) throw new Error("Você já possui este item");
  if (item.preco === null) throw new Error("Item só pode ser desbloqueado por conquista");
  if (heroi.ouro < item.preco) throw new Error("Ouro insuficiente");

  const novos = [...heroi.itens_desbloqueados, itemId];
  await supabase.from("users").update({
    ouro: heroi.ouro - item.preco,
    itens_desbloqueados: novos,
  }).eq("id", userId);
  await supabase.from("transacoes_ouro").insert({
    user_id: userId, valor: -item.preco, origem: "loja", descricao: item.nome,
  });
}

export async function equiparItem(userId: string, heroi: Heroi, itemId: string | null, categoria: "hat" | "armor" | "aura" | "weapon" | "wings" | "mask" | "pet" | "frame") {
  const equipado = { ...(heroi.avatar_equipado ?? {}), [categoria]: itemId };
  await supabase.from("users").update({ avatar_equipado: equipado as any }).eq("id", userId);
}

/** Atualiza um patch da aparência (rosto, pele, cabelo, olhos, marca). */
export async function salvarAparencia(userId: string, heroi: Heroi, patch: Partial<AvatarEquipado>) {
  const equipado = { ...(heroi.avatar_equipado ?? {}), ...patch };
  await supabase.from("users").update({ avatar_equipado: equipado as any }).eq("id", userId);
}

/** Garante itens iniciais + itens ligados a conquistas do usuário. */
export async function sincronizarItensDesbloqueados(userId: string, heroi: Heroi, conquistasTipos: string[]) {
  const atuais = new Set(heroi.itens_desbloqueados ?? []);
  const antes = atuais.size;
  for (const id of ITENS_INICIAIS) atuais.add(id);
  // itens com unlock atendido
  const { ITENS } = await import("./itens");
  for (const it of ITENS) {
    if (it.unlock && conquistasTipos.includes(it.unlock)) atuais.add(it.id);
  }
  if (atuais.size !== antes) {
    await supabase.from("users").update({ itens_desbloqueados: Array.from(atuais) }).eq("id", userId);
  }
  return Array.from(atuais);
}

export async function fetchInimigoAtivo(userId: string): Promise<Inimigo | null> {
  const { data } = await supabase
    .from("inimigo")
    .select("*")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as Inimigo) ?? null;
}

export async function fetchHabitos(userId: string): Promise<Habito[]> {
  const { data } = await supabase
    .from("habitos")
    .select("*")
    .eq("user_id", userId)
    .eq("ativo", true)
    .order("criado_em", { ascending: true });
  return (data as Habito[]) ?? [];
}

export async function fetchLogsHoje(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("habito_logs")
    .select("habito_id")
    .eq("user_id", userId)
    .eq("data", todayISO());
  return new Set((data ?? []).map((r: any) => r.habito_id));
}

/** Logs for a specific ISO date. */
export async function fetchLogsData(userId: string, data: string): Promise<Set<string>> {
  const { data: rows } = await supabase
    .from("habito_logs")
    .select("habito_id")
    .eq("user_id", userId)
    .eq("data", data);
  return new Set((rows ?? []).map((r: any) => r.habito_id));
}

/**
 * Recalcula o HP máximo do inimigo com base no potencial diário de dano do usuário.
 * Regra: hp_max = soma(dano dos hábitos positivos) * 21 dias (mínimo de 21 dias
 * de consistência para derrotar o inimigo). Preserva o dano já causado.
 */
export async function recalcularHpMaxInimigo(userId: string): Promise<void> {
  const [inimigo, habitos] = await Promise.all([
    fetchInimigoAtivo(userId),
    fetchHabitos(userId),
  ]);
  if (!inimigo) return;
  const positivos = habitos.filter(h => h.tipo === "positivo");
  const danoDiario = positivos.reduce((s, h) => s + (h.peso_dano_cura || 0), 0);
  const DIAS_MIN = 21;
  const novoMax = Math.max(50, danoDiario * DIAS_MIN);
  if (novoMax === inimigo.hp_max) return;
  const danoJaCausado = Math.max(0, inimigo.hp_max - inimigo.hp_atual);
  const novoAtual = clamp(novoMax - danoJaCausado, 0, novoMax);
  await supabase.from("inimigo")
    .update({ hp_max: novoMax, hp_atual: novoAtual })
    .eq("id", inimigo.id);
}

export async function fetchOnboarding(userId: string) {
  const { data } = await supabase
    .from("onboarding_respostas")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function fetchMiniVitorias(userId: string): Promise<MiniVitoria[]> {
  const { data } = await supabase
    .from("mini_vitorias")
    .select("*")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });
  return (data as MiniVitoria[]) ?? [];
}

export async function fetchConquistas(userId: string): Promise<Conquista[]> {
  const { data } = await supabase
    .from("conquistas")
    .select("*")
    .eq("user_id", userId)
    .order("desbloqueada_em", { ascending: false });
  return (data as Conquista[]) ?? [];
}

export async function fetchTransacoes(userId: string) {
  const { data } = await supabase
    .from("transacoes_ouro")
    .select("*")
    .eq("user_id", userId)
    .order("data", { ascending: false })
    .limit(50);
  return data ?? [];
}

/** Apply XP gain and level ups. Returns new heroi patch. */
export function applyXp(h: Heroi, delta: number) {
  let xp = h.xp_atual + delta;
  let nivel = h.nivel;
  let prox = h.xp_proximo_nivel;
  const conquistas: { tipo: string; titulo: string; descricao: string }[] = [];
  while (xp >= prox) {
    xp -= prox;
    nivel += 1;
    prox = xpForLevel(nivel);
    conquistas.push({
      tipo: `nivel_${nivel}`,
      titulo: `Nível ${nivel} alcançado`,
      descricao: `Você evoluiu para o nível ${nivel}.`,
    });
  }
  if (xp < 0) xp = 0;
  return { xp_atual: xp, nivel, xp_proximo_nivel: prox, conquistas };
}

export async function checkConquistas(userId: string, novas: { tipo: string; titulo: string; descricao: string }[]) {
  if (!novas.length) return;
  await supabase.from("conquistas").upsert(
    novas.map(c => ({ user_id: userId, tipo: c.tipo, titulo: c.titulo, descricao: c.descricao })),
    { onConflict: "user_id,tipo", ignoreDuplicates: true },
  );
}

export async function updateHabito(habitoId: string, patch: Partial<Pick<Habito, "nome" | "tipo" | "peso_dano_cura" | "peso_xp" | "peso_ouro">>) {
  const { error } = await supabase.from("habitos").update(patch).eq("id", habitoId);
  if (error) throw error;
}

export async function updateInimigo(inimigoId: string, patch: Partial<Pick<Inimigo, "nome" | "gatilho" | "mentiras" | "hp_max">> & { hp_atual?: number }) {
  const { error } = await supabase.from("inimigo").update(patch).eq("id", inimigoId);
  if (error) throw error;
}

/** Mark a habit as done today (or undo). Updates hero + enemy + logs + gold tx. */
export async function toggleHabito(opts: {
  heroi: Heroi;
  inimigo: Inimigo | null;
  habito: Habito;
  marcado: boolean; // current state
  data?: string;    // ISO date; defaults to today
}) {
  const { heroi, inimigo, habito, marcado } = opts;
  const dia = opts.data ?? todayISO();
  const sign = marcado ? -1 : 1; // if already marked, we're undoing
  const positivo = habito.tipo === "positivo";
  const skill = getPetSkill(heroi.avatar_equipado?.pet);

  // Habit log
  if (marcado) {
    await supabase.from("habito_logs").delete().eq("habito_id", habito.id).eq("data", dia);
  } else {
    await supabase.from("habito_logs").insert({
      user_id: heroi.id,
      habito_id: habito.id,
      data: dia,
      completado: true,
    });
  }

  // Hero XP + vida
  let xpBase = positivo ? habito.peso_xp : -habito.peso_xp;
  if (positivo && skill.xpBonusPct) xpBase = Math.round(xpBase * (1 + skill.xpBonusPct));
  const xpDelta = sign * xpBase;

  let vidaBase = 0;
  if (positivo) {
    vidaBase = skill.curaPorHabito ?? 0;
  } else {
    const perda = Math.max(2, Math.round(habito.peso_dano_cura / 3));
    const reduzida = skill.danoReducaoPct ? Math.round(perda * (1 - skill.danoReducaoPct)) : perda;
    vidaBase = -Math.max(1, reduzida);
  }
  const vidaDelta = sign * vidaBase;

  let ouroBase = positivo ? (habito.peso_ouro ?? 0) : 0;
  if (positivo && skill.ouroBonusPct && ouroBase > 0) {
    const bonus = Math.max(1, Math.round(ouroBase * skill.ouroBonusPct));
    ouroBase = ouroBase + bonus;
  }
  const ouroDelta = sign * ouroBase;
  const { xp_atual, nivel, xp_proximo_nivel, conquistas } = applyXp(heroi, xpDelta);
  const vida_atual = clamp(heroi.vida_atual + vidaDelta, 0, heroi.vida_max);
  const ouro = Math.max(0, (heroi.ouro ?? 0) + ouroDelta);

  await supabase.from("users").update({
    xp_atual, nivel, xp_proximo_nivel, vida_atual, ouro,
  }).eq("id", heroi.id);

  if (ouroDelta !== 0) {
    await supabase.from("transacoes_ouro").insert({
      user_id: heroi.id,
      valor: ouroDelta,
      origem: "habito",
      descricao: habito.nome,
    });
  }

  // Enemy HP
  if (inimigo) {
    const hpDelta = sign * (positivo ? -habito.peso_dano_cura : habito.peso_dano_cura);
    const hp_atual = clamp(inimigo.hp_atual + hpDelta, 0, inimigo.hp_max);
    await supabase.from("inimigo").update({ hp_atual }).eq("id", inimigo.id);
  }

  if (conquistas.length) await checkConquistas(heroi.id, conquistas);

  return { xpDelta, positivo, ouroDelta };
}

/** Roll the daily chest. Returns gold amount. */
export function rollDailyChest(): number {
  const r = Math.random();
  if (r < 0.6) return 1 + Math.floor(Math.random() * 3); // 1-3
  if (r < 0.9) return 4 + Math.floor(Math.random() * 3); // 4-6
  return 7 + Math.floor(Math.random() * 4); // 7-10
}

export async function abrirBauDiario(userId: string, heroi: Heroi): Promise<number> {
  const base = rollDailyChest();
  const skill = getPetSkill(heroi.avatar_equipado?.pet);
  const bonus = skill.ouroBonusPct ? Math.max(1, Math.round(base * skill.ouroBonusPct)) : 0;
  const gold = base + bonus;
  await supabase.from("users").update({
    ouro: heroi.ouro + gold,
    ultimo_bau_data: todayISO(),
  }).eq("id", userId);
  await supabase.from("transacoes_ouro").insert({
    user_id: userId,
    valor: gold,
    origem: "bau_diario",
    descricao: bonus > 0 ? `Baú do dia (+${bonus} bônus de pet)` : "Baú do dia",
  });
  return gold;
}

export async function concluirMiniVitoria(userId: string, heroi: Heroi, mv: MiniVitoria) {
  const { xp_atual, nivel, xp_proximo_nivel, conquistas } = applyXp(heroi, mv.recompensa_xp);
  const vida_atual = clamp(heroi.vida_atual + mv.recompensa_vida, 0, heroi.vida_max);
  await supabase.from("users").update({
    xp_atual, nivel, xp_proximo_nivel, vida_atual,
    ouro: heroi.ouro + mv.recompensa_ouro,
  }).eq("id", userId);
  await supabase.from("mini_vitorias").update({
    concluida: true, concluida_em: new Date().toISOString(),
  }).eq("id", mv.id);
  await supabase.from("transacoes_ouro").insert({
    user_id: userId, valor: mv.recompensa_ouro, origem: "mini_vitoria", descricao: mv.titulo,
  });
  if (conquistas.length) await checkConquistas(userId, conquistas);
}