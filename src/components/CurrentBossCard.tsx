import { useEffect } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Skull, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTodayBrasilia } from '@/lib/utils';

export default function CurrentBossCard({ onOpenBosses }: { onOpenBosses: () => void }) {
  const { state, settleBossesForToday } = useGame();
  useEffect(() => { settleBossesForToday(); }, [settleBossesForToday]);

  const today = getTodayBrasilia();
  const active = (state.bosses || []).filter(b => !b.defeatedAt);
  const current = active[0];

  if (!current) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rpg-panel border-dashed border-red-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Skull className="w-5 h-5 text-red-400/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm tracking-wider text-red-400">👹 INIMIGO ATUAL</p>
            <p className="text-xs text-foreground/60">Nenhum inimigo invocado.</p>
          </div>
          <Button
            size="sm"
            onClick={onOpenBosses}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40"
          >
            <Plus className="w-3 h-3 mr-1" /> Invocar
          </Button>
        </div>
      </motion.div>
    );
  }

  const tasks = current.tasks || [];
  const doneToday = tasks.filter(t => t.doneDates.includes(today)).length;
  const pct = Math.max(0, (current.hp / current.maxHp) * 100);

  return (
    <motion.button
      type="button"
      onClick={onOpenBosses}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="rpg-panel relative overflow-hidden border-red-500/40 text-left w-full block cursor-pointer hover:border-red-400/70 transition-colors"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-transparent to-red-500/5 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <p className="font-display text-xs tracking-[0.2em] text-red-400">👹 INIMIGO ATUAL</p>
          <span className="ml-auto text-[10px] text-foreground/50">
            {doneToday}/{tasks.length} hoje
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="text-4xl shrink-0"
            animate={pct <= 25 ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >{current.emoji}</motion.div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm text-red-300 truncate">{current.name}</div>
            <p className="text-[11px] text-foreground/60 line-clamp-2">{current.description}</p>
          </div>
        </div>

        <div className="relative h-3 bg-background/70 rounded-full overflow-hidden border border-red-500/40">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-700 via-red-500 to-red-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display text-white drop-shadow">
            {current.hp} / {current.maxHp} HP
          </span>
        </div>
      </div>
    </motion.button>
  );
}
