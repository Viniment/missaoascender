import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchHeroi, fetchInimigoAtivo, fetchHabitos, fetchLogsHoje, fetchOnboarding,
  toggleHabito, abrirBauDiario, applyXp, checkConquistas,
} from "@/lib/api";
import { todayISO } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Heart, Zap, Coins, Flame, Swords, Trash2 } from "lucide-react";

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

  const [msg, setMsg] = useState<string>("");
  const [novoHabito, setNovoHabito] = useState({ nome: "", tipo: "positivo" as "positivo" | "negativo", peso: 5 });
  const [showForm, setShowForm] = useState(false);
  const [floats, setFloats] = useState<{ id: number; text: string; color: string }[]>([]);

  useEffect(() => { if (ob === null) nav("/onboarding"); }, [ob, nav]);
  useEffect(() => { if (ob && inimigo === null) nav("/criar-inimigo"); }, [ob, inimigo, nav]);

  // Reforço message on load
  useEffect(() => {
    if (!heroi || !inimigo) return;
    supabase.functions.invoke("mensagem-reforco", {
      body: { heroi_nome: heroi.nome, inimigo_nome: inimigo.nome, hp_atual: inimigo.hp_atual, hp_max: inimigo.hp_max },
    }).then(r => { if (r.data?.msg) setMsg(r.data.msg); });
  }, [heroi?.id, inimigo?.id]);

  const spawnFloat = (text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloats(f => [...f, { id, text, color }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1400);
  };

  const onToggle = async (habitoId: string) => {
    if (!heroi || !habitos) return;
    const h = habitos.find(x => x.id === habitoId)!;
    const marcado = logs?.has(habitoId) ?? false;
    const positivo = h.tipo === "positivo";
    try {
      await toggleHabito({ heroi, inimigo: inimigo ?? null, habito: h, marcado });
      const sign = marcado ? "-" : "+";
      spawnFloat(`${sign}${h.peso_xp} XP`, positivo ? "text-primary" : "text-destructive");
      if (positivo && !marcado) spawnFloat(`-${h.peso_dano_cura} HP inimigo`, "text-neon-cyan");
      if (!positivo && !marcado) {
        // fetch mockery message
        supabase.functions.invoke("mensagem-inimigo", {
          body: { inimigo_nome: inimigo?.nome, habito: h.nome, mentiras: inimigo?.mentiras ?? [] },
        }).then(r => { if (r.data?.msg) toast(r.data.msg, { icon: "😈" }); });
      }
      await qc.invalidateQueries();
    } catch (e: any) { toast.error(e.message); }
  };

  const abrirBau = async () => {
    if (!heroi) return;
    if (heroi.ultimo_bau_data === todayISO()) { toast.info("Baú de hoje já aberto."); return; }
    const g = await abrirBauDiario(heroi.id, heroi);
    spawnFloat(`+${g} 🪙`, "text-gold");
    toast.success(`Baú aberto: +${g} de ouro`);
    await qc.invalidateQueries();
  };

  const criarHabito = async () => {
    if (!uid || !novoHabito.nome.trim()) return;
    const { error } = await supabase.from("habitos").insert({
      user_id: uid,
      nome: novoHabito.nome.trim(),
      tipo: novoHabito.tipo,
      peso_dano_cura: novoHabito.peso,
      peso_xp: Math.max(3, novoHabito.peso * 2),
    });
    if (error) return toast.error(error.message);
    setNovoHabito({ nome: "", tipo: "positivo", peso: 5 });
    setShowForm(false);
    await qc.invalidateQueries({ queryKey: ["habitos", uid] });
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

  return (
    <Shell>
      {/* Floats */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <AnimatePresence>
          {floats.map(f => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -80 }}
              exit={{ opacity: 0 }}
              className={`font-display text-2xl absolute ${f.color}`}
            >{f.text}</motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        {/* Hero card */}
        <div className="rpg-panel neon-glow p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Nível {heroi.nivel}</p>
              <h2 className="font-display text-xl tracking-wider text-foreground">{heroi.nome}</h2>
            </div>
            <div className="text-right text-xs space-y-1">
              <div className="flex items-center justify-end gap-1 text-gold"><Coins className="w-3 h-3" /> {heroi.ouro}</div>
              <div className="flex items-center justify-end gap-1 text-destructive"><Flame className="w-3 h-3" /> {heroi.streak_atual}d</div>
            </div>
          </div>
          <Bar label="XP" pct={xpPct} value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} color="bg-primary" icon={<Zap className="w-3 h-3" />} />
          <Bar label="Vida" pct={hpPct} value={`${heroi.vida_atual}/${heroi.vida_max}`} color="bg-success" icon={<Heart className="w-3 h-3" />} />
        </div>

        {/* Enemy card */}
        {inimigo && (
          <div className="rpg-panel border-destructive/30 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{(inimigo.avatar_config as any)?.emoji ?? "😈"}</div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-destructive">Inimigo</p>
                  <h3 className="font-display text-lg tracking-wide">{inimigo.nome}</h3>
                </div>
              </div>
              <button onClick={() => nav("/inimigo")} className="text-xs text-muted-foreground hover:text-primary">detalhes →</button>
            </div>
            <Bar label="HP" pct={enemyPct} value={`${inimigo.hp_atual}/${inimigo.hp_max}`} color="bg-destructive" icon={<Swords className="w-3 h-3" />} />
            {msg && <p className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-3">"{msg}"</p>}
          </div>
        )}

        {/* Baú */}
        <button
          onClick={abrirBau}
          disabled={bauAberto}
          className="w-full rpg-panel p-4 flex items-center justify-between hover:border-gold transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-gold" />
            <div className="text-left">
              <p className="font-display tracking-wide text-sm">Baú do Dia</p>
              <p className="text-xs text-muted-foreground">{bauAberto ? "Já aberto hoje" : "Toque para abrir"}</p>
            </div>
          </div>
          <span className="text-xs text-gold font-display">1-10 🪙</span>
        </button>

        {/* Hábitos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display tracking-widest text-sm text-primary">HÁBITOS DE HOJE</h3>
            <button onClick={() => setShowForm(v => !v)} className="text-xs flex items-center gap-1 text-primary hover:underline">
              <Plus className="w-3 h-3" /> novo
            </button>
          </div>

          {showForm && (
            <div className="rpg-panel p-4 space-y-3">
              <input
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                placeholder="Ex: Treinar 30min"
                value={novoHabito.nome}
                onChange={e => setNovoHabito({ ...novoHabito, nome: e.target.value })}
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  value={novoHabito.tipo}
                  onChange={e => setNovoHabito({ ...novoHabito, tipo: e.target.value as any })}
                >
                  <option value="positivo">Positivo (fere o inimigo)</option>
                  <option value="negativo">Negativo (te fere)</option>
                </select>
                <input
                  type="number" min={1} max={30}
                  className="w-20 bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  value={novoHabito.peso}
                  onChange={e => setNovoHabito({ ...novoHabito, peso: parseInt(e.target.value) || 1 })}
                />
              </div>
              <button onClick={criarHabito} className="w-full bg-primary text-primary-foreground py-2 rounded-md font-display tracking-wide text-sm">
                Criar hábito
              </button>
            </div>
          )}

          {(habitos ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum hábito ainda. Crie o primeiro.</p>
          )}

          {(habitos ?? []).map(h => {
            const marcado = logs?.has(h.id) ?? false;
            const pos = h.tipo === "positivo";
            return (
              <div key={h.id} className={`rpg-panel p-3 flex items-center gap-3 ${marcado ? "opacity-60" : ""}`}>
                <button
                  onClick={() => onToggle(h.id)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    marcado ? (pos ? "bg-primary border-primary" : "bg-destructive border-destructive") : "border-border hover:border-primary"
                  }`}
                >
                  {marcado && <span className="text-xs text-primary-foreground">✓</span>}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${marcado ? "line-through" : ""}`}>{h.nome}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {pos ? `+${h.peso_xp} XP · -${h.peso_dano_cura} HP inim.` : `-${h.peso_xp} XP · -HP herói`}
                  </p>
                </div>
                <button onClick={() => excluirHabito(h.id)} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function Bar({ label, pct, value, color, icon }: { label: string; pct: number; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        <span className="flex items-center gap-1">{icon}{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div className={`h-full ${color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}