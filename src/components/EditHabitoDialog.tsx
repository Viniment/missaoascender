import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Coins, Zap, Swords } from "lucide-react";
import { toast } from "sonner";
import { updateHabito, type Habito, type Inimigo } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

export default function EditHabitoDialog({
  habito, inimigo, onboarding, onClose, onSaved,
}: {
  habito: Habito | null;
  inimigo: Inimigo | null;
  onboarding: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"positivo" | "negativo">("positivo");
  const [pesoDano, setPesoDano] = useState(6);
  const [pesoXp, setPesoXp] = useState(10);
  const [pesoOuro, setPesoOuro] = useState(2);
  const [saving, setSaving] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    if (!habito) return;
    setNome(habito.nome);
    setTipo(habito.tipo);
    setPesoDano(habito.peso_dano_cura);
    setPesoXp(habito.peso_xp);
    setPesoOuro(habito.peso_ouro ?? 2);
  }, [habito]);

  const recalcular = async () => {
    if (!nome.trim()) return;
    setRecalculando(true);
    try {
      const { data } = await supabase.functions.invoke("sugerir-pesos-habito", {
        body: {
          habito_nome: nome.trim(),
          tipo,
          inimigo: inimigo ? { nome: inimigo.nome, gatilho: inimigo.gatilho, mentiras: inimigo.mentiras } : null,
          onboarding: onboarding ?? null,
        },
      });
      if (data?.peso_dano_cura) setPesoDano(data.peso_dano_cura);
      if (data?.peso_xp) setPesoXp(data.peso_xp);
      if (data?.peso_ouro) setPesoOuro(data.peso_ouro);
      toast.success("IA recalibrou os pesos.");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao recalcular");
    } finally { setRecalculando(false); }
  };

  const salvar = async () => {
    if (!habito || !nome.trim()) return;
    setSaving(true);
    try {
      await updateHabito(habito.id, {
        nome: nome.trim(),
        tipo,
        peso_dano_cura: Math.max(2, Math.min(15, pesoDano)),
        peso_xp: Math.max(5, Math.min(25, pesoXp)),
        peso_ouro: Math.max(1, Math.min(6, pesoOuro)),
      });
      toast.success("Ação atualizada.");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {habito && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-md rpg-panel neon-glow p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-primary">⚔ Editar Ação</p>
              <h3 className="font-display text-lg tracking-widest mt-1">Configurar batalha</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome</label>
                <input
                  className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</label>
                <select
                  className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                  value={tipo}
                  onChange={e => setTipo(e.target.value as any)}
                >
                  <option value="positivo">⚔ Positivo — fere o inimigo</option>
                  <option value="negativo">💀 Negativo — te fere</option>
                </select>
              </div>

              <button
                onClick={recalcular}
                disabled={recalculando || !nome.trim()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 text-xs text-primary disabled:opacity-50"
              >
                {recalculando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Recalibrar com IA
              </button>

              <Slider label="Dano ao inimigo" icon={<Swords className="w-3 h-3" />} value={pesoDano} setValue={setPesoDano} min={2} max={15} color="text-destructive" />
              <Slider label="XP" icon={<Zap className="w-3 h-3" />} value={pesoXp} setValue={setPesoXp} min={5} max={25} color="text-primary" />
              {tipo === "positivo" && (
                <Slider label="Ouro" icon={<Coins className="w-3 h-3" />} value={pesoOuro} setValue={setPesoOuro} min={1} max={6} color="text-gold" />
              )}
              <p className="text-[10px] text-muted-foreground italic">
                Consistência {'>'} intensidade. Nenhuma ação sozinha derrota o inimigo — a repetição sim.
              </p>
            </div>

            <button
              onClick={salvar} disabled={saving}
              className="w-full btn-pixel py-2.5 rounded-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Slider({ label, icon, value, setValue, min, max, color }: any) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="flex items-center gap-1">{icon}{label}</span>
        <span className={`font-display text-sm ${color}`}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => setValue(Number(e.target.value))}
        className="w-full accent-primary mt-1"
      />
    </div>
  );
}