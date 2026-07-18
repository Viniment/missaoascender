import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchHeroi, fetchInimigoAtivo, fetchHabitos, fetchLogsHoje, fetchOnboarding,
  toggleHabito, abrirBauDiario, fetchConquistas,
} from "@/lib/api";
import { todayISO } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Heart, Zap, Coins, Flame, Swords, Trash2, Skull, Shield, Sparkles, Loader2, X, Trophy } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Link } from "react-router-dom";
import { fireReward } from "@/components/fx/RewardBurst";
import AnimatedCounter from "@/components/fx/AnimatedCounter";
import LevelUpOverlay from "@/components/fx/LevelUpOverlay";
import VictoryScreen from "@/components/fx/VictoryScreen";
import AvisosBanner from "@/components/AvisosBanner";
import ChestOverlay from "@/components/fx/ChestOverlay";

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
  const { data: logs } = useQuery({ queryKey: ["logs", uid, todayISO()], queryFn: () => fetchLogsHoje(uid!), enabled: !!uid });
  const { data: conquistas } = useQuery({ queryKey: ["conq", uid], queryFn: () => fetchConquistas(uid!), enabled: !!uid });

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
      body: { heroi_nome: heroi.nome, inimigo_nome: inimigo.nome, hp_atual: inimigo.hp_atual, hp_max: inimigo.hp_max },
    }).then(r => { if (r.data?.msg) setMsg(r.data.msg); });
  }, [heroi?.id, inimigo?.id]);

  const onToggle = async (habitoId: string) => {
    if (!heroi || !habitos) return;
    const h = habitos.find(x => x.id === habitoId)!;
    const marcado = logs?.has(habitoId) ?? false;
    const positivo = h.tipo === "positivo";
    try {
      await toggleHabito({ heroi, inimigo: inimigo ?? null, habito: h, marcado });
      await qc.invalidateQueries();

      // Só abre popup ao MARCAR (não ao desmarcar)
      if (marcado) return;

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
          body: { heroi_nome: heroi.nome, inimigo_nome: inimigo?.nome, hp_atual: (inimigo?.hp_atual ?? 100) - h.peso_dano_cura, hp_max: inimigo?.hp_max ?? 100 },
        }).then(r => setBattle(b => b ? { ...b, msg: r.data?.msg ?? "Golpe certeiro. Continue.", loading: false } : null))
          .catch(() => setBattle(b => b ? { ...b, msg: "Golpe certeiro. Continue.", loading: false } : null));
      } else {
        supabase.functions.invoke("mensagem-inimigo", {
          body: { inimigo_nome: inimigo?.nome, habito: h.nome, mentiras: inimigo?.mentiras ?? [] },
        }).then(r => setBattle(b => b ? { ...b, msg: r.data?.msg ?? "Você recuou.", loading: false } : null))
          .catch(() => setBattle(b => b ? { ...b, msg: "Você recuou.", loading: false } : null));
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const abrirBau = async () => {
    if (!heroi) return;
    if (heroi.ultimo_bau_data === todayISO()) { toast.info("Baú de hoje já aberto."); return; }
    setChestGold(null);
    setChestOpen(true);
  };

  const executarAberturaBau = async () => {
    if (!heroi) return;
    const g = await abrirBauDiario(heroi.id, heroi);
    setChestGold(g);
    fireReward(`+${g} ouro`, "#facc15");
    await qc.invalidateQueries();
  };

  const criarHabito = async () => {
    if (!uid || !novoHabito.nome.trim()) return;
    setCreating(true);
    try {
      // IA mede o peso baseado no contexto
      let peso_dano_cura = 8, peso_xp = 12;
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
      } catch {}

      const { error } = await supabase.from("habitos").insert({
        user_id: uid,
        nome: novoHabito.nome.trim(),
        tipo: novoHabito.tipo,
        peso_dano_cura,
        peso_xp,
      });
      if (error) throw error;
      setNovoHabito({ nome: "", tipo: "positivo" });
      setShowForm(false);
      await qc.invalidateQueries({ queryKey: ["habitos", uid] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar hábito");
    } finally {
      setCreating(false);
    }
  };

  const excluirHabito = async (id: string) => {
    await supabase.from("habitos").update({ ativo: false }).eq("id", id);
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

      <div className="space-y-6">
        <AvisosBanner />
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="player-card scanlines p-5"
        >
          <div className="flex items-center gap-4">
            <Link to="/personalizar" className="shrink-0 hover:scale-105 transition-transform relative">
              <div className="avatar-ring">
                <div className="avatar-inner">
                  <Avatar equipado={heroi.avatar_equipado} size="lg" />
                </div>
              </div>
              <div className="level-badge absolute -bottom-2 -right-2 shadow-lg">
                <div className="flex flex-col items-center justify-center px-1">
                  <small>LVL</small>
                  <span className="text-base leading-none">{heroi.nivel}</span>
                </div>
              </div>
            </Link>

            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-[10px] text-primary/80 uppercase tracking-[0.3em] flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> HERÓI
              </p>
              <h2 className="font-display text-2xl tracking-widest text-foreground glow-text-purple truncate leading-tight">
                {heroi.nome}
              </h2>
              {heroi.titulo && (
                <div className="stat-chip title">
                  <Sparkles className="w-3 h-3" /> {heroi.titulo}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="stat-chip gold">
                  <Coins className="w-3.5 h-3.5" /> <AnimatedCounter value={heroi.ouro} />
                </span>
                <span className="stat-chip streak">
                  <Flame className="w-3.5 h-3.5" /> {heroi.streak_atual}d
                </span>
                <Link to="/conquistas" className="stat-chip trophy hover:brightness-125 transition">
                  <Trophy className="w-3.5 h-3.5" /> {conquistas?.length ?? 0}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Bar label="XP" pct={xpPct} value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} fillClass="xp-bar-fill" icon={<Zap className="w-3.5 h-3.5" />} />
            <Bar label="VIDA" pct={hpPct} value={`${heroi.vida_atual}/${heroi.vida_max}`} fillClass="life-bar-fill" icon={<Heart className="w-3.5 h-3.5" />} />
          </div>
        </motion.div>

        {/* Enemy card */}
        {inimigo && (
          <motion.div
            animate={shakeEnemy ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="rpg-panel danger-glow scanlines border-destructive/40 p-5 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">{(inimigo.avatar_config as any)?.emoji ?? "😈"}</div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><Skull className="w-3 h-3" /> BOSS</p>
                  <h3 className="font-display text-xl tracking-widest text-foreground">{inimigo.nome}</h3>
                </div>
              </div>
              <button onClick={() => nav("/inimigo")} className="text-xs text-muted-foreground hover:text-primary">detalhes →</button>
            </div>
            <Bar label="HP" pct={enemyPct} value={`${inimigo.hp_atual}/${inimigo.hp_max}`} fillClass="hp-bar-fill" icon={<Swords className="w-3 h-3" />} />
            {msg && (
              <div className="mt-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Mentor</p>
                <p className="text-sm italic text-foreground/90">"{msg}"</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Hábitos AGRUPADOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display tracking-[0.3em] text-sm text-primary glow-text-purple">⚔ AÇÕES DE BATALHA</h3>
            <button onClick={() => setShowForm(v => !v)} className="text-[11px] flex items-center gap-1 btn-pixel px-3 py-1.5 rounded-md">
              <Plus className="w-3 h-3" /> Novo
            </button>
          </div>

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
                <HabitoRow key={h.id} h={h} marcado={logs?.has(h.id) ?? false} onToggle={() => onToggle(h.id)} onDelete={() => excluirHabito(h.id)} />
              ))}
            </div>
          )}

          {/* Negativos */}
          {negativos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><Skull className="w-3 h-3" /> Armadilhas do inimigo</p>
              {negativos.map(h => (
                <HabitoRow key={h.id} h={h} marcado={logs?.has(h.id) ?? false} onToggle={() => onToggle(h.id)} onDelete={() => excluirHabito(h.id)} negativo />
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
    </Shell>
  );
}

function Bar({ label, pct, value, fillClass, icon }: { label: string; pct: number; value: string; fillClass: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">
        <span className="flex items-center gap-1">{icon}{label}</span>
        <span className="font-display">{value}</span>
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

function HabitoRow({ h, marcado, onToggle, onDelete, negativo }: any) {
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
            : <>+{h.peso_xp} XP · −{h.peso_dano_cura} HP inim.</>}
        </p>
      </div>
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