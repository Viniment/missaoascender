import { useEffect, useState } from "react";
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

export default function RewardBurstLayer() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  useEffect(() => {
    const fn = (b: Burst) => {
      setBursts((prev) => [...prev, b]);
      setTimeout(() => setBursts((prev) => prev.filter((x) => x.id !== b.id)), 1500);
    };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return (
    <div className="fx-essential fixed inset-0 pointer-events-none z-[60]">
      {bursts.map((b) => (
        <div
          key={b.id}
          className="reward-float text-xl md:text-2xl"
          style={{ left: `${b.x}%`, top: `${b.y}%`, color: b.color }}
        >
          {b.label}
        </div>
      ))}
    </div>
  );
}
