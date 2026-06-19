import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sprout, ChevronDown } from 'lucide-react';
import { useGame } from '@/lib/GameContext';
import { cn } from '@/lib/utils';

const DAY_MS = 86_400_000;

/**
 * Balança de identidade — compacta por padrão, expande ao clicar.
 * Mostra quem está liderando seu diálogo interno nos últimos 14 dias:
 * Alter Ego (identidade futura) vs Eu Atual (padrões atuais, sem julgamento).
 */
export default function IdentityBalance() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);

  const ae = state.alterEgo;
  const ie = state.innerEnemy;

  const { aePoints, csPoints, aePct, leader, leadName, intensity, hasData, habitsDone, habitsFailed, missionsDone, missionsFailed, sabotageCount } = useMemo(() => {
    const now = Date.now();
    const weight = (iso: string) => {
      const age = (now - new Date(iso).getTime()) / DAY_MS;
      if (age < 0 || age > 14) return 0;
      return 1 - (age / 14) * 0.8;
    };

    let aeRaw = 0;
    let csRaw = 0;
    let hD = 0, hF = 0, mD = 0, mF = 0, sC = 0;

    for (const h of state.habits || []) {
      for (const [date, status] of Object.entries(h.history || {})) {
        const w = weight(`${date}T12:00:00`);
        if (w === 0) continue;
        if (status === 'done') { aeRaw += w; hD++; }
        else if (status === 'failed') { csRaw += w; hF++; }
      }
    }

    for (const m of state.missions || []) {
      if (m.completedAt) {
        const w = weight(m.completedAt);
        if (w > 0) {
          if (m.status === 'Concluída') { aeRaw += 2 * w; mD++; }
          else if (m.status === 'Falhada') { csRaw += 2 * w; mF++; }
        }
      }
      if (m.completionHistory) {
        for (const h of m.completionHistory) {
          const w = weight(h.date);
          if (w === 0) continue;
          if (h.failed) { csRaw += 2 * w; mF++; }
          else { aeRaw += 2 * w; mD++; }
        }
      }
    }

    for (const sp of state.sabotagePatterns || []) {
      if (sp.resolved) continue;
      const w = weight(sp.detectedAt);
      if (w > 0) { csRaw += 1.5 * w; sC++; }
    }

    const total = aeRaw + csRaw;
    const aePercentage = total > 0 ? (aeRaw / total) * 100 : 50;
    const isAeLeading = aePercentage >= 50;
    const lead = Math.abs(aePercentage - 50);
    let int: 'equilibrado' | 'leve' | 'forte' | 'dominante' = 'equilibrado';
    if (lead < 5) int = 'equilibrado';
    else if (lead < 15) int = 'leve';
    else if (lead < 30) int = 'forte';
    else int = 'dominante';

    return {
      aePoints: Math.round(aeRaw * 10) / 10,
      csPoints: Math.round(csRaw * 10) / 10,
      aePct: aePercentage,
      leader: isAeLeading ? ('alter' as const) : ('current' as const),
      leadName: isAeLeading ? (ae?.name || 'Alter Ego') : (ie?.name || 'Eu Atual'),
      intensity: int,
      hasData: total > 0.5,
      habitsDone: hD, habitsFailed: hF,
      missionsDone: mD, missionsFailed: mF,
      sabotageCount: sC,
    };
  }, [state.habits, state.missions, state.sabotagePatterns, ae?.name, ie?.name]);

  const leaderColor = leader === 'alter' ? 'text-primary' : 'text-amber-400';
  const intensityLabel: Record<typeof intensity, string> = {
    equilibrado: 'em equilíbrio',
    leve: 'guiando suavemente',
    forte: 'guiando com firmeza',
    dominante: 'guiando o caminho',
  };
  const leadPct = Math.round(leader === 'alter' ? aePct : 100 - aePct);

  return (
    <div className="rpg-panel p-0 overflow-hidden">
      {/* Linha compacta clicável */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 p-3 hover:bg-secondary/40 transition-colors text-left"
        aria-expanded={open}
      >
        {leader === 'alter'
          ? <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          : <Sprout className="w-3.5 h-3.5 text-amber-400 shrink-0" />}

        <div className="flex-1 min-w-0">
          {!hasData ? (
            <p className="text-[11px] text-foreground/50 italic truncate">Balança aguardando ações…</p>
          ) : (
            <div className="flex items-center gap-2">
              <span className={cn('font-display text-sm tracking-wide truncate', leaderColor)}>
                {leadName}
              </span>
              <span className="text-[10px] text-foreground/50 truncate">{intensityLabel[intensity]} · {leadPct}%</span>
            </div>
          )}
          {/* Mini barra */}
          <div className="relative h-1 rounded-full bg-secondary overflow-hidden mt-1.5">
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary"
              initial={false}
              animate={{ width: `${aePct}%` }}
              transition={{ duration: 0.6 }}
            />
            <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
          </div>
        </div>

        <ChevronDown className={cn('w-3.5 h-3.5 text-foreground/40 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Expansível */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-3">
              {!hasData ? (
                <p className="text-[11px] text-foreground/50 italic text-center py-2">
                  Sem dados suficientes ainda. Suas ações vão começar a inclinar a balança aos poucos.
                </p>
              ) : (
                <>
                  <p className="text-[10px] font-display tracking-widest text-foreground/50 uppercase text-center">
                    Quem está liderando seu diálogo (14d)
                  </p>

                  {/* Nomes nas pontas */}
                  <div className="flex items-center justify-between text-[11px] font-display tracking-wider">
                    <span className="flex items-center gap-1.5 text-primary min-w-0">
                      <Shield className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ae?.name || 'Alter Ego'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400 min-w-0">
                      <span className="truncate text-right">{ie?.name || 'Eu Atual'}</span>
                      <Sprout className="w-3 h-3 shrink-0" />
                    </span>
                  </div>

                  {/* Barra grande */}
                  <div className="relative h-3 rounded-full bg-secondary overflow-hidden border border-border">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70"
                      initial={false}
                      animate={{ width: `${aePct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-foreground/60 font-mono">
                    <span>+{aePoints}</span>
                    <span>{Math.round(aePct)}% / {Math.round(100 - aePct)}%</span>
                    <span>+{csPoints}</span>
                  </div>

                  {/* Detalhes */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-md bg-primary/5 border border-primary/20 p-2 space-y-0.5">
                      <p className="text-[9px] font-display tracking-widest text-primary/80 uppercase">Provas do {ae?.name || 'Alter Ego'}</p>
                      <p className="text-foreground/70">{habitsDone} hábitos honrados</p>
                      <p className="text-foreground/70">{missionsDone} missões cumpridas</p>
                    </div>
                    <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-2 space-y-0.5">
                      <p className="text-[9px] font-display tracking-widest text-amber-400/80 uppercase">Padrões do {ie?.name || 'Eu Atual'}</p>
                      <p className="text-foreground/70">{habitsFailed} hábitos em aberto</p>
                      <p className="text-foreground/70">{missionsFailed} missões em aberto</p>
                      {sabotageCount > 0 && <p className="text-foreground/70">{sabotageCount} padrão(ões) para olhar</p>}
                    </div>
                  </div>

                  <p className={cn('text-[11px] italic text-center leading-relaxed', leader === 'alter' ? 'text-primary/80' : 'text-amber-400/80')}>
                    {leader === 'alter'
                      ? `Suas escolhas estão dando vida a ${ae?.name || 'seu Alter Ego'}.`
                      : `O ${ie?.name || 'Eu Atual'} pede atenção e cuidado. Um pequeno passo do ${ae?.name || 'Alter Ego'} já basta.`}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
