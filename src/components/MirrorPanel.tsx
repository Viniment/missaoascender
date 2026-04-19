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
  duration: string;
  icon: React.ReactNode;
  priority: number;
}

function buildExercises(d: ExerciseInput): Exercise[] {
  const out: Exercise[] = [];
  const topFailure = d.recurringFailures[0]?.[0];
  const topCount = d.recurringFailures[0]?.[1];

  if (d.recurringFailures.length > 0 || d.monsterHp >= 60) {
    out.push({
      name: 'Urge Surfing',
      howto: 'Quando o impulso de fugir/procrastinar vier, sente-se. Observe a sensação no corpo por 5-10 min sem agir. Note onde dói, como pulsa. Não lute, não obedeça — só observe até passar.',
      why: topFailure
        ? `Detectado: "${topFailure}" falhou ${topCount}× — o impulso está vencendo. Urge surfing ensina o cérebro que o impulso passa sem ser obedecido.`
        : `Monstro em ${d.monsterHp}/100 — o impulso está te dominando. Treinar a observar sem agir desativa o automatismo.`,
      duration: 'Sempre que vier',
      icon: <Waves className="w-4 h-4" />,
      priority: 10,
    });
  }

  if (d.consistencyScore < 50 && d.consistencyScore > 0) {
    out.push({
      name: 'Jejum de Dopamina (24h)',
      howto: '1 dia inteiro sem: redes sociais, doces, pornô, jogos, streaming, notícias. Só trabalho real, leitura, exercício, conversas presenciais. Reseta a sensibilidade dos receptores de dopamina.',
      why: `Consistência últimos 30d: ${d.consistencyScore}%. Receptores saturados — qualquer coisa difícil parece insuportável. Jejum recalibra o sistema.`,
      duration: '1× por semana',
      icon: <ShieldOff className="w-4 h-4" />,
      priority: 9,
    });
  }

  out.push({
    name: 'Diário de Gatilhos',
    howto: 'Toda vez que o impulso de procrastinar/sabotar vier: anote em 3 colunas — HORA, CONTEXTO (onde estava, o que fazia), EMOÇÃO (tédio, ansiedade, raiva). Não julgue, só registre.',
    why: 'Em 7 dias o padrão fica visível: você descobre os gatilhos exatos. Sem ver o gatilho, não há como desativá-lo.',
    duration: 'Praticar por 7 dias',
    icon: <NotebookPen className="w-4 h-4" />,
    priority: 7,
  });

  out.push({
    name: 'Regra dos 10 Minutos',
    howto: 'Quando bater o impulso de ceder ao mau hábito (rolar feed, comer compulsivo, etc), espere 10 minutos. Pode ceder depois — mas só depois. Use timer.',
    why: 'O pico do impulso dura 90s-10min. Esperar treina o córtex pré-frontal a vencer o sistema límbico. Quase sempre o impulso some.',
    duration: 'Sempre que vier',
    icon: <Clock className="w-4 h-4" />,
    priority: 7,
  });

  if (d.recurringFailures.length > 0) {
    out.push({
      name: 'Habit Stacking Reverso',
      howto: topFailure
        ? `Logo após o gatilho que normalmente leva a falhar "${topFailure}", insira 2 minutos da ação OPOSTA. Ex: pegou o celular? Faça 10 flexões antes de desbloquear.`
        : 'Logo após o gatilho do mau hábito, insira 2 minutos da ação oposta. Ex: pegou o celular? Faça 10 flexões antes de desbloquear.',
      why: 'Reescreve a rota neural: o gatilho deixa de levar à fuga e passa a levar à ação. Em 21 dias, vira automático.',
      duration: 'Praticar por 21 dias',
      icon: <Repeat className="w-4 h-4" />,
      priority: 8,
    });

    out.push({
      name: 'Substituição de Recompensa',
      howto: 'Identifique a recompensa real do mau hábito (alívio? prazer? estímulo?). Liste 3 alternativas saudáveis que entregam o mesmo neurotransmissor. Use uma delas quando o impulso vier.',
      why: 'O cérebro não larga um hábito — ele troca por outro. Sem recompensa substituta, o velho hábito sempre volta.',
      duration: 'Praticar por 30 dias',
      icon: <Replace className="w-4 h-4" />,
      priority: 6,
    });
  }

  if (d.completionRate < 40 && d.hasFinalized) {
    out.push({
      name: 'Janela de Atenção (Pomodoro com sofrimento)',
      howto: '25 min cravados na tarefa difícil. Se vier impulso de fugir, escreva o impulso num papel ao lado e CONTINUE. Ao fim, 5 min de pausa real (sem tela).',
      why: `Taxa de ${d.completionRate}% nas finalizadas — você foge antes de entrar em foco profundo. Treinar tolerar o desconforto inicial é a chave.`,
      duration: '3× ao dia',
      icon: <Hourglass className="w-4 h-4" />,
      priority: 8,
    });
  }

  if (d.monsterHp >= 70) {
    out.push({
      name: 'Cold Exposure',
      howto: 'Banho frio de 2 minutos por dia (água o mais fria possível). Comece em 30s e suba. Respire pelo nariz, não fuja.',
      why: `Monstro em ${d.monsterHp}/100 — sua tolerância ao desconforto está zerada. Frio treina o sistema nervoso a NÃO fugir do desconforto. Vira músculo.`,
      duration: 'Diário por 30 dias',
      icon: <Snowflake className="w-4 h-4" />,
      priority: 9,
    });
  }

  out.push({
    name: 'Mindful Eating',
    howto: '1 refeição por dia sem tela, sem pressa. Mastigue cada garfada 20×. Sinta sabor, textura, temperatura. Pouse o talher entre garfadas.',
    why: 'Religa a consciência ao corpo. Quem come no automático, vive no automático. É treino de presença barato e diário.',
    duration: '1× ao dia',
    icon: <Utensils className="w-4 h-4" />,
    priority: 5,
  });

  out.push({
    name: 'Digital Sunset',
    howto: 'Sem tela (celular, TV, computador) por 1 hora antes de dormir. Substitua por leitura física, conversa, ou nada. Celular fora do quarto.',
    why: 'Tela noturna destrói sono profundo → dia seguinte sem função executiva → você procrastina sem conseguir reagir. Restaurar o sono é restaurar a vontade.',
    duration: 'Praticar por 7 dias',
    icon: <MoonStar className="w-4 h-4" />,
    priority: 6,
  });

  return out.sort((a, b) => b.priority - a.priority).slice(0, 6);
}
