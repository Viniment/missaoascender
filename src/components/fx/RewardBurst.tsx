import { useEffect, useMemo, useState } from "react";
import { hasRecentSaveFailure } from "@/lib/reliability";

type Burst = { id: number; label: string; color: string; x: number; y: number };

let counter = 0;
const listeners = new Set<(b: Burst) => void>();

export function fireReward(label: string, color = "#facc15") {
  // Recompensas visuais só podem aparecer depois de uma operação confirmada.
  // Se a última gravação falhou, não mostramos XP/ouro/vida para não criar a
  // impressão de que o progresso foi salvo quando não foi.
  if (hasRecentSaveFailure()) return;

  const b: Burst = {
    id: ++counter,
    label,
    color,
    x: 50 + (Math.random() * 20 - 10),
    y: 50 + (Math.random() * 10 - 5),
  };
  listeners.forEach((fn) => fn(b));
}

function rewardMeta(label: string) {
  if (/xp/i.test(label)) return { icon: "✦", title: "EXPERIÊNCIA", tone: "text-primary" };
  if (/ouro|moeda|gold|🪙/i.test(label)) return { icon: "◈", title: "OURO", tone: "text-yellow-300" };
  if (/hp|vida/i.test(label)) return { icon: "♥", title: "VIDA", tone: "text-destructive" };
  return { icon: "◆", title: "RECOMPENSA", tone: "text-foreground" };
}

export default function RewardBurstLayer() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    const fn = (b: Burst) => {
      setBursts((prev) => [...prev, b]);
      setTimeout(() => setBursts((prev) => prev.filter((x) => x.id !== b.id)), 1700);
    };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const visible = useMemo(() => bursts.slice(-4), [bursts]);

  return (
    <div className="fx-essential fixed inset-0 pointer-events-none z-[60] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        {visible.map((b, index) => {
          const meta = rewardMeta(b.label);
          return (
            <div
              key={b.id}
              className="reward-float flex items-center gap-3 rounded-xl border border-border/70 bg-background/90 px-4 py-2 shadow-2xl backdrop-blur-md"
              style={{ color: b.color, animationDelay: `${index * 45}ms` }}
            >
              <span className={`text-lg font-black ${meta.tone}`}>{meta.icon}</span>
              <span className="text-left leading-none">
                <span className={`block text-[8px] font-bold tracking-[0.28em] ${meta.tone}`}>{meta.title}</span>
                <span className="block mt-1 font-display text-lg font-bold tracking-wider">{b.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
