import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchHeroi, fetchInimigoAtivo, fetchHabitos, fetchLogsHoje, fetchOnboarding,
  toggleHabito, abrirBauDiario, fetchConquistas, fetchLogsData, recalcularHpMaxInimigo,
} from "@/lib/api";
import { todayISO, shiftISO, formatBRDate } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Heart, Zap, Coins, Flame, Swords, Trash2, Skull, Shield, Sparkles, Loader2, X, Trophy, Pencil, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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
import type { Habito } from "@/lib/api";
import { CARD_BACKGROUNDS } from "@/lib/itens";

type Battle = {
  positivo: boolean;
  habito: string;
  xp: number;
  dano: number;
  vidaDelta: number;
  msg: string;
  loading: boolean;
};

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: ob } = useQuery({ queryKey: ["ob", uid], queryFn: () => fetchOnboarding(uid!), enabled: !!uid });
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: habitos } = useQuery({ queryKey: ["habitos", uid], queryFn: () => fetchHabitos(uid!), enabled: !!uid });
  const { data: conquistas } = useQuery({ queryKey: ["conq", uid], queryFn: () => fetchConquistas(uid!), enabled: !!uid });

  const [dataSelecionada, setDataSelecionada] = useState<string>(todayISO());
  const isHoje = dataSelecionada === todayISO();
  const { data: logs } = useQuery({
    queryKey: ["logs", uid, dataSelecionada],
    queryFn: () => fetchLogsData(uid!, dataSelecionada),
    enabled: !!uid,
  });

  const [msg, setMsg] = useState<string>("");
  const [novoHabito, setNovoHabito] = useState({ nome: "", tipo: "positivo" as "positivo" | "negativo" });
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [victory, setVictory] = useState<string | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const [chestGold, setChestGold] = useState<number | null>(null);
  const [editHabito, setEditHabito] = useState<Habito | null>(null);
  const [editInimigoOpen, setEditInimigoOpen] = useState(false);
  const prevNivel = useRef<number | null>(null);
  const prevEnemyHp = useRef<number | null>(null);

  useEffect(() => {
    if (!heroi) return;
    if (prevNivel.current !== null && heroi.nivel > prevNivel.current) {
      setLevelUp(heroi.nivel);
    }
    prevNivel.current = heroi.nivel;
  }, [heroi?.nivel]);

  useEffect(() => {
    if (!inimigo) return;
    if (prevEnemyHp.current !== null && prevEnemyHp.current > 0 && inimigo.hp_atual <= 0) {
      setVictory(inimigo.nome);
    }
    prevEnemyHp.current = inimigo.hp_atual;
  }, [inimigo?.hp_atual]);

  useEffect(() => { if (ob === null) nav("/onboarding"); }, [ob, nav]);
  useEffect(() => { if (ob && inimigo === null) nav("/criar-inimigo"); }, [ob, inimigo, nav]);

  useEffect(() => {
    if (!heroi || !inimigo) return;
    supabase.functions.invoke("mensagem-reforco", {
      body: {
        heroi_nome: heroi.nome,
        inimigo_nome: inimigo.nome,
        sonho: (ob as any)?.sonho ?? null,
        streak: heroi.streak_atual,
        habito_nome: null,
        hp_atual: inimigo.hp_atual,
        hp_max: inimigo.hp_max,
      },
    }).then(r => { if (r.data?.msg) setMsg(r.data.msg); });
  }, [heroi?.id, inimigo?.id, (ob as any)?.sonho]);

  const onToggle = async (habitoId: string) => {
    if (!heroi || !habitos) return;
    const h = habitos.find(x => x.id === habitoId)!;
    const marcado = logs?.has(habitoId) ?? false;
    const positivo = h.tipo === "positivo";
    try {
      await toggleHabito({ heroi, inimigo: inimigo ?? null, habito: h, marcado, data: dataSelecionada });
      await qc.invalidateQueries();

      // Só abre popup ao MARCAR (não ao desmarcar)
      if (marcado) return;

      fireHabitFX(positivo ? "positive" : "negative");

      const vidaDelta = positivo ? 0 : -Math.max(2, Math.round(h.peso_dano_cura / 3));
      setBattle({
        positivo, habito: h.nome,
        xp: h.peso_xp, dano: h.peso_dano_cura,
        vidaDelta, msg: "", loading: true,
      });

      if (positivo) {
        setShakeEnemy(true);
        setTimeout(() => setShakeEnemy(false), 400);
        fireReward(`+${h.peso_xp} XP`, "#a855f7");
        setTimeout(() => fireReward(`-${h.peso_dano_cura} HP`, "#ef4444"), 180);
        supabase.functions.invoke("mensagem-reforco", {
          body: {
            heroi_nome: heroi.nome,
            inimigo_nome: inimigo?.nome,
            sonho: (ob as any)?.sonho ?? null,
            streak: heroi.streak_atual,
            habito_nome: h.nome,
            hp_atual: (inimigo?.hp_atual ?? 100) - h.peso_dano_cura,
            hp_max: inimigo?.hp_max ?? 100,
          },
        }).then(r => setBattle(b => b ? { ...b, msg: r.data?.msg ?? "Golpe certeiro. Continue.", loading: false } : null))
          .catch(() => setBattle(b => b ? { ...b, msg: "Golpe certeiro. Continue.", loading: false } : null));
      } else {
        supabase.functions.invoke("mensagem-inimigo", {
          body: {
            heroi_nome: heroi.nome,
            inimigo_nome: inimigo?.nome,
            sonho: (ob as any)?.sonho ?? null,
            streak: heroi.streak_atual,
            habito: h.nome,
            mentiras: inimigo?.mentiras ?? [],
          },
        }).then(r => setBattle(b => b ? { ...b, msg: r.data?.msg ?? "Você recuou.", loading: false } : null))
          .catch(() => setBattle(b => b ? { ...b, msg: "Você recuou.", loading: false } : null));
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const abrirBau = async () => {
    if (!heroi) return;
    const infinito = typeof window !== "undefined" && localStorage.getItem("dev_bau_infinito") === "1";
    if (!infinito && heroi.ultimo_bau_data === todayISO()) { toast.info("Baú de hoje já aberto."); return; }
    setChestGold(null);
    setChestOpen(true);
  };

  const executarAberturaBau = async () => {
    if (!heroi) return;
    const g = await abrirBauDiario(heroi.id, heroi);
    setChestGold(g);
    fireReward(`+${g} ouro`, "#facc15");
    await qc.invalidateQueries();
    const infinito = typeof window !== "undefined" && localStorage.getItem("dev_bau_infinito") === "1";
    if (infinito) {
      await supabase.from("users").update({ ultimo_bau_data: null }).eq("id", heroi.id);
      await qc.invalidateQueries();
    }
  };

  const criarHabito = async () => {
    if (!uid || !novoHabito.nome.trim()) return;
    setCreating(true);
    try {
      // IA mede o peso baseado no contexto
      let peso_dano_cura = 8, peso_xp = 12, peso_ouro = 2;
      try {
        const { data } = await supabase.functions.invoke("sugerir-pesos-habito", {
          body: {
            habito_nome: novoHabito.nome.trim(),
            tipo: novoHabito.tipo,
            inimigo: inimigo ? { nome: inimigo.nome, gatilho: inimigo.gatilho, mentiras: inimigo.mentiras } : null,
            onboarding: ob ?? null,
          },
        });
        if (data?.peso_dano_cura) peso_dano_cura = data.peso_dano_cura;
        if (data?.peso_xp) peso_xp = data.peso_xp;
        if (data?.peso_ouro) peso_ouro = data.peso_ouro;
      } catch {}

      const { error } = await supabase.from("habitos").insert({
        user_id: uid,
        nome: novoHabito.nome.trim(),
        tipo: novoHabito.tipo,
        peso_dano_cura,
        peso_xp,
        peso_ouro,
      });
      if (error) throw error;
      setNovoHabito({ nome: "", tipo: "positivo" });
      setShowForm(false);
      if (novoHabito.tipo === "positivo") {
        await recalcularHpMaxInimigo(uid);
        await qc.invalidateQueries({ queryKey: ["inimigo", uid] });
      }
      await qc.invalidateQueries({ queryKey: ["habitos", uid] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar hábito");
    } finally {
      setCreating(false);
    }
  };

  const excluirHabito = async (id: string) => {
    await supabase.from("habitos").update({ ativo: false }).eq("id", id);
    if (uid) {
      await recalcularHpMaxInimigo(uid);
      await qc.invalidateQueries({ queryKey: ["inimigo", uid] });
    }
    await qc.invalidateQueries({ queryKey: ["habitos", uid] });
  };

  if (!heroi) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  const xpPct = Math.min(100, (heroi.xp_atual / heroi.xp_proximo_nivel) * 100);
  const hpPct = (heroi.vida_atual / heroi.vida_max) * 100;
  const enemyPct = inimigo ? (inimigo.hp_atual / inimigo.hp_max) * 100 : 0;
  const bauAberto = heroi.ultimo_bau_data === todayISO();

  const positivos = (habitos ?? []).filter(h => h.tipo === "positivo");
  const negativos = (habitos ?? []).filter(h => h.tipo === "negativo");

  return (
    <Shell>
      {/* Combat popup */}
      <BattleOverlay battle={battle} onClose={() => setBattle(null)} inimigo={inimigo} />
      <LevelUpOverlay nivel={levelUp} onClose={() => setLevelUp(null)} />
      <VictoryScreen inimigoNome={victory} onClose={() => setVictory(null)} />
      <HabitFX />

      <div className="space-y-6">
        <AvisosBanner />
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="player-card scanlines p-3.5 sm:p-5"
        >
          {(() => {
            const cardBgId = (heroi.avatar_equipado as any)?.cardBg as string | undefined;
            const bg = cardBgId ? CARD_BACKGROUNDS[cardBgId] : null;
            return bg ? <div className={`card-bg-layer ${bg.className}`} /> : null;
          })()}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/personalizar" className="shrink-0 hover:scale-105 transition-transform relative">
              <div className="avatar-ring">
                <div className="avatar-inner">
                  <Avatar equipado={heroi.avatar_equipado} size="md" />
                </div>
              </div>
              <div className="level-badge level-badge-sm absolute -bottom-2 -right-2 shadow-lg">
                <div className="flex flex-col items-center justify-center px-1">
                  <small>LVL</small>
                  <span className="text-sm sm:text-base leading-none">{heroi.nivel}</span>
                </div>
              </div>
            </Link>

            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[9px] sm:text-[10px] text-primary/80 uppercase tracking-[0.3em] flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> HERÓI
              </p>
              <h2 className="font-display text-lg sm:text-2xl tracking-widest text-foreground glow-text-purple truncate leading-tight">
                {heroi.nome}
              </h2>
              {heroi.titulo && (
                <div className="stat-chip title">
                  <Sparkles className="w-3 h-3" /> {heroi.titulo}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                <span className="stat-chip gold">
                  <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <AnimatedCounter value={heroi.ouro} />
                </span>
                <span className="stat-chip streak">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {heroi.streak_atual}d
                </span>
                <Link to="/conquistas" className="stat-chip trophy hover:brightness-125 transition">
                  <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {conquistas?.length ?? 0}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
            <Bar label="XP" pct={xpPct} value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} fillClass="xp-bar-fill" icon={<Zap className="w-3.5 h-3.5" />} />
            <Bar label="VIDA" pct={hpPct} value={`${heroi.vida_atual}/${heroi.vida_max}`} fillClass="life-bar-fill" icon={<Heart className="w-3.5 h-3.5" />} />
          </div>
        </motion.div>

        {/* Enemy card */}
        {inimigo && (
          <motion.div
            animate={shakeEnemy ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="rpg-panel danger-glow scanlines border-destructive/40 p-4 sm:p-5 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="text-3xl sm:text-4xl drop-shadow-[0_0_10px_rgba(255,0,0,0.6)] shrink-0">{(inimigo.avatar_config as any)?.emoji ?? "😈"}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><Skull className="w-3 h-3" /> BOSS</p>
                  <h3 className="font-display text-sm sm:text-xl tracking-widest sm:tracking-widest text-foreground break-words leading-tight">{inimigo.nome}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditInimigoOpen(true)}
                  className="p-1.5 rounded-md border border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Editar inimigo"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => nav("/inimigo")} className="text-xs text-muted-foreground hover:text-primary px-2">detalhes →</button>
              </div>
            </div>
            <Bar label="HP" pct={enemyPct} value={`${inimigo.hp_atual}/${inimigo.hp_max}`} fillClass="hp-bar-fill" icon={<Swords className="w-3 h-3" />} />
          </motion.div>
        )}

        {/* Fissura — acesso rápido */}
        <Link
          to="/fissura"
          className="rpg-panel p-3.5 sm:p-4 flex items-center gap-3 border-destructive/40 hover:border-destructive hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] transition group"
        >
          <div className="w-10 h-10 rounded-md grid place-items-center bg-destructive/15 border border-destructive/40 text-destructive group-hover:scale-110 transition">
            <Flame className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-destructive">Protocolo de emergência</p>
            <h3 className="font-display text-sm sm:text-base tracking-widest">Estou em Fissura</h3>
            <p className="text-[11px] text-muted-foreground">A IA monta um protocolo pra você atravessar a onda agora.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
        </Link>

        {/* Ferramentas cognitivas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/reestruturacao"
            className="rpg-panel p-3.5 flex items-center gap-3 hover:border-primary hover:shadow-[0_0_25px_rgba(139,92,246,0.2)] transition group"
          >
            <div className="w-10 h-10 rounded-md grid place-items-center bg-primary/15 border border-primary/40 text-primary group-hover:scale-110 transition">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">TCC</p>
              <h3 className="font-display text-sm tracking-widest">Reestruturar</h3>
              <p className="text-[11px] text-muted-foreground">Desmontar um pensamento.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
          </Link>
          <Link
            to="/urge-surfing"
            className="rpg-panel p-3.5 flex items-center gap-3 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] transition group"
          >
            <div className="w-10 h-10 rounded-md grid place-items-center bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 group-hover:scale-110 transition">
              <Waves className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Mindfulness</p>
              <h3 className="font-display text-sm tracking-widest">Surfar a Onda</h3>
              <p className="text-[11px] text-muted-foreground">Atravessar um desejo sem ceder.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-300" />
          </Link>
        </div>

        {/* Hábitos AGRUPADOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display tracking-[0.3em] text-sm text-primary glow-text-purple">⚔ AÇÕES DE BATALHA</h3>
            <button onClick={() => setShowForm(v => !v)} className="text-[11px] flex items-center gap-1 btn-pixel px-3 py-1.5 rounded-md">
              <Plus className="w-3 h-3" /> Novo
            </button>
          </div>

          {/* Seletor de dia — permite marcar hábitos retroativos */}
          <div className="rpg-panel p-2 flex items-center gap-2">
            <button
              onClick={() => setDataSelecionada(shiftISO(dataSelecionada, -1))}
              className="p-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="w-3 h-3" /> {isHoje ? "Hoje" : "Registro retroativo"}
              </p>
              <p className="font-display text-sm tracking-widest capitalize">
                {formatBRDate(dataSelecionada)}
              </p>
            </div>
            <button
              onClick={() => setDataSelecionada(shiftISO(dataSelecionada, 1))}
              disabled={isHoje}
              className="p-1.5 rounded-md border border-border hover:border-primary/60 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isHoje && (
              <button
                onClick={() => setDataSelecionada(todayISO())}
                className="text-[10px] px-2 py-1 rounded-md border border-primary/40 text-primary hover:bg-primary/10 uppercase tracking-widest"
              >
                Hoje
              </button>
            )}
          </div>
          {!isHoje && (
            <p className="text-[10px] text-center text-muted-foreground italic -mt-2">
              Marcando hábitos de um dia anterior — recompensas e dano são aplicados normalmente.
            </p>
          )}

          {showForm && (
            <div className="rpg-panel p-4 space-y-3">
              <input
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                placeholder="Ex: Treinar 30min, Meditar, Ler 10 páginas..."
                value={novoHabito.nome}
                onChange={e => setNovoHabito({ ...novoHabito, nome: e.target.value })}
                autoFocus
              />
              <select
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                value={novoHabito.tipo}
                onChange={e => setNovoHabito({ ...novoHabito, tipo: e.target.value as any })}
              >
                <option value="positivo">⚔ Positivo — fere o inimigo</option>
                <option value="negativo">💀 Negativo — te fere</option>
              </select>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> A IA calcula o peso baseado no seu inimigo e no seu sonho.
              </p>
              <button
                onClick={criarHabito} disabled={creating}
                className="w-full btn-pixel py-2 rounded-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Forjando...</> : "Criar hábito"}
              </button>
            </div>
          )}

          {(habitos ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum hábito ainda. Crie o primeiro.</p>
          )}

          {/* Positivos */}
          {positivos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1"><Swords className="w-3 h-3" /> Ataques ao inimigo</p>
              {positivos.map(h => (
                <HabitoRow key={h.id} h={h} marcado={logs?.has(h.id) ?? false} onToggle={() => onToggle(h.id)} onDelete={() => excluirHabito(h.id)} onEdit={() => setEditHabito(h)} />
              ))}
            </div>
          )}

          {/* Negativos */}
          {negativos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><Skull className="w-3 h-3" /> Armadilhas do inimigo</p>
              {negativos.map(h => (
                <HabitoRow key={h.id} h={h} marcado={logs?.has(h.id) ?? false} onToggle={() => onToggle(h.id)} onDelete={() => excluirHabito(h.id)} onEdit={() => setEditHabito(h)} negativo />
              ))}
            </div>
          )}
        </div>

        {/* Baú */}
        <button
          onClick={abrirBau}
          disabled={bauAberto}
          className="w-full rpg-panel p-4 flex items-center justify-between hover:border-gold transition-colors disabled:opacity-50 relative overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-gold" />
            <div className="text-left">
              <p className="font-display tracking-widest text-sm text-gold">BAÚ DO DIA</p>
              <p className="text-xs text-muted-foreground">{bauAberto ? "Já aberto hoje" : "Toque para abrir"}</p>
            </div>
          </div>
          <span className="text-xs text-gold font-display">1-10 🪙</span>
        </button>
      </div>
      <ChestOverlay
        open={chestOpen}
        gold={chestGold}
        onOpen={executarAberturaBau}
        onClose={() => setChestOpen(false)}
      />
      <EditHabitoDialog
        habito={editHabito}
        inimigo={inimigo ?? null}
        onboarding={ob}
        onClose={() => setEditHabito(null)}
        onSaved={async () => {
          if (uid) {
            await recalcularHpMaxInimigo(uid);
            await qc.invalidateQueries({ queryKey: ["inimigo", uid] });
          }
          qc.invalidateQueries({ queryKey: ["habitos", uid] });
        }}
      />
      <EditInimigoDialog
        inimigo={inimigo ?? null}
        open={editInimigoOpen}
        onClose={() => setEditInimigoOpen(false)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["inimigo", uid] })}
      />
    </Shell>
  );
}

