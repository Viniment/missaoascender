import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchMiniVitorias } from "@/lib/api";
import { concluirMiniVitoria } from "@/lib/miniVitorias";
import { toast } from "sonner";
import { Plus, Sparkles, Coins, Heart, Zap, ChevronRight } from "lucide-react";

type MiniVitoriaView = {
  id: string;
  titulo: string;
  recompensa_ouro: number;
  recompensa_xp: number;
  recompensa_vida: number;
  concluida: boolean;
  concluida_em: string | null;
};

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
    const { error } = await supabase.from("mini_vitorias").insert({
      user_id: uid,
      titulo: titulo.trim(),
      recompensa_ouro: randomInt(5, 10),
      recompensa_xp: randomInt(5, 10),
      recompensa_vida: randomInt(1, 2),
    });
    if (error) return toast.error(error.message);
    setTitulo("");
    setShow(false);
    await qc.invalidateQueries({ queryKey: ["mvs", uid] });
    toast.success("Mini vitória criada.");
  };

  const concluir = async (id: string) => {
    if (!heroi || !mvs) return;
    const mv = mvs.find(m => m.id === id) as MiniVitoriaView | undefined;
    if (!mv || mv.concluida) return;

    const confirmar = window.confirm(`Confirmar a conclusão de:\n\n“${mv.titulo}”\n\nEssa ação registra a Mini Vitória como concluída e entrega a recompensa.\n\nDeseja continuar?`);
    if (!confirmar) return;

    try {
      const recompensa = await concluirMiniVitoria(heroi, mv);
      toast.success(`+${recompensa.xp} XP · +${recompensa.ouro} Ouro · +${recompensa.vida} Vida`);
      await qc.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a mini vitória.");
    }
  };

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl tracking-wider text-primary glow-text-purple">MINI VITÓRIAS</h1>
            <p className="text-xs text-muted-foreground">Pequenas metas que dão recompensas aleatórias.</p>
          </div>
          <button onClick={() => setShow(v => !v)} className="shrink-0 group relative overflow-hidden rounded-lg border border-gold/60 bg-gold/10 px-3 py-2 text-gold shadow-[0_0_18px_hsl(var(--gold)/.14)] transition-all hover:bg-gold/20 hover:border-gold hover:shadow-[0_0_24px_hsl(var(--gold)/.24)]">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-1.5 text-[10px] font-display uppercase tracking-[.16em]"><Plus className="w-3.5 h-3.5" />Nova Mini Vitória</span>
          </button>
        </div>

        {show && (
          <div className="rpg-panel p-4 space-y-3 border-gold/30 shadow-[0_0_24px_hsl(var(--gold)/.06)]">
            <input className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm" placeholder="Ex: Chegar aos 108 kg" value={titulo} onChange={e => setTitulo(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void criar(); }} autoFocus />
            <p className="text-[10px] leading-relaxed text-muted-foreground">Uma Mini Vitória é um único marco. A recompensa continua usando a lógica atual: <span className="text-foreground">5–10 XP</span>, <span className="text-gold">5–10 Ouro</span> e <span className="text-destructive">1–2 Vida</span>.</p>
            <button onClick={() => void criar()} disabled={!titulo.trim()} className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-display tracking-wider disabled:opacity-50">Criar Mini Vitória</button>
          </div>
        )}

        {(mvs ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Ainda sem vitórias.</p>}

        {(mvs ?? []).map(raw => {
          const mv = raw as MiniVitoriaView;
          return (
            <div key={mv.id} className={`rpg-panel p-4 flex items-center gap-3 ${mv.concluida ? "opacity-50" : ""}`}>
              <Sparkles className={`w-5 h-5 shrink-0 ${mv.concluida ? "text-muted-foreground" : "text-gold"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${mv.concluida ? "line-through" : ""}`}>{mv.titulo}</p>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-purple-300"><Zap className="w-3 h-3" /> +{mv.recompensa_xp} XP</span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-gold"><Coins className="w-3 h-3" /> +{mv.recompensa_ouro} Ouro</span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-destructive"><Heart className="w-3 h-3 fill-current" /> +{mv.recompensa_vida} Vida</span>
                </div>
              </div>
              {!mv.concluida && <button onClick={() => void concluir(mv.id)} className="shrink-0 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-display tracking-wide flex items-center gap-1">Concluir <ChevronRight className="w-3 h-3" /></button>}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
