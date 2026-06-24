import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGame } from '@/lib/GameContext';
import type { TratakaPoint, TratakaSound, TratakaSession } from '@/lib/gameStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Focus, Flame, Circle, Sparkles, X, Trash2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

// =========================================================================
// Trataka — concentração visual (tradição yogue)
// Espaço de treinamento mental. Sem gamificação, sem distrações.
// =========================================================================

type Phase = 'config' | 'instruction' | 'session' | 'integration' | 'register' | 'done';

const POINTS: { id: TratakaPoint; label: string; description: string }[] = [
  { id: 'vela', label: 'Vela', description: 'Chama suave e oscilante' },
  { id: 'ponto-branco', label: 'Ponto branco', description: 'Luz pura, neutra' },
  { id: 'ponto-dourado', label: 'Ponto dourado', description: 'Calor e presença' },
  { id: 'zen', label: 'Símbolo zen', description: 'Enso — o círculo da plenitude' },
];

const SOUNDS: { id: TratakaSound; label: string }[] = [
  { id: 'silencio', label: 'Silêncio' },
  { id: 'ruido-branco', label: 'Ruído branco' },
  { id: 'chuva', label: 'Chuva' },
  { id: 'floresta', label: 'Floresta' },
  { id: 'tigela', label: 'Tigela tibetana (início e fim)' },
];

const DURATIONS = [60, 180, 300, 600, 900];

function formatHMS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTotalMinutes(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

// ---- Web Audio: ambiência minimalista, gerada localmente ----
function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  const stop = useCallback(() => {
    nodesRef.current?.stop();
    nodesRef.current = null;
  }, []);

  const playBowl = useCallback(() => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = ctxRef.current;
      const now = ctx.currentTime;
      [196, 392, 588].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15 / (i + 1), now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 5);
      });
    } catch { /* ignore */ }
  }, []);

  const start = useCallback((kind: TratakaSound) => {
    stop();
    if (kind === 'silencio') return;
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = ctxRef.current;
      // Gerador de ruído base
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      gain.gain.value = 0.08;

      if (kind === 'ruido-branco') {
        filter.type = 'allpass';
      } else if (kind === 'chuva') {
        filter.type = 'lowpass';
        filter.frequency.value = 1600;
        gain.gain.value = 0.12;
      } else if (kind === 'floresta') {
        filter.type = 'bandpass';
        filter.frequency.value = 900;
        filter.Q.value = 0.6;
        gain.gain.value = 0.06;
      } else if (kind === 'tigela') {
        // Sem ambiente contínuo; toca apenas no início (e no fim, depois)
        playBowl();
        nodesRef.current = { stop: () => {} };
        return;
      }

      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start();
      nodesRef.current = {
        stop: () => {
          try { noise.stop(); } catch {}
          try { gain.disconnect(); filter.disconnect(); } catch {}
        },
      };
    } catch { /* ignore */ }
  }, [playBowl, stop]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, playBowl };
}

