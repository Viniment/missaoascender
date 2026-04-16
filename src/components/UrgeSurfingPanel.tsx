import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Play, X, Clock, Trophy, Zap, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/lib/GameContext';
import { getTodayBrasilia } from '@/lib/utils';

type ImpulseType = 'eating' | 'procrastination' | 'anxiety';
type SessionPhase = 'idle' | 'active' | 'abandoned' | 'completed';

const DURATIONS = [
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
];

const IMPULSE_LABELS: Record<ImpulseType, string> = {
  eating: 'Compulsão Alimentar',
  procrastination: 'Procrastinação',
  anxiety: 'Ansiedade',
};

const IMPULSE_ICONS: Record<ImpulseType, string> = {
  eating: '🍔',
  procrastination: '💤',
  anxiety: '⚡',
};

const MONSTER_SPEECH: Record<ImpulseType, string[]> = {
  eating: [
    '"Só hoje… você merece."',
    '"Um pouquinho não faz mal…"',
    '"Ninguém precisa saber."',
    '"Você já tentou resistir antes e não funcionou."',
  ],
  procrastination: [
    '"Depois você faz… relaxa agora."',
    '"Amanhã é um dia melhor pra isso."',
    '"Só mais 5 minutos…"',
    '"Você já fez bastante hoje."',
  ],
  anxiety: [
    '"Você não vai aguentar isso."',
    '"Algo terrível vai acontecer."',
    '"Você precisa agir agora ou…"',
    '"Não vai passar nunca."',
  ],
};

const GUIDE_MESSAGES = {
  start: [
    'Feche os olhos. Sinta onde o impulso aparece no seu corpo: peito, estômago, garganta…',
    'Não tente lutar contra a vontade. Apenas observe ela como se fosse uma onda no mar.',
    'O impulso é como uma onda: ele sobe, atinge um pico e depois desce sozinho.',
    'Acompanhe a respiração 4-7-8. Inspire pelo nariz por 4 segundos.',
  ],
  mid: [
    'Você está surfando a onda. Cada segundo que passa, o impulso perde força.',
    'Note: a vontade muda de intensidade. Ela não é constante — vai e volta.',
    'Segure o ar por 7 segundos. Isso desacelera seus batimentos e acalma a mente.',
    'Nenhum impulso dura para sempre. A maioria passa em 15 a 20 minutos.',
    'Expire lentamente pela boca por 8 segundos. Solte a tensão junto com o ar.',
  ],
  end: [
    'O pico já passou. O impulso está perdendo força agora.',
    'Você escolheu não reagir — e isso reconecta seu cérebro a cada vez.',
    'Cada sessão que você completa torna a próxima mais fácil. Isso é neuroplasticidade.',
    'Você está provando que consegue sentir sem precisar agir.',
  ],
};

const BREATHING_PHASES = ['Inspire…', 'Segure…', 'Expire pela boca…'];
const BREATHING_DURATIONS = [4, 7, 8]; // técnica 4-7-8

interface UrgeSurfingStats {
  totalSessions: number;
  totalCompleted: number;
  streak: number;
  lastSessionDate: string | null;
}

function getStats(state: any): UrgeSurfingStats {
  return state.urgeSurfingStats || { totalSessions: 0, totalCompleted: 0, streak: 0, lastSessionDate: null };
}

