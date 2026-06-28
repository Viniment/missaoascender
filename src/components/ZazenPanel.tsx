import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useGame } from '@/lib/GameContext';
import { Settings as SettingsIcon, X, Maximize2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

type Phase = 'idle' | 'intro' | 'session' | 'done';

const DURATIONS = [5, 10, 15, 20];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// soft tibetan-style bell via WebAudio
function playBell(kind: 'start' | 'end') {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const freqs = kind === 'start' ? [528, 1056, 1584] : [432, 864, 1296];
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 6);
    master.connect(ctx.destination);
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.6 / (i + 1), now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 5.5 - i * 0.8);
      o.connect(g); g.connect(master);
      o.start(now);
      o.stop(now + 6);
    });
    setTimeout(() => ctx.close().catch(() => {}), 6500);
  } catch { /* ignore */ }
}

function HistoryView() {
  const { state } = useGame();
  const sessions = state.zazenSessions || [];

  const stats = useMemo(() => {
    const totalSec = sessions.reduce((s, x) => s + x.completedSec, 0);
    const totalDist = sessions.reduce((s, x) => s + x.distractions, 0);
    const avgDist = sessions.length ? totalDist / sessions.length : 0;

    // consecutive days
    const dates = new Set(sessions.map(s => s.date.slice(0, 10)));
    let streak = 0;
    let best = 0;
    // streak ending today
    const today = new Date();
    for (let i = 0; i < 3650; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (dates.has(key)) streak++; else break;
    }
    // best streak overall
    const sorted = [...dates].sort();
    let cur = 0; let prev: Date | null = null;
    sorted.forEach(k => {
      const d = new Date(k);
      if (prev && (d.getTime() - prev.getTime()) === 86400000) cur++;
      else cur = 1;
      if (cur > best) best = cur;
      prev = d;
    });

    // weekly chart (last 7 days minutes)
    const week: { day: string; min: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const min = sessions
        .filter(s => s.date.slice(0, 10) === key)
        .reduce((acc, s) => acc + s.completedSec / 60, 0);
      week.push({ day: ['D','S','T','Q','Q','S','S'][d.getDay()], min });
    }
    const maxMin = Math.max(1, ...week.map(w => w.min));

    return { totalSec, avgDist, streak, best, week, maxMin };
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <p className="text-foreground/40 text-sm text-center py-8">
        Nenhuma sessão registrada ainda.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">Sequência</p>
          <p className="text-2xl font-light mt-1 text-foreground">{stats.streak}d</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">Maior</p>
          <p className="text-2xl font-light mt-1 text-foreground">{stats.best}d</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">Total</p>
          <p className="text-2xl font-light mt-1 text-foreground">{Math.round(stats.totalSec / 60)}m</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">Distrações/sessão</p>
          <p className="text-2xl font-light mt-1 text-foreground">{stats.avgDist.toFixed(1)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-background/40 p-4">
        <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-3">Últimos 7 dias (min)</p>
        <div className="flex items-end gap-2 h-32">
          {stats.week.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-foreground/30 rounded-sm transition-all"
                  style={{ height: `${(w.min / stats.maxMin) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-foreground/40">{w.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { state, updateZazenSettings } = useGame();
  const s = state.zazenSettings || {
    startBell: true, endBell: true, breathingMode: true,
    showTimerHint: true, showDistractionCount: true, autoFullscreen: true,
  };
  const Row = ({ label, value, k }: { label: string; value: boolean; k: keyof typeof s }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <span className="text-sm text-foreground/80">{label}</span>
      <Switch checked={value} onCheckedChange={(v) => updateZazenSettings({ [k]: v } as Partial<typeof s>)} />
    </div>
  );
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm tracking-widest uppercase text-foreground/60">Configurações</h3>
        <button onClick={onClose} className="text-foreground/40 hover:text-foreground/80 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <Row label="Som inicial" value={s.startBell} k="startBell" />
      <Row label="Som final" value={s.endBell} k="endBell" />
      <Row label="Modo Respiração" value={s.breathingMode} k="breathingMode" />
      <Row label="Mostrar Timer (ao mover o mouse)" value={s.showTimerHint} k="showTimerHint" />
      <Row label="Mostrar contador de distrações" value={s.showDistractionCount} k="showDistractionCount" />
      <Row label="Tela cheia automática" value={s.autoFullscreen} k="autoFullscreen" />
    </div>
  );
}

function Session({
  durationMin, onFinish,
}: { durationMin: number; onFinish: (data: { completedSec: number; distractions: number; completed: boolean }) => void }) {
  const { state } = useGame();
  const settings = state.zazenSettings || {
    startBell: true, endBell: true, breathingMode: true,
    showTimerHint: true, showDistractionCount: true, autoFullscreen: true,
  };

  const totalSec = durationMin * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [distractions, setDistractions] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [needsFullscreenBtn, setNeedsFullscreenBtn] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>();
  const startedAt = useRef(Date.now());
  const finished = useRef(false);

  const finish = useCallback((completed: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const completedSec = Math.min(totalSec, Math.round((Date.now() - startedAt.current) / 1000));
    if (settings.endBell && completed) playBell('end');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onFinish({ completedSec, distractions, completed });
  }, [totalSec, distractions, onFinish, settings.endBell]);

  // Start bell + fullscreen
  useEffect(() => {
    if (settings.startBell) playBell('start');
    if (settings.autoFullscreen) {
      const el = document.documentElement;
      const req = el.requestFullscreen?.bind(el);
      if (req) {
        req().catch(() => setNeedsFullscreenBtn(true));
      } else {
        setNeedsFullscreenBtn(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown
  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(t); finish(true); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finish]);

  const revealHint = useCallback(() => {
    if (!settings.showTimerHint) return;
    setShowHint(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(false), 2500);
  }, [settings.showTimerHint]);

  // mouse near top
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (e.clientY < 60) revealHint(); };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [revealHint]);

  // keyboard: Esc reveals hint, Space registers distraction
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        revealHint();
      } else if (e.code === 'Space') {
        e.preventDefault();
        registerDistraction();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealHint]);

  const registerDistraction = useCallback(() => {
    setDistractions(d => d + 1);
    setPulse(true);
    setTimeout(() => setPulse(false), 1200);
  }, []);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().then(() => setNeedsFullscreenBtn(false)).catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-none"
      style={{ animation: 'zazenFadeIn 1.6s ease-out both' }}
      onClick={registerDistraction}
      onTouchStart={registerDistraction}
    >
      <style>{`
        @keyframes zazenFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zazenDotAppear { from { opacity: 0; transform: scale(0.6) } to { opacity: 1; transform: scale(1) } }
        @keyframes zazenBreath {
          0%, 100% { transform: scale(1) }
          50% { transform: scale(1.02) }
        }
        @keyframes zazenPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.18) }
          100% { box-shadow: 0 0 0 28px rgba(255,255,255,0) }
        }
      `}</style>

      <div
        className="rounded-full bg-neutral-500/70"
        style={{
          width: 18,
          height: 18,
          animation: `zazenDotAppear 2.4s ease-out both${settings.breathingMode ? ', zazenBreath 8s ease-in-out 2.4s infinite' : ''}`,
        }}
      >
        {pulse && (
          <div
            className="absolute inset-0 rounded-full"
            style={{ animation: 'zazenPulse 1.2s ease-out forwards' }}
          />
        )}
      </div>

      {/* Timer hint */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 text-neutral-500 text-xs tracking-[0.3em] uppercase transition-opacity duration-700"
        style={{ opacity: showHint ? 0.7 : 0 }}
      >
        {formatTime(remaining)} restantes
      </div>

      {settings.showDistractionCount && distractions > 0 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-700 text-[10px] tracking-[0.3em] uppercase transition-opacity duration-700"
          style={{ opacity: showHint ? 0.6 : 0 }}
        >
          {distractions} {distractions === 1 ? 'pensamento observado' : 'pensamentos observados'}
        </div>
      )}

      {needsFullscreenBtn && (
        <button
          onClick={(e) => { e.stopPropagation(); enterFullscreen(); }}
          className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-300 text-[10px] tracking-widest uppercase flex items-center gap-2 transition-colors cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          <Maximize2 className="w-3 h-3" /> Tela Cheia
        </button>
      )}

      {/* discrete end button — only when hint visible */}
      <button
        onClick={(e) => { e.stopPropagation(); finish(false); }}
        className="absolute top-6 right-6 text-neutral-700 hover:text-neutral-400 text-[10px] tracking-[0.3em] uppercase transition-opacity cursor-pointer"
        style={{ opacity: showHint ? 0.6 : 0, pointerEvents: showHint ? 'auto' : 'none' }}
      >
        encerrar
      </button>
    </div>
  );
}

function DoneScreen({
  durationSec, distractions, onClose,
}: { durationSec: number; distractions: number; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center px-6"
      style={{ animation: 'zazenFadeIn 1.6s ease-out both' }}
    >
      <div className="max-w-md text-center space-y-8 text-neutral-300">
        <p className="text-[10px] tracking-[0.4em] uppercase text-neutral-500">Sessão concluída</p>
        <div className="space-y-3">
          <p className="text-4xl font-extralight tracking-widest">{formatTime(durationSec)}</p>
          <p className="text-xs tracking-widest uppercase text-neutral-500">
            {distractions} {distractions === 1 ? 'pensamento percebido' : 'pensamentos percebidos'}
          </p>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed font-light italic">
          "Cada vez que você percebe um pensamento e retorna ao foco, você fortalece sua mente."
        </p>
        <button
          onClick={onClose}
          className="mx-auto px-8 py-3 border border-neutral-700 hover:border-neutral-400 text-neutral-400 hover:text-neutral-100 text-xs tracking-[0.4em] uppercase transition-colors rounded-sm"
        >
          Concluir
        </button>
      </div>
    </div>
  );
}

export default function ZazenPanel() {
  const { addZazenSession } = useGame();
  const [phase, setPhase] = useState<Phase>('idle');
  const [duration, setDuration] = useState<number>(10);
  const [showSettings, setShowSettings] = useState(false);
  const [result, setResult] = useState<{ completedSec: number; distractions: number } | null>(null);

  const start = () => setPhase('intro');

  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => setPhase('session'), 1600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const onSessionFinish = useCallback((data: { completedSec: number; distractions: number; completed: boolean }) => {
    setResult({ completedSec: data.completedSec, distractions: data.distractions });
    addZazenSession({
      date: new Date().toISOString(),
      durationSec: duration * 60,
      completedSec: data.completedSec,
      distractions: data.distractions,
      completed: data.completed,
    });
    setPhase('done');
  }, [addZazenSession, duration]);

  if (phase === 'intro') {
    return (
      <div
        className="fixed inset-0 z-[100] bg-black"
        style={{ animation: 'zazenFadeIn 1.6s ease-out both' }}
      >
        <style>{`@keyframes zazenFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      </div>
    );
  }

  if (phase === 'session') {
    return <Session durationMin={duration} onFinish={onSessionFinish} />;
  }

  if (phase === 'done' && result) {
    return (
      <DoneScreen
        durationSec={result.completedSec}
        distractions={result.distractions}
        onClose={() => { setResult(null); setPhase('idle'); }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-10">
      <div className="text-center space-y-5">
        <h1 className="text-5xl font-extralight tracking-[0.3em] text-foreground/90">Zazen</h1>
        <p className="text-sm text-foreground/50 leading-relaxed font-light max-w-md mx-auto whitespace-pre-line">
{`Olhe para um único ponto.
Quando surgir um pensamento,
simplesmente deixe ele ir
e volte ao ponto.`}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 text-center">Duração</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-5 py-2.5 text-xs tracking-widest uppercase border rounded-sm transition-colors ${
                duration === d
                  ? 'border-foreground/60 text-foreground'
                  : 'border-border/40 text-foreground/50 hover:text-foreground/80'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={start}
          className="px-12 py-4 border border-foreground/40 hover:border-foreground/80 text-foreground/80 hover:text-foreground text-xs tracking-[0.5em] uppercase rounded-sm transition-colors"
        >
          Iniciar Sessão
        </button>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setShowSettings(s => !s)}
          className="text-foreground/40 hover:text-foreground/70 text-[10px] tracking-[0.3em] uppercase flex items-center gap-2 transition-colors"
        >
          <SettingsIcon className="w-3 h-3" /> Configurações
        </button>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <div className="pt-8 border-t border-border/30">
        <p className="text-[10px] tracking-[0.4em] uppercase text-foreground/40 text-center mb-6">Histórico</p>
        <HistoryView />
      </div>
    </div>
  );
}