// ---- Renderiza o ponto de fixação ----
function FixationPoint({ kind }: { kind: TratakaPoint }) {
  if (kind === 'vela') {
    return (
      <div className="relative flex items-end justify-center" aria-hidden>
        <div className="absolute -top-16 w-6 h-20 rounded-t-full bg-gradient-to-b from-amber-200/90 via-orange-400/80 to-orange-600/0 blur-md animate-pulse" />
        <div className="absolute -top-14 w-3 h-12 rounded-full bg-gradient-to-b from-yellow-100 via-amber-300 to-orange-500 shadow-[0_0_40px_12px_rgba(251,191,36,0.45)]" />
        <div className="w-12 h-1 bg-amber-900/60 rounded" />
      </div>
    );
  }
  if (kind === 'ponto-branco') {
    return (
      <div
        aria-hidden
        className="w-4 h-4 rounded-full bg-white shadow-[0_0_60px_20px_rgba(255,255,255,0.4)]"
      />
    );
  }
  if (kind === 'ponto-dourado') {
    return (
      <div
        aria-hidden
        className="w-4 h-4 rounded-full bg-amber-300 shadow-[0_0_70px_24px_rgba(251,191,36,0.55)]"
      />
    );
  }
  // zen — enso
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden className="drop-shadow-[0_0_30px_rgba(255,255,255,0.25)]">
      <path
        d="M80 18 a62 62 0 1 0 44 106"
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TratakaPanel() {
  const { state, addTratakaSession, deleteTratakaSession } = useGame();
  const sessions = state.tratakaSessions || [];

  const [phase, setPhase] = useState<Phase>('config');
  const [point, setPoint] = useState<TratakaPoint>('ponto-branco');
  const [sound, setSound] = useState<TratakaSound>('silencio');
  const [duration, setDuration] = useState<number>(300);
  const [customMin, setCustomMin] = useState<string>('');
  const [remaining, setRemaining] = useState<number>(300);
  const [integrationLeft, setIntegrationLeft] = useState<number>(30);
  const [focusBefore, setFocusBefore] = useState<number>(5);
  const [focusAfter, setFocusAfter] = useState<number>(7);
  const [muted, setMuted] = useState<boolean>(false);

  const audio = useAmbientSound();
  const startedAtRef = useRef<number>(0);

  // -------- Estatísticas --------
  const stats = useMemo(() => {
    const totalSec = sessions.reduce((s, x) => s + x.durationSec, 0);
    const uniqueDays = new Set(sessions.map(s => s.date.slice(0, 10)));
    const days = Array.from(uniqueDays).sort();
    // Sequência atual
    let current = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (uniqueDays.has(key)) current++;
      else break;
    }
    // Maior sequência
    let best = 0, run = 0, prev: Date | null = null;
    for (const k of days) {
      const d = new Date(k);
      if (prev && (d.getTime() - prev.getTime()) === 86400000) run++;
      else run = 1;
      if (run > best) best = run;
      prev = d;
    }
    // Média semanal
    const weekAgo = Date.now() - 7 * 86400000;
    const weekSec = sessions.filter(s => new Date(s.date).getTime() >= weekAgo).reduce((s, x) => s + x.durationSec, 0);
    return { totalSec, daysPracticed: uniqueDays.size, current, best, weekAvgSec: Math.round(weekSec / 7) };
  }, [sessions]);

  // -------- Fluxo --------
  const beginSession = () => {
    let d = duration;
    if (customMin) {
      const n = Math.max(1, Math.min(180, parseInt(customMin) || 0));
      if (n) d = n * 60;
    }
    setDuration(d);
    setRemaining(d);
    setPhase('instruction');
  };

  const startTimer = () => {
    startedAtRef.current = Date.now();
    if (!muted) {
      if (sound === 'tigela') audio.playBowl();
      else audio.start(sound);
    }
    setPhase('session');
  };

  // Tick da sessão principal
  useEffect(() => {
    if (phase !== 'session') return;
    const it = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          window.clearInterval(it);
          audio.stop();
          if (!muted) audio.playBowl();
          setIntegrationLeft(30);
          setPhase('integration');
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(it);
  }, [phase, audio, muted]);

  // Tick da integração
  useEffect(() => {
    if (phase !== 'integration') return;
    const it = window.setInterval(() => {
      setIntegrationLeft(r => {
        if (r <= 1) { window.clearInterval(it); setPhase('register'); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(it);
  }, [phase]);

  // Bloquear scroll/zoom durante imersão
  useEffect(() => {
    if (phase === 'session' || phase === 'integration') {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [phase]);

  const abortSession = () => {
    audio.stop();
    setPhase('config');
    setRemaining(duration);
  };

  const skipIntegration = () => { setPhase('register'); };

  const saveSession = () => {
    const actualSec = Math.max(0, duration - remaining);
    const s: Omit<TratakaSession, 'id'> = {
      date: new Date(startedAtRef.current || Date.now()).toISOString(),
      durationSec: actualSec || duration,
      point,
      sound,
      focusBefore,
      focusAfter,
    };
    addTratakaSession(s);
    setPhase('done');
  };

  const skipRegister = () => {
    const actualSec = Math.max(0, duration - remaining);
    addTratakaSession({
      date: new Date(startedAtRef.current || Date.now()).toISOString(),
      durationSec: actualSec || duration,
      point, sound,
    });
    setPhase('done');
  };

  // -------- Render imersivo (fullscreen overlay) --------
  if (phase === 'session' || phase === 'integration') {
    const isSession = phase === 'session';
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none">
        <div className="flex-1 w-full flex items-center justify-center">
          {isSession ? (
            <FixationPoint kind={point} />
          ) : (
            <div className="text-center space-y-6 px-6">
              <p className="font-display text-foreground/80 text-lg md:text-xl tracking-wide max-w-md">
                Feche os olhos por alguns instantes e observe os efeitos da prática.
              </p>
              <p className="text-foreground/40 text-4xl font-mono tabular-nums">{integrationLeft}s</p>
            </div>
          )}
        </div>

        {/* Cronômetro discreto e controles mínimos */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-foreground/40">
          {isSession && <span className="font-mono text-xs tabular-nums">{formatHMS(remaining)}</span>}
        </div>
        <button
          onClick={abortSession}
          aria-label="Encerrar prática"
          className="absolute top-4 right-4 text-foreground/30 hover:text-foreground/70 transition-colors p-2"
        >
          <X className="w-5 h-5" />
        </button>
        {phase === 'integration' && (
          <button
            onClick={skipIntegration}
            className="absolute bottom-6 right-6 text-xs text-foreground/40 hover:text-foreground/80 transition-colors"
          >
            Pular
          </button>
        )}
      </div>
    );
  }

  // -------- Tela: Instrução --------
  if (phase === 'instruction') {
    return (
      <div className="space-y-6">
        <Card className="p-8 bg-card/40 border-border/60 text-center space-y-6">
          <Focus className="w-10 h-10 text-primary mx-auto opacity-80" />
          <h2 className="font-display text-xl tracking-widest text-foreground/90">CONCENTRAÇÃO</h2>
          <p className="text-foreground/70 leading-relaxed max-w-md mx-auto">
            Fixe o olhar no ponto central. Evite mover os olhos.
            Quando pensamentos surgirem, apenas retorne sua atenção ao ponto.
          </p>
          <p className="text-xs text-foreground/40 tracking-wider">
            Duração: {formatTotalMinutes(duration)} · {POINTS.find(p => p.id === point)?.label}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => setPhase('config')}>Voltar</Button>
            <Button onClick={startTimer} className="bg-primary text-primary-foreground">Iniciar</Button>
          </div>
        </Card>
      </div>
    );
  }

  // -------- Tela: Registro --------
  if (phase === 'register') {
    return (
      <Card className="p-6 bg-card/40 border-border/60 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="font-display text-lg tracking-widest text-foreground/90">REGISTRO</h2>
          <p className="text-xs text-foreground/50">Note a diferença antes e depois da prática.</p>
        </div>

        <FocusScale label="Como estava seu foco antes?" value={focusBefore} onChange={setFocusBefore} />
        <FocusScale label="Como está seu foco agora?" value={focusAfter} onChange={setFocusAfter} />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={skipRegister}>Pular</Button>
          <Button onClick={saveSession} className="bg-primary text-primary-foreground">Salvar</Button>
        </div>
      </Card>
    );
  }

  // -------- Tela: Concluído --------
  if (phase === 'done') {
    return (
      <Card className="p-8 bg-card/40 border-border/60 text-center space-y-4">
        <Sparkles className="w-8 h-8 mx-auto text-primary opacity-80" />
        <p className="font-display tracking-widest text-foreground/80">PRESENÇA REGISTRADA</p>
        <p className="text-sm text-foreground/60">A disciplina silenciosa é a mais forte de todas.</p>
        <Button onClick={() => setPhase('config')} variant="outline">Voltar ao dojo</Button>
      </Card>
    );
  }

  // -------- Tela: Configuração + Estatísticas + Histórico --------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="font-display text-2xl tracking-[0.25em] text-foreground/90">TRATAKA</h1>
        <p className="text-xs text-foreground/50 tracking-wider">Concentração visual · Dojo da presença</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Stat label="Dias praticados" value={String(stats.daysPracticed)} />
        <Stat label="Sequência atual" value={`${stats.current}d`} />
        <Stat label="Maior sequência" value={`${stats.best}d`} />
        <Stat label="Tempo total" value={formatTotalMinutes(stats.totalSec)} />
        <Stat label="Média semanal" value={formatTotalMinutes(stats.weekAvgSec)} />
      </div>

      {/* Configuração */}
      <Card className="p-5 bg-card/40 border-border/60 space-y-5">
        <div>
          <p className="text-xs text-foreground/60 tracking-wider mb-2">PONTO DE FIXAÇÃO</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {POINTS.map(p => (
              <button
                key={p.id}
                onClick={() => setPoint(p.id)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all',
                  point === p.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 text-foreground/70 hover:border-border'
                )}
              >
                <div className="flex items-center gap-2">
                  {p.id === 'vela' ? <Flame className="w-4 h-4" /> : p.id === 'zen' ? <Circle className="w-4 h-4" /> : <span className="w-3 h-3 rounded-full inline-block" style={{ background: p.id === 'ponto-dourado' ? '#fbbf24' : '#fff' }} />}
                  <span className="text-sm font-medium">{p.label}</span>
                </div>
                <p className="text-[11px] text-foreground/50 mt-1">{p.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-foreground/60 tracking-wider mb-2">DURAÇÃO</p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => { setDuration(d); setCustomMin(''); }}
                className={cn(
                  'px-3 py-1.5 rounded-md border text-sm transition-all',
                  duration === d && !customMin
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 text-foreground/70 hover:border-border'
                )}
              >
                {d / 60} min
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={180}
                placeholder="Personalizado"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-28 px-2 py-1.5 rounded-md border border-border/60 bg-background text-sm text-foreground"
              />
              <span className="text-xs text-foreground/50">min</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-foreground/60 tracking-wider mb-2">SOM</p>
          <div className="flex flex-wrap gap-2">
            {SOUNDS.map(s => (
              <button
                key={s.id}
                onClick={() => setSound(s.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md border text-sm transition-all',
                  sound === s.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border/60 text-foreground/70 hover:border-border'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setMuted(m => !m)}
            className="mt-2 inline-flex items-center gap-2 text-xs text-foreground/50 hover:text-foreground/80"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {muted ? 'Som desativado' : 'Som ativo'}
          </button>
        </div>

        <Button onClick={beginSession} className="w-full bg-primary text-primary-foreground">
          Entrar no silêncio
        </Button>
      </Card>

      {/* Histórico */}
      <Card className="p-5 bg-card/40 border-border/60">
        <p className="text-xs text-foreground/60 tracking-wider mb-3">HISTÓRICO</p>
        {sessions.length === 0 ? (
          <p className="text-sm text-foreground/40 italic">Ainda não há sessões registradas.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {sessions.slice(0, 50).map(s => {
              const date = new Date(s.date);
              const delta = (s.focusBefore != null && s.focusAfter != null) ? (s.focusAfter - s.focusBefore) : null;
              return (
                <li key={s.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-foreground/80">
                      {date.toLocaleDateString('pt-BR')} · {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {formatTotalMinutes(s.durationSec)} · {POINTS.find(p => p.id === s.point)?.label || s.point}
                      {delta != null && (
                        <span className={cn('ml-2', delta > 0 ? 'text-primary' : delta < 0 ? 'text-destructive' : 'text-foreground/40')}>
                          foco {s.focusBefore} → {s.focusAfter} {delta > 0 ? `(+${delta})` : delta < 0 ? `(${delta})` : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTratakaSession(s.id)}
                    aria-label="Remover sessão"
                    className="text-foreground/30 hover:text-destructive p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-card/40 border border-border/60 text-center">
      <p className="text-base md:text-lg font-display text-foreground/90 tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-foreground/50 mt-0.5">{label}</p>
    </div>
  );
}

function FocusScale({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="text-sm text-foreground/80 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              'w-9 h-9 rounded-md border text-sm font-mono tabular-nums transition-all',
              value === n
                ? 'border-primary bg-primary/15 text-foreground'
                : 'border-border/60 text-foreground/60 hover:border-border'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
