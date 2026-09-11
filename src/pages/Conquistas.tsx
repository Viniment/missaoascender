import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { fetchConquistas, fetchHeroi, fetchInimigoAtivo } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Lock, Brain, Swords, Flame, Coins, Shield, Sparkles, Target, Eye, Waves, Crown, Star, CheckCircle2 } from "lucide-react";

type Grupo = "todas" | "nivel" | "mente" | "batalha" | "consistencia" | "riqueza" | "pureza";
type Raridade = "comum" | "rara" | "epica" | "lendaria";
type CatalogItem = { tipo: string; titulo: string; descricao: string; como: string; unlocked: boolean; progresso?: string; percent?: number; desbloqueada_em?: string | null; grupo: Exclude<Grupo, "todas">; raridade: Raridade; icon: any };

const GROUPS: { id: Grupo; label: string; icon: any }[] = [
  { id: "todas", label: "Todas", icon: Trophy }, { id: "mente", label: "Mente", icon: Brain }, { id: "nivel", label: "Nível", icon: Sparkles },
  { id: "consistencia", label: "Consistência", icon: Flame }, { id: "batalha", label: "Batalha", icon: Swords }, { id: "riqueza", label: "Riqueza", icon: Coins }, { id: "pureza", label: "Autodomínio", icon: Shield },
];
const RARITY: Record<Raridade, { label: string; className: string; glow: string }> = {
  comum: { label: "COMUM", className: "border-border text-muted-foreground", glow: "" },
  rara: { label: "RARA", className: "border-cyan-400/50 text-cyan-300", glow: "shadow-[0_0_18px_rgba(34,211,238,0.12)]" },
  epica: { label: "ÉPICA", className: "border-purple-400/60 text-purple-300", glow: "shadow-[0_0_22px_rgba(168,85,247,0.18)]" },
  lendaria: { label: "LENDÁRIA", className: "border-amber-300/70 text-amber-200", glow: "shadow-[0_0_28px_rgba(251,191,36,0.2)]" },
};

function loadDiary(uid: string) { try { return JSON.parse(localStorage.getItem(`ascensao:diario:${uid}`) || "[]") as Array<{ date: string; text: string; type: string }>; } catch { return []; } }

