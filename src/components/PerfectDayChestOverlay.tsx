import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/lib/GameContext';
import { rarityStyle } from '@/lib/perfectDay';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PerfectDayChestOverlay() {
  const { state, claimPerfectDayLoot } = useGame();
  const loot = state.pendingLoot;
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (loot) setOpened(false);
  }, [loot]);

  if (!loot) return null;
  const style = rarityStyle(loot.rarity);

  return (
    <AnimatePresence>
      <motion.div
        key="perfect-day-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.7, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 18 }}
          className={cn(
            'relative max-w-sm w-full rounded-2xl border-2 p-6 text-center bg-gradient-to-b',
            style.border, style.glow, style.bg,
          )}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn('absolute w-1 h-1 rounded-full', style.text.replace('text-', 'bg-'))}
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 0,
                }}
                animate={opened ? {
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  opacity: [0, 1, 0],
                } : {}}
                transition={{ duration: 1.5, delay: i * 0.05, repeat: Infinity, repeatDelay: 1 }}
              />
            ))}
          </div>

          <p className={cn('font-display text-[10px] tracking-[0.3em] uppercase mb-3', style.text)}>
            Dia Perfeito
          </p>

          <motion.div
            animate={opened ? { rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.1, 1] } : { rotate: [0, -2, 2, -2, 0] }}
            transition={opened ? { duration: 0.6 } : { duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            {opened ? '✨' : '🎁'}
          </motion.div>

          <h2 className={cn('font-display text-2xl tracking-widest mb-1', style.text)}>
            {loot.title}
          </h2>
          <p className="text-sm text-foreground/80 mb-5 leading-relaxed">
            {loot.message}
          </p>

          {opened && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 mb-5"
            >
              {loot.gold ? (
                <div className="flex items-center justify-center gap-2 text-gold">
                  <span className="text-lg">💰</span>
                  <span className="font-display tracking-widest">+{loot.gold} ouro</span>
                </div>
              ) : null}
              {loot.xp ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-display tracking-widest">+{loot.xp} XP</span>
                </div>
              ) : null}
              {loot.theme && (
                <p className="text-xs text-foreground/70">Tema desbloqueado: <span className={style.text}>{loot.theme}</span></p>
              )}
              {loot.frame && (
                <p className="text-xs text-foreground/70">Moldura desbloqueada: <span className={style.text}>{loot.frame}</span></p>
              )}
            </motion.div>
          )}

          {!opened ? (
            <button
              onClick={() => setOpened(true)}
              className={cn(
                'w-full py-3 rounded-lg border-2 font-display tracking-widest text-sm hover:opacity-90 transition',
                style.border, style.text,
              )}
            >
              ABRIR BAÚ
            </button>
          ) : (
            <button
              onClick={() => { claimPerfectDayLoot(); setOpened(false); }}
              className={cn(
                'w-full py-3 rounded-lg border-2 font-display tracking-widest text-sm hover:opacity-90 transition',
                style.border, style.text,
              )}
            >
              RECEBER
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}