export default function UrgeSurfingPanel() {
  const { state, setState, addXp } = useGame();
  const stats = getStats(state);

  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [impulseType, setImpulseType] = useState<ImpulseType>('eating');
  const [duration, setDuration] = useState(180);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [emergency, setEmergency] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentGuide, setCurrentGuide] = useState('');
  const [currentMonsterSpeech, setCurrentMonsterSpeech] = useState('');
  const [breathingPhase, setBreathingPhase] = useState(0);
  const breathingSizeRef = useRef(20);
  const [breathingSize, setBreathingSize] = useState(20);

  // Monster intensity: 1 at start, 0 at end
  const progress = duration > 0 ? (duration - secondsLeft) / duration : 0;
  const monsterIntensity = Math.max(0, 1 - progress * 1.3);
  const waveIntensity = Math.sin(progress * Math.PI * 4) * 0.2 * (1 - progress);

  // Guide messages based on progress
  const progressBucket = Math.floor(progress * 6);
  useEffect(() => {
    if (phase !== 'active') return;
    const messages = progress < 0.33 ? GUIDE_MESSAGES.start
      : progress < 0.66 ? GUIDE_MESSAGES.mid
      : GUIDE_MESSAGES.end;
    const idx = Math.floor(Math.random() * messages.length);
    setCurrentGuide(messages[idx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, progressBucket]);

  // Monster speech
  const monsterBucket = Math.floor(progress * 5);
  useEffect(() => {
    if (phase !== 'active') return;
    const speeches = MONSTER_SPEECH[impulseType];
    if (progress < 0.7) {
      const idx = Math.floor(progress * speeches.length);
      setCurrentMonsterSpeech(speeches[Math.min(idx, speeches.length - 1)]);
    } else {
      setCurrentMonsterSpeech('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, impulseType, monsterBucket]);

  // Breathing cycle — continuous size, no jumps
  useEffect(() => {
    if (phase !== 'active') return;
    const MIN = 20;
    const MAX = 80;
    let phaseIdx = 0;
    let elapsed = 0;
    let currentSize = MIN;
    breathingSizeRef.current = MIN;
    setBreathingSize(MIN);
    setBreathingPhase(0);

    const tick = setInterval(() => {
      elapsed += 0.1;
      const phaseDur = BREATHING_DURATIONS[phaseIdx];

      // Calculate target size and interpolate
      if (phaseIdx === 0) {
        // Inspire (4s): grow from MIN toward MAX
        const t = Math.min(1, elapsed / phaseDur);
        currentSize = MIN + t * (MAX - MIN);
      } else if (phaseIdx === 1) {
        // Segure (7s): hold at MAX
        currentSize = MAX;
      } else if (phaseIdx === 2) {
        // Expire (8s): shrink from MAX toward MIN
        const t = Math.min(1, elapsed / phaseDur);
        currentSize = MAX - t * (MAX - MIN);
      }

      breathingSizeRef.current = currentSize;
      setBreathingSize(currentSize);

      if (elapsed >= phaseDur) {
        elapsed = 0;
        phaseIdx = (phaseIdx + 1) % BREATHING_PHASES.length;
        setBreathingPhase(phaseIdx);
      }
    }, 100);

    return () => clearInterval(tick);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== 'active') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // Session complete
  useEffect(() => {
    if (phase === 'active' && secondsLeft === 0) {
      setPhase('completed');
      const today = getTodayBrasilia();
      const newStreak = stats.lastSessionDate === today ? stats.streak : (stats.streak + 1);
      setState((prev: any) => ({
        ...prev,
        urgeSurfingStats: {
          totalSessions: stats.totalSessions + 1,
          totalCompleted: stats.totalCompleted + 1,
          streak: newStreak,
          lastSessionDate: today,
        },
      }));
      addXp(15, 'Urge Surfing concluído');
    }
  }, [secondsLeft, phase]);

  const startSession = useCallback((dur: number, isEmergency = false) => {
    setDuration(dur);
    setSecondsLeft(dur);
    setPhase('active');
    setEmergency(isEmergency);
  }, []);

  const abandonSession = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('abandoned');
    setState((prev: any) => ({
      ...prev,
      urgeSurfingStats: {
        ...getStats(prev),
        totalSessions: getStats(prev).totalSessions + 1,
      },
    }));
  }, [setState]);

  const resetToIdle = useCallback(() => {
    setPhase('idle');
    setSecondsLeft(duration);
    setEmergency(false);
  }, [duration]);

  const min = Math.floor(secondsLeft / 60);
  const sec = secondsLeft % 60;

  // IDLE VIEW
  if (phase === 'idle') {
    return (
      <div className="rpg-panel neon-glow space-y-6">
        <h3 className="font-display text-sm text-primary glow-text-purple flex items-center gap-2">
          <Flame className="w-4 h-4" /> URGE SURFING
        </h3>

        {/* Stats */}
        {stats.totalCompleted > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="font-display text-lg text-primary">{stats.totalCompleted}</div>
              <div className="text-xs text-foreground">Superados</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="font-display text-lg text-primary">{stats.streak}</div>
              <div className="text-xs text-foreground">Sequência</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="font-display text-lg text-primary">{stats.totalSessions}</div>
              <div className="text-xs text-foreground">Sessões</div>
            </div>
          </div>
        )}

        {/* Impulse type selector */}
        <div className="space-y-2">
          <label className="text-xs font-display text-foreground">TIPO DE IMPULSO</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(IMPULSE_LABELS) as ImpulseType[]).map(type => (
              <button
                key={type}
                onClick={() => setImpulseType(type)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-body transition-all ${
                  impulseType === type
                    ? 'bg-primary/20 text-primary border border-primary/40 neon-glow'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                <span className="text-lg">{IMPULSE_ICONS[type]}</span>
                {IMPULSE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Duration selector */}
        <div className="space-y-2">
          <label className="text-xs font-display text-foreground">DURAÇÃO</label>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button
                key={d.seconds}
                onClick={() => { setDuration(d.seconds); setSecondsLeft(d.seconds); }}
                className={`flex-1 py-2 rounded-md text-xs font-display transition-colors ${
                  duration === d.seconds
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start buttons */}
        <div className="space-y-3">
          <Button className="w-full" onClick={() => startSession(duration)}>
            <Play className="w-4 h-4 mr-2" />
            Iniciar Sessão
          </Button>
          <Button
            variant="destructive"
            className="w-full animate-pulse"
            onClick={() => startSession(180, true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Estou com vontade agora
          </Button>
        </div>
      </div>
    );
  }

  // ACTIVE VIEW
  if (phase === 'active') {
    const MIN_SIZE = 20;
    const MAX_SIZE = 80;
    const currentBreathingSize = breathingSizeRef.current;
    const breathingOpacity = 0.3 + 0.7 * ((currentBreathingSize - MIN_SIZE) / (MAX_SIZE - MIN_SIZE));

    const monsterScale = 0.5 + (monsterIntensity + waveIntensity) * 0.5;
    const monsterOpacity = 0.3 + monsterIntensity * 0.7;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rpg-panel space-y-6 ${emergency ? 'border-red-500/50' : 'neon-glow'}`}
        style={emergency ? { boxShadow: '0 0 30px rgba(239,68,68,0.3)' } : undefined}
      >
        {/* Header with abandon button */}
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm text-primary glow-text-purple flex items-center gap-2">
            <Flame className="w-4 h-4" />
            {emergency ? '🔥 EMERGÊNCIA' : 'URGE SURFING'}
          </h3>
          <button
            onClick={abandonSession}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Monster visualization */}
        <div className="relative flex items-center justify-center h-48">
          {/* Monster */}
          <motion.div
            animate={{
              scale: monsterScale,
              opacity: monsterOpacity,
            }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="absolute"
          >
            <div
              className="text-7xl select-none"
              style={{
                filter: `drop-shadow(0 0 ${20 * monsterIntensity}px hsl(var(--primary) / ${monsterIntensity}))`,
              }}
            >
              🐲
            </div>
          </motion.div>

          {/* Timer overlay */}
          <div className="absolute bottom-0 font-display text-3xl text-foreground glow-text-purple">
            {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
          </div>
        </div>

        {/* Breathing ball */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{
              width: breathingSize,
              height: breathingSize,
            }}
            transition={{ duration: 0.1 }}
            className="rounded-full"
            style={{
              opacity: breathingOpacity,
              background: `radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.2))`,
              boxShadow: `0 0 ${12 + breathingSize * 0.2}px hsl(var(--primary) / 0.4), inset 0 0 ${breathingSize * 0.3}px hsl(var(--primary) / 0.15)`,
            }}
          />
          <motion.div
            key={breathingPhase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-foreground font-display"
          >
            <Wind className="w-3.5 h-3.5" />
            {BREATHING_PHASES[breathingPhase]}
          </motion.div>
        </div>

        {/* Guide message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentGuide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-center text-sm text-foreground font-body italic"
          >
            {currentGuide}
          </motion.p>
        </AnimatePresence>

        {/* Monster speech — marked as the monster talking */}
        <AnimatePresence>
          {currentMonsterSpeech && (
            <motion.div
              key={currentMonsterSpeech}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: monsterIntensity * 0.9, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-center text-xs font-body px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 mx-auto max-w-xs"
            >
              <span className="text-base shrink-0">🐲</span>
              <span className="text-destructive italic">{currentMonsterSpeech}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{
              width: `${progress * 100}%`,
              boxShadow: '0 0 8px hsl(var(--primary) / 0.6)',
            }}
          />
        </div>
      </motion.div>
    );
  }

  // COMPLETED VIEW
  if (phase === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rpg-panel neon-glow space-y-6 text-center"
      >
        <div className="text-5xl">🏆</div>
        <h3 className="font-display text-lg text-primary glow-text-purple">
          IMPULSO SUPERADO
        </h3>
        <p className="text-sm text-foreground font-body">
          Você ficou. E isso muda tudo.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-primary">
          <Trophy className="w-4 h-4" />
          +15 XP • Já superou {stats.totalCompleted} impulso{stats.totalCompleted !== 1 ? 's' : ''}
        </div>
        <Button className="w-full" onClick={resetToIdle}>
          Voltar
        </Button>
      </motion.div>
    );
  }

  // ABANDONED VIEW
  if (phase === 'abandoned') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rpg-panel space-y-6 text-center border-border"
      >
        <div className="text-5xl opacity-50">🐲</div>
        <h3 className="font-display text-sm text-foreground">
          O impulso ainda não passou.
        </h3>
        <p className="text-sm text-foreground font-body">
          Ficar até o fim é o que enfraquece ele.
        </p>
        <Button className="w-full" onClick={resetToIdle}>
          Tentar novamente
        </Button>
      </motion.div>
    );
  }

  return null;
}
