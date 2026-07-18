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
        <div className="fx-essential pointer-events-none fixed inset-0 z-[200] overflow-hidden">
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
          className="fx-essential pointer-events-none fixed inset-0 z-[200] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* red vignette pulse */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 40%, rgba(220,38,38,0.55) 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.7, 0] }}
            transition={{ duration: 1.2, times: [0, 0.15, 0.5, 1] }}
          />
          {/* full red flash */}
          <motion.div
            className="absolute inset-0 bg-red-600/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.35 }}
          />
          {/* shake wrapper with cracks */}
          <motion.div
            className="absolute inset-0"
            initial={{ x: 0 }}
            animate={{ x: [0, -14, 12, -10, 8, -5, 3, 0] }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          >
            {/* dark shards flying outward */}
            {Array.from({ length: shardCount }).map((_, i) => {
              const angle = (i / shardCount) * Math.PI * 2;
              const dist = 260 + Math.random() * 180;
              const size = 10 + Math.random() * 14;
              return (
                <motion.div
                  key={`s${i}`}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: 2,
                    height: size,
                    background: "linear-gradient(to bottom, #ef4444, #7f1d1d)",
                    boxShadow: "0 0 8px rgba(239,68,68,0.7)",
                    transformOrigin: "center",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: (angle * 180) / Math.PI }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              );
            })}
          </motion.div>
          {/* central skull mark */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.15, 1, 0.9], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, times: [0, 0.25, 0.7, 1] }}
          >
            <div
              className="font-display text-6xl md:text-8xl tracking-widest"
              style={{
                color: "#fca5a5",
                textShadow: "0 0 24px rgba(239,68,68,0.9), 0 0 60px rgba(127,29,29,0.7)",
              }}
            >
              ✖
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}