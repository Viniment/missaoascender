import { motion, AnimatePresence } from 'framer-motion';
import { getRankStyle, type AchievementDef } from '@/lib/achievements';
import { useEffect } from 'react';

interface Props {
  achievement: AchievementDef | null;
  onDismiss: () => void;
}

export default function AchievementUnlockOverlay({ achievement, onDismiss }: Props) {
  useEffect(() => {
    if (achievement) {
      const t = setTimeout(onDismiss, 4000);
      return () => clearTimeout(t);
    }
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="pointer-events-none"
          >
            <Card achievement={achievement} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Card({ achievement }: { achievement: AchievementDef }) {
  const style = getRankStyle(achievement.rank);

  return (
    <div
      className={`relative rounded-2xl border-2 ${style.border} bg-gradient-to-br ${style.bg} 
        p-8 shadow-2xl ${style.glow} max-w-xs text-center overflow-hidden`}
    >
      {/* Animated glow ring */}
      <motion.div
        className={`absolute inset-0 rounded-2xl border-2 ${style.border} opacity-50`}
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="relative flex flex-col items-center gap-3">
        <motion.span
          className="text-6xl drop-shadow-lg"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {achievement.icon}
        </motion.span>

        <p className="text-xs font-body text-muted-foreground uppercase tracking-widest">
          🏆 Conquista Desbloqueada
        </p>

        <h3 className={`font-display text-lg ${style.text} font-bold`}>
          {achievement.label}
        </h3>

        <span className={`text-xs font-body px-3 py-1 rounded-full ${style.border} border bg-black/30 ${style.text}`}>
          Rank {achievement.rank}
        </span>
      </div>
    </div>
  );
}
