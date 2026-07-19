import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, X } from "lucide-react";

type Stage = "closed" | "opening" | "reveal";

export default function ChestOverlay({
  open,
  onOpen,
  onClose,
  gold,
}: {
  open: boolean;
  onOpen: () => Promise<void> | void;
  onClose: () => void;
  gold: number | null;
}) {
  const [stage, setStage] = useState<Stage>("closed");
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const particleCount = isMobile ? 8 : 18;
  const coinCount = isMobile ? 4 : 8;
  const confettiCount = isMobile ? 40 : 90;
  const confettiColors = [
    "#f4c430", "#ffe27a", "#ff5f6d", "#7b2ff7",
    "#22d3ee", "#34d399", "#fb923c", "#ffffff",
  ];

  useEffect(() => {
    if (open) {
      setStage("closed");
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (gold != null && stage === "opening") {
      const t = setTimeout(() => setStage("reveal"), 1600);
      return () => clearTimeout(t);
    }
  }, [gold, stage]);

  const handleTap = async () => {
    if (busy || stage !== "closed") return;
    setBusy(true);
    setStage("opening");
    try { await onOpen(); } catch { setStage("closed"); setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fx-essential fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          {/* Confetti */}
          {stage === "reveal" && (
            <div className="pointer-events-none fixed inset-0 z-[110] overflow-hidden">
              {Array.from({ length: confettiCount }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 0.6;
                const duration = 2.4 + Math.random() * 2.2;
                const w = 8 + Math.random() * 6;
                const h = i % 3 === 0 ? w : w * 0.45;
                const color = confettiColors[i % confettiColors.length];
                const rot = Math.random() * 360;
                const drift = (Math.random() - 0.5) * 220;
                const rounded = i % 4 === 0;
                return (
                  <motion.div
                    key={`cf${i}`}
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

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
            <motion.p
              className="font-display tracking-[0.4em] text-xs text-gold/80 uppercase"
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              ⚜ Recompensa Diária ⚜
            </motion.p>

            <motion.h2
              className="font-display text-2xl md:text-3xl text-gold tracking-widest text-center"
              style={{ textShadow: "0 0 20px hsl(45 100% 55% / 0.8)" }}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            >
              {stage === "closed" && "BAÚ DO DIA"}
              {stage === "opening" && "ABRINDO..."}
              {stage === "reveal" && "TESOURO!"}
            </motion.h2>

            {/* Chest */}
            <div className="relative h-56 w-56 flex items-center justify-center">
              {/* Ground shadow */}
              <div className="absolute bottom-2 w-40 h-4 rounded-full bg-black/60 blur-md" />

              <motion.div
                className="relative"
                animate={
                  stage === "closed"
                    ? { y: [0, -6, 0] }
                    : stage === "opening"
                    ? { x: [0, -4, 4, -4, 4, 0], y: [0, -2, 0] }
                    : { y: [0, -10, 0] }
                }
                transition={
                  stage === "closed"
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : stage === "opening"
                    ? { duration: 0.15, repeat: Infinity }
                    : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <ChestSVG stage={stage} />
              </motion.div>

              {/* Burst particles on reveal */}
              {stage === "reveal" &&
                Array.from({ length: particleCount }).map((_, i) => {
                  const angle = (i / particleCount) * Math.PI * 2;
                  const dist = 120 + Math.random() * 60;
                  return (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gold"
                      style={{ boxShadow: "0 0 12px hsl(45 100% 60%)" }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist,
                        opacity: 0,
                        scale: 0.2,
                      }}
                      transition={{ duration: 1.4, ease: "easeOut" }}
                    />
                  );
                })}

              {/* Floating coins on reveal */}
              {stage === "reveal" &&
                Array.from({ length: coinCount }).map((_, i) => (
                  <motion.div
                    key={`c${i}`}
                    className="absolute top-1/2 left-1/2"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.5, rotate: 0 }}
                    animate={{
                      x: (Math.random() - 0.5) * 220,
                      y: -80 - Math.random() * 120,
                      opacity: [0, 1, 1, 0],
                      scale: 1,
                      rotate: 720,
                    }}
                    transition={{ duration: 1.8, delay: i * 0.05, ease: "easeOut" }}
                  >
                    <Coins className="w-5 h-5 text-gold drop-shadow-[0_0_8px_hsl(45_100%_60%)]" />
                  </motion.div>
                ))}
            </div>

            {/* Reward text */}
            <AnimatePresence mode="wait">
              {stage === "reveal" && gold != null && (
                <motion.div
                  key="reward"
                  initial={{ y: 30, opacity: 0, scale: 0.6 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-3 px-6 py-3 rounded-xl border border-gold/50 bg-gradient-to-b from-gold/20 to-gold/5">
                    <Coins className="w-7 h-7 text-gold" />
                    <span
                      className="font-display text-3xl text-gold"
                      style={{ textShadow: "0 0 16px hsl(45 100% 55%)" }}
                    >
                      +{gold}
                    </span>
                    <Sparkles className="w-5 h-5 text-gold animate-pulse" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <AnimatePresence mode="wait">
              {stage === "closed" && (
                <motion.button
                  key="tap"
                  onClick={handleTap}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="relative px-8 py-3 rounded-lg border border-gold/60 bg-gold/10 hover:bg-gold/20 transition-all"
                >
                  <motion.span
                    className="absolute inset-0 rounded-lg border border-gold/40"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                  <span className="font-display tracking-[0.3em] text-sm text-gold">
                    TOQUE PARA ABRIR
                  </span>
                </motion.button>
              )}
              {stage === "reveal" && (
                <motion.button
                  key="close"
                  onClick={onClose}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="px-8 py-3 rounded-lg border border-primary/60 bg-primary/10 hover:bg-primary/20"
                >
                  <span className="font-display tracking-[0.3em] text-sm text-primary">
                    COLETAR
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Close X (only before opening) */}
          {stage === "closed" && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 border border-white/10 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

