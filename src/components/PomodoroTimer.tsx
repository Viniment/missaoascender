import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Mode = 'focus' | 'short' | 'long';
const DURATIONS: Record<Mode, number> = { focus: 50 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: 'Foco', short: 'Pausa Curta', long: 'Pausa Longa' };

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('focus');
  const [seconds, setSeconds] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      interval.current = setInterval(() => setSeconds(s => s - 1), 1000);
    } else {
      if (interval.current) clearInterval(interval.current);
    }
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [running, seconds]);

  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setSeconds(DURATIONS[m]);
    setRunning(false);
  };

  const reset = () => {
    setSeconds(DURATIONS[mode]);
    setRunning(false);
  };

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const progress = ((DURATIONS[mode] - seconds) / DURATIONS[mode]) * 100;

  return (
    <div className="rpg-panel space-y-4">
      <h3 className="font-display text-sm text-primary glow-text-purple flex items-center gap-2">
        <Timer className="w-4 h-4" /> POMODORO
      </h3>

      <div className="flex gap-1">
        {(Object.keys(DURATIONS) as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 text-xs font-display py-1.5 rounded-md transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {LABELS[m]}
          </button>
        ))}
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            style={{ filter: 'drop-shadow(0 0 6px hsl(263 93% 58% / 0.5))' }}
          />
        </svg>
        <span className="absolute font-display text-2xl text-foreground">
          {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
        </span>
      </div>

      <div className="flex gap-2 justify-center">
        <Button size="sm" onClick={() => setRunning(!running)}>
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="secondary" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
