import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useGame } from '@/lib/GameContext';
import { ATTRIBUTE_MAP, type AttributeId } from '@/lib/attributes';

interface LevelUpEvent {
  kind: 'player' | 'attribute';
  label: string;
  detail: string;
  emoji: string;
  color: string;
}

export default function LevelUpOverlay() {
  const { state } = useGame();
  const [queue, setQueue] = useState<LevelUpEvent[]>([]);
  const [current, setCurrent] = useState<LevelUpEvent | null>(null);

  // Track player level
  const [lastPlayerLevel, setLastPlayerLevel] = useState(state.level);
  const [lastRank, setLastRank] = useState(state.rank);
  const [lastAttrLevels, setLastAttrLevels] = useState<Record<AttributeId, number>>(() => {
    const out: Record<string, number> = {};
    for (const id of Object.keys(ATTRIBUTE_MAP)) out[id] = state.attributes?.[id as AttributeId]?.level || 1;
    return out as Record<AttributeId, number>;
  });

  useEffect(() => {
    const events: LevelUpEvent[] = [];
    if (state.rank !== lastRank) {
      events.push({ kind: 'player', label: 'NOVO RANK!', detail: state.rank, emoji: '👑', color: 'text-gold' });
    } else if (state.level !== lastPlayerLevel && state.level > lastPlayerLevel) {
      events.push({ kind: 'player', label: 'LEVEL UP', detail: `Nível ${state.level}`, emoji: '⚡', color: 'text-primary' });
    }
    for (const id of Object.keys(ATTRIBUTE_MAP) as AttributeId[]) {
      const cur = state.attributes?.[id]?.level || 1;
      const prev = lastAttrLevels[id] || 1;
      if (cur > prev) {
        const def = ATTRIBUTE_MAP[id];
        events.push({ kind: 'attribute', label: `${def.label.toUpperCase()} +1`, detail: `Nível ${cur}`, emoji: def.emoji, color: def.color });
      }
    }
    if (events.length > 0) setQueue(q => [...q, ...events]);
    setLastPlayerLevel(state.level);
    setLastRank(state.rank);
    const next: Record<string, number> = {};
    for (const id of Object.keys(ATTRIBUTE_MAP)) next[id] = state.attributes?.[id as AttributeId]?.level || 1;
    setLastAttrLevels(next as Record<AttributeId, number>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.level, state.rank, state.attributes]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      const t = setTimeout(() => setCurrent(null), 2200);
      return () => clearTimeout(t);
    }
  }, [current, queue]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.label + current.detail}
          initial={{ opacity: 0, scale: 0.6, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="relative px-8 py-4 rounded-2xl bg-background/90 backdrop-blur-md border border-primary/50 shadow-[0_0_60px_rgba(123,47,247,0.4)]">
            <motion.div
              className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-gold/30 to-primary/30 blur-xl"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className="relative flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-4xl"
              >
                {current.emoji}
              </motion.div>
              <div>
                <div className={`font-display text-xl tracking-widest ${current.color} flex items-center gap-2`}>
                  <Sparkles className="w-4 h-4" />
                  {current.label}
                </div>
                <div className="text-foreground/80 text-sm font-display">{current.detail}</div>
              </div>
            </div>
            {/* Partículas */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary"
                style={{ left: '50%', top: '50%' }}
                animate={{
                  x: [0, Math.cos((i / 8) * Math.PI * 2) * 80],
                  y: [0, Math.sin((i / 8) * Math.PI * 2) * 80],
                  opacity: [1, 0],
                }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
