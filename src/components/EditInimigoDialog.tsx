import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Plus, Trash2, Skull } from "lucide-react";
import { toast } from "sonner";
import { updateInimigo, type Inimigo } from "@/lib/api";

export default function EditInimigoDialog({
  inimigo, open, onClose, onSaved,
}: {
  inimigo: Inimigo | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [gatilho, setGatilho] = useState("");
  const [mentiras, setMentiras] = useState<string[]>([]);
  const [novaMentira, setNovaMentira] = useState("");
  const [hpMax, setHpMax] = useState(100);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!inimigo) return;
    setNome(inimigo.nome);
    setGatilho(inimigo.gatilho ?? "");
    setMentiras(inimigo.mentiras ?? []);
    setHpMax(inimigo.hp_max);
  }, [inimigo, open]);

  const addMentira = () => {
    const t = novaMentira.trim();
    if (!t) return;
    setMentiras(m => [...m, t]);
    setNovaMentira("");
  };

  const salvar = async () => {
    if (!inimigo || !nome.trim()) return;
    setSaving(true);
    try {
      const newHpMax = Math.max(30, Math.min(500, hpMax));
      const hp_atual = Math.min(inimigo.hp_atual, newHpMax);
      await updateInimigo(inimigo.id, {
        nome: nome.trim().slice(0, 40),
        gatilho: gatilho.trim() || null as any,
        mentiras: mentiras.map(m => m.trim()).filter(Boolean),
        hp_max: newHpMax,
        hp_atual,
      });
      toast.success("Inimigo atualizado.");
      onSaved(); onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && inimigo && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-md rpg-panel danger-glow border-destructive/40 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-destructive flex items-center gap-1"><Skull className="w-3 h-3" /> Editar Inimigo</p>
              <h3 className="font-display text-lg tracking-widest mt-1">Reconfigurar o boss</h3>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome</label>
              <input
                maxLength={40}
                className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                value={nome} onChange={e => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Gatilho</label>
              <input
                className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                placeholder="Ex: solidão, tédio, cansaço..."
                value={gatilho} onChange={e => setGatilho(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Mentiras que ele te conta</label>
              <div className="mt-1 space-y-1.5">
                {mentiras.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/60 border border-border rounded-md px-2 py-1.5">
                    <input
                      className="flex-1 bg-transparent text-xs outline-none"
                      value={m}
                      onChange={e => setMentiras(list => list.map((x, idx) => idx === i ? e.target.value : x))}
                    />
                    <button onClick={() => setMentiras(list => list.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-xs"
                    placeholder="Nova mentira..."
                    value={novaMentira}
                    onChange={e => setNovaMentira(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addMentira())}
                  />
                  <button onClick={addMentira} className="px-3 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>HP Máximo</span>
                <span className="font-display text-sm text-destructive">{hpMax}</span>
              </div>
              <input
                type="range" min={30} max={500} step={10} value={hpMax}
                onChange={e => setHpMax(Number(e.target.value))}
                className="w-full accent-destructive mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                HP alto = mais dias de consistência para derrotar.
              </p>
            </div>

            <button
              onClick={salvar} disabled={saving || !nome.trim()}
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