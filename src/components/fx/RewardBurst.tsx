import { useEffect, useState } from "react";

type Burst = { id: number; label: string; color: string; x: number; y: number };

let counter = 0;
const listeners = new Set<(b: Burst) => void>();

export function fireReward(label: string, color = "#facc15") {
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
    <div className="fixed inset-0 pointer-events-none z-[60]">
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