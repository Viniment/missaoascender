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

function ChestSVG({ stage }: { stage: Stage }) {
  const opened = stage === "reveal";
  return (
    <svg
      width="230"
      height="230"
      viewBox="0 0 200 200"
      className="drop-shadow-[0_20px_36px_rgba(0,0,0,0.85)]"
    >
      <defs>
        <linearGradient id="wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8b4a22" />
          <stop offset="50%" stopColor="#502813" />
          <stop offset="100%" stopColor="#1a0a03" />
        </linearGradient>
        <linearGradient id="woodTop" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a45a28" />
          <stop offset="55%" stopColor="#6a3418" />
          <stop offset="100%" stopColor="#3a1a08" />
        </linearGradient>
        <linearGradient id="lidUnder" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2a1408" />
          <stop offset="100%" stopColor="#5a3018" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff2ae" />
          <stop offset="40%" stopColor="#ffd94a" />
          <stop offset="80%" stopColor="#c58810" />
          <stop offset="100%" stopColor="#6b4508" />
        </linearGradient>
        <linearGradient id="jewel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ff9db3" />
          <stop offset="60%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#6b0a1f" />
        </linearGradient>
        <radialGradient id="innerGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff6c2" />
          <stop offset="55%" stopColor="#f4c430" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="innerWall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#050200" />
          <stop offset="70%" stopColor="#241005" />
          <stop offset="100%" stopColor="#6a3810" />
        </linearGradient>
        <linearGradient id="gemBlue" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#b6e6ff" />
          <stop offset="60%" stopColor="#3aa0ff" />
          <stop offset="100%" stopColor="#0b3a7a" />
        </linearGradient>
        <linearGradient id="gemGreen" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#c8ffd6" />
          <stop offset="60%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#0a4a24" />
        </linearGradient>
        <linearGradient id="gemPurple" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#e8ccff" />
          <stop offset="60%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#3a0d6b" />
        </linearGradient>
        <linearGradient id="gemRed" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffd4d4" />
          <stop offset="60%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#5a0808" />
        </linearGradient>
        <radialGradient id="coinShine" cx="0.32" cy="0.28" r="0.75">
          <stop offset="0%" stopColor="#fff8d0" />
          <stop offset="55%" stopColor="#f4c430" />
          <stop offset="100%" stopColor="#7a4d08" />
        </radialGradient>
        <linearGradient id="rimGold" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffe98a" />
          <stop offset="100%" stopColor="#a06e10" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="100" cy="170" rx="82" ry="5" fill="#000" opacity="0.55" />

      {/* --- OPEN LID (behind body) --- */}
      {opened && (
        <g style={{ transformOrigin: "100px 90px" }}>
          {/* Foreshortened lid tilted back */}
          <g transform="matrix(0.96 0 0 0.42 4 22)">
            <path
              d="M26 90 Q26 42 100 36 Q174 42 174 90 Z"
              fill="url(#lidUnder)"
              stroke="#0a0402"
              strokeWidth="2"
            />
            <path
              d="M26 90 Q26 42 100 36 Q174 42 174 90"
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="4"
            />
            <path
              d="M46 90 Q46 56 62 44"
              stroke="url(#goldGrad)"
              strokeWidth="2.2"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M154 90 Q154 56 138 44"
              stroke="url(#goldGrad)"
              strokeWidth="2.2"
              fill="none"
              opacity="0.9"
            />
          </g>
        </g>
      )}

      {/* --- CHEST BODY --- */}
      <rect
        x="26"
        y="88"
        width="148"
        height="76"
        rx="8"
        fill="url(#wood)"
        stroke="#0a0402"
        strokeWidth="2"
      />
      {/* Plank divisions */}
      {[62, 100, 138].map((x) => (
        <line
          key={x}
          x1={x}
          y1="90"
          x2={x}
          y2="162"
          stroke="#0a0402"
          strokeWidth="1.4"
          opacity="0.6"
        />
      ))}
      {/* Wood grain */}
      <path d="M32 102 Q46 105 60 102" stroke="#a05828" strokeWidth="0.8" opacity="0.35" fill="none" />
      <path d="M66 122 Q82 125 98 122" stroke="#a05828" strokeWidth="0.8" opacity="0.35" fill="none" />
      <path d="M104 142 Q120 145 136 142" stroke="#a05828" strokeWidth="0.8" opacity="0.35" fill="none" />
      <path d="M140 110 Q154 113 168 110" stroke="#a05828" strokeWidth="0.8" opacity="0.35" fill="none" />

      {/* Top rim gold band */}
      <rect x="26" y="88" width="148" height="9" fill="url(#rimGold)" stroke="#4a3208" strokeWidth="1" />
      <line x1="26" y1="92" x2="174" y2="92" stroke="#fff3b0" strokeWidth="0.7" opacity="0.9" />
      {/* Bottom band */}
      <rect x="26" y="150" width="148" height="9" fill="url(#rimGold)" stroke="#4a3208" strokeWidth="1" />
      <line x1="26" y1="154" x2="174" y2="154" stroke="#fff3b0" strokeWidth="0.6" opacity="0.8" />

      {/* Corner studs */}
      {[
        [34, 102],
        [166, 102],
        [34, 144],
        [166, 144],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.4" fill="url(#goldGrad)" stroke="#4a3208" strokeWidth="0.8" />
          <circle cx={x - 0.9} cy={y - 0.9} r="1" fill="#fff6c2" opacity="0.9" />
        </g>
      ))}

      {/* --- TREASURE (only when opened) --- */}
      {opened && (
        <>
          {/* Dark opening across the top of the box */}
          <ellipse cx="100" cy="94" rx="70" ry="9" fill="url(#innerWall)" />
          {/* Warm halo */}
          <ellipse cx="100" cy="82" rx="92" ry="36" fill="url(#innerGlow)" opacity="0.5" />
          <ellipse cx="100" cy="90" rx="66" ry="18" fill="url(#innerGlow)" opacity="0.9" />

          {/* Back row of coins (peak of the mound) */}
          {[
            [66, 84, 4.6],
            [76, 80, 5],
            [86, 78, 5.2],
            [96, 76, 5.4],
            [106, 78, 5.2],
            [116, 80, 5],
            [126, 84, 4.6],
          ].map(([x, y, r], i) => (
            <g key={`bk${i}`}>
              <circle cx={x} cy={y} r={r} fill="url(#coinShine)" stroke="#5a3d0a" strokeWidth="0.6" />
              <ellipse
                cx={Number(x) - 1.2}
                cy={Number(y) - 1.4}
                rx={Number(r) * 0.4}
                ry={Number(r) * 0.22}
                fill="#fff6c2"
                opacity="0.92"
              />
            </g>
          ))}

          {/* Big centerpiece purple gem */}
          <g>
            <polygon
              points="88,76 100,64 112,76 100,96"
              fill="url(#gemPurple)"
              stroke="#26074a"
              strokeWidth="1"
            />
            <polygon points="88,76 100,64 100,96" fill="#ffffff" opacity="0.3" />
            <circle cx="96" cy="72" r="1.6" fill="#fff" opacity="0.95" />
          </g>

          {/* Side gems */}
          <polygon points="70,88 76,82 82,88 76,96" fill="url(#gemBlue)" stroke="#062247" strokeWidth="0.7" />
          <polygon points="70,88 76,82 76,96" fill="#ffffff" opacity="0.28" />
          <circle cx="74" cy="86" r="0.9" fill="#fff" opacity="0.95" />

          <polygon points="118,88 124,82 130,88 124,96" fill="url(#gemGreen)" stroke="#082e18" strokeWidth="0.7" />
          <polygon points="118,88 124,82 124,96" fill="#ffffff" opacity="0.28" />
          <circle cx="122" cy="86" r="0.9" fill="#fff" opacity="0.95" />

          <polygon points="52,94 57,89 62,94 57,101" fill="url(#gemRed)" stroke="#450606" strokeWidth="0.6" />
          <circle cx="55" cy="92" r="0.7" fill="#fff" opacity="0.9" />

          <polygon points="138,94 143,89 148,94 143,101" fill="url(#gemPurple)" stroke="#26074a" strokeWidth="0.6" />
          <circle cx="141" cy="92" r="0.7" fill="#fff" opacity="0.9" />

          {/* Front lip — coins tumbling over the front rim */}
          {[
            [34, 98, 4.8],
            [46, 100, 5.4],
            [58, 102, 5.8],
            [70, 103, 6.2],
            [82, 104, 6.5],
            [94, 105, 6.7],
            [106, 105, 6.7],
            [118, 104, 6.5],
            [130, 103, 6.2],
            [142, 102, 5.8],
            [154, 100, 5.4],
            [166, 98, 4.8],
          ].map(([x, y, r], i) => (
            <g key={`fr${i}`}>
              <circle cx={x} cy={y} r={r} fill="url(#coinShine)" stroke="#5a3d0a" strokeWidth="0.6" />
              <ellipse
                cx={Number(x) - 1.4}
                cy={Number(y) - 1.6}
                rx={Number(r) * 0.4}
                ry={Number(r) * 0.22}
                fill="#fff6c2"
                opacity="0.95"
              />
            </g>
          ))}

          {/* Coins tumbling down front of box */}
          {[
            [40, 120, 4.4],
            [56, 132, 4.4],
            [148, 122, 4.4],
            [162, 134, 4],
          ].map(([x, y, r], i) => (
            <g key={`tm${i}`}>
              <circle cx={x} cy={y} r={r} fill="url(#coinShine)" stroke="#5a3d0a" strokeWidth="0.6" opacity="0.95" />
              <ellipse
                cx={Number(x) - 1.1}
                cy={Number(y) - 1.3}
                rx={Number(r) * 0.4}
                ry={Number(r) * 0.22}
                fill="#fff6c2"
                opacity="0.9"
              />
            </g>
          ))}

          {/* Coins on ground */}
          <ellipse cx="46" cy="167" rx="7" ry="2" fill="url(#coinShine)" stroke="#5a3d0a" strokeWidth="0.5" />
          <ellipse cx="60" cy="168" rx="6" ry="1.8" fill="url(#coinShine)" stroke="#5a3d0a" strokeWidth="0.5" />
          <ellipse cx="140" cy="168" rx="6.5" ry="1.9" fill="url(#coinShine)" stroke="#5a3d0a" strokeWidth="0.5" />
          <ellipse cx="156" cy="167" rx="5.5" ry="1.7" fill="url(#coinShine)" stroke="#5a3d0a" strokeWidth="0.5" />

          {/* Sparkle stars */}
          <g fill="#fff8d0">
            <path d="M78 54 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3 z" opacity="0.9" />
            <path d="M125 50 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1 z" opacity="0.85" />
            <path d="M100 44 l0.8 2 2 0.8 -2 0.8 -0.8 2 -0.8 -2 -2 -0.8 2 -0.8 z" opacity="0.9" />
            <path d="M60 66 l0.7 1.7 1.7 0.7 -1.7 0.7 -0.7 1.7 -0.7 -1.7 -1.7 -0.7 1.7 -0.7 z" opacity="0.75" />
            <path d="M144 68 l0.7 1.7 1.7 0.7 -1.7 0.7 -0.7 1.7 -0.7 -1.7 -1.7 -0.7 1.7 -0.7 z" opacity="0.75" />
          </g>
        </>
      )}

      {/* --- CLOSED LID (fades out on open) --- */}
      <g
        style={{
          opacity: opened ? 0 : 1,
          transition: "opacity 0.5s ease-out",
          pointerEvents: opened ? "none" : "auto",
        }}
      >
        <path d="M26 90 Q26 42 100 38 Q174 42 174 90 Z" fill="url(#woodTop)" stroke="#0a0402" strokeWidth="2" />
        <path d="M62 90 Q62 54 74 46" stroke="#0a0402" strokeWidth="1.2" opacity="0.55" fill="none" />
        <path d="M138 90 Q138 54 126 46" stroke="#0a0402" strokeWidth="1.2" opacity="0.55" fill="none" />
        <path d="M26 90 Q26 42 100 38 Q174 42 174 90" fill="none" stroke="url(#goldGrad)" strokeWidth="4" />
        <path d="M36 74 Q66 50 100 46" stroke="#d89563" strokeWidth="1.8" opacity="0.6" fill="none" />
        <path d="M46 88 Q46 56 62 48" stroke="url(#goldGrad)" strokeWidth="2" fill="none" opacity="0.85" />
        <path d="M154 88 Q154 56 138 48" stroke="url(#goldGrad)" strokeWidth="2" fill="none" opacity="0.85" />
        <rect x="86" y="78" width="28" height="24" rx="3" fill="url(#goldGrad)" stroke="#4a3208" strokeWidth="1" />
        <rect x="88" y="80" width="24" height="20" rx="2" fill="none" stroke="#fff3b0" strokeWidth="0.5" opacity="0.7" />
        <circle cx="100" cy="90" r="4.6" fill="url(#jewel)" stroke="#4a0512" strokeWidth="0.9" />
        <circle cx="98.5" cy="88.5" r="1.3" fill="#fff" opacity="0.9" />
      </g>
    </svg>
  );
}

