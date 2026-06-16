import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Skull } from 'lucide-react';
import { useGame } from '@/lib/GameContext';
import { cn } from '@/lib/utils';

const DAY_MS = 86_400_000;

/**
 * Balança de identidade — mostra quem está vencendo nos últimos 14 dias:
 * o Alter Ego (quando você cumpre) ou o Inimigo Interno (quando você sabota).
 *
 * Pontuação:
 *  +1 por hábito 'done', -1 por hábito 'failed'
 *  +2 por missão concluída, -2 por missão falhada
 *  -1.5 por padrão de sabotagem não resolvido detectado nos últimos 14d
 *  Decay linear: eventos do dia de hoje pesam 1.0, eventos de 14d atrás pesam ~0.2
 */
export default function IdentityBalance() {
  const { state } = useGame();
  const ae = state.alterEgo;
  const ie = state.innerEnemy;

  const { aePoints, iePoints, total, aePct, leader, leadName, intensity, hasData } = useMemo(() => {
    const now = Date.now();
    const weight = (iso: string) => {
      const age = (now - new Date(iso).getTime()) / DAY_MS;
      if (age < 0 || age > 14) return 0;
      return 1 - (age / 14) * 0.8; // 1.0 → 0.2
    };

    let aeRaw = 0;
    let ieRaw = 0;

    // Hábitos
    for (const h of state.habits || []) {
      for (const [date, status] of Object.entries(h.history || {})) {
        const w = weight(`${date}T12:00:00`);
        if (w === 0) continue;
        if (status === 'done') aeRaw += w;
        else if (status === 'failed') ieRaw += w;
      }
    }

    // Missões
    for (const m of state.missions || []) {
      if (m.completedAt) {
        const w = weight(m.completedAt);
        if (w > 0) {
          if (m.status === 'Concluída') aeRaw += 2 * w;
          else if (m.status === 'Falhada') ieRaw += 2 * w;
        }
      }
      if (m.completionHistory) {
        for (const h of m.completionHistory) {
          const w = weight(h.date);
          if (w === 0) continue;
          if (h.failed) ieRaw += 2 * w;
          else aeRaw += 2 * w;
        }
      }
    }

    // Padrões de sabotagem ativos
    for (const sp of state.sabotagePatterns || []) {
      if (sp.resolved) continue;
      const w = weight(sp.detectedAt);
      if (w > 0) ieRaw += 1.5 * w;
    }

    const totalScore = aeRaw + ieRaw;
    const aePercentage = totalScore > 0 ? (aeRaw / totalScore) * 100 : 50;
    const hasAnyData = totalScore > 0.5;

    const isAeLeading = aePercentage >= 50;
    const lead = Math.abs(aePercentage - 50);
    let int: 'equilibrado' | 'leve' | 'forte' | 'dominante' = 'equilibrado';
    if (lead < 5) int = 'equilibrado';
    else if (lead < 15) int = 'leve';
    else if (lead < 30) int = 'forte';
    else int = 'dominante';

    return {
      aePoints: Math.round(aeRaw * 10) / 10,
      iePoints: Math.round(ieRaw * 10) / 10,
      total: totalScore,
      aePct: aePercentage,
      leader: isAeLeading ? ('alter' as const) : ('enemy' as const),
      leadName: isAeLeading ? (ae?.name || 'Alter Ego') : (ie?.name || 'Inimigo Interno'),
      intensity: int,
      hasData: hasAnyData,
    };
  }, [state.habits, state.missions, state.sabotagePatterns, ae?.name, ie?.name]);

  const leaderColor = leader === 'alter' ? 'text-primary' : 'text-destructive';
  const leaderGlow = leader === 'alter'
    ? 'shadow-[0_0_30px_hsl(var(--primary)/0.4)]'
    : 'shadow-[0_0_30px_hsl(var(--destructive)/0.4)]';

  const intensityLabel: Record<typeof intensity, string> = {
    equilibrado: 'em equilíbrio',
    leve: 'liderando por pouco',
    forte: 'vencendo',
    dominante: 'dominando',
  };

  return (
    <div className={cn('rpg-panel space-y-4', leaderGlow)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xs tracking-widest text-foreground/50 uppercase">
          Balança de Identidade
        </h3>
        <span className="text-[10px] font-display tracking-widest text-foreground/40 uppercase">
          14d
        </span>
      </div>

      {!hasData ? (
        <p className="text-xs text-foreground/50 italic text-center py-3">
          Sem dados suficientes ainda. Cumpra ou falhe hábitos e missões e a balança começa a inclinar.
        </p>
      ) : (
        <>
          {/* Quem está vencendo */}
          <div className="text-center space-y-1">
            <p className="text-[10px] font-display tracking-widest text-foreground/50 uppercase">
              Quem você está dando mais ouvido
            </p>
            <motion.p
              key={leadName + intensity}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('font-display text-2xl tracking-wide', leaderColor)}
            >
              {leadName}
            </motion.p>
            <p className="text-[11px] text-foreground/60">
              está {intensityLabel[intensity]} ({Math.round(leader === 'alter' ? aePct : 100 - aePct)}%)
            </p>
          </div>

          {/* Balança visual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-display tracking-wider">
              <span className="flex items-center gap-1.5 text-primary">
                <Shield className="w-3 h-3" />
                <span className="truncate max-w-[110px]">{ae?.name || 'Alter Ego'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-destructive">
                <span className="truncate max-w-[110px] text-right">{ie?.name || 'Inimigo'}</span>
                <Skull className="w-3 h-3" />
              </span>
            </div>

            <div className="relative h-3 rounded-full bg-secondary overflow-hidden border border-border">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: '50%' }}
                animate={{ width: `${aePct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
            </div>

            <div className="flex items-center justify-between text-[10px] text-foreground/50 font-mono">
              <span>+{aePoints}</span>
              <span>{Math.round(aePct)}% / {Math.round(100 - aePct)}%</span>
              <span>-{iePoints}</span>
            </div>
          </div>

          {/* Mensagem-eco */}
          <p className={cn('text-[11px] italic text-center leading-relaxed', leader === 'alter' ? 'text-primary/80' : 'text-destructive/80')}>
            {leader === 'alter'
              ? `Suas ações estão construindo ${ae?.name || 'seu Alter Ego'}.`
              : `${ie?.name || 'Seu inimigo interno'} está sendo escutado. Hora de inclinar a balança.`}
          </p>
        </>
      )}
    </div>
  );
}
