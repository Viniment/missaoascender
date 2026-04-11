import { getRankStyle, type AchievementDef, type UnlockedAchievement } from '@/lib/achievements';

interface Props {
  achievement: AchievementDef;
  unlocked?: UnlockedAchievement;
  compact?: boolean;
}

export default function AchievementCard({ achievement, unlocked, compact }: Props) {
  const style = getRankStyle(achievement.rank);
  const isUnlocked = !!unlocked;

  return (
    <div
      className={`relative rounded-xl border-2 ${style.border} bg-gradient-to-br ${style.bg} 
        ${isUnlocked ? `shadow-lg ${style.glow}` : 'opacity-40 grayscale'}
        ${compact ? 'p-3' : 'p-4'} transition-all duration-300 overflow-hidden`}
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
