import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "positive" | "negative";

let externalTrigger: ((mode: Mode) => void) | null = null;

export function fireHabitFX(mode: Mode) {
  externalTrigger?.(mode);
}

const POSITIVE_COLORS = [
  "#f4c430", "#ffe27a", "#22d3ee", "#34d399",
  "#a855f7", "#f472b6", "#fb923c", "#ffffff",
];

export default function HabitFX() {
  const [active, setActive] = useState<Mode | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    externalTrigger = (mode) => {
      setActive(mode);
      const dur = mode === "positive" ? 2200 : 1400;
      setTimeout(() => setActive(null), dur);
    };
    return () => { externalTrigger = null; };
  }, []);

  const confettiCount = isMobile ? 45 : 90;
  const shardCount = isMobile ? 10 : 18;

  return (
    <AnimatePresence>
      {active === "positive" && (
        <div className="fx-essential pointer-events-none fixed inset-0 z-[50] overflow-hidden">
          {/* soft flash */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,230,120,0.25), transparent 55%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.2, 1] }}
          />
          {Array.from({ length: confettiCount }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 2.0 + Math.random() * 1.8;
            const w = 7 + Math.random() * 7;
            const h = i % 3 === 0 ? w : w * 0.45;
            const color = POSITIVE_COLORS[i % POSITIVE_COLORS.length];
            const rot = Math.random() * 360;
            const drift = (Math.random() - 0.5) * 240;
            const rounded = i % 4 === 0;
            return (
              <motion.div
                key={`p${i}`}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: "-24px",
                  width: w,
                  height: h,
                  background: color,
                  borderRadius: rounded ? 9999 : 2,
                  boxShadow: `0 0 6px ${color}80`,
                  willChange: "transform, opacity",
                }}
                initial={{ y: -40, x: 0, opacity: 0, rotate: rot }}
                animate={{
                  y: typeof window !== "undefined" ? window.innerHeight + 60 : 900,
                  x: drift,
                  opacity: [0, 1, 1, 1, 0],
                  rotate: rot + 720,
                }}
                transition={{ duration, delay, ease: "easeIn", times: [0, 0.1, 0.5, 0.85, 1] }}
              />
            );
          })}
        </div>
      )}

      {active === "negative" && (
        <motion.div
          key="neg"
          className="fx-essential pointer-events-none fixed inset-0 z-[50] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* dark red vignette from the edges */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(127,29,29,0.75) 95%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.85, 0] }}
            transition={{ duration: 1.3, times: [0, 0.15, 0.5, 1] }}
          />
          {/* quick red flash */}
          <motion.div
            className="absolute inset-0 bg-red-700/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            transition={{ duration: 0.3 }}
          />
          {/* falling dark ash from top (mirror of positive confetti, visible around popup) */}
          {Array.from({ length: isMobile ? 30 : 55 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.4;
            const duration = 1.6 + Math.random() * 1.4;
            const w = 4 + Math.random() * 5;
            const rot = Math.random() * 360;
            const drift = (Math.random() - 0.5) * 160;
            const colors = ["#7f1d1d", "#450a0a", "#1c1917", "#3f0d0d"];
            const color = colors[i % colors.length];
            return (
              <motion.div
                key={`na${i}`}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: "-20px",
                  width: w,
                  height: w,
                  background: color,
                  borderRadius: 2,
                  boxShadow: "0 0 6px rgba(239,68,68,0.5)",
                  willChange: "transform, opacity",
                }}
                initial={{ y: -40, x: 0, opacity: 0, rotate: rot }}
                animate={{
                  y: typeof window !== "undefined" ? window.innerHeight + 60 : 900,
                  x: drift,
                  opacity: [0, 1, 1, 0.9, 0],
                  rotate: rot + 540,
                }}
                transition={{ duration, delay, ease: "easeIn", times: [0, 0.1, 0.5, 0.85, 1] }}
              />
            );
          })}
          {/* diagonal slash marks from the edges (visible outside popup box) */}
          {[
            { top: "12%", left: "8%", rot: -25 },
            { top: "18%", right: "10%", rot: 30 },
            { bottom: "20%", left: "12%", rot: 40 },
            { bottom: "14%", right: "8%", rot: -35 },
          ].map((pos, i) => (
            <motion.div
              key={`sl${i}`}
              className="absolute"
              style={{
                ...pos,
                width: 140,
                height: 6,
                background: "linear-gradient(to right, transparent, #ef4444, transparent)",
                boxShadow: "0 0 18px rgba(239,68,68,0.9)",
                transform: `rotate(${pos.rot}deg)`,
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 1] }}
              transition={{ duration: 0.9, delay: i * 0.05, times: [0, 0.15, 0.7, 1] }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}