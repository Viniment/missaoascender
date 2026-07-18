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
        <div className="fx-essential pointer-events-none fixed inset-0 z-[70] overflow-hidden">
          {/* soft flash */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,230,120,0.25), transparent 55%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.2, 1] }}
          />
          {Array.from({ length: confettiCount }).map((_, i) => {
            // Keep confetti on the left/right side strips so it doesn't cover popup text
            const side = i % 2 === 0 ? "left" : "right";
            const left = side === "left"
              ? Math.random() * 22           // 0% – 22%
              : 78 + Math.random() * 22;     // 78% – 100%
            const delay = Math.random() * 0.5;
            const duration = 2.0 + Math.random() * 1.8;
            const w = 7 + Math.random() * 7;
            const h = i % 3 === 0 ? w : w * 0.45;
            const color = POSITIVE_COLORS[i % POSITIVE_COLORS.length];
            const rot = Math.random() * 360;
            const drift = (side === "left" ? -1 : 1) * (20 + Math.random() * 80);
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
          {/* Red screen flash — pulses 3x then fades */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(220,38,38,0.55)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.2, 0.85, 0.2, 0.7, 0] }}
            transition={{ duration: 1.2, times: [0, 0.12, 0.28, 0.42, 0.58, 0.72, 1], ease: "easeOut" }}
          />
          {/* Dark edge vignette to reinforce the hit */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 45%, rgba(69,10,10,0.9) 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 0] }}
            transition={{ duration: 1.2, times: [0, 0.15, 0.5, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}