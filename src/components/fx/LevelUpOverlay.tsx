import { AnimatePresence, motion } from "framer-motion";

export default function LevelUpOverlay({ nivel, onClose }: { nivel: number | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {nivel !== null && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fx-essential fixed inset-0 z-[70] flex items-center justify-center bg-background/85 backdrop-blur-md p-4 cursor-pointer"
        >
          {/* Radial rays */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 2.2, rotate: 45 }}
            transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
            className="absolute w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{
              background: "conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary)/0.35) 20deg, transparent 40deg, transparent 80deg, hsl(var(--primary)/0.35) 100deg, transparent 120deg, transparent 160deg, hsl(var(--primary)/0.35) 180deg, transparent 200deg, transparent 240deg, hsl(var(--primary)/0.35) 260deg, transparent 280deg, transparent 320deg, hsl(var(--primary)/0.35) 340deg, transparent 360deg)",
              filter: "blur(6px)",
            }}
          />
          <motion.div
            initial={{ scale: 0.5, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="relative rpg-panel neon-glow scanlines px-10 py-8 text-center max-w-sm w-full"
          >
            <p className="text-[11px] uppercase tracking-[0.5em] text-primary mb-2">✦ Ascensão ✦</p>
            <h2 className="font-display text-4xl tracking-[0.3em] text-foreground glow-text-purple">NÍVEL</h2>
            <motion.p
              initial={{ scale: 0.3 }} animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="font-display text-7xl text-primary glow-text-purple leading-none my-2"
            >
              {nivel}
            </motion.p>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-3">Seu herói evoluiu</p>
            <p className="text-[10px] text-muted-foreground mt-4 opacity-70">toque para continuar</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}