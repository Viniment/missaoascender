import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shiftISO, todayISO } from "@/lib/utils";
import type { Habito } from "@/lib/api";
import { Target, TrendingDown } from "lucide-react";

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
  if (score >= 0.5) status = { label: "Indo em direção ao seu sonho", color: "text-emerald-300", glow: "drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]" };
  else if (score >= 0.15) status = { label: "Se aproximando do que quer ser", color: "text-primary", glow: "drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" };
  else if (score > -0.15) status = { label: "Parado — nem avança, nem recua", color: "text-yellow-300", glow: "drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" };
  else if (score > -0.5) status = { label: "Se afastando do seu sonho", color: "text-orange-300", glow: "drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" };
  else status = { label: "Traindo você mesmo", color: "text-destructive", glow: "drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]" };

  const sem = positivos.length === 0 && negativos.length === 0;

  return (
    <div className="rounded-lg border border-primary/20 bg-background/40 backdrop-blur-sm px-3 py-2.5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Rumo do sonho · 7d
        </span>
        <span className="text-[10px] sm:text-xs font-display tabular-nums text-foreground/90">
          {sem ? "—" : `${pct}%`}
        </span>
      </div>

      {/* Termômetro horizontal */}
      <div className="relative h-4 w-full">
        {/* trilho */}
        <div className="absolute inset-y-[5px] inset-x-0 rounded-full bg-secondary/60 border border-primary/10 overflow-hidden">
          {/* gradiente de fundo (vermelho esquerda → verde direita) */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "linear-gradient(90deg, rgb(239,68,68) 0%, rgb(251,146,60) 30%, hsl(var(--primary)) 55%, rgb(52,211,153) 100%)" }}
          />
          {/* marca central 50% */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
          {/* preenchimento a partir do centro */}
          <div
            className={`absolute inset-y-0 transition-all duration-700 ease-out ${status.glow}`}
            style={{
              width: `${Math.max(2, Math.abs(pct - 50))}%`,
              left: score >= 0 ? "50%" : `${pct}%`,
              background: score >= 0
                ? "linear-gradient(90deg, hsl(var(--primary)), rgb(52,211,153))"
                : "linear-gradient(90deg, rgb(239,68,68), rgb(251,146,60))",
              boxShadow: score >= 0
                ? "0 0 12px rgba(52,211,153,0.55)"
                : "0 0 12px rgba(239,68,68,0.55)",
            }}
          />
        </div>
        {/* bulbo direito (destino: sonho) */}
        <div
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background transition-colors duration-700"
          style={{
            background: score >= 0.15
              ? "radial-gradient(circle at 30% 30%, rgb(110,231,183), rgb(16,185,129))"
              : score <= -0.15
                ? "radial-gradient(circle at 30% 30%, rgb(252,165,165), rgb(220,38,38))"
                : "radial-gradient(circle at 30% 30%, rgb(253,224,71), rgb(202,138,4))",
            boxShadow: score >= 0
              ? "0 0 10px rgba(52,211,153,0.6)"
              : "0 0 10px rgba(239,68,68,0.6)",
          }}
        />
        {/* marcador deslizante */}
        <div
          className="absolute -top-1 h-6 w-[3px] rounded-sm bg-foreground shadow-md transition-all duration-700 ease-out -translate-x-1/2"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Legendas das pontas */}
      <div className="mt-1.5 flex items-center justify-between text-[9px] sm:text-[10px]">
        <span className="flex items-center gap-1 text-destructive/90">
          <TrendingDown className="w-2.5 h-2.5" /> traindo você
        </span>
        <span className="flex items-center gap-1 text-emerald-300/90">
          rumo ao sonho <Target className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Status */}
      <div className={`mt-1.5 text-center text-[11px] sm:text-sm font-display tracking-wider leading-tight ${status.color}`}>
        {sem ? "sem hábitos ativos" : status.label}
      </div>
    </div>
  );
}