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
          {/* Confetti (replaces background glow) */}
          {stage === "reveal" && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: confettiCount }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 0.4;
                const duration = 1.8 + Math.random() * 1.6;
                const size = 6 + Math.random() * 6;
                const color = confettiColors[i % confettiColors.length];
                const rot = Math.random() * 360;
                const drift = (Math.random() - 0.5) * 120;
                const rounded = i % 3 === 0;
                return (
                  <motion.span
                    key={`cf${i}`}
                    className="absolute"
                    style={{
                      left: `${left}%`,
                      top: -20,
                      width: size,
                      height: size * (rounded ? 1 : 0.5),
                      background: color,
                      borderRadius: rounded ? "9999px" : "2px",
                      transform: `rotate(${rot}deg)`,
                    }}
                    initial={{ y: -40, opacity: 0, rotate: rot }}
                    animate={{
                      y: "110vh",
                      x: drift,
                      opacity: [0, 1, 1, 0.9, 0],
                      rotate: rot + 540,
                    }}
                    transition={{ duration, delay, ease: "easeIn" }}
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

function ChestSVG({ stage }: { stage: Stage }) {
  const opened = stage === "reveal";
  return (
    <svg width="200" height="200" viewBox="0 0 180 180" className="drop-shadow-[0_14px_28px_rgba(0,0,0,0.75)]">
      <defs>
        <linearGradient id="wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7a4320" />
          <stop offset="45%" stopColor="#4d2611" />
          <stop offset="100%" stopColor="#1e0d05" />
        </linearGradient>
        <linearGradient id="woodTop" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9a5426" />
          <stop offset="60%" stopColor="#5e2f15" />
          <stop offset="100%" stopColor="#33170a" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff2ae" />
          <stop offset="45%" stopColor="#f4c430" />
          <stop offset="100%" stopColor="#8a5e0a" />
        </linearGradient>
        <linearGradient id="jewel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ff9db3" />
          <stop offset="60%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#6b0a1f" />
        </linearGradient>
        <radialGradient id="innerGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff6c2" />
          <stop offset="60%" stopColor="#f4c430" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Chest body (base) */}
      <rect x="22" y="80" width="136" height="72" rx="7" fill="url(#wood)" stroke="#120802" strokeWidth="2" />
      {/* Wood plank divisions */}
      <line x1="55" y1="82" x2="55" y2="150" stroke="#120802" strokeWidth="1.4" opacity="0.7" />
      <line x1="90" y1="82" x2="90" y2="150" stroke="#120802" strokeWidth="1.4" opacity="0.7" />
      <line x1="125" y1="82" x2="125" y2="150" stroke="#120802" strokeWidth="1.4" opacity="0.7" />
      {/* Wood grain highlights */}
      <path d="M28 92 Q45 95 55 92" stroke="#8a4a20" strokeWidth="0.8" opacity="0.35" fill="none" />
      <path d="M60 110 Q75 113 88 110" stroke="#8a4a20" strokeWidth="0.8" opacity="0.35" fill="none" />
      <path d="M95 130 Q110 133 122 130" stroke="#8a4a20" strokeWidth="0.8" opacity="0.35" fill="none" />
      <path d="M128 100 Q142 103 152 100" stroke="#8a4a20" strokeWidth="0.8" opacity="0.35" fill="none" />
      {/* Metal bands */}
      <rect x="22" y="96" width="136" height="7" fill="url(#goldGrad)" stroke="#4a3208" strokeWidth="1" />
      <rect x="22" y="136" width="136" height="7" fill="url(#goldGrad)" stroke="#4a3208" strokeWidth="1" />
      <line x1="22" y1="99.5" x2="158" y2="99.5" stroke="#fff3b0" strokeWidth="0.6" opacity="0.7" />
      <line x1="22" y1="139.5" x2="158" y2="139.5" stroke="#fff3b0" strokeWidth="0.6" opacity="0.7" />
      {/* Corner studs */}
      {[
        [30, 88], [150, 88], [30, 146], [150, 146],
        [30, 117], [150, 117],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.2" fill="url(#goldGrad)" stroke="#4a3208" strokeWidth="0.8" />
          <circle cx={x - 0.8} cy={y - 0.8} r="0.9" fill="#fff6c2" opacity="0.9" />
        </g>
      ))}
      {/* Base shadow strip */}
      <rect x="22" y="147" width="136" height="5" fill="#000" opacity="0.35" />

      {/* Inner glow when open */}
      {opened && (
        <ellipse cx="90" cy="88" rx="58" ry="14" fill="url(#innerGlow)" opacity="0.95" />
      )}
      {opened && (
        <>
          <circle cx="66" cy="90" r="5.5" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="0.6" />
          <circle cx="80" cy="94" r="6" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="0.6" />
          <circle cx="95" cy="92" r="6.5" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="0.6" />
          <circle cx="112" cy="94" r="5.5" fill="url(#goldGrad)" stroke="#5a3d0a" strokeWidth="0.6" />
          <circle cx="72" cy="86" r="2.2" fill="#fff6c2" />
          <circle cx="102" cy="86" r="2.4" fill="#fff6c2" />
        </>
      )}

      {/* Lid group - rotates on open */}
      <g style={{ transformOrigin: "90px 82px", transform: opened ? "rotate(-58deg)" : "rotate(0deg)", transition: "transform 0.9s cubic-bezier(.34,1.56,.64,1)" }}>
        <path d="M22 82 Q22 38 90 38 Q158 38 158 82 Z" fill="url(#woodTop)" stroke="#120802" strokeWidth="2" />
        {/* Lid plank lines */}
        <path d="M55 82 Q55 48 65 42" stroke="#120802" strokeWidth="1.2" opacity="0.55" fill="none" />
        <path d="M125 82 Q125 48 115 42" stroke="#120802" strokeWidth="1.2" opacity="0.55" fill="none" />
        {/* Gold arc trim */}
        <path d="M22 82 Q22 38 90 38 Q158 38 158 82" fill="none" stroke="url(#goldGrad)" strokeWidth="3.5" />
        {/* Highlight on lid */}
        <path d="M32 68 Q60 46 90 44" stroke="#c78853" strokeWidth="1.6" opacity="0.55" fill="none" />
        {/* Side gold bands on lid */}
        <path d="M40 80 Q40 52 55 44" stroke="url(#goldGrad)" strokeWidth="2" fill="none" opacity="0.85" />
        <path d="M140 80 Q140 52 125 44" stroke="url(#goldGrad)" strokeWidth="2" fill="none" opacity="0.85" />
        {/* Lock plate */}
        <rect x="78" y="70" width="24" height="22" rx="3" fill="url(#goldGrad)" stroke="#4a3208" strokeWidth="1" />
        <rect x="80" y="72" width="20" height="18" rx="2" fill="none" stroke="#fff3b0" strokeWidth="0.5" opacity="0.7" />
        {/* Jewel */}
        <circle cx="90" cy="81" r="4.2" fill="url(#jewel)" stroke="#4a0512" strokeWidth="0.8" />
        <circle cx="88.5" cy="79.5" r="1.2" fill="#fff" opacity="0.85" />
      </g>
    </svg>
  );
}