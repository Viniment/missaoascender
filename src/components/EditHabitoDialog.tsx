import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Coins, Zap, Swords, Heart, Target } from "lucide-react";
import { toast } from "sonner";
import { updateHabito, type Habito, type Inimigo } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/acoes-batalha.css";

export default function EditHabitoDialog({ habito, inimigo, onboarding, onClose, onSaved }: { habito: Habito | null; inimigo: Inimigo | null; onboarding: any; onClose: () => void; onSaved: () => void; }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"positivo" | "negativo">("positivo");
  const [tipoTarefa, setTipoTarefa] = useState<"unica" | "quantidade">("unica");
  const [quantidadeMeta, setQuantidadeMeta] = useState(1);
  const [pesoDano, setPesoDano] = useState(6);
  const [pesoXp, setPesoXp] = useState(10);
  const [pesoOuro, setPesoOuro] = useState(2);
  const [saving, setSaving] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    if (!habito) return;
    setNome(habito.nome); setTipo(habito.tipo);
    setTipoTarefa(((habito as any).tipo_tarefa ?? "unica") as any);
    setQuantidadeMeta(Math.max(1, Number((habito as any).quantidade_meta ?? 1)));
    setPesoDano(habito.peso_dano_cura); setPesoXp(habito.peso_xp); setPesoOuro(habito.peso_ouro ?? 2);
  }, [habito]);

  const recalcular = async () => {
    if (!nome.trim()) return;
    setRecalculando(true);
    try {
      const { data } = await supabase.functions.invoke("sugerir-pesos-habito", { body: { habito_nome: nome.trim(), tipo, inimigo: inimigo ? { nome: inimigo.nome, gatilho: inimigo.gatilho, mentiras: inimigo.mentiras } : null, onboarding: onboarding ?? null } });
      if (data?.peso_dano_cura) setPesoDano(data.peso_dano_cura);
      if (data?.peso_xp) setPesoXp(data.peso_xp);
      if (data?.peso_ouro) setPesoOuro(data.peso_ouro);
      toast.success("IA recalibrou os pesos.");
    } catch (e: any) { toast.error(e.message ?? "Erro ao recalcular"); }
    finally { setRecalculando(false); }
  };

  const salvar = async () => {
    if (!habito || !nome.trim()) return;
    setSaving(true);
    try {
      await updateHabito(habito.id, {
        nome: nome.trim(), tipo,
        peso_dano_cura: Math.max(2, Math.min(15, pesoDano)),
        peso_xp: Math.max(5, Math.min(25, pesoXp)),
        peso_ouro: Math.max(1, Math.min(6, pesoOuro)),
      });
      const { error } = await supabase.from("habitos").update({ tipo_tarefa: tipoTarefa, quantidade_meta: tipoTarefa === "quantidade" ? Math.max(1, Math.floor(quantidadeMeta)) : 1 }).eq("id", habito.id);
      if (error) throw error;
      toast.success("Ação atualizada."); onSaved(); onClose();
    } catch (e: any) { toast.error(e.message ?? "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  return <AnimatePresence>{habito && <motion.div className="fixed inset-0 z-[80] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} /><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="relative w-full max-w-md rpg-panel neon-glow p-5 space-y-4 max-h-[90vh] overflow-y-auto">
    <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
    <div className="pr-8"><p className="text-[10px] uppercase tracking-[0.4em] text-primary">⚔ Editar Ação</p><h3 className="font-display text-lg tracking-widest mt-1">Configurar batalha</h3></div>

    <div className="grid gap-3">
      <div className="rounded-xl border border-border/70 bg-secondary/35 p-3 space-y-2">
        <label className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Identidade da ação</label>
        <input className="w-full bg-background/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 transition-colors" value={nome} onChange={e => setNome(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setTipo("positivo")} className={`rounded-xl border p-3 text-left transition-all ${tipo === "positivo" ? "border-primary bg-primary/10 shadow-[0_0_22px_hsl(var(--primary)/.12)]" : "border-border/70 bg-secondary/25"}`}>
          <Swords className="w-4 h-4 text-primary mb-2" /><p className="text-xs font-semibold">Ação positiva</p><p className="text-[9px] text-muted-foreground mt-1">Dano ao inimigo + recompensas</p>
        </button>
        <button type="button" onClick={() => setTipo("negativo")} className={`rounded-xl border p-3 text-left transition-all ${tipo === "negativo" ? "border-destructive bg-destructive/10 shadow-[0_0_22px_hsl(var(--destructive)/.10)]" : "border-border/70 bg-secondary/25"}`}>
          <Heart className="w-4 h-4 text-destructive mb-2" /><p className="text-xs font-semibold">Armadilha</p><p className="text-[9px] text-muted-foreground mt-1">Fere você e fortalece o inimigo</p>
        </button>
      </div>

      <div className="rounded-xl border border-border/70 bg-secondary/35 p-3 space-y-2">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /><div><p className="text-[9px] uppercase tracking-[0.25em] text-primary">Formato</p><p className="text-[10px] text-muted-foreground">Como esta ação será executada</p></div></div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setTipoTarefa("unica")} className={`rounded-lg border p-2.5 text-left ${tipoTarefa === "unica" ? "border-primary bg-primary/10" : "border-border/70 bg-background/30"}`}><p className="text-xs font-semibold">⚔ Única</p><p className="text-[9px] text-muted-foreground mt-1">Uma execução</p></button>
          <button type="button" onClick={() => setTipoTarefa("quantidade")} className={`rounded-lg border p-2.5 text-left ${tipoTarefa === "quantidade" ? "border-primary bg-primary/10" : "border-border/70 bg-background/30"}`}><p className="text-xs font-semibold">🔢 Quantidade</p><p className="text-[9px] text-muted-foreground mt-1">Meta diária</p></button>
        </div>
      </div>

      {tipoTarefa === "quantidade" && <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.25em] text-primary">Meta diária</p><p className="text-[10px] text-muted-foreground mt-1">Execuções necessárias hoje</p></div><div className="flex items-center gap-2"><input type="number" min={1} max={99} className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-center font-display" value={quantidadeMeta} onChange={e => setQuantidadeMeta(Math.max(1, Number(e.target.value) || 1))} /><span className="text-xs text-muted-foreground">×</span></div></div>}

      <div className="rounded-xl border border-border/70 bg-secondary/25 p-3 space-y-3">
        <div className="flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Recompensas de batalha</p><p className="text-[10px] text-muted-foreground">Pesos aplicados a cada execução</p></div><button onClick={recalcular} disabled={recalculando || !nome.trim()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 text-[10px] text-primary disabled:opacity-50">{recalculando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} IA</button></div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="DANO" value={pesoDano} icon={<Swords className="w-3 h-3" />} color="text-destructive" />
          <Stat label="XP" value={pesoXp} icon={<Zap className="w-3 h-3" />} color="text-primary" />
          {tipo === "positivo" && <Stat label="OURO" value={pesoOuro} icon={<Coins className="w-3 h-3" />} color="text-yellow-300" />}
        </div>
        <Slider label="Dano ao inimigo" value={pesoDano} setValue={setPesoDano} min={2} max={15} color="text-destructive" />
        <Slider label="XP" value={pesoXp} setValue={setPesoXp} min={5} max={25} color="text-primary" />
        {tipo === "positivo" && <Slider label="Ouro" value={pesoOuro} setValue={setPesoOuro} min={1} max={6} color="text-yellow-300" />}
      </div>
    </div>

    <button onClick={salvar} disabled={saving} className="w-full btn-pixel py-3 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar alterações"}</button>
  </motion.div></motion.div>}</AnimatePresence>;
}

function Stat({ label, value, icon, color }: any) {
  return <div className="rounded-lg border border-border/60 bg-background/40 p-2 text-center"><div className={`flex justify-center ${color}`}>{icon}</div><p className={`font-display text-lg mt-1 ${color}`}>{value}</p><p className="text-[8px] tracking-[0.2em] text-muted-foreground">{label}</p></div>;
}

function Slider({ label, value, setValue, min, max, color }: any) {
  return <div><div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground"><span>{label}</span><span className={`font-display text-sm ${color}`}>{value}</span></div><input type="range" min={min} max={max} value={value} onChange={e => setValue(Number(e.target.value))} className="w-full accent-primary mt-1" /></div>;
}
