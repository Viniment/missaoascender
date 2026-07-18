import { AnimatePresence, motion } from "framer-motion";

export default function VictoryScreen({ inimigoNome, onClose }: { inimigoNome: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {inimigoNome && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="relative rpg-panel scanlines p-8 text-center max-w-sm w-full border-gold/60"
            style={{ boxShadow: "0 0 60px hsl(45 95% 55% / 0.4), 0 0 20px hsl(var(--primary) / 0.5) inset" }}
          >
            <motion.p
              initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[11px] uppercase tracking-[0.5em] text-gold mb-3"
            >
              ✦ Boss Derrotado ✦
            </motion.p>
            <motion.h2
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
              className="font-display text-5xl tracking-[0.25em] glow-text-purple text-foreground leading-none"
            >
              VITÓRIA
            </motion.h2>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Você silenciou <span className="text-destructive font-display tracking-widest">{inimigoNome}</span>.
            </p>
            <p className="mt-2 text-xs text-primary">Sua consciência ficou mais forte.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full btn-pixel py-2.5 rounded-md text-xs uppercase tracking-[0.3em]"
            >
              Reivindicar recompensa
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}