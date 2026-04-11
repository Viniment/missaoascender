import { getRankStyle, type AchievementDef, type UnlockedAchievement } from '@/lib/achievements';
import { useGame } from '@/lib/GameContext';

interface Props {
  achievement: AchievementDef;
  unlocked?: UnlockedAchievement;
  compact?: boolean;
  onClick?: () => void;
}

export default function AchievementCard({ achievement, unlocked, compact, onClick }: Props) {
  const { state } = useGame();
  const style = getRankStyle(achievement.rank);
  const isUnlocked = !!unlocked;
  const prog = achievement.progress(state);
  const pct = prog.target > 0 ? Math.min(100, (prog.current / prog.target) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border-2 ${style.border} bg-gradient-to-br ${style.bg} 
        ${isUnlocked ? `shadow-lg ${style.glow}` : 'opacity-50 grayscale hover:opacity-70 hover:grayscale-[50%]'}
        ${compact ? 'p-3' : 'p-4'} transition-all duration-300 overflow-hidden cursor-pointer active:scale-95`}
    >
      {/* Glow overlay for high ranks */}
      {isUnlocked && ['S', 'Monarca'].includes(achievement.rank) && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse pointer-events-none" />
      )}

      <div className="relative flex flex-col items-center text-center gap-2">
        {/* Icon */}
        <span className={`${compact ? 'text-2xl' : 'text-4xl'} drop-shadow-lg`}>
          {achievement.icon}
        </span>

        {/* Label */}
        <h4 className={`font-display ${compact ? 'text-xs' : 'text-sm'} ${style.text} font-bold leading-tight`}>
          {achievement.label}
        </h4>

        {/* Rank badge */}
        <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${style.border} border bg-black/30 ${style.text}`}>
          Rank {achievement.rank}
        </span>

        {/* Mini progress bar for locked */}
        {!isUnlocked && (
          <div className="w-full mt-1">
            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${style.bg} transition-all duration-500`}
                style={{ width: `${pct}%`, filter: 'brightness(1.5)' }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5">{prog.current}/{prog.target}</p>
          </div>
        )}

        {/* Unlock date */}
        {unlocked && (
          <span className="text-[10px] text-muted-foreground font-body">
            {new Date(unlocked.unlockedAt).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}
