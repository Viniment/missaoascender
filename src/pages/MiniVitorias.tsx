import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchMiniVitorias, concluirMiniVitoria } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export default function MiniVitoriasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: mvs } = useQuery({ queryKey: ["mvs", uid], queryFn: () => fetchMiniVitorias(uid!), enabled: !!uid });
  const [titulo, setTitulo] = useState("");
  const [show, setShow] = useState(false);

  const criar = async () => {
    if (!uid || !titulo.trim()) return;
    const recompensaOuro = randomInt(5, 10);
    const recompensaXp = randomInt(5, 10);
    const recompensaVida = randomInt(1, 2);
    const { error } = await supabase.from("mini_vitorias").insert({
      user_id: uid,
      titulo: titulo.trim(),
      recompensa_ouro: recompensaOuro,
      recompensa_xp: recompensaXp,
      recompensa_vida: recompensaVida,
    });
    if (error) return toast.error(error.message);
    setTitulo("");
    setShow(false);
    await qc.invalidateQueries({ queryKey: ["mvs", uid] });
    toast.success(`Mini vitória criada: +${recompensaXp} XP · +${recompensaOuro} 🪙 · +${recompensaVida} HP`);
  };

  const concluir = async (id: string) => {
    if (!heroi || !mvs) return;
    const mv = mvs.find(m => m.id === id)!;
    if (mv.concluida) return;
    try {
      await concluirMiniVitoria(heroi.id, heroi, mv);
      toast.success(`+${mv.recompensa_xp} XP · +${mv.recompensa_ouro} 🪙 · +${mv.recompensa_vida} HP`);
      await qc.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a mini vitória.");
    }
  };

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl tracking-wider text-primary glow-text-purple">MINI VITÓRIAS</h1>
            <p className="text-xs text-muted-foreground">Pequenas metas que dão recompensas aleatórias.</p>
          </div>
          <button onClick={() => setShow(v => !v)} className="text-xs text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> nova</button>
        </div>

        {show && (
          <div className="rpg-panel p-4 space-y-3">
            <input
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              placeholder="Ex: Ler 20 páginas"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void criar(); }}
              autoFocus
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              A recompensa é sorteada automaticamente ao criar: <span className="text-foreground">5–10 XP</span>, <span className="text-foreground">5–10 Ouro</span> e <span className="text-foreground">1–2 Vida</span>.
            </p>
            <button onClick={() => void criar()} disabled={!titulo.trim()} className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-display tracking-wider disabled:opacity-50">Criar Mini Vitória</button>
          </div>
        )}

        {(mvs ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Ainda sem vitórias.</p>}

        {(mvs ?? []).map(mv => (
          <div key={mv.id} className={`rpg-panel p-4 flex items-center gap-3 ${mv.concluida ? "opacity-50" : ""}`}>
            <Sparkles className={`w-5 h-5 ${mv.concluida ? "text-muted-foreground" : "text-gold"}`} />
            <div className="flex-1">
              <p className={`text-sm ${mv.concluida ? "line-through" : ""}`}>{mv.titulo}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                +{mv.recompensa_xp} XP · +{mv.recompensa_ouro} 🪙 · +{mv.recompensa_vida} HP
              </p>
            </div>
            {!mv.concluida && (
              <button onClick={() => void concluir(mv.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-display tracking-wide">
                Concluir
              </button>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}
