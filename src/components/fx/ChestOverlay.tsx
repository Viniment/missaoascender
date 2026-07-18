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
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          {/* Radial glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, hsl(45 100% 55% / 0.35), transparent 55%)",
            }}
            animate={{ opacity: stage === "closed" ? 0.5 : 1, scale: stage === "reveal" ? 1.2 : 1 }}
            transition={{ duration: 0.8 }}
          />
          {/* Rotating light rays on reveal */}
          {stage === "reveal" && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-[900px] h-[900px]"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, hsl(45 100% 60% / 0.25) 20deg, transparent 40deg, transparent 90deg, hsl(45 100% 60% / 0.25) 110deg, transparent 130deg, transparent 180deg, hsl(45 100% 60% / 0.25) 200deg, transparent 220deg, transparent 270deg, hsl(45 100% 60% / 0.25) 290deg, transparent 310deg)",
                  filter: "blur(2px)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
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
                Array.from({ length: 18 }).map((_, i) => {
                  const angle = (i / 18) * Math.PI * 2;
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
                Array.from({ length: 8 }).map((_, i) => (
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

function ChestSVG({ stage }: { stage: Stage }) {
  const opened = stage === "reveal";
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]">
      <defs>
        <linearGradient id="wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6b3a1a" />
          <stop offset="50%" stopColor="#4a2410" />
          <stop offset="100%" stopColor="#2a1408" />
        </linearGradient>
        <linearGradient id="woodTop" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8a4a20" />
          <stop offset="100%" stopColor="#5a2c14" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="50%" stopColor="#f4c430" />
          <stop offset="100%" stopColor="#a67611" />
        </linearGradient>
        <radialGradient id="innerGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff6c2" />
          <stop offset="60%" stopColor="#f4c430" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Chest body (base) */}
      <rect x="25" y="80" width="130" height="70" rx="6" fill="url(#wood)" stroke="#1a0a04" strokeWidth="2" />
      {/* Wood planks */}
      <line x1="60" y1="80" x2="60" y2="150" stroke="#1a0a04" strokeWidth="1.5" opacity="0.6" />
      <line x1="120" y1="80" x2="120" y2="150" stroke="#1a0a04" strokeWidth="1.5" opacity="0.6" />
      {/* Metal bands */}
      <rect x="25" y="95" width="130" height="6" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="1" />
      <rect x="25" y="135" width="130" height="6" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="1" />
      {/* Corner studs */}
      {[
        [32, 88], [148, 88], [32, 144], [148, 144],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="0.8" />
      ))}

      {/* Inner glow when open */}
      {opened && (
        <ellipse cx="90" cy="90" rx="55" ry="12" fill="url(#innerGlow)" opacity="0.95" />
      )}
      {opened && (
        <>
          <circle cx="70" cy="90" r="5" fill="url(#goldGrad)" />
          <circle cx="90" cy="94" r="6" fill="url(#goldGrad)" />
          <circle cx="110" cy="90" r="5" fill="url(#goldGrad)" />
          <circle cx="82" cy="88" r="3" fill="#fff6c2" />
          <circle cx="100" cy="88" r="3" fill="#fff6c2" />
        </>
      )}

      {/* Lid group - rotates on open */}
      <g style={{ transformOrigin: "90px 82px", transform: opened ? "rotate(-55deg)" : "rotate(0deg)", transition: "transform 0.9s cubic-bezier(.34,1.56,.64,1)" }}>
        <path d="M25 82 Q25 40 90 40 Q155 40 155 82 Z" fill="url(#woodTop)" stroke="#1a0a04" strokeWidth="2" />
        <path d="M25 82 Q25 40 90 40 Q155 40 155 82" fill="none" stroke="url(#goldGrad)" strokeWidth="3" />
        {/* Lock */}
        <rect x="80" y="72" width="20" height="18" rx="2" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="1" />
        <circle cx="90" cy="80" r="3" fill="#2a1408" />
      </g>
    </svg>
  );
}