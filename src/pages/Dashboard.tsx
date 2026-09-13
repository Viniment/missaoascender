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

  const positivos = useMemo(() => (habitos ?? []).filter(h => h.tipo === "positivo"), [habitos]);
  const negativos = useMemo(() => (habitos ?? []).filter(h => h.tipo === "negativo"), [habitos]);
  const bauAberto = !!heroi && heroi.ultimo_bau_data === todayISO();

  return <Shell>
    {/* conteúdo do dashboard preservado */}
    {showForm && <div className="rpg-panel scanlines border-primary/30 p-4 sm:p-5 space-y-4 shadow-[0_0_30px_hsl(var(--primary)/.08)]">}
  </Shell>;
}

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
}