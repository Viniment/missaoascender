import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchInimigoAtivo, fetchHabitos, fetchOnboarding, toggleHabito, abrirBauDiario, fetchConquistas, fetchLogsData, recalcularHpMaxInimigo } from "@/lib/api";
import { fetchQuantidadeAcoes, executarAcaoBatalha } from "@/lib/acoesBatalha";
import { todayISO, shiftISO, formatBRDate } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Heart, Zap, Coins, Flame, Swords, Trash2, Skull, Shield, Sparkles, Loader2, X, Trophy, Pencil, ChevronLeft, ChevronRight, Calendar, Target } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Link } from "react-router-dom";
import { fireReward } from "@/components/fx/RewardBurst";
import HabitFX, { fireHabitFX } from "@/components/fx/HabitFX";
import AnimatedCounter from "@/components/fx/AnimatedCounter";
import LevelUpOverlay from "@/components/fx/LevelUpOverlay";
import VictoryScreen from "@/components/fx/VictoryScreen";
import AvisosBanner from "@/components/AvisosBanner";
import ChestOverlay from "@/components/fx/ChestOverlay";
import EditHabitoDialog from "@/components/EditHabitoDialog";
import EditInimigoDialog from "@/components/EditInimigoDialog";
import CartaEnfrentamentoDialog from "@/components/CartaEnfrentamentoDialog";
import type { Habito } from "@/lib/api";
import { CARD_BACKGROUNDS } from "@/lib/itens";

type Battle = { positivo: boolean; habito: string; xp: number; dano: number; ouro: number; vidaDelta: number; msg: string; loading: boolean; quantidadeAtual?: number; quantidadeMeta?: number };

const VITORIA_MENSAGENS = [
  "🔥 Excelente! Você cumpriu sua ação.",
  "⚔️ Golpe confirmado! Continue avançando.",
  "🏆 Muito bem! Mais uma vitória contra o inimigo.",
  "💪 Execução concluída. Você está construindo consistência.",
  "✨ Vitória registrada! Não pare agora."
];
const DERROTA_MENSAGENS = [
  "💀 O inimigo conseguiu uma abertura.",
  "⚠️ Você caiu nesta rodada. Levante e retome.",
  "🩸 O inimigo ganhou força desta vez.",
  "😈 Armadilha acionada. A batalha continua.",
  "🔥 Derrota registrada. Ainda dá para voltar ao combate."
];
function mensagemAleatoria(lista: string[]) { return lista[Math.floor(Math.random() * lista.length)]; }

