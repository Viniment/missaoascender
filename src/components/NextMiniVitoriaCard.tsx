import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, ChevronRight, Coins, Heart, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchHeroi, fetchMiniVitorias } from "@/lib/api";
import { concluirMiniVitoria } from "@/lib/miniVitorias";
import { fireReward } from "@/components/fx/RewardBurst";

export default function NextMiniVitoriaCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: heroi } = useQuery({
    queryKey: ["heroi", uid],
    queryFn: () => fetchHeroi(uid!),
    enabled: !!uid,
  });
  const { data: mvs } = useQuery({
    queryKey: ["mvs", uid],
    queryFn: () => fetchMiniVitorias(uid!),
    enabled: !!uid,
  });

  const proxima = (mvs ?? []).find((mv) => !mv.concluida);

  if (!proxima) return null;

  const conquistar = async () => {
    if (!heroi) return;
    try {
      const recompensa = await concluirMiniVitoria(heroi, proxima);
      await qc.invalidateQueries();
      fireReward(`+${recompensa.xp} XP`, "#a855f7");
      setTimeout(() => fireReward(`+${recompensa.ouro} ouro`, "#facc15"), 150);
      setTimeout(() => fireReward(`+${recompensa.vida} vida`, "#ef4444"), 300);
      toast.success("Mini-vitória conquistada!", {
        description: `+${recompensa.xp} XP · +${recompensa.ouro} Ouro · +${recompensa.vida} Vida`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a mini-vitória.");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rpg-panel scanlines overflow-hidden border-primary/35 p-4 sm:p-5 shadow-[0_0_28px_hsl(var(--primary)/0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/35 bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.12)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.34em] text-primary/75">PRÓXIMA MINI-VITÓRIA</p>
          <h3 className="mt-1 font-display text-base sm:text-lg tracking-[0.12em] text-foreground break-words">
            {proxima.titulo}
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">Seu próximo marco. Quando conquistar, registre a vitória.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md border border-purple-400/30 bg-purple-500/10 px-2 py-1 text-[10px] font-display font-bold text-purple-300">
          <Zap className="h-3 w-3" /> +{proxima.recompensa_xp} XP
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-2 py-1 text-[10px] font-display font-bold text-gold">
          <Coins className="h-3 w-3" /> +{proxima.recompensa_ouro} Ouro
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-display font-bold text-destructive">
          <Heart className="h-3 w-3 fill-current" /> +{proxima.recompensa_vida} Vida
        </span>
      </div>

      <button
        type="button"
        onClick={() => void conquistar()}
        disabled={!heroi}
        className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-primary/55 bg-primary/15 px-4 py-3 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.12)] transition-all hover:border-primary hover:bg-primary/20 hover:shadow-[0_0_30px_hsl(var(--primary)/0.22)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <Check className="relative h-4 w-4" />
        <span className="relative font-display text-[11px] font-black uppercase tracking-[0.22em]">Conquistei o marco</span>
        <ChevronRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </motion.section>
  );
}
