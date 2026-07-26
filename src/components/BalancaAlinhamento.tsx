import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shiftISO, todayISO } from "@/lib/utils";
import type { Habito } from "@/lib/api";
import { Compass, Heart, Skull } from "lucide-react";

/**
 * Balança do Alinhamento: mede, nos últimos 7 dias, se o herói está indo
 * em direção ao sonho ou se afastando dele.
 *
 * Regras:
 *  - Cada dia × cada hábito positivo ativo = 1 slot.
 *    - marcado → +1 (a favor do sonho)
 *    - não marcado → -1 (falha = traição do sonho)
 *  - Cada dia × cada hábito negativo ativo = 1 slot.
 *    - marcado → -1 (recaída)
 *    - não marcado → +1 (resistiu)
 *
 *  score ∈ [-1, 1]. Ângulo da balança = score * 30°.
 */
export default function BalancaAlinhamento({ uid, habitos }: { uid: string; habitos: Habito[] }) {
  const hoje = todayISO();
  const desde = shiftISO(hoje, -6);

  const { data: logs } = useQuery({
    queryKey: ["balanca-logs", uid, desde, hoje],
    queryFn: async () => {
      const { data } = await supabase
        .from("habito_logs")
        .select("habito_id, data")
        .eq("user_id", uid)
        .gte("data", desde)
        .lte("data", hoje);
      return (data ?? []) as { habito_id: string; data: string }[];
    },
  });

  const positivos = habitos.filter(h => h.tipo === "positivo" && h.ativo);
  const negativos = habitos.filter(h => h.tipo === "negativo" && h.ativo);

  const dias: string[] = Array.from({ length: 7 }, (_, i) => shiftISO(hoje, -i));
  let favor = 0;
  let contra = 0;

  const logSet = new Set((logs ?? []).map(l => `${l.data}:${l.habito_id}`));

  for (const d of dias) {
    for (const h of positivos) {
      if (logSet.has(`${d}:${h.id}`)) favor++;
      else contra++;
    }
    for (const h of negativos) {
      if (logSet.has(`${d}:${h.id}`)) contra++;
      else favor++;
    }
  }

  const total = favor + contra;
  const score = total === 0 ? 0 : (favor - contra) / total;
  const pct = Math.round(((score + 1) / 2) * 100); // 0..100
  const angle = score * 28; // graus

  let status: { label: string; color: string; glow: string };
  if (score >= 0.5) status = { label: "Virando o herói", color: "text-emerald-300", glow: "drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]" };
  else if (score >= 0.15) status = { label: "No caminho", color: "text-primary", glow: "drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" };
  else if (score > -0.15) status = { label: "Em cima do muro", color: "text-yellow-300", glow: "drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" };
  else if (score > -0.5) status = { label: "Traindo o sonho", color: "text-orange-300", glow: "drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" };
  else status = { label: "Virando quem você odeia", color: "text-destructive", glow: "drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]" };

  const sem = positivos.length === 0 && negativos.length === 0;

  return (
    <div className="rounded-lg border border-primary/20 bg-background/40 backdrop-blur-sm px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Alinhamento · 7d</span>
        </div>
        <span className={`text-[10px] sm:text-xs font-display tracking-wider ${status.color}`}>
          {sem ? "sem hábitos" : status.label}
        </span>
      </div>

      <div className="mt-2 space-y-1.5">
        {/* Barra bipolar herói ↔ sombra */}
        <div className="relative h-3 rounded-full bg-secondary/50 overflow-hidden border border-primary/10">
          {/* marca central */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/40 z-10" />
          {/* preenchimento */}
          <div
            className={`absolute inset-y-0 transition-all duration-700 ease-out ${status.glow}`}
            style={{
              width: `${Math.max(2, Math.abs(pct - 50))}%`,
              left: score >= 0 ? "50%" : `${pct}%`,
              background: score >= 0
                ? "linear-gradient(90deg, hsl(var(--primary)), rgb(52,211,153))"
                : "linear-gradient(90deg, rgb(239,68,68), rgb(251,146,60))",
              boxShadow: score >= 0
                ? "0 0 10px rgba(52,211,153,0.5)"
                : "0 0 10px rgba(239,68,68,0.5)",
            }}
          />
          {/* indicador */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-foreground border-2 border-background shadow-lg transition-all duration-700 ease-out z-20"
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] sm:text-[10px] tabular-nums">
          <span className="flex items-center gap-1 text-emerald-300/90">
            <Heart className="w-2.5 h-2.5" /> herói · {favor}
          </span>
          <span className="text-muted-foreground">{sem ? "—" : `${pct}%`}</span>
          <span className="flex items-center gap-1 text-destructive/90">
            {contra} · sombra <Skull className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
}