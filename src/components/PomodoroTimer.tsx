import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useGame } from '@/lib/GameContext';

type Mode = 'focus' | 'short' | 'long';
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const LABELS: Record<Mode, string> = { focus: 'Foco', short: 'Pausa Curta', long: 'Pausa Longa' };

function playAlarm() {
  try {
    const ctx = new AudioContext();
    const times = [0, 0.25, 0.5];
    times.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch {}
}

export default function PomodoroTimer() {
  const { state, setState } = useGame();
  const [mode, setMode] = useState<Mode>('focus');
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(DURATIONS.focus);
  const [backgroundMode, setBackgroundMode] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmPlayed = useRef(false);
  const restored = useRef(false);

  // Restore from background state on mount
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const ps = state.pomodoroStartedAt;
    const pd = state.pomodoroDuration;
    const pm = state.pomodoroMode as Mode | undefined;
    if (ps && pd && pm) {
      setBackgroundMode(true);
      setMode(pm);
      const elapsed = Math.floor((Date.now() - ps) / 1000);
      const remaining = pd - elapsed;
      if (remaining > 0) {
        setSeconds(remaining);
        setRunning(true);
      } else {
        setSeconds(0);
        setRunning(false);
        playAlarm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePomodoroBg = useCallback((startedAt: number | null, duration: number | null, bgMode: string | null) => {
    setState(prev => ({ ...prev, pomodoroStartedAt: startedAt, pomodoroDuration: duration, pomodoroMode: bgMode }));
  }, [setState]);

  // Tick logic
  useEffect(() => {
    if (!running || seconds <= 0) {
      if (interval.current) clearInterval(interval.current);
      return;
    }

    interval.current = setInterval(() => {
      if (backgroundMode && state.pomodoroStartedAt && state.pomodoroDuration) {
        const elapsed = Math.floor((Date.now() - state.pomodoroStartedAt) / 1000);
        const remaining = Math.max(0, state.pomodoroDuration - elapsed);
        setSeconds(remaining);
      } else {
        setSeconds(s => Math.max(0, s - 1));
      }
    }, 1000);

    return () => { if (interval.current) clearInterval(interval.current); };
  }, [running, seconds, backgroundMode, state.pomodoroStartedAt, state.pomodoroDuration]);

  // Handle timer completion
  useEffect(() => {
    if (seconds === 0 && !alarmPlayed.current) {
      setRunning(false);
      alarmPlayed.current = true;
      playAlarm();
      if (backgroundMode) {
        updatePomodoroBg(null, null, null);
      }
    }
    if (seconds > 0) {
      alarmPlayed.current = false;
    }
  }, [seconds, backgroundMode, updatePomodoroBg]);

  const startTimer = useCallback(() => {
    setRunning(true);
    alarmPlayed.current = false;
    if (backgroundMode) {
      updatePomodoroBg(Date.now(), seconds, mode);
    }
  }, [backgroundMode, seconds, mode, updatePomodoroBg]);

  const pauseTimer = useCallback(() => {
    setRunning(false);
    if (backgroundMode) {
      updatePomodoroBg(null, seconds, mode);
    }
  }, [backgroundMode, seconds, mode, updatePomodoroBg]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setSeconds(DURATIONS[m]);
    setRunning(false);
    alarmPlayed.current = false;
    if (backgroundMode) updatePomodoroBg(null, null, null);
  };

  const reset = () => {
    setSeconds(DURATIONS[mode]);
    setRunning(false);
    alarmPlayed.current = false;
    if (backgroundMode) updatePomodoroBg(null, null, null);
  };

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const progress = ((DURATIONS[mode] - seconds) / DURATIONS[mode]) * 100;

  return (
    <div className="rpg-panel neon-glow space-y-4">
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
        <Button size="sm" onClick={() => running ? pauseTimer() : startTimer()}>
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="secondary" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <Moon className="w-3.5 h-3.5" />
          Continuar em background
        </label>
        <Switch
          checked={backgroundMode}
          onCheckedChange={setBackgroundMode}
          disabled={running}
        />
      </div>
    </div>
  );
}
