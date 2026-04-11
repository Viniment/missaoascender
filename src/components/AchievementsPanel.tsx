import { useGame } from '@/lib/GameContext';
import { ACHIEVEMENTS, type UnlockedAchievement } from '@/lib/achievements';
import AchievementCard from './AchievementCard';
import { useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  streak: '🔥 Streak',
  habit: '🧠 Hábitos',
  mission: '⚔️ Missões',
  level: '📈 Progressão',
  discipline: '💀 Disciplina',
  special: '👑 Especial',
};

const TYPES = Object.keys(TYPE_LABELS);

export default function AchievementsPanel() {
  const { state } = useGame();
  const unlocked: UnlockedAchievement[] = state.achievements || [];
  const unlockedMap = new Map(unlocked.map(u => [u.id, u]));
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? ACHIEVEMENTS.filter(a => a.type === filter) : ACHIEVEMENTS;
  const totalUnlocked = unlocked.length;
  const total = ACHIEVEMENTS.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-primary glow-text-purple">🏆 Conquistas</h2>
        <span className="text-sm font-body text-muted-foreground">
          {totalUnlocked}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(totalUnlocked / total) * 100}%` }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-2 py-1 rounded-md text-xs font-body transition-colors ${
            !filter ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas
        </button>
        {TYPES.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2 py-1 rounded-md text-xs font-body transition-colors ${
              filter === type ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(a => (
          <AchievementCard
            key={a.id}
            achievement={a}
            unlocked={unlockedMap.get(a.id)}
            compact
          />
        ))}
      </div>
    </div>
  );
}
