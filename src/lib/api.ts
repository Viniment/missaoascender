import { supabase } from "@/integrations/supabase/client";
import { todayISO, xpForLevel, clamp } from "./utils";

export type Habito = {
  id: string;
  nome: string;
  tipo: "positivo" | "negativo";
  peso_dano_cura: number;
  peso_xp: number;
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
  return (data as Heroi) ?? null;
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

/** Mark a habit as done today (or undo). Updates hero + enemy + logs + gold tx. */
export async function toggleHabito(opts: {
  heroi: Heroi;
  inimigo: Inimigo | null;
  habito: Habito;
  marcado: boolean; // current state
}) {
  const { heroi, inimigo, habito, marcado } = opts;
  const today = todayISO();
  const sign = marcado ? -1 : 1; // if already marked, we're undoing
  const positivo = habito.tipo === "positivo";

  // Habit log
  if (marcado) {
    await supabase.from("habito_logs").delete().eq("habito_id", habito.id).eq("data", today);
  } else {
    await supabase.from("habito_logs").insert({
      user_id: heroi.id,
      habito_id: habito.id,
      data: today,
      completado: true,
    });
  }

  // Hero XP + vida
  const xpDelta = sign * (positivo ? habito.peso_xp : -habito.peso_xp);
  const vidaDelta = sign * (positivo ? 0 : -Math.max(2, Math.round(habito.peso_dano_cura / 3)));
  const { xp_atual, nivel, xp_proximo_nivel, conquistas } = applyXp(heroi, xpDelta);
  const vida_atual = clamp(heroi.vida_atual + vidaDelta, 0, heroi.vida_max);

  await supabase.from("users").update({
    xp_atual, nivel, xp_proximo_nivel, vida_atual,
  }).eq("id", heroi.id);

  // Enemy HP
  if (inimigo) {
    const hpDelta = sign * (positivo ? -habito.peso_dano_cura : habito.peso_dano_cura);
    const hp_atual = clamp(inimigo.hp_atual + hpDelta, 0, inimigo.hp_max);
    await supabase.from("inimigo").update({ hp_atual }).eq("id", inimigo.id);
  }

  if (conquistas.length) await checkConquistas(heroi.id, conquistas);

  return { xpDelta, positivo };
}

/** Roll the daily chest. Returns gold amount. */
export function rollDailyChest(): number {
  const r = Math.random();
  if (r < 0.6) return 1 + Math.floor(Math.random() * 3); // 1-3
  if (r < 0.9) return 4 + Math.floor(Math.random() * 3); // 4-6
  return 7 + Math.floor(Math.random() * 4); // 7-10
}

export async function abrirBauDiario(userId: string, heroi: Heroi): Promise<number> {
  const gold = rollDailyChest();
  await supabase.from("users").update({
    ouro: heroi.ouro + gold,
    ultimo_bau_data: todayISO(),
  }).eq("id", userId);
  await supabase.from("transacoes_ouro").insert({
    user_id: userId,
    valor: gold,
    origem: "bau_diario",
    descricao: "Baú do dia",
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