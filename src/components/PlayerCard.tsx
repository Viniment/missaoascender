import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Coins, Trophy, Heart } from 'lucide-react';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { formatEmotionalStreak, getRandomAffirmation } from '@/lib/affirmations';
import { useMemo } from 'react';

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
  const streakInfo = formatEmotionalStreak(state.streak);
  const identity = computeIdentityLevel(state);
  // Affirmation rotaciona por dia para sensação cinematográfica sem mudar a cada render.
  const affirmation = useMemo(() => getRandomAffirmation(new Date().toDateString()), []);

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
          <p className="text-xs text-muted-foreground italic mb-1 break-words">"{state.title}"</p>
          <p className="text-[10px] text-primary/70 italic mb-2 sm:mb-3 break-words leading-snug">{affirmation}</p>

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
        <Stat
          icon={<Heart className="w-3.5 h-3.5 text-primary fill-primary/40" />}
          label={`${streakInfo.emoji} ${streakInfo.label}`}
          value={`${state.streak}d`}
        />
        <Stat icon={<Trophy className="w-3.5 h-3.5 text-primary" />} label="Conquistas" value={`${(state.achievements || []).length}/${ACHIEVEMENTS.length}`} />
      </div>

      {/* Becoming — quem você está se tornando */}
      <div className={`mt-4 rounded-md border ${identity.current.bg} px-3 py-2.5`}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Estou me tornando</span>
          <span className={`text-[10px] font-display ${identity.current.color}`}>{Math.round(identity.stability)}%</span>
        </div>
        <p className={`text-sm font-display ${identity.current.color} leading-tight`}>
          {identity.current.label}
        </p>
        <p className="text-[11px] text-foreground/70 italic mt-1 leading-snug">
          {identity.current.description}
        </p>
        <div className="relative h-1.5 mt-2 bg-background/40 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 to-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${identity.progressInLevel * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {identity.next && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Caminhando para <span className={identity.next.color}>{identity.next.label}</span>
          </p>
        )}
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
