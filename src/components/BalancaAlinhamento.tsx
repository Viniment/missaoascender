import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shiftISO, todayISO } from "@/lib/utils";
import type { Habito } from "@/lib/api";
import { Scale } from "lucide-react";

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
          <Scale className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Balança · 7d</span>
        </div>
        <span className={`text-[10px] sm:text-xs font-display tracking-wider ${status.color}`}>
          {sem ? "sem hábitos" : status.label}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-3">
        {/* Balança SVG */}
        <svg viewBox="0 0 120 60" className={`w-24 h-12 shrink-0 ${status.glow}`}>
          {/* base */}
          <line x1="60" y1="52" x2="60" y2="18" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          <circle cx="60" cy="15" r="2.5" fill="hsl(var(--primary))" />
          <rect x="52" y="52" width="16" height="3" rx="1" fill="hsl(var(--primary))" opacity="0.7" />
          {/* braço */}
          <g style={{ transformOrigin: "60px 15px", transform: `rotate(${angle}deg)`, transition: "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <line x1="15" y1="15" x2="105" y2="15" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
            {/* prato favor (esquerda) */}
            <line x1="20" y1="15" x2="20" y2="26" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.6" />
            <path d="M 8 26 Q 20 34 32 26 Z" fill="rgba(52,211,153,0.25)" stroke="rgb(52,211,153)" strokeWidth="1.2" />
            {/* prato contra (direita) */}
            <line x1="100" y1="15" x2="100" y2="26" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.6" />
            <path d="M 88 26 Q 100 34 112 26 Z" fill="rgba(239,68,68,0.25)" stroke="rgb(239,68,68)" strokeWidth="1.2" />
          </g>
        </svg>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden relative">
            <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${Math.abs(pct - 50)}%`,
                marginLeft: score >= 0 ? "50%" : `${pct}%`,
                background: score >= 0
                  ? "linear-gradient(90deg, hsl(var(--primary)), rgb(52,211,153))"
                  : "linear-gradient(90deg, rgb(239,68,68), rgb(251,146,60))",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground tabular-nums">
            <span className="text-emerald-300/80">a favor {favor}</span>
            <span className="text-destructive/80">contra {contra}</span>
          </div>
        </div>
      </div>
    </div>
  );
}