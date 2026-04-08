import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Crown, Flame, Coins, Star } from 'lucide-react';

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
      className="rpg-panel"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full border-2 border-primary overflow-hidden glow-purple flex-shrink-0 bg-secondary flex items-center justify-center">
          {state.avatar ? (
            <img src={state.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-display text-primary">{state.name[0]}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-display text-lg text-foreground truncate">{state.name}</h2>
            <span className={`font-display text-sm font-bold ${rankColors[state.rank]}`}>
              [{state.rank}]
            </span>
          </div>
          <p className="text-xs text-muted-foreground italic mb-2">"{state.title}"</p>

          {/* XP Bar */}
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 xp-bar rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display text-primary-foreground">
              {state.xp} / {state.xpToNext} XP
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <Stat icon={<Star className="w-3.5 h-3.5 text-primary" />} label="Nível" value={state.level} />
        <Stat icon={<Crown className="w-3.5 h-3.5 text-gold" />} label="Rank" value={state.rank} />
        <Stat icon={<Coins className="w-3.5 h-3.5 text-gold" />} label="Ouro" value={state.gold} />
        <Stat icon={<Flame className="w-3.5 h-3.5 text-destructive" />} label="Streak" value={state.streak} />
      </div>
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 rounded-md bg-secondary/50">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-display text-sm text-foreground">{value}</span>
    </div>
  );
}
