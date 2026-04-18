import { useMemo } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

function daysAgo(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

export default function MirrorPanel() {
  const { state } = useGame();

  const stats = useMemo(() => {
    const missions = state.missions || [];
    const habits = state.habits || [];

    // Promises vs actions
    const totalMissions = missions.length;
    const completed = missions.filter(m => m.status === 'Concluída').length;
    const failed = missions.filter(m => m.status === 'Falhada').length;
    const active = missions.filter(m => m.status === 'Ativa').length;
    const completionRate = totalMissions > 0 ? Math.round((completed / totalMissions) * 100) : 0;

    // Habit streaks vs failures (last 7 days)
    const habitFailures7d: Record<string, number> = {};
    const habitDones7d: Record<string, number> = {};
    habits.forEach(h => {
      Object.entries(h.history || {}).forEach(([d, s]) => {
        if (daysAgo(d) <= 7) {
          if (s === 'failed') habitFailures7d[h.name] = (habitFailures7d[h.name] || 0) + 1;
          if (s === 'done') habitDones7d[h.name] = (habitDones7d[h.name] || 0) + 1;
        }
      });
    });

    // Most failed missions (recurring patterns)
    const failureFreq: Record<string, number> = {};
    missions.forEach(m => {
      if (m.status === 'Falhada') failureFreq[m.name] = (failureFreq[m.name] || 0) + 1;
      (m.completionHistory || []).forEach(h => {
        if (h.failed) failureFreq[m.name] = (failureFreq[m.name] || 0) + 1;
      });
    });
    const recurringFailures = Object.entries(failureFreq)
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Total time (executed hours)
    const totalHours = missions.reduce((sum, m) => {
      const own = m.executedHours || 0;
      const histHours = (m.completionHistory || []).reduce((s, h) => s + (h.executedHours || 0), 0);
      return sum + own + histHours;
    }, 0);

    // Failures last 30d
    let failures30d = 0;
    let dones30d = 0;
    habits.forEach(h => {
      Object.entries(h.history || {}).forEach(([d, s]) => {
        if (daysAgo(d) <= 30) {
          if (s === 'failed') failures30d++;
          if (s === 'done') dones30d++;
        }
      });
    });
    missions.forEach(m => {
      (m.completionHistory || []).forEach(h => {
        if (daysAgo(h.date) <= 30) {
          if (h.failed) failures30d++;
          else dones30d++;
        }
      });
      if (m.completedAt && daysAgo(m.completedAt) <= 30) {
        if (m.status === 'Falhada') failures30d++;
        if (m.status === 'Concluída') dones30d++;
      }
    });

    const consistencyScore = (dones30d + failures30d) > 0
      ? Math.round((dones30d / (dones30d + failures30d)) * 100)
      : 0;

    return {
      totalMissions, completed, failed, active, completionRate,
      habitFailures7d, habitDones7d,
      recurringFailures,
      totalHours,
      failures30d, dones30d, consistencyScore,
    };
  }, [state]);

  const promised = state.awakening?.become?.trim();
  const reject = state.awakening?.reject?.trim();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2 min-w-0">
          <Eye className="w-5 h-5 shrink-0" /> ESPELHO DA VERDADE
        </h2>
      </div>

      <p className="text-xs text-muted-foreground font-body italic">
        Aqui você se vê sem filtro. Promessas vs ações. Padrões vs evolução. Sem fugir.
      </p>

      {/* Promised vs Doing */}
      {(promised || reject) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel border-primary/30">
          <h3 className="font-display text-xs tracking-widest text-primary uppercase mb-3">⚖️ Promessa vs Ação</h3>
          {promised && (
            <div className="mb-2">
              <p className="text-[10px] uppercase text-foreground/50 tracking-wider">Você jurou se tornar</p>
              <p className="text-sm text-foreground/90 italic">"{promised}"</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="text-center p-2 rounded bg-success/10 border border-success/20">
              <p className="text-[10px] uppercase text-success/80">Consistência 30d</p>
              <p className="font-display text-2xl text-success">{stats.consistencyScore}%</p>
            </div>
            <div className="text-center p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-[10px] uppercase text-destructive/80">Falhas 30d</p>
              <p className="font-display text-2xl text-destructive">{stats.failures30d}</p>
            </div>
          </div>
          {reject && stats.consistencyScore < 60 && (
            <p className="text-xs text-destructive/90 mt-3 italic">
              Você diz rejeitar "{reject}" — mas a métrica acima conta outra história.
            </p>
          )}
        </motion.div>
      )}

      {/* Mission completion rate */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel">
        <h3 className="font-display text-xs tracking-widest text-foreground/60 uppercase mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Taxa de Conclusão (Missões)
        </h3>
        <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-2">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stats.completionRate}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">
          <Stat icon={<CheckCircle2 className="w-3 h-3 text-success" />} v={stats.completed} l="Feitas" />
          <Stat icon={<XCircle className="w-3 h-3 text-destructive" />} v={stats.failed} l="Falhas" />
          <Stat icon={<TrendingUp className="w-3 h-3 text-primary" />} v={stats.active} l="Ativas" />
          <Stat icon={<TrendingUp className="w-3 h-3 text-foreground/60" />} v={`${stats.completionRate}%`} l="Taxa" />
        </div>
        <p className="text-[11px] text-foreground/50 mt-3">
          {stats.totalHours.toFixed(1)}h investidas em missões cronometradas.
        </p>
      </motion.div>

      {/* Recurring failure patterns */}
      {stats.recurringFailures.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel border-destructive/30 bg-destructive/5">
          <h3 className="font-display text-xs tracking-widest text-destructive uppercase mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Padrões de Falha Recorrentes
          </h3>
          <ul className="space-y-2">
            {stats.recurringFailures.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between text-sm">
                <span className="text-foreground/90 truncate pr-2">{name}</span>
                <span className="text-destructive font-display text-xs shrink-0">{count}x falhada</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-destructive/80 mt-3 italic">
            Essas tarefas se repetem como padrão. Não é falta de tempo — é padrão.
          </p>
        </motion.div>
      )}

      {/* Habits weekly snapshot */}
      {(state.habits || []).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel">
          <h3 className="font-display text-xs tracking-widest text-foreground/60 uppercase mb-3">
            Hábitos · Últimos 7 dias
          </h3>
          <ul className="space-y-2">
            {state.habits.slice(0, 8).map(h => {
              const d = stats.habitDones7d[h.name] || 0;
              const f = stats.habitFailures7d[h.name] || 0;
              const total = d + f;
              const rate = total > 0 ? Math.round((d / total) * 100) : 0;
              return (
                <li key={h.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/90 truncate pr-2">{h.name}</span>
                    <span className="text-foreground/60 shrink-0">
                      <span className="text-success">{d}✓</span> · <span className="text-destructive">{f}✗</span>
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${rate >= 70 ? 'bg-success' : rate >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}

      {stats.totalMissions === 0 && (state.habits || []).length === 0 && (
        <div className="rpg-panel text-center py-8">
          <p className="text-sm text-foreground/60">
            O espelho ainda não tem o que refletir. Crie missões e hábitos primeiro.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, v, l }: { icon: React.ReactNode; v: number | string; l: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 rounded-md bg-secondary/40">
      {icon}
      <span className="font-display text-sm text-foreground">{v}</span>
      <span className="text-[10px] text-foreground/50 uppercase">{l}</span>
    </div>
  );
}
