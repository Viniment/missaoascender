import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchMiniVitorias, concluirMiniVitoria } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";

export default function MiniVitoriasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: mvs } = useQuery({ queryKey: ["mvs", uid], queryFn: () => fetchMiniVitorias(uid!), enabled: !!uid });
  const [nova, setNova] = useState({ titulo: "", ouro: 3, xp: 15, vida: 5 });
  const [show, setShow] = useState(false);

  const criar = async () => {
    if (!uid || !nova.titulo.trim()) return;
    const { error } = await supabase.from("mini_vitorias").insert({
      user_id: uid, titulo: nova.titulo.trim(),
      recompensa_ouro: nova.ouro, recompensa_xp: nova.xp, recompensa_vida: nova.vida,
    });
    if (error) return toast.error(error.message);
    setNova({ titulo: "", ouro: 3, xp: 15, vida: 5 });
    setShow(false);
    await qc.invalidateQueries({ queryKey: ["mvs", uid] });
  };

  const concluir = async (id: string) => {
    if (!heroi || !mvs) return;
    const mv = mvs.find(m => m.id === id)!;
    if (mv.concluida) return;
    await concluirMiniVitoria(heroi.id, heroi, mv);
    toast.success(`+${mv.recompensa_xp} XP · +${mv.recompensa_ouro} 🪙`);
    await qc.invalidateQueries();
  };

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl tracking-wider text-primary glow-text-purple">MINI VITÓRIAS</h1>
            <p className="text-xs text-muted-foreground">Pequenas metas que dão recompensas grandes.</p>
          </div>
          <button onClick={() => setShow(v => !v)} className="text-xs text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> nova</button>
        </div>

        {show && (
          <div className="rpg-panel p-4 space-y-3">
            <input className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              placeholder="Ex: Ler 20 páginas"
              value={nova.titulo} onChange={e => setNova({ ...nova, titulo: e.target.value })}/>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-muted-foreground">Ouro
                <input type="number" className="mt-1 w-full bg-secondary border border-border rounded-md px-2 py-1.5 text-sm"
                  value={nova.ouro} onChange={e => setNova({ ...nova, ouro: +e.target.value })}/>
              </label>
              <label className="text-xs text-muted-foreground">XP
                <input type="number" className="mt-1 w-full bg-secondary border border-border rounded-md px-2 py-1.5 text-sm"
                  value={nova.xp} onChange={e => setNova({ ...nova, xp: +e.target.value })}/>
              </label>
              <label className="text-xs text-muted-foreground">Vida
                <input type="number" className="mt-1 w-full bg-secondary border border-border rounded-md px-2 py-1.5 text-sm"
                  value={nova.vida} onChange={e => setNova({ ...nova, vida: +e.target.value })}/>
              </label>
            </div>
            <button onClick={criar} className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-display tracking-wider">Criar</button>
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
              <button onClick={() => concluir(mv.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-display tracking-wide">
                Concluir
              </button>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}