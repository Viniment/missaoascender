import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Skull } from 'lucide-react';
import { computeMonsterHp } from '@/lib/gameStore';
import { useMemo } from 'react';

export default function MonsterIndicator() {
  const { state } = useGame();

  // HP derived from real history of habits + missions (last 30 days, weighted).
  const hp = useMemo(() => computeMonsterHp(state), [state]);
  const reason = state.monster?.lastReason;

  // Detect dormant state (no events in window)
  const hasAnyEvent = useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;
    for (const h of state.habits || []) {
      for (const dateStr of Object.keys(h.history || {})) {
        if ((now - new Date(dateStr + 'T12:00:00').getTime()) / DAY <= 30) return true;
      }
    }
    for (const m of state.missions || []) {
      if ((m.completionHistory || []).some(e => (now - new Date(e.date).getTime()) / DAY <= 30)) return true;
      if (m.completedAt && (now - new Date(m.completedAt).getTime()) / DAY <= 30) return true;
    }
    return false;
  }, [state.habits, state.missions]);

  if (state.aiSettings?.monsterEnabled === false) return null;

  // Stage by HP
  const stage = !hasAnyEvent
    ? { label: 'ADORMECIDO', color: 'success', desc: 'Aja para acordá-lo… ou enterre-o de vez.' }
    : hp >= 80 ? { label: 'COLOSSO', color: 'destructive', desc: 'Te domina. Cada fuga o engorda.' }
    : hp >= 60 ? { label: 'ATIVO', color: 'destructive', desc: 'Cresceu. Está vencendo as últimas batalhas.' }
    : hp >= 40 ? { label: 'CRESCENDO', color: 'warning', desc: 'Se alimentando das suas falhas.' }
    : hp >= 20 ? { label: 'FRACO', color: 'success', desc: 'Recuando. Continue agindo.' }
    :             { label: 'AGONIZANTE', color: 'success', desc: 'Quase morto. Não solte agora.' };

  const colorClass =
    stage.color === 'destructive' ? 'text-destructive border-destructive/40 bg-destructive/10' :
    stage.color === 'warning' ? 'text-warning border-warning/40 bg-warning/10' :
    'text-success border-success/40 bg-success/10';

  const barColor =
    stage.color === 'destructive' ? 'bg-destructive' :
    stage.color === 'warning' ? 'bg-warning' :
    'bg-success';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rpg-panel border ${colorClass}`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Skull className="w-4 h-4 shrink-0" />
        <h3 className="font-display text-xs tracking-widest uppercase min-w-0 flex-1">Monstro da Procrastinação</h3>
        <span className="text-[10px] font-display px-2 py-0.5 rounded border border-current shrink-0 whitespace-nowrap">
          {stage.label}
        </span>
      </div>
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-2">
        <motion.div
          className={`absolute inset-y-0 left-0 ${barColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${hp}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[11px] text-foreground/70 leading-snug">
        HP <span className="font-display">{hp}/100</span> · {stage.desc}
      </p>
      {reason && hasAnyEvent && (
        <p className="text-[10px] text-foreground/50 italic mt-1 truncate">↳ {reason}</p>
      )}
    </motion.div>
  );
}
