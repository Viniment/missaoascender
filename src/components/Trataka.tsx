import { useEffect, useRef, useState } from "react";
import { Brain, ChevronRight, Maximize2, X } from "lucide-react";

type Duration = 5 | 10 | 15 | 20;

const durations: Array<{ value: Duration; label: string; subtitle: string }> = [
  { value: 5, label: "5 MIN", subtitle: "Acender" },
  { value: 10, label: "10 MIN", subtitle: "Firmar" },
  { value: 15, label: "15 MIN", subtitle: "Aprofundar" },
  { value: 20, label: "20 MIN", subtitle: "Permanecer" },
];

export default function Trataka() {
  const [duration, setDuration] = useState<Duration | null>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  const start = async (minutes: Duration) => {
    setDuration(minutes);
    setRemaining(minutes * 60);
    setFinished(false);
    setShowIntro(false);
    setRunning(true);

    try {
      await stageRef.current?.requestFullscreen?.();
    } catch {
      // Fullscreen may be unavailable or blocked by the browser.
    }
  };

  const leave = async () => {
    setRunning(false);
    setDuration(null);
    setShowIntro(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Ignore browser fullscreen errors.
    }
  };

  useEffect(() => {
    if (!running) return;

    const startedAt = Date.now();
    const total = (duration ?? 0) * 60 * 1000;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const next = Math.max(0, Math.ceil((total - elapsed) / 1000));
      setRemaining(next);

      if (next <= 0) {
        setRunning(false);
        setFinished(true);
        try {
          if (document.fullscreenElement) void document.exitFullscreen();
        } catch {
          // Ignore browser fullscreen errors.
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running, duration]);

  const format = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <section className="rpg-panel overflow-hidden border-primary/25">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">METACOGNIÇÃO · FOCO</div>
            <h2 className="mt-1 font-display text-lg tracking-widest">TRATAKA</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Um ponto. Uma mente. Perceba, escolha e retorne.
            </p>
          </div>
        </div>

        {!running && !finished && (
          <>
            <div className="mt-5 rounded-xl border border-border bg-background/30 p-4">
              <p className="text-xs font-semibold leading-relaxed">
                Pensamentos vão surgir. Você não precisa combatê-los, expulsá-los ou controlá-los.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Apenas perceba. Quando notar que sua atenção foi para outro lugar, escolha gentilmente
                voltar ao ponto. <span className="font-semibold text-foreground">O retorno é o treino.</span>
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {durations.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => start(item.value)}
                  className="group rounded-xl border border-border bg-background/30 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5"
                >
                  <div className="text-sm font-black tracking-wider">{item.label}</div>
                  <div className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
                    {item.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {finished && (
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">PRÁTICA CONCLUÍDA</div>
            <h3 className="mt-2 font-display text-lg tracking-widest">VOCÊ PERCEBEU.</h3>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Sua mente se afastou. Você percebeu. E escolheu retornar. O objetivo não era ter uma mente
              sem pensamentos — era perceber que você podia escolher onde colocar sua atenção.
            </p>
            <button
              type="button"
              onClick={() => setFinished(false)}
              className="mt-4 rounded-xl border border-border px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:border-primary/50"
            >
              Fazer novamente
            </button>
          </div>
        )}
      </div>

      {running && (
        <div
          ref={stageRef}
          className="fixed inset-0 z-[2147483647] flex min-h-screen items-center justify-center overflow-hidden bg-black text-white"
        >
          <div className="absolute left-5 top-5 text-[8px] font-black uppercase tracking-[0.3em] text-white/15">
            TRATAKA · METACOGNIÇÃO
          </div>

          <div className="flex flex-col items-center">
            <div
              aria-label="Ponto de foco"
              className="h-3 w-3 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.95),0_0_45px_rgba(255,255,255,0.35)]"
            />
            <div className="fixed bottom-7 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.25em] text-white/15">{format(remaining)}</div>
          </div>

          <button
            type="button"
            onClick={leave}
            aria-label="Encerrar prática"
            className="absolute right-5 top-5 rounded-full p-2 text-white/15 transition hover:bg-white/10 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 max-w-[90vw] -translate-x-1/2 -translate-y-full text-center text-[8px] leading-relaxed text-white/10">
            PERCEBA · NÃO JULGUE · ESCOLHA · RETORNE
          </div>
        </div>
      )}

      {!running && !finished && showIntro && (
        <div className="border-t border-border/50 px-5 py-3">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            <Maximize2 className="h-3 w-3" />
            A prática abre em tela cheia
            <ChevronRight className="ml-auto h-3 w-3" />
          </div>
        </div>
      )}
    </section>
  );
}
