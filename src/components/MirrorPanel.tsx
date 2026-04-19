import { useMemo } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, AlertTriangle, CheckCircle2, XCircle, ShieldOff, Waves, Utensils, Repeat, Hourglass, Snowflake, MoonStar, NotebookPen, Clock, Replace, Info, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    const finalized = completed + failed;
    const completionRate = finalized > 0 ? Math.round((completed / finalized) * 100) : 0;

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
      totalMissions, completed, failed, active, finalized, completionRate,
      habitFailures7d, habitDones7d,
      recurringFailures,
      totalHours,
      failures30d, dones30d, consistencyScore,
    };
  }, [state]);

  const monsterHp = state.monster?.hp ?? 0;
  const exercises = useMemo(() => buildExercises({
    recurringFailures: stats.recurringFailures,
    consistencyScore: stats.consistencyScore,
    failures30d: stats.failures30d,
    dones30d: stats.dones30d,
    completionRate: stats.completionRate,
    monsterHp,
    activeMissions: (state.missions || []).filter(m => m.status === 'Ativa').map(m => m.name),
    awakeningBecome: state.awakening?.become,
    hasFinalized: stats.finalized > 0,
  }), [stats, monsterHp, state.missions, state.awakening]);

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
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="ml-1 text-foreground/40 hover:text-foreground/80">
                  <Info className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-xs">
                Calculada apenas sobre missões finalizadas (Concluídas + Falhadas). Ativas não contam.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <Stat icon={<TrendingUp className="w-3 h-3 text-foreground/60" />} v={stats.finalized > 0 ? `${stats.completionRate}%` : '—'} l="Taxa" />
        </div>
        <p className="text-[11px] text-foreground/50 mt-3">
          {stats.totalHours.toFixed(1)}h investidas em missões cronometradas. Taxa baseada em {stats.finalized} missõ{stats.finalized === 1 ? 'ão' : 'es'} finalizada{stats.finalized === 1 ? '' : 's'}.
        </p>
      </motion.div>

      {/* Habit Deactivation Protocol */}
      {exercises.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rpg-panel border-primary/30 bg-primary/5">
          <h3 className="font-display text-xs tracking-widest text-primary uppercase mb-1 flex items-center gap-2">
            <ShieldOff className="w-4 h-4" /> Protocolo de Desativação de Hábitos
          </h3>
          <p className="text-[11px] text-foreground/60 mb-3">
            🧠 Práticas progressivas para enfraquecer o poder dos hábitos automáticos. Não são exercícios pontuais — são treinos que reescrevem o cérebro ao longo de dias e semanas.
          </p>
          <ul className="space-y-2">
            {exercises.map((ex, i) => (
              <li key={i} className="rounded-md border border-border/40 bg-background/40 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary shrink-0">{ex.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-display text-sm text-foreground leading-tight">{ex.name}</p>
                      <span className="text-[10px] uppercase tracking-wider text-primary/70 bg-primary/10 px-2 py-0.5 rounded shrink-0">{ex.duration}</span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1">{ex.howto}</p>
                    <p className="text-[11px] text-primary/80 italic mt-1">{ex.why}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

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

interface ExerciseInput {
  recurringFailures: [string, number][];
  consistencyScore: number;
  failures30d: number;
  dones30d: number;
  completionRate: number;
  monsterHp: number;
  activeMissions: string[];
  awakeningBecome?: string;
  hasFinalized: boolean;
}

interface Exercise {
  name: string;
  howto: string;
  why: string;
  icon: React.ReactNode;
}

function buildExercises(d: ExerciseInput): Exercise[] {
  const out: Exercise[] = [];

  if (d.recurringFailures.length > 0) {
    const [topName, topCount] = d.recurringFailures[0];
    out.push({
      name: 'Regra dos 2 minutos',
      howto: `Faça AGORA uma versão mínima de "${topName}" — só 2 minutos. O objetivo é quebrar a inércia, não terminar.`,
      why: `Detectado: "${topName}" falhou ${topCount}× — o cérebro travou antes de começar. Reduzir o atrito mata o padrão.`,
      icon: <Timer className="w-4 h-4" />,
    });
  }

  if (d.consistencyScore < 50 && d.consistencyScore > 0) {
    out.push({
      name: 'Implementação de Intenção',
      howto: 'Escreva agora: "QUANDO [gatilho específico] acontecer, EU FAREI [ação concreta]". Ex: "Quando acordar, vou beber água antes do celular".',
      why: `Consistência últimos 30d: ${d.consistencyScore}%. Decisões no momento falham — pré-decisões funcionam.`,
      icon: <Target className="w-4 h-4" />,
    });
  }

  if (d.failures30d > d.dones30d && d.failures30d > 0) {
    out.push({
      name: 'Premeditatio Malorum (estoico)',
      howto: 'Pegue papel e escreva por 3 min: "Se eu continuar fugindo dessas tarefas por 1 ano, minha vida será ___". Detalhe sem suavizar.',
      why: `Últimos 30d: ${d.failures30d} falhas vs ${d.dones30d} feitos. O cérebro precisa SENTIR a consequência futura, não só pensar nela.`,
      icon: <BookOpen className="w-4 h-4" />,
    });
  }

  if (d.monsterHp >= 70) {
    out.push({
      name: 'Confronto de Identidade',
      howto: d.awakeningBecome
        ? `Releia em voz alta: "Eu juro me tornar ${d.awakeningBecome}". Depois escreva 1 ação que essa pessoa faria nos próximos 30 minutos — e faça.`
        : 'Vá em "Despertar", releia em voz alta quem você jurou se tornar, e escreva 1 ação que essa pessoa faria agora.',
      why: `Monstro em ${d.monsterHp}/100 — está te dominando. Identidade é o único contra-ataque real.`,
      icon: <Skull className="w-4 h-4" />,
    });
  }

  if (d.completionRate < 40 && d.hasFinalized && d.activeMissions.length > 0) {
    out.push({
      name: 'Decomposição Radical',
      howto: `Pegue "${d.activeMissions[0]}" e quebre em 3 micro-passos de 5 min cada. Faça SÓ o primeiro agora.`,
      why: `Taxa de ${d.completionRate}% nas finalizadas — missões estão grandes demais pro estado atual. Reduza ou trave.`,
      icon: <Scissors className="w-4 h-4" />,
    });
  }

  // Sempre presentes — regulação emocional
  out.push({
    name: 'Box Breathing 4-4-4-4',
    howto: 'Antes da próxima tarefa: inspire 4s · segure 4s · expire 4s · segure 4s. Repita 4 ciclos. Dispara o sistema parassimpático.',
    why: 'Procrastinação raramente é preguiça — é desregulação emocional. Acalmar o sistema vem antes de agir.',
    icon: <Wind className="w-4 h-4" />,
  });

  out.push({
    name: 'Visualização do Eu Futuro',
    howto: 'Feche os olhos por 60s. Sinta (não pense) como será TER FEITO a tarefa: o alívio, o orgulho, o corpo relaxado. Depois abra e comece.',
    why: 'O cérebro responde a recompensa antecipada. Associa prazer à ação antes de executá-la.',
    icon: <Sparkles className="w-4 h-4" />,
  });

  return out.slice(0, 6);
}
