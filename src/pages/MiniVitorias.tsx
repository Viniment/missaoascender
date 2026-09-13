import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchMiniVitorias } from "@/lib/api";
import { concluirMiniVitoria } from "@/lib/miniVitorias";
import { toast } from "sonner";
import { Plus, Sparkles, Coins, Heart, Zap, ChevronRight, Repeat2 } from "lucide-react";

type TipoMiniVitoria = "unica" | "quantidade";
type MiniVitoriaView = {
  id: string;
  titulo: string;
  recompensa_ouro: number;
  recompensa_xp: number;
  recompensa_vida: number;
  concluida: boolean;
  concluida_em: string | null;
  tipo?: TipoMiniVitoria;
  quantidade_meta?: number;
  quantidade_atual?: number;
};

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export default function MiniVitoriasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: mvs } = useQuery({ queryKey: ["mvs", uid], queryFn: () => fetchMiniVitorias(uid!), enabled: !!uid });
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoMiniVitoria>("unica");
  const [quantidade, setQuantidade] = useState("3");
  const [show, setShow] = useState(false);

  const criar = async () => {
    if (!uid || !titulo.trim()) return;
    const meta = tipo === "quantidade" ? Math.max(2, Number.parseInt(quantidade, 10) || 0) : 1;
    if (tipo === "quantidade" && !meta) return toast.error("Informe uma quantidade válida.");

    const recompensaOuro = randomInt(5, 10);
    const recompensaXp = randomInt(5, 10);
    const recompensaVida = randomInt(1, 2);
    const { error } = await supabase.from("mini_vitorias").insert({
      user_id: uid,
      titulo: titulo.trim(),
      tipo,
      quantidade_meta: meta,
      quantidade_atual: 0,
      recompensa_ouro: recompensaOuro,
      recompensa_xp: recompensaXp,
      recompensa_vida: recompensaVida,
    });
    if (error) return toast.error(error.message);
    setTitulo("");
    setQuantidade("3");
    setTipo("unica");
    setShow(false);
    await qc.invalidateQueries({ queryKey: ["mvs", uid] });
    toast.success("Mini vitória criada.");
  };

  const concluir = async (id: string) => {
    if (!heroi || !mvs) return;
    const mv = mvs.find(m => m.id === id) as MiniVitoriaView | undefined;
    if (!mv || mv.concluida) return;
    try {
      const recompensa = await concluirMiniVitoria(heroi, mv);
      if (!recompensa.completed) {
        toast.success(`Progresso: ${recompensa.progress}/${recompensa.target}`);
      } else {
        toast.success(`+${recompensa.xp} XP · +${recompensa.ouro} Ouro · +${recompensa.vida} Vida`);
      }
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
          <button
            onClick={() => setShow(v => !v)}
            className="shrink-0 group relative overflow-hidden rounded-lg border border-gold/60 bg-gold/10 px-3 py-2 text-gold shadow-[0_0_18px_hsl(var(--gold)/.14)] transition-all hover:bg-gold/20 hover:border-gold hover:shadow-[0_0_24px_hsl(var(--gold)/.24)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-1.5 text-[10px] font-display uppercase tracking-[.16em]">
              <Plus className="w-3.5 h-3.5" />
              Nova Mini Vitória
            </span>
          </button>
        </div>

        {show && (
          <div className="rpg-panel p-4 space-y-3 border-gold/30 shadow-[0_0_24px_hsl(var(--gold)/.06)]">
            <input
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              placeholder={tipo === "quantidade" ? "Ex: Escovar os dentes" : "Ex: Chegar aos 108 kg"}
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void criar(); }}
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("unica")}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${tipo === "unica" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30"}`}
              >
                <p className="text-[10px] uppercase tracking-[.2em] font-display">⚔ Única</p>
                <p className="mt-1 text-[10px]">Uma conquista.</p>
              </button>
              <button
                type="button"
                onClick={() => setTipo("quantidade")}
                className={`rounded-lg border px-3 py-2.5 text-left transition ${tipo === "quantidade" ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30"}`}
              >
                <p className="text-[10px] uppercase tracking-[.2em] font-display">↻ Quantidade</p>
                <p className="mt-1 text-[10px]">Várias vezes até completar.</p>
              </button>
            </div>

            {tipo === "quantidade" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <label className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">Quantidade necessária</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    step={1}
                    className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                    value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                  />
                  <span className="shrink-0 text-xs font-display text-primary">vezes</span>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">Ex.: 3 → o jogador poderá registrar 0/3 → 1/3 → 2/3 → 3/3.</p>
              </div>
            )}

            <p className="text-[10px] leading-relaxed text-muted-foreground">
              A recompensa continua usando exatamente a lógica atual de Mini-Vitórias: <span className="text-foreground">5–10 XP</span>, <span className="text-gold">5–10 Ouro</span> e <span className="text-destructive">1–2 Vida</span>.
            </p>
            <button onClick={() => void criar()} disabled={!titulo.trim() || (tipo === "quantidade" && Number(quantidade) < 2)} className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-display tracking-wider disabled:opacity-50">Criar Mini Vitória</button>
          </div>
        )}

        {(mvs ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Ainda sem vitórias.</p>}

        {(mvs ?? []).map(raw => {
          const mv = raw as MiniVitoriaView;
          const meta = Math.max(1, mv.quantidade_meta ?? 1);
          const atual = Math.min(meta, Math.max(0, mv.quantidade_atual ?? 0));
          const quantidadeTask = (mv.tipo ?? "unica") === "quantidade";
          return (
            <div key={mv.id} className={`rpg-panel p-4 flex items-center gap-3 ${mv.concluida ? "opacity-50" : ""}`}>
              {quantidadeTask ? <Repeat2 className={`w-5 h-5 shrink-0 ${mv.concluida ? "text-muted-foreground" : "text-primary"}`} /> : <Sparkles className={`w-5 h-5 shrink-0 ${mv.concluida ? "text-muted-foreground" : "text-gold"}`} />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${mv.concluida ? "line-through" : ""}`}>{mv.titulo}</p>
                {quantidadeTask && (
                  <p className="mt-1 font-display text-sm tracking-wider text-primary">{atual} / {meta}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-purple-300 shadow-[0_0_10px_rgba(168,85,247,.12)]">
                    <Zap className="w-3 h-3" /> +{mv.recompensa_xp} XP
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-gold shadow-[0_0_10px_hsl(var(--gold)/.12)]">
                    <Coins className="w-3 h-3" /> +{mv.recompensa_ouro} Ouro
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-display font-bold tracking-wide text-destructive shadow-[0_0_10px_hsl(var(--destructive)/.10)]">
                    <Heart className="w-3 h-3 fill-current" /> +{mv.recompensa_vida} Vida
                  </span>
                </div>
              </div>
              {!mv.concluida && (
                <button onClick={() => void concluir(mv.id)} className="shrink-0 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-display tracking-wide flex items-center gap-1">
                  {quantidadeTask ? "Registrar" : "Concluir"} <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
