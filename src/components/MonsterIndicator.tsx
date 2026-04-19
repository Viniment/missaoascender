import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Skull, ChevronDown } from 'lucide-react';
import { computeMonsterHp } from '@/lib/gameStore';
import { useMemo, useState } from 'react';

export default function MonsterIndicator() {
  const { state } = useGame();
  const [expanded, setExpanded] = useState(false);

  const hp = useMemo(() => computeMonsterHp(state), [state]);
  const reason = state.monster?.lastReason;

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
      className={`rpg-panel border ${colorClass} p-3 sm:p-4`}
    >
      {/* Compact one-line header (all viewports) */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 text-left"
      >
        <Skull className="w-3.5 h-3.5 shrink-0" />
        <span className="font-display text-[10px] tracking-wider uppercase shrink-0">Monstro</span>
        <span className="text-foreground/40 text-[10px]">·</span>
        <span className="font-display text-[10px] tracking-wider truncate">{stage.label}</span>
        <span className="ml-auto font-display text-[10px] tabular-nums shrink-0">{hp}/100</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
        <motion.div
          className={`absolute inset-y-0 left-0 ${barColor} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${hp}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {expanded && (
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-foreground/70 leading-snug">{stage.desc}</p>
          {reason && hasAnyEvent && (
            <p className="text-[10px] text-foreground/50 italic">↳ {reason}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
