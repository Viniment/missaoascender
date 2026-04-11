import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getRankStyle, type AchievementDef, type UnlockedAchievement } from '@/lib/achievements';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';

interface Props {
  achievement: AchievementDef | null;
  unlocked?: UnlockedAchievement;
  open: boolean;
  onClose: () => void;
}

export default function AchievementDetailDialog({ achievement, unlocked, open, onClose }: Props) {
  const { state } = useGame();
  if (!achievement) return null;

  const style = getRankStyle(achievement.rank);
  const isUnlocked = !!unlocked;
  const prog = achievement.progress(state);
  const pct = prog.target > 0 ? Math.min(100, (prog.current / prog.target) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        {/* Top colored banner */}
        <div className={`relative bg-gradient-to-br ${style.bg} p-6 pb-8 border-b-2 ${style.border}`}>
          {isUnlocked && ['S', 'Monarca'].includes(achievement.rank) && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse pointer-events-none" />
          )}
          <div className="relative flex flex-col items-center text-center gap-3">
            <motion.span
              className="text-5xl drop-shadow-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              {achievement.icon}
            </motion.span>
            <DialogHeader className="space-y-1">
              <DialogTitle className={`font-display text-lg ${style.text} font-bold`}>
                {achievement.label}
              </DialogTitle>
            </DialogHeader>
            <span className={`text-[11px] font-body px-3 py-0.5 rounded-full ${style.border} border bg-black/30 ${style.text}`}>
              Rank {achievement.rank}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Description */}
          <p className="text-sm font-body text-muted-foreground text-center italic">
            "{achievement.description}"
          </p>

          {/* Progress bar */}
          {!isUnlocked && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-body text-muted-foreground">
                <span>Progresso</span>
                <span className={style.text}>{prog.current}/{prog.target}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${style.bg}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {pct === 0 ? 'Ainda não iniciado' : pct < 50 ? 'Continue assim!' : pct < 100 ? 'Quase lá! 🔥' : ''}
              </p>
            </div>
          )}

          {/* Unlocked date */}
          {isUnlocked && unlocked && (
            <div className="flex items-center justify-center gap-2 text-sm font-body">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">
                Desbloqueada em {new Date(unlocked.unlockedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {/* Requirements */}
          <div className="space-y-2">
            <h4 className="text-xs font-display text-foreground uppercase tracking-wider">
              {isUnlocked ? '✅ Requisitos Cumpridos' : '🔒 Requisitos para Desbloquear'}
            </h4>
            <ul className="space-y-1.5">
              {achievement.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-body">
                  {isUnlocked ? (
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <span className={isUnlocked ? 'text-emerald-300/80' : 'text-muted-foreground'}>
                    {req}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Motivational tip for locked */}
          {!isUnlocked && pct > 0 && (
            <div className={`text-center text-xs font-body px-3 py-2 rounded-lg border ${style.border} bg-gradient-to-r ${style.bg} bg-opacity-20`}>
              <span className={style.text}>
                {pct >= 75 ? '🔥 Você está muito perto! Não pare agora!' :
                 pct >= 50 ? '💪 Metade do caminho percorrido!' :
                 '⚡ Cada passo conta. Continue evoluindo!'}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
