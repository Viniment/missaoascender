import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Flame, Coins, Trophy } from 'lucide-react';
import { ACHIEVEMENTS } from '@/lib/achievements';
import IdentityBadge from './IdentityBadge';

const rankColors: Record<string, string> = {
  E: 'text-muted-foreground',
  D: 'text-success',
  C: 'text-neon-blue',
  B: 'text-neon-cyan',
  A: 'text-primary',
  S: 'text-gold',
  Monarca: 'text-gold',
};

export default function PlayerCard() {
  const { state } = useGame();
  const xpPercent = Math.min(100, (state.xp / state.xpToNext) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rpg-panel neon-glow"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative w-16 h-16 rounded-full border-2 border-primary overflow-hidden glow-purple flex-shrink-0 bg-secondary flex items-center justify-center">
          {state.avatar ? (
            <img src={state.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-display text-primary">{state.name[0]}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h2 className="font-display text-base sm:text-lg text-foreground truncate min-w-0 w-full sm:w-auto sm:flex-1">{state.name}</h2>
            <span className={`font-display text-xs font-bold ${rankColors[state.rank]} bg-secondary/80 px-1.5 py-0.5 rounded shrink-0`}>
              {state.rank}
            </span>
            <span className="font-display text-xs font-bold text-foreground bg-secondary/80 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
              Nível {state.level}
            </span>
            <IdentityBadge compact />
          </div>
          <p className="text-xs text-muted-foreground italic mb-2 sm:mb-3 break-words">"{state.title}"</p>

          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 xp-bar-fill rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-2 text-center">
              {state.xp} / {state.xpToNext} XP
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4">
        <Stat icon={<Coins className="w-3.5 h-3.5 text-gold" />} label="Ouro" value={state.gold} />
        <Stat icon={<Flame className="w-3.5 h-3.5 text-destructive" />} label="Streak" value={state.streak} />
        <Stat icon={<Trophy className="w-3.5 h-3.5 text-primary" />} label="Conquistas" value={`${(state.achievements || []).length}/${ACHIEVEMENTS.length}`} />
      </div>
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 px-1 rounded-md bg-secondary/50 min-w-0">
      {icon}
      <span className="text-xs text-foreground truncate max-w-full">{label}</span>
      <span className="font-display text-sm text-foreground truncate max-w-full">{value}</span>
    </div>
  );
}