export default function Dashboard() {
  const { user } = useAuth(); const nav = useNavigate(); const qc = useQueryClient(); const uid = user?.id;
  const { data: ob } = useQuery({ queryKey: ["ob", uid], queryFn: () => fetchOnboarding(uid!), enabled: !!uid });
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: habitos } = useQuery({ queryKey: ["habitos", uid], queryFn: () => fetchHabitos(uid!), enabled: !!uid });
  const { data: conquistas } = useQuery({ queryKey: ["conq", uid], queryFn: () => fetchConquistas(uid!), enabled: !!uid });
  const { data: transacoes } = useQuery({ queryKey: ["transacoes-conquistas", uid], queryFn: async () => { const { data, error } = await supabase.from("transacoes_ouro").select("valor, origem").eq("user_id", uid!); if (error) throw error; return data ?? []; }, enabled: !!uid });
  const [dataSelecionada, setDataSelecionada] = useState<string>(todayISO());
  const isHoje = dataSelecionada === todayISO();
  const { data: logs } = useQuery({ queryKey: ["logs", uid, dataSelecionada], queryFn: () => fetchLogsData(uid!, dataSelecionada), enabled: !!uid });
  const { data: quantidadeLogs } = useQuery({ queryKey: ["quantidade-acoes", uid, dataSelecionada], queryFn: () => fetchQuantidadeAcoes(uid!, dataSelecionada), enabled: !!uid });
  const [novoHabito, setNovoHabito] = useState({ nome: "", tipo: "positivo" as "positivo" | "negativo", tipoTarefa: "unica" as "unica" | "quantidade", quantidadeMeta: 1 });
  const [showForm, setShowForm] = useState(false); const [creating, setCreating] = useState(false); const [battle, setBattle] = useState<Battle | null>(null); const [shakeEnemy, setShakeEnemy] = useState(false); const [levelUp, setLevelUp] = useState<number | null>(null); const [victory, setVictory] = useState<string | null>(null); const [chestOpen, setChestOpen] = useState(false); const [chestGold, setChestGold] = useState<number | null>(null); const [editHabito, setEditHabito] = useState<Habito | null>(null); const [editInimigoOpen, setEditInimigoOpen] = useState(false); const [cartaOpen, setCartaOpen] = useState(false);
  const prevNivel = useRef<number | null>(null); const prevEnemyHp = useRef<number | null>(null);
  useEffect(() => { if (!heroi) return; if (prevNivel.current !== null && heroi.nivel > prevNivel.current) setLevelUp(heroi.nivel); prevNivel.current = heroi.nivel; }, [heroi?.nivel]);
  useEffect(() => { if (!inimigo) return; if (prevEnemyHp.current !== null && prevEnemyHp.current > 0 && inimigo.hp_atual <= 0) setVictory(inimigo.nome); prevEnemyHp.current = inimigo.hp_atual; }, [inimigo?.hp_atual]);
  useEffect(() => { if (ob === null) nav("/onboarding"); }, [ob, nav]);
  useEffect(() => { if (ob && inimigo === null) nav("/criar-inimigo"); }, [ob, inimigo, nav]);

  const onToggle = async (habitoId: string) => {
    if (!heroi || !habitos) return;
    const h = habitos.find(x => x.id === habitoId)!; const tipoTarefa = (h as any).tipo_tarefa ?? "unica"; const meta = Math.max(1, Number((h as any).quantidade_meta ?? 1)); const porQuantidade = tipoTarefa === "quantidade" && meta > 1; const quantidadeAtual = quantidadeLogs?.get(h.id)?.quantidadeAtual ?? 0; const marcado = porQuantidade ? quantidadeAtual >= meta : (logs?.has(h.id) ?? false); const positivo = h.tipo === "positivo";
    if (porQuantidade && marcado) { toast.info(`Meta de ${meta}x já concluída hoje.`); return; }
    try {
      const resultado: any = porQuantidade ? await executarAcaoBatalha({ heroi, inimigo: inimigo ?? null, habito: h, marcado: false, quantidadeAtual, data: dataSelecionada }) : await toggleHabito({ heroi, inimigo: inimigo ?? null, habito: h, marcado, data: dataSelecionada });
      await qc.invalidateQueries(); if (marcado && !porQuantidade) return;
      fireHabitFX(positivo ? "positive" : "negative");
      const xpReal = Math.abs(Number(resultado?.xpDelta ?? (positivo ? h.peso_xp : -h.peso_xp))); const ouroReal = Math.abs(Number(resultado?.ouroDelta ?? 0)); const vidaReal = Number(resultado?.vidaDelta ?? (positivo ? 0 : -Math.max(2, Math.round(h.peso_dano_cura / 3))));
      const mensagem = positivo ? mensagemAleatoria(VITORIA_MENSAGENS) : mensagemAleatoria(DERROTA_MENSAGENS);
      setBattle({ positivo, habito: h.nome, xp: xpReal, dano: h.peso_dano_cura, ouro: ouroReal, vidaDelta: vidaReal, quantidadeAtual: resultado?.quantidadeAtual, quantidadeMeta: resultado?.quantidadeMeta, msg: mensagem, loading: false });
      if (positivo) {
        setShakeEnemy(true); setTimeout(() => setShakeEnemy(false), 400);
        fireReward(`+${xpReal} XP`, "#a855f7"); if (ouroReal > 0) setTimeout(() => fireReward(`+${ouroReal} 🪙`, "#facc15"), 120); setTimeout(() => fireReward(`-${h.peso_dano_cura} HP`, "#ef4444"), 240);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const abrirBau = async () => { if (!heroi) return; const infinito = typeof window !== "undefined" && localStorage.getItem("dev_bau_infinito") === "1"; if (!infinito && heroi.ultimo_bau_data === todayISO()) { toast.info("Baú de hoje já aberto."); return; } setChestGold(null); setChestOpen(true); };
  const executarAberturaBau = async () => { if (!heroi) return; const g = await abrirBauDiario(heroi.id, heroi); setChestGold(g); fireReward(`+${g} ouro`, "#facc15"); await qc.invalidateQueries(); const infinito = typeof window !== "undefined" && localStorage.getItem("dev_bau_infinito") === "1"; if (infinito) { await supabase.from("users").update({ ultimo_bau_data: null }).eq("id", heroi.id); await qc.invalidateQueries(); } };
  const criarHabito = async () => {
    if (!uid || !novoHabito.nome.trim()) return; setCreating(true);
    try { let peso_dano_cura = 8, peso_xp = 12, peso_ouro = 2; try { const { data } = await supabase.functions.invoke("sugerir-pesos-habito", { body: { habito_nome: novoHabito.nome.trim(), tipo: novoHabito.tipo, inimigo: inimigo ? { nome: inimigo.nome, gatilho: inimigo.gatilho, mentiras: inimigo.mentiras } : null, onboarding: ob ?? null } }); if (data?.peso_dano_cura) peso_dano_cura = data.peso_dano_cura; if (data?.peso_xp) peso_xp = data.peso_xp; if (data?.peso_ouro) peso_ouro = data.peso_ouro; } catch {}
      const { error } = await supabase.from("habitos").insert({ user_id: uid, nome: novoHabito.nome.trim(), tipo: novoHabito.tipo, tipo_tarefa: novoHabito.tipoTarefa, quantidade_meta: novoHabito.tipoTarefa === "quantidade" ? Math.max(1, Math.floor(novoHabito.quantidadeMeta)) : 1, peso_dano_cura, peso_xp, peso_ouro }); if (error) throw error;
      setNovoHabito({ nome: "", tipo: "positivo", tipoTarefa: "unica", quantidadeMeta: 1 }); setShowForm(false); if (novoHabito.tipo === "positivo") { await recalcularHpMaxInimigo(uid); await qc.invalidateQueries({ queryKey: ["inimigo", uid] }); } await qc.invalidateQueries({ queryKey: ["habitos", uid] });
    } catch (e: any) { toast.error(e.message ?? "Erro ao criar ação"); } finally { setCreating(false); }
  };
  const excluirHabito = async (id: string) => { await supabase.from("habitos").update({ ativo: false }).eq("id", id); if (uid) { await recalcularHpMaxInimigo(uid); await qc.invalidateQueries({ queryKey: ["inimigo", uid] }); } await qc.invalidateQueries({ queryKey: ["habitos", uid] }); };

  const totalConquistas = useMemo(() => {
    const desbloqueadas = new Set((conquistas ?? []).map(c => c.tipo));
    const addIf = (tipo: string, unlocked: boolean) => { if (unlocked) desbloqueadas.add(tipo); };
    const nivel = heroi?.nivel ?? 1;
    const streak = heroi?.streak_atual ?? 0;
    const ouro = heroi?.ouro ?? 0;
    let diario: any[] = [];
    let maxFast = 0;
    if (uid && typeof window !== "undefined") {
      try { diario = JSON.parse(localStorage.getItem(`ascensao:diario:${uid}`) || "[]") as any[]; } catch {}
      try { const s = JSON.parse(localStorage.getItem(`ascensao:jejum:${uid}`) || "[]") as Array<{ minutes: number }>; maxFast = Math.max(0, ...s.map(x => (x.minutes || 0) / 60)); } catch {}
    }
    const datas = new Set(diario.map(x => x.date)).size;
    const urges = diario.filter(x => x.type === "urge").length;
    const pensamentos = diario.filter(x => /PENSAMENTO:/i.test(x.text || "")).length;
    const ganho = (transacoes ?? []).filter(x => (x.valor ?? 0) > 0).reduce((a, x) => a + (x.valor ?? 0), 0);
    const compras = (transacoes ?? []).filter(x => x.origem === "loja").length;
    for (const n of [2,3,4,5,7,10,15,20,30,50,75,100]) addIf(`nivel_${n}`, nivel >= n);
    for (const n of [1,2,3,5,7,10,15,20,30,45,60,100]) addIf(`diario_${n}`, diario.length >= n);
    for (const n of [1,2,3,5,7,14,30]) addIf(`dias_mente_${n}`, datas >= n);
    for (const n of [1,3,5,10]) addIf(`pensamentos_${n}`, pensamentos >= n);
    for (const n of [1,2,3,5,10]) addIf(`vontades_${n}`, urges >= n);
    for (const n of [1,2,3,5,7,10,15,20,30,45,60,100]) addIf(`streak_${n}`, streak >= n);
    for (const n of [100,250,500,1000,2500,5000,10000]) addIf(`ouro_ganho_${n}`, ganho >= n);
    for (const n of [100,250,500,1000,2000,5000]) addIf(`ouro_cofre_${n}`, ouro >= n);
    for (const n of [1,2,3,5,10,15,30]) addIf(`compras_${n}`, compras >= n);
    const jejumMax = 21 * 24;
    for (const n of [1,3,6,12,18,24,36,48,72,120,168,336,jejumMax]) addIf(`jejum_${n}`, maxFast >= n);
    return desbloqueadas.size;
  }, [conquistas, heroi, transacoes, uid]);

  if (!heroi) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  const xpPct = Math.min(100, (heroi.xp_atual / heroi.xp_proximo_nivel) * 100); const hpPct = (heroi.vida_atual / heroi.vida_max) * 100; const enemyPct = inimigo ? (inimigo.hp_atual / inimigo.hp_max) * 100 : 0; const bauAberto = heroi.ultimo_bau_data === todayISO(); const positivos = (habitos ?? []).filter(h => h.tipo === "positivo"); const negativos = (habitos ?? []).filter(h => h.tipo === "negativo");
  return <Shell>
    <BattleOverlay battle={battle} onClose={() => setBattle(null)} inimigo={inimigo} /><LevelUpOverlay nivel={levelUp} onClose={() => setLevelUp(null)} /><VictoryScreen inimigoNome={victory} onClose={() => setVictory(null)} /><HabitFX />
    <div className="space-y-6">
      <AvisosBanner />
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="player-card scanlines p-3.5 sm:p-5">
        {(() => { const cardBgId = (heroi.avatar_equipado as any)?.cardBg as string | undefined; const bg = cardBgId ? CARD_BACKGROUNDS[cardBgId] : null; return bg ? <div className={`card-bg-layer ${bg.className}`} /> : null; })()}
        <div className="flex items-center gap-3 sm:gap-4"><Link to="/personalizar" className="shrink-0 hover:scale-105 transition-transform relative"><div className="avatar-ring"><div className="avatar-inner"><Avatar equipado={heroi.avatar_equipado} size="md" /></div></div><div className="level-badge level-badge-sm absolute -bottom-2 -right-2 shadow-lg"><div className="flex flex-col items-center justify-center px-1"><small>LVL</small><span className="text-sm sm:text-base leading-none">{heroi.nivel}</span></div></div></Link><div className="flex-1 min-w-0 space-y-1"><p className="text-[9px] sm:text-[10px] text-primary/80 uppercase tracking-[0.3em] flex items-center gap-1.5"><Shield className="w-3 h-3" /> HERÓI</p><h2 className="font-display text-lg sm:text-2xl tracking-widest text-foreground glow-text-purple truncate leading-tight">{heroi.nome}</h2>{heroi.titulo && <div className="stat-chip title"><Sparkles className="w-3 h-3" /> {heroi.titulo}</div>}<div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1"><span className="stat-chip gold"><Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <AnimatedCounter value={heroi.ouro} /></span><span className="stat-chip streak"><Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {heroi.streak_atual}d</span><Link to="/conquistas" className="stat-chip trophy hover:brightness-125 transition"><Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {totalConquistas}</Link></div></div></div>
        <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4"><Bar label="XP" pct={xpPct} value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} fillClass="xp-bar-fill" icon={<Zap className="w-3.5 h-3.5" />} /><Bar label="VIDA" pct={hpPct} value={`${heroi.vida_atual}/${heroi.vida_max}`} fillClass="life-bar-fill" icon={<Heart className="w-3.5 h-3.5" />} /></div>
      </motion.div>
      {inimigo && <motion.div animate={shakeEnemy ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.4 }} className="rpg-panel danger-glow scanlines border-destructive/40 p-4 sm:p-5 space-y-3 overflow-hidden"><div className="flex items-center justify-between"><div className="flex items-center gap-3 min-w-0 flex-1">{(inimigo.avatar_config as any)?.tipo === "foto" && (inimigo.avatar_config as any)?.foto_url ? <img src={(inimigo.avatar_config as any).foto_url} alt={`Imagem do inimigo ${inimigo.nome}`} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-destructive/40 shadow-[0_0_14px_rgba(255,0,0,0.35)] shrink-0" /> : <div className="w-16 h-16 sm:w-20 sm:h-20 grid place-items-center rounded-lg border border-destructive/30 bg-destructive/5 text-4xl sm:text-5xl drop-shadow-[0_0_10px_rgba(255,0,0,0.6)] shrink-0">{(inimigo.avatar_config as any)?.emoji ?? "😈"}</div>}<div className="min-w-0 flex-1"><p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><Skull className="w-3 h-3" /> BOSS</p><h3 className="font-display text-sm sm:text-xl tracking-widest sm:tracking-widest text-foreground break-words leading-tight">{inimigo.nome}</h3></div></div><div className="flex items-center gap-1"><button onClick={() => setEditInimigoOpen(true)} className="p-1.5 rounded-md border border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Editar inimigo"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => nav("/inimigo")} className="text-xs text-muted-foreground hover:text-primary px-2">detalhes →</button></div></div><Bar label="HP" pct={enemyPct} value={`${inimigo.hp_atual}/${inimigo.hp_max}`} fillClass="hp-bar-fill" icon={<Swords className="w-3 h-3" />} /></motion.div>}
      <button type="button" onClick={() => setCartaOpen(true)} className="w-full text-left rpg-panel p-3.5 sm:p-4 flex items-center gap-3 border-destructive/40 hover:border-destructive hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] transition group"><div className="w-10 h-10 rounded-md grid place-items-center bg-destructive/15 border border-destructive/40 text-destructive group-hover:scale-110 transition"><Swords className="w-5 h-5" /></div><div className="flex-1 min-w-0"><p className="text-[10px] uppercase tracking-[0.3em] text-destructive">LEMBRETE DIÁRIO</p><h3 className="font-display text-sm sm:text-base tracking-widest">Carta de Enfrentamento</h3><p className="text-[11px] text-muted-foreground">A Carta fica na Home. Use este atalho sempre que quiser abrir o lembrete diário.</p></div><ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-destructive" /></button>
      <CartaEnfrentamentoDialog open={cartaOpen} onClose={() => setCartaOpen(false)} heroi={heroi} inimigo={inimigo} habitos={habitos} onboarding={ob} onChanged={() => qc.invalidateQueries({ queryKey: ["heroi", uid] })} />
      <div className="space-y-4">
        <div className="flex items-center justify-between"><div><h3 className="font-display tracking-[0.3em] text-sm text-primary glow-text-purple">⚔ AÇÕES DE BATALHA</h3><p className="text-[10px] text-muted-foreground mt-1">Cada ação é uma decisão contra o inimigo.</p></div><button onClick={() => setShowForm(v => !v)} className="text-[11px] flex items-center gap-1 btn-pixel px-3 py-1.5 rounded-md"><Plus className="w-3 h-3" /> Nova ação</button></div>
        <div className="rpg-panel p-2 flex items-center gap-2"><button onClick={() => setDataSelecionada(shiftISO(dataSelecionada, -1))} className="p-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary"><ChevronLeft className="w-4 h-4" /></button><div className="flex-1 text-center"><p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-1"><Calendar className="w-3 h-3" /> {isHoje ? "Hoje" : "Registro retroativo"}</p><p className="font-display text-sm tracking-widest capitalize">{formatBRDate(dataSelecionada)}</p></div><button onClick={() => setDataSelecionada(shiftISO(dataSelecionada, 1))} disabled={isHoje} className="p-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>{!isHoje && <button onClick={() => setDataSelecionada(todayISO())} className="text-[10px] px-2 py-1 rounded-md border border-primary/40 text-primary uppercase tracking-widest">Hoje</button>}</div>
        {!isHoje && <p className="text-[10px] text-center text-muted-foreground italic -mt-2">Marcando ações de um dia anterior — recompensas e dano são aplicados normalmente.</p>}
        {showForm && <div className="rpg-panel scanlines border-primary/30 p-4 sm:p-5 space-y-4 shadow-[0_0_30px_hsl(var(--primary)/.08)]">
          <div className="flex items-center gap-3 pb-3 border-b border-border/60"><div className="w-10 h-10 rounded-xl grid place-items-center bg-primary/10 border border-primary/30 text-primary"><Swords className="w-5 h-5" /></div><div><p className="text-[9px] uppercase tracking-[0.3em] text-primary">FORJAR AÇÃO</p><h4 className="font-display tracking-widest text-base">Nova ação de batalha</h4></div></div>
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-3"><label className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Nome da ação</label><input className="mt-2 w-full bg-background/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60" placeholder="Nomeie sua ação" value={novoHabito.nome} onChange={e => setNovoHabito({ ...novoHabito, nome: e.target.value })} autoFocus /></div>
          <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setNovoHabito({ ...novoHabito, tipo: "positivo" })} className={`rounded-xl border p-3 text-left transition-all ${novoHabito.tipo === "positivo" ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/.1)]" : "border-border/70 bg-secondary/20"}`}><Swords className="w-4 h-4 text-primary mb-2" /><p className="text-xs font-semibold">Ataque</p><p className="text-[9px] text-muted-foreground mt-1">Você fere o inimigo</p></button><button type="button" onClick={() => setNovoHabito({ ...novoHabito, tipo: "negativo" })} className={`rounded-xl border p-3 text-left transition-all ${novoHabito.tipo === "negativo" ? "border-destructive bg-destructive/10 shadow-[0_0_20px_hsl(var(--destructive)/.1)]" : "border-border/70 bg-secondary/20"}`}><Heart className="w-4 h-4 text-destructive mb-2" /><p className="text-xs font-semibold">Armadilha</p><p className="text-[9px] text-muted-foreground mt-1">O inimigo ganha força</p></button></div>
          <div className="rounded-xl border border-border/70 bg-secondary/25 p-3"><div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-primary" /><div><p className="text-[9px] uppercase tracking-[0.25em] text-primary">Formato</p><p className="text-[10px] text-muted-foreground">Defina como a ação será contabilizada</p></div></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setNovoHabito({ ...novoHabito, tipoTarefa: "unica", quantidadeMeta: 1 })} className={`rounded-lg border p-2.5 text-left ${novoHabito.tipoTarefa === "unica" ? "border-primary bg-primary/10" : "border-border/70 bg-background/30"}`}><p className="text-xs font-semibold">⚔ Única</p><p className="text-[9px] text-muted-foreground mt-1">Uma conclusão</p></button><button type="button" onClick={() => setNovoHabito({ ...novoHabito, tipoTarefa: "quantidade" })} className={`rounded-lg border p-2.5 text-left ${novoHabito.tipoTarefa === "quantidade" ? "border-primary bg-primary/10" : "border-border/70 bg-background/30"}`}><p className="text-xs font-semibold">🔢 Quantidade</p><p className="text-[9px] text-muted-foreground mt-1">Meta diária</p></button></div></div>
          {novoHabito.tipoTarefa === "quantidade" && <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.25em] text-primary">Meta diária</p><p className="text-[10px] text-muted-foreground mt-1">Execuções necessárias</p></div><div className="flex items-center gap-2"><input type="number" min={1} max={99} className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-center font-display" value={novoHabito.quantidadeMeta} onChange={e => setNovoHabito({ ...novoHabito, quantidadeMeta: Math.max(1, Number(e.target.value) || 1) })} /><span className="text-xs text-muted-foreground">×</span></div></div>}
          <div className="rounded-xl border border-border/70 bg-secondary/20 p-3"><div className="flex items-center justify-between mb-2"><div><p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Recompensa calculada</p><p className="text-[10px] text-muted-foreground">A IA ajusta os pesos ao seu objetivo.</p></div><Sparkles className="w-4 h-4 text-primary" /></div><div className="grid grid-cols-3 gap-2"><RewardStat icon={<Swords className="w-3.5 h-3.5" />} label="DANO" value="IA" color="text-destructive" /><RewardStat icon={<Zap className="w-3.5 h-3.5" />} label="XP" value="IA" color="text-primary" /><RewardStat icon={<Coins className="w-3.5 h-3.5" />} label="OURO" value="IA" color="text-yellow-300" /></div></div>
          <button onClick={criarHabito} disabled={creating || !novoHabito.nome.trim()} className="w-full btn-pixel py-3 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2">{creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Forjando recompensa...</> : <><Swords className="w-4 h-4" /> Forjar ação</>}</button>
        </div>}
        {(habitos ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhuma ação ainda. Crie a primeira.</p>}
        {positivos.length > 0 && <div className="space-y-2"><p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1"><Swords className="w-3 h-3" /> Ataques ao inimigo</p>{positivos.map(h => { const meta = (h as any).tipo_tarefa === "quantidade" ? Math.max(1, Number((h as any).quantidade_meta ?? 1)) : 1; const qtd = quantidadeLogs?.get(h.id)?.quantidadeAtual ?? (logs?.has(h.id) ? 1 : 0); return <HabitoRow key={h.id} h={h} marcado={meta === 1 ? (logs?.has(h.id) ?? false) : qtd >= meta} quantidadeAtual={qtd} quantidadeMeta={meta} onToggle={() => onToggle(h.id)} onDelete={() => excluirHabito(h.id)} onEdit={() => setEditHabito(h)} />; })}</div>}
        {negativos.length > 0 && <div className="space-y-2"><p className="text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><Skull className="w-3 h-3" /> Armadilhas do inimigo</p>{negativos.map(h => { const meta = (h as any).tipo_tarefa === "quantidade" ? Math.max(1, Number((h as any).quantidade_meta ?? 1)) : 1; const qtd = quantidadeLogs?.get(h.id)?.quantidadeAtual ?? (logs?.has(h.id) ? 1 : 0); return <HabitoRow key={h.id} h={h} marcado={meta === 1 ? (logs?.has(h.id) ?? false) : qtd >= meta} quantidadeAtual={qtd} quantidadeMeta={meta} onToggle={() => onToggle(h.id)} onDelete={() => excluirHabito(h.id)} onEdit={() => setEditHabito(h)} negativo />; })}</div>}
      </div>
      <button onClick={abrirBau} disabled={bauAberto} className="w-full rpg-panel p-4 flex items-center justify-between hover:border-gold transition-colors disabled:opacity-50"><div className="flex items-center gap-3"><Gift className="w-6 h-6 text-gold" /><div className="text-left"><p className="font-display tracking-widest text-sm text-gold">BAÚ DO DIA</p><p className="text-xs text-muted-foreground">{bauAberto ? "Já aberto hoje" : "Toque para abrir"}</p></div></div><span className="text-xs text-gold font-display">1-10 🪙</span></button>
    </div>
    <ChestOverlay open={chestOpen} gold={chestGold} onOpen={executarAberturaBau} onClose={() => setChestOpen(false)} />
    <EditHabitoDialog habito={editHabito} inimigo={inimigo ?? null} onboarding={ob} onClose={() => setEditHabito(null)} onSaved={async () => { if (uid) { await recalcularHpMaxInimigo(uid); await qc.invalidateQueries({ queryKey: ["inimigo", uid] }); } qc.invalidateQueries({ queryKey: ["habitos", uid] }); }} />
    <EditInimigoDialog inimigo={inimigo ?? null} open={editInimigoOpen} onClose={() => setEditInimigoOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["inimigo", uid] })} />
  </Shell>;
}

function RewardStat({ icon, label, value, color }: any) { return <div className="rounded-lg border border-border/60 bg-background/40 p-2 text-center"><div className={`flex justify-center ${color}`}>{icon}</div><p className={`font-display text-base mt-1 ${color}`}>{value}</p><p className="text-[8px] tracking-[0.2em] text-muted-foreground">{label}</p></div>; }
function Bar({ label, pct, value, fillClass, icon }: { label: string; pct: number; value: string; fillClass: string; icon: React.ReactNode }) { return <div><div className="flex items-center justify-between mb-1.5"><span className="bar-label">{icon}{label}</span><span className="bar-value">{value}</span></div><div className="bar-track"><div className="bar-fill-wrap"><motion.div className={`relative h-full ${fillClass}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}><div className="bar-shine" /><div className="bar-sheen" /></motion.div></div></div></div>; }
function HabitoRow({ h, marcado, quantidadeAtual = 0, quantidadeMeta = 1, onToggle, onDelete, onEdit, negativo }: any) {
  const porQuantidade = (h as any).tipo_tarefa === "quantidade" && quantidadeMeta > 1;
  const concluida = porQuantidade ? quantidadeAtual >= quantidadeMeta : marcado;
  const cor = negativo ? "text-destructive" : "text-primary";
  const borda = negativo ? "border-destructive/30" : "border-primary/30";
  const fundo = negativo ? "bg-destructive/5" : "bg-primary/5";
  const icone = negativo ? <Heart className="w-4 h-4 fill-current" /> : <Swords className="w-4 h-4" />;
  return <motion.div whileTap={{ scale: 0.985 }} className={`relative overflow-hidden rounded-xl border ${concluida ? "border-primary/25 opacity-65" : borda} ${fundo} p-3.5 sm:p-4 transition-all hover:shadow-[0_0_22px_hsl(var(--primary)/.08)]`}>
    <div className="flex items-start gap-3">
      <button onClick={onToggle} disabled={porQuantidade && concluida} className={`mt-0.5 w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${concluida ? negativo ? "bg-destructive border-destructive text-white shadow-[0_0_16px_hsl(0_90%_55%/.45)]" : "bg-primary border-primary text-white shadow-[0_0_16px_hsl(var(--primary)/.45)]" : negativo ? "border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive/15 hover:border-destructive" : "border-primary/50 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary"}`}>
        {porQuantidade ? <span className="font-display text-[11px] font-bold">{concluida ? "✓" : "+1"}</span> : concluida && <span className="text-sm font-bold">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-0">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <div className={`shrink-0 ${cor}`}>{icone}</div>
            <div className="min-w-0"><p className={`font-display text-sm sm:text-[15px] tracking-wide truncate ${concluida ? "line-through" : ""}`}>{h.nome}</p><p className={`text-[9px] uppercase tracking-[0.2em] mt-0.5 ${cor}`}>{negativo ? "Armadilha detectada" : porQuantidade ? "Missão de repetição" : "Golpe contra o inimigo"}</p></div>
          </div>
          <div className="flex items-center gap-0 shrink-0">
            {onEdit && <button onClick={onEdit} className="text-muted-foreground hover:text-primary p-1.5 shrink-0" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>}
            <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1.5 shrink-0" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-purple-300"><Zap className="w-3 h-3" /> {negativo ? `−${h.peso_xp}` : `+${h.peso_xp}`} XP</span>
          {!negativo && <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-gold"><Coins className="w-3 h-3" /> +{h.peso_ouro ?? 0} Ouro</span>}
          {negativo ? <span className="inline-flex items-center gap-1 rounded-md border border-destructive/35 bg-destructive/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-destructive"><Heart className="w-3 h-3 fill-current" /> −{Math.max(1, Math.round(h.peso_dano_cura / 3))} Vida</span> : <span className="inline-flex items-center gap-1 rounded-md border border-destructive/35 bg-destructive/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-destructive"><Heart className="w-3 h-3 fill-current" /> −{h.peso_dano_cura} HP Boss</span>}
        </div>
        {porQuantidade && <div className="mt-3 rounded-lg border border-primary/25 bg-background/30 p-2.5"><div className="flex items-center justify-between mb-1.5"><span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground"><Target className="w-3 h-3" /> Progresso diário</span><span className={`font-display text-xs ${concluida ? "text-primary" : "text-foreground"}`}>{quantidadeAtual} / {quantidadeMeta}</span></div><div className="h-1.5 rounded-full bg-background/80 overflow-hidden"><motion.div className={`h-full ${concluida ? "bg-primary" : "bg-primary/70"}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (quantidadeAtual / quantidadeMeta) * 100)}%` }} transition={{ duration: 0.3 }} /></div></div>}
      </div>
    </div>
  </motion.div>;
}function BattleOverlay({ battle, onClose, inimigo }: { battle: Battle | null; onClose: () => void; inimigo: any }) { return <AnimatePresence>{battle && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-md p-4"><motion.div initial={{ scale: 0.82, y: 28 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} className={`relative w-full max-w-sm rpg-panel scanlines p-5 sm:p-6 space-y-4 ${battle.positivo ? "neon-glow" : "danger-glow border-destructive/50"}`}>
  <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-lg border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
  <div className="text-center pr-7"><p className={`text-[9px] uppercase tracking-[0.45em] ${battle.positivo ? "text-primary" : "text-destructive"}`}>{battle.positivo ? "⚔ RECOMPENSA DE BATALHA" : "💀 PENALIDADE DE BATALHA"}</p><h3 className="font-display text-lg tracking-widest mt-1">{battle.habito}</h3></div>
  <div className="rounded-2xl border border-border/60 bg-background/35 p-3"><div className="grid grid-cols-3 gap-2">{battle.positivo ? <><RewardStat icon={<Zap className="w-4 h-4" />} label="XP" value={`+${battle.xp}`} color="text-primary" /><RewardStat icon={<Coins className="w-4 h-4" />} label="OURO" value={`+${battle.ouro}`} color="text-yellow-300" /><RewardStat icon={<Heart className="w-4 h-4 fill-current" />} label="HP BOSS" value={`−${battle.dano}`} color="text-destructive" /></> : <><RewardStat icon={<Zap className="w-4 h-4" />} label="XP" value={`−${battle.xp}`} color="text-destructive" /><RewardStat icon={<Heart className="w-4 h-4 fill-current" />} label="VIDA" value={`${battle.vidaDelta}`} color="text-destructive" /><RewardStat icon={<Skull className="w-4 h-4" />} label="HP BOSS" value={`+${battle.dano}`} color="text-destructive" /></>}</div></div>
  {battle.quantidadeMeta && battle.quantidadeMeta > 1 && <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-muted-foreground"><Target className="w-3 h-3" /> Progresso da missão</span><span className="font-display text-primary">{battle.quantidadeAtual} / {battle.quantidadeMeta}</span></div><div className="mt-2 h-1.5 rounded-full bg-background/70 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, ((battle.quantidadeAtual ?? 0) / battle.quantidadeMeta) * 100)}%` }} /></div><p className="text-[9px] text-muted-foreground mt-2">{(battle.quantidadeAtual ?? 0) >= battle.quantidadeMeta ? "✓ Missão concluída — meta diária atingida" : `Mais ${battle.quantidadeMeta - (battle.quantidadeAtual ?? 0)} execução(ões) para concluir`}</p></div>}
  <div className={`rounded-xl border p-3.5 text-sm italic text-center min-h-[58px] flex items-center justify-center ${battle.positivo ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>{battle.msg}</div>
  <button onClick={onClose} className="w-full btn-pixel py-3 rounded-lg text-xs tracking-widest">CONTINUAR</button>
</motion.div></motion.div>}</AnimatePresence>; }