function Bar({ label, pct, value, fillClass, icon }: { label: string; pct: number; value: string; fillClass: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="bar-label">{icon}{label}</span>
        <span className="bar-value">{value}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill-wrap">
          <motion.div
            className={`relative h-full ${fillClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bar-shine" />
            <div className="bar-sheen" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function HabitoRow({ h, marcado, onToggle, onDelete, onEdit, negativo }: any) {
  return (
    <div className={`rpg-panel p-3 flex items-center gap-3 transition-all ${marcado ? "opacity-60" : "hover:border-primary/50"}`}>
      <button
        onClick={onToggle}
        className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
          marcado
            ? negativo ? "bg-destructive border-destructive shadow-[0_0_10px_hsl(0_90%_55%/0.7)]" : "bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]"
            : "border-border hover:border-primary"
        }`}
      >
        {marcado && <span className="text-sm text-primary-foreground font-bold">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${marcado ? "line-through" : ""}`}>{h.nome}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">
          {negativo
            ? <>−{h.peso_xp} XP · +{h.peso_dano_cura} HP inim.</>
            : <>+{h.peso_xp} XP · −{h.peso_dano_cura} HP · +{h.peso_ouro ?? 0}<span className="text-gold">🪙</span></>}
        </p>
      </div>
      {onEdit && (
        <button onClick={onEdit} className="text-muted-foreground hover:text-primary p-1" title="Editar">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive p-1">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function BattleOverlay({ battle, onClose, inimigo }: { battle: Battle | null; onClose: () => void; inimigo: any }) {
  return (
    <AnimatePresence>
      {battle && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={`relative w-full max-w-sm rpg-panel scanlines p-6 space-y-4 ${battle.positivo ? "neon-glow" : "danger-glow border-destructive/50"}`}
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <p className={`text-[10px] uppercase tracking-[0.4em] ${battle.positivo ? "text-primary" : "text-destructive"}`}>
                {battle.positivo ? "⚔ GOLPE CERTEIRO" : "💀 O INIMIGO AVANÇA"}
              </p>
              <h3 className="font-display text-lg tracking-widest text-foreground">{battle.habito}</h3>
            </div>

            {/* Damage numbers */}
            <div className="flex items-center justify-center gap-6 py-3">
              {battle.positivo ? (
                <>
                  <div className="text-center animate-damage-pop">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Dano</p>
                    <p className="font-display text-3xl text-destructive glow-text-purple">−{battle.dano}</p>
                    <p className="text-[10px] text-muted-foreground">HP {inimigo?.nome ?? "inimigo"}</p>
                  </div>
                  <div className="text-center animate-damage-pop" style={{ animationDelay: "80ms" }}>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">XP</p>
                    <p className="font-display text-3xl text-primary glow-text-purple">+{battle.xp}</p>
                    <p className="text-[10px] text-muted-foreground">Herói</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center animate-damage-pop">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Vida</p>
                    <p className="font-display text-3xl text-destructive">{battle.vidaDelta}</p>
                    <p className="text-[10px] text-muted-foreground">Herói</p>
                  </div>
                  <div className="text-center animate-damage-pop" style={{ animationDelay: "80ms" }}>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground">XP</p>
                    <p className="font-display text-3xl text-destructive">−{battle.xp}</p>
                    <p className="text-[10px] text-muted-foreground">Perdido</p>
                  </div>
                </>
              )}
            </div>

            <div className={`rounded-md border p-3 text-sm italic text-center min-h-[56px] flex items-center justify-center ${battle.positivo ? "border-primary/40 bg-primary/5 text-foreground" : "border-destructive/40 bg-destructive/5 text-foreground/90"}`}>
              {battle.loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : `"${battle.msg}"`}
            </div>

            <button
              onClick={onClose}
              className="w-full btn-pixel py-2.5 rounded-md text-xs"
            >
              Tocar para continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}