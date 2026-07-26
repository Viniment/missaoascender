import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shiftISO, todayISO } from "@/lib/utils";
import type { Habito } from "@/lib/api";
import { Flame, Skull, Sparkles, Target } from "lucide-react";

/**
 * Termômetro do Sonho — últimos 7 dias.
 *
 * Regra (dor pela inação, prazer pelo progresso):
 *  - Dia SEM nenhum registro → conta como 100% negativo:
 *      contra += (positivos + negativos) do dia. É a punição da omissão:
 *      quem não aparece, trai.
 *  - Dia COM pelo menos 1 registro (positivo OU negativo) → só o que foi
 *    de fato marcado entra na conta:
 *      positivo marcado → +1 (favor)
 *      negativo marcado → -1 (contra)
 *      slots não marcados NÃO são punidos.
 *
 *  score ∈ [-1, 1].
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
  const posIds = new Set(positivos.map(h => h.id));
  const negIds = new Set(negativos.map(h => h.id));

  const dias: string[] = Array.from({ length: 7 }, (_, i) => shiftISO(hoje, -i));
  let favor = 0;
  let contra = 0;
  let diasOmissos = 0;
  let diasHeroicos = 0;

  // agrupa logs por dia
  const porDia = new Map<string, Set<string>>();
  for (const l of logs ?? []) {
    if (!porDia.has(l.data)) porDia.set(l.data, new Set());
    porDia.get(l.data)!.add(l.habito_id);
  }

  for (const d of dias) {
    const marcados = porDia.get(d);
    if (!marcados || marcados.size === 0) {
      // Dia sem registro = 100% negativo (dor da inação)
      contra += positivos.length + negativos.length;
      diasOmissos++;
      continue;
    }
    let fDia = 0;
    let cDia = 0;
    for (const id of marcados) {
      if (posIds.has(id)) fDia++;
      else if (negIds.has(id)) cDia++;
    }
    favor += fDia;
    contra += cDia;
    if (fDia > 0 && cDia === 0) diasHeroicos++;
  }

  const total = favor + contra;
  const score = total === 0 ? 0 : (favor - contra) / total;
  const pct = Math.round(((score + 1) / 2) * 100); // 0..100

  let status: { label: string; sub: string; color: string; glow: string };
  if (score >= 0.5)       status = { label: "Você está virando quem sonhou ser", sub: "prazer do progresso — não pare agora",          color: "text-emerald-300", glow: "drop-shadow-[0_0_10px_rgba(52,211,153,0.75)]" };
  else if (score >= 0.15) status = { label: "Cada registro te aproxima do sonho", sub: "sente o peso caindo pro seu lado",              color: "text-primary",     glow: "drop-shadow-[0_0_10px_hsl(var(--primary)/0.7)]" };
  else if (score > -0.15) status = { label: "Você está travado — nem avança, nem cai", sub: "silêncio também é uma escolha",              color: "text-yellow-300",  glow: "drop-shadow-[0_0_10px_rgba(250,204,21,0.65)]" };
  else if (score > -0.5)  status = { label: "Cada dia sem registro é uma traição pequena", sub: "isso dói — e é pra doer mesmo",              color: "text-orange-300",  glow: "drop-shadow-[0_0_10px_rgba(251,146,60,0.7)]" };
  else                    status = { label: "Você está virando quem jurou não ser",  sub: "a inação está te devorando — reaja hoje",   color: "text-destructive", glow: "drop-shadow-[0_0_14px_rgba(239,68,68,0.8)]" };

  const sem = positivos.length === 0 && negativos.length === 0;

  return (
    <div className="rounded-lg border border-primary/20 bg-background/40 backdrop-blur-sm px-3 py-2.5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Rumo do sonho · 7d
        </span>
        <span className="flex items-center gap-2 text-[10px] sm:text-xs font-display tabular-nums text-foreground/90">
          {!sem && diasHeroicos > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-300/90" title="dias heróicos (só positivos)">
              <Sparkles className="w-2.5 h-2.5" />{diasHeroicos}
            </span>
          )}
          {!sem && diasOmissos > 0 && (
            <span className="flex items-center gap-0.5 text-destructive/90" title="dias sem nenhum registro">
              <Skull className="w-2.5 h-2.5" />{diasOmissos}
            </span>
          )}
          <span>{sem ? "—" : `${pct}%`}</span>
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
          <Skull className="w-2.5 h-2.5" /> traindo você
        </span>
        <span className="flex items-center gap-1 text-yellow-300/80">
          <Flame className="w-2.5 h-2.5" /> reagir
        </span>
        <span className="flex items-center gap-1 text-emerald-300/90">
          rumo ao sonho <Target className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Status */}
      <div className={`mt-1.5 text-center font-display tracking-wider leading-tight ${status.color}`}>
        <div className="text-[11px] sm:text-sm">{sem ? "sem hábitos ativos" : status.label}</div>
        {!sem && (
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
            {status.sub}
          </div>
        )}
      </div>
    </div>
  );
}