export default function ConquistasPage() {
  const { user } = useAuth(); const uid = user?.id;
  const { data: cs } = useQuery({ queryKey: ["conq", uid], queryFn: () => fetchConquistas(uid!), enabled: !!uid });
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo-ativo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: derrotados } = useQuery({ queryKey: ["inimigos-derrotados", uid], queryFn: async () => { const { count } = await supabase.from("inimigo").select("id", { count: "exact", head: true }).eq("user_id", uid!).eq("ativo", false); return count ?? 0; }, enabled: !!uid });
  const { data: economia } = useQuery({ queryKey: ["econ-conq", uid], queryFn: async () => { const { data } = await supabase.from("transacoes_ouro").select("valor,origem").eq("user_id", uid!); const rows = data ?? []; return { ouroGanho: rows.filter(r => (r.valor ?? 0) > 0).reduce((s, r) => s + (r.valor ?? 0), 0), compras: rows.filter(r => (r.origem ?? "") === "loja").length }; }, enabled: !!uid });
  const { data: pureza } = useQuery({ queryKey: ["pureza-conq", uid], queryFn: async () => { const { data: logs } = await supabase.from("habito_logs").select("data, completado, habitos!inner(tipo)").eq("user_id", uid!).eq("completado", true); const byDay = new Map<string, { pos: number; neg: number }>(); for (const l of logs ?? []) { const d = l.data as string; const t = (l as any).habitos?.tipo as string | undefined; const cur = byDay.get(d) ?? { pos: 0, neg: 0 }; if (t === "positivo") cur.pos++; else if (t === "negativo") cur.neg++; byDay.set(d, cur); } let perfeitos = 0; for (const { pos, neg } of byDay.values()) if (pos > 0 && neg === 0) perfeitos++; return { perfeitos, semArmadilhas: perfeitos }; }, enabled: !!uid });

  const [diary, setDiary] = useState<Array<{ date: string; text: string; type: string }>>([]); const [filtro, setFiltro] = useState<Grupo>("todas"); const [aberta, setAberta] = useState<string | null>(null);
  useEffect(() => { if (uid) setDiary(loadDiary(uid)); }, [uid]);

  const catalog = useMemo<CatalogItem[]>(() => {
    if (!heroi) return [];
    const map = new Map((cs ?? []).map(c => [c.tipo, c] as const)); const items: CatalogItem[] = [];
    const nivel = heroi.nivel ?? 1, streak = heroi.streak_atual ?? 0, ouro = heroi.ouro ?? 0, ganho = economia?.ouroGanho ?? 0, compras = economia?.compras ?? 0, kills = derrotados ?? 0;
    const add = (x: Omit<CatalogItem, "percent"> & { percent?: number }) => items.push({ percent: x.unlocked ? 100 : Math.max(0, Math.min(99, x.percent ?? 0)), ...x });
    const db = (tipo: string) => map.get(tipo)?.desbloqueada_em ?? null;
    const unlock = (tipo: string, condition: boolean) => condition || map.has(tipo);

    for (const n of [2, 3, 5, 10, 15, 20, 30, 50, 75, 100]) { const u = unlock(`nivel_${n}`, nivel >= n); add({ tipo: `nivel_${n}`, titulo: `Nível ${n}`, descricao: `Alcance o nível ${n} e avance mais um capítulo da campanha.`, como: `Continue acumulando XP até o nível ${n}.`, unlocked: u, progresso: u ? undefined : `${nivel}/${n}`, percent: nivel / n * 100, desbloqueada_em: u ? db(`nivel_${n}`) : null, grupo: "nivel", raridade: n >= 50 ? "lendaria" : n >= 20 ? "epica" : n >= 10 ? "rara" : "comum", icon: Sparkles }); }

    const diaryDates = new Set(diary.map(e => e.date)).size, diaryCount = diary.length, urgeCount = diary.filter(e => e.type === "urge").length;
    const conscious = diary.filter(e => /ESCOLHA:\s*(?!não registrada)/i.test(e.text)).length;
    const perspectives = diary.filter(e => /PERSPECTIVA:\s*(?!não registrada)/i.test(e.text)).length;
    const mente = [
      ["mente_primeiro", "Primeiro contato", "Você entrou no laboratório da própria mente.", "Faça seu primeiro registro no Diário.", diaryCount >= 1, diaryCount, 1, "comum", Eye],
      ["mente_3", "Olhar de fora", "Você começou a observar padrões em vez de simplesmente reagir.", "Faça 3 registros metacognitivos.", diaryCount >= 3, diaryCount, 3, "rara", Eye],
      ["mente_7", "Cartógrafo mental", "Sete registros transformaram experiências em dados para a campanha.", "Faça 7 registros no Diário.", diaryCount >= 7, diaryCount, 7, "epica", Brain],
      ["mente_14", "Observador persistente", "Você voltou para observar a própria mente por 14 registros.", "Faça 14 registros.", diaryCount >= 14, diaryCount, 14, "epica", Brain],
      ["mente_30", "Mestre da observação", "Metacognição deixou de ser evento e virou prática.", "Faça 30 registros.", diaryCount >= 30, diaryCount, 30, "lendaria", Crown],
      ["mente_vontade", "Vontade ≠ comando", "Você praticou separar impulso de decisão.", "Registre uma experiência pelo modo de vontade.", urgeCount >= 1, urgeCount, 1, "rara", Waves],
      ["mente_escolha", "A escolha é minha", "Você chegou ao ponto em que pensamento, emoção e vontade deixam espaço para uma ação consciente.", "Registre uma escolha consciente no Diário.", conscious >= 1, conscious, 1, "epica", Target],
      ["mente_perspectiva", "Outra perspectiva", "Você investigou uma interpretação e procurou uma explicação alternativa.", "Registre uma perspectiva alternativa.", perspectives >= 1, perspectives, 1, "rara", Brain],
      ["mente_3escolhas", "Autor da resposta", "Três vezes você parou para escolher a resposta em vez de apenas reagir.", "Faça 3 escolhas conscientes no Diário.", conscious >= 3, conscious, 3, "epica", Target],
      ["mente_7dias", "Presença mental", "Você voltou ao Diário em 7 dias diferentes.", "Registre experiências em 7 dias diferentes.", diaryDates >= 7, diaryDates, 7, "lendaria", Star],
    ] as any[];
    for (const [tipo, titulo, descricao, como, u, current, goal, raridade, icon] of mente) add({ tipo, titulo, descricao, como, unlocked: !!u, progresso: u ? undefined : `${current}/${goal}`, percent: Number(current) / Number(goal) * 100, desbloqueada_em: u ? db(tipo) : null, grupo: "mente", raridade, icon });

    for (const n of [3, 7, 14, 30, 60, 100]) { const u = unlock(`streak_${n}`, streak >= n); add({ tipo: `streak_${n}`, titulo: `${n} dias de streak`, descricao: `Mantenha ${n} dias seguidos de foco.`, como: `Complete pelo menos um hábito positivo por ${n} dias consecutivos.`, unlocked: u, progresso: u ? undefined : `${streak}/${n}`, percent: streak / n * 100, desbloqueada_em: u ? db(`streak_${n}`) : null, grupo: "consistencia", raridade: n >= 60 ? "lendaria" : n >= 14 ? "epica" : "rara", icon: Flame }); }
    const bau = !!heroi.ultimo_bau_data || map.has("bau_lendario"); add({ tipo: "bau_lendario", titulo: "Caçador de recompensas", descricao: "Você descobriu que consistência também pode virar loot.", como: "Abra o baú diário.", unlocked: bau, progresso: bau ? undefined : "0/1", desbloqueada_em: bau ? db("bau_lendario") : null, grupo: "consistencia", raridade: "rara", icon: Star });
    add({ tipo: "mestre_habitos", titulo: "Mestre dos hábitos", descricao: "Consistência virou identidade.", como: "Mantenha 30 dias de streak e derrote pelo menos um inimigo.", unlocked: streak >= 30 && kills >= 1, progresso: streak >= 30 && kills >= 1 ? undefined : `${Math.min(streak,30)}/30 dias + ${Math.min(kills,1)}/1 inimigo`, percent: Math.min(100, streak / 30 * 100) * (kills >= 1 ? 1 : .8), desbloqueada_em: streak >= 30 && kills >= 1 ? db("mestre_habitos") : null, grupo: "consistencia", raridade: "lendaria", icon: Crown });

    const batalha = !!inimigo || kills > 0 || map.has("primeira_batalha"); add({ tipo: "primeira_batalha", titulo: "Primeira batalha", descricao: "Você identificou um inimigo interno e decidiu enfrentá-lo.", como: "Cadastre um inimigo de campanha.", unlocked: batalha, progresso: batalha ? undefined : "0/1", desbloqueada_em: batalha ? db("primeira_batalha") : null, grupo: "batalha", raridade: "comum", icon: Swords });
    for (const n of [1, 3, 5, 10, 25]) { const tipo = n === 1 ? "primeiro_inimigo_derrotado" : `inimigos_${n}`; const u = unlock(tipo, kills >= n); add({ tipo, titulo: n === 1 ? "Primeiro inimigo derrotado" : `${n} inimigos derrotados`, descricao: "Um padrão a menos controlando a campanha.", como: "Zere o HP de inimigos cumprindo seus hábitos positivos.", unlocked: u, progresso: u ? undefined : `${kills}/${n}`, percent: kills / n * 100, desbloqueada_em: u ? db(tipo) : null, grupo: "batalha", raridade: n >= 10 ? "lendaria" : n >= 5 ? "epica" : "rara", icon: Swords }); }

    for (const n of [100, 500, 1000, 5000, 10000]) { const tipo = `ouro_ganho_${n}`, u = ganho >= n; add({ tipo, titulo: `${n.toLocaleString("pt-BR")} de ouro ganho`, descricao: `Acumule ${n.toLocaleString("pt-BR")} de ouro ao longo da campanha.`, como: "Cumpra ações que geram ouro.", unlocked: u, progresso: u ? undefined : `${ganho.toLocaleString("pt-BR")}/${n.toLocaleString("pt-BR")}`, percent: ganho / n * 100, desbloqueada_em: u ? db(tipo) : null, grupo: "riqueza", raridade: n >= 5000 ? "lendaria" : n >= 1000 ? "epica" : "rara", icon: Coins }); }
    for (const n of [500, 2000, 5000]) { const tipo = `ouro_cofre_${n}`, u = ouro >= n; add({ tipo, titulo: `${n.toLocaleString("pt-BR")} guardados`, descricao: "Você aprendeu a acumular poder sem gastar tudo.", como: "Mantenha esse valor de ouro ao mesmo tempo.", unlocked: u, progresso: u ? undefined : `${ouro}/${n}`, percent: ouro / n * 100, desbloqueada_em: u ? db(tipo) : null, grupo: "riqueza", raridade: n >= 5000 ? "lendaria" : "epica", icon: Coins }); }
    for (const n of [1, 5, 15, 30]) { const tipo = `compras_${n}`, u = compras >= n; add({ tipo, titulo: n === 1 ? "Primeira compra" : `${n} compras`, descricao: "Transforme ouro em recursos para sua evolução.", como: "Compre itens na loja.", unlocked: u, progresso: u ? undefined : `${compras}/${n}`, percent: compras / n * 100, desbloqueada_em: u ? db(tipo) : null, grupo: "riqueza", raridade: n >= 15 ? "epica" : "comum", icon: Coins }); }

    for (const n of [1, 5, 15, 30]) { const tipo = `dias_perfeitos_${n}`, u = (pureza?.perfeitos ?? 0) >= n; add({ tipo, titulo: n === 1 ? "Primeiro dia limpo" : `${n} dias limpos`, descricao: "Você escolheu construir sem alimentar a armadilha.", como: "Complete um hábito positivo e nenhum negativo no dia.", unlocked: u, progresso: u ? undefined : `${pureza?.perfeitos ?? 0}/${n}`, percent: (pureza?.perfeitos ?? 0) / n * 100, desbloqueada_em: u ? db(tipo) : null, grupo: "pureza", raridade: n >= 15 ? "epica" : "rara", icon: Shield }); }
    return items;
  }, [heroi, cs, inimigo, derrotados, economia, pureza, diary]);

  const total = catalog.length, obtidas = catalog.filter(c => c.unlocked).length, filtrado = filtro === "todas" ? catalog : catalog.filter(c => c.grupo === filtro);
  const proxima = catalog.filter(c => !c.unlocked).sort((a,b) => (b.percent ?? 0) - (a.percent ?? 0))[0];
  const percentual = total ? Math.round(obtidas / total * 100) : 0;

  return <Shell><div className="mx-auto max-w-6xl space-y-5 pb-4">
    <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-5 shadow-[0_0_40px_hsl(var(--primary)/0.08)] sm:p-7">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary"><Trophy className="h-4 w-4" /> Sala de Troféus</div><h1 className="mt-2 font-display text-2xl tracking-[0.14em] text-primary glow-text-purple sm:text-3xl">CONQUISTAS</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Cada conquista representa uma mudança real: aprender, observar, escolher e agir. A campanha não mede só resultado — mede evolução.</p></div><div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-center"><div className="font-display text-2xl text-primary">{obtidas}/{total}</div><div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">desbloqueadas</div></div></div>
      <div className="relative mt-6"><div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest"><span>Progresso da coleção</span><span className="text-primary">{percentual}%</span></div><div className="h-3 overflow-hidden rounded-full border border-border bg-background/60"><motion.div initial={{ width: 0 }} animate={{ width: `${percentual}%` }} className="h-full bg-gradient-to-r from-primary via-purple-400 to-amber-300 shadow-[0_0_15px_hsl(var(--primary)/0.6)]" /></div></div>
    </header>

    {proxima && <section className="rpg-panel flex items-center gap-3 p-4 border-primary/25"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Target className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">PRÓXIMA CONQUISTA</div><div className="mt-0.5 font-display text-sm tracking-wider">{proxima.titulo}</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${proxima.percent}%` }} /></div></div><span className="text-[10px] font-black text-primary">{Math.round(proxima.percent ?? 0)}%</span></section>}

    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">{GROUPS.map(g => { const Icon = g.icon; const count = g.id === "todas" ? catalog.length : catalog.filter(c => c.grupo === g.id).length; const got = g.id === "todas" ? obtidas : catalog.filter(c => c.grupo === g.id && c.unlocked).length; const active = filtro === g.id; return <button key={g.id} onClick={() => setFiltro(g.id)} className={`shrink-0 rounded-xl border px-3 py-2 transition ${active ? "border-primary bg-primary/15 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.18)]" : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"}`}><span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"><Icon className="h-3.5 w-3.5" />{g.label}<span className="opacity-60">{got}/{count}</span></span></button>; })}</div>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtrado.map(c => { const open = aberta === c.tipo; const R = RARITY[c.raridade]; const Icon = c.icon; return <motion.button key={c.tipo} layout onClick={() => setAberta(open ? null : c.tipo)} className={`group relative overflow-hidden rounded-2xl border bg-card/70 p-4 text-left transition hover:-translate-y-0.5 ${c.unlocked ? `${R.glow} ${R.className}` : "border-border/60 opacity-60 hover:opacity-90"}`}>
      <div className="flex items-start gap-3"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${c.unlocked ? R.className : "border-border text-muted-foreground"} bg-background/40`}>{c.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`text-[8px] font-black tracking-[0.16em] ${R.className}`}>{R.label}</span>{c.unlocked && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}</div><h3 className={`mt-1 font-display text-sm tracking-wider ${c.unlocked ? "text-foreground" : "text-muted-foreground"}`}>{c.titulo}</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{c.descricao}</p></div></div>
      {!c.unlocked && <div className="mt-3"><div className="mb-1 flex justify-between text-[9px] font-bold text-muted-foreground"><span>PROGRESSO</span><span>{Math.round(c.percent ?? 0)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary/70 transition-all" style={{ width: `${Math.min(100, c.percent ?? 0)}%` }} /></div></div>}
      {open && <div className="mt-4 space-y-2 border-t border-border/60 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-primary">Como desbloquear</p><p className="text-xs leading-relaxed text-foreground/90">{c.como}</p>{c.progresso && <p className="text-[10px] font-bold text-muted-foreground">Atual: {c.progresso}</p>}{c.unlocked && c.desbloqueada_em && <p className="text-[10px] text-muted-foreground">Desbloqueada em {new Date(c.desbloqueada_em).toLocaleDateString("pt-BR")}</p>}</div>}
      <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary opacity-0 shadow-[0_0_8px_hsl(var(--primary))] transition group-hover:opacity-100" />
    </motion.button>; })}</section>
  </div></Shell>;
}
