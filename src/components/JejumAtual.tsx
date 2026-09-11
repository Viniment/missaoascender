import { useEffect, useMemo, useState } from "react";
import { Clock3, X, Play, Square, Waves, Brain, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Estado = "tranquila" | "normal" | "vontade" | "dificil";

const KEY = "ascensao:jejum-atual";
const META_HORAS = 18;

function formatarTempo(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export default function JejumAtual() {
  const [inicio, setInicio] = useState<number | null>(() => {
    const saved = localStorage.getItem(KEY);
    return saved ? Number(saved) : null;
  });
  const [agora, setAgora] = useState(Date.now());
  const [estado, setEstado] = useState<Estado | null>(null);
  const [protocolo, setProtocolo] = useState(false);
  const [etapa, setEtapa] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const decorrido = inicio ? agora - inicio : 0;
  const metaMs = META_HORAS * 60 * 60 * 1000;
  const progresso = inicio ? Math.min(100, (decorrido / metaMs) * 100) : 0;
  const concluido = decorrido >= metaMs;

  const iniciar = () => {
    const timestamp = Date.now();
    localStorage.setItem(KEY, String(timestamp));
    setInicio(timestamp);
    setEstado(null);
    toast.success("Jejum iniciado. Foque no próximo momento, não no relógio.");
  };

  const encerrar = () => {
    localStorage.removeItem(KEY);
    setInicio(null);
    setEstado(null);
    toast.info("Jejum encerrado conscientemente.");
  };

  const selecionarEstado = (value: Estado) => {
    setEstado(value);
    if (value === "vontade") {
      setEtapa(1);
      setProtocolo(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 w-[min(380px,calc(100vw-2rem))] rpg-panel scanlines border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.12)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-primary flex items-center gap-1.5">
              <Clock3 className="w-3 h-3" /> JEJUM ATUAL
            </p>
            <h3 className="font-display text-lg tracking-widest mt-1">{inicio ? formatarTempo(decorrido) : "Nenhum jejum ativo"}</h3>
          </div>
          {inicio ? (
            <button onClick={encerrar} className="text-muted-foreground hover:text-destructive p-1" title="Encerrar jejum">
              <Square className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {inicio ? (
          <>
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Meta: {META_HORAS}h</span>
              <span>{concluido ? "Meta atingida" : `${Math.round(progresso)}%`}</span>
            </div>
            <div className="h-2 mt-1.5 rounded-full bg-secondary overflow-hidden border border-border">
              <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${progresso}%` }} />
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Como está sua mente agora?</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["tranquila", "normal", "vontade", "dificil"] as Estado[]).map(item => (
                  <button
                    key={item}
                    onClick={() => selecionarEstado(item)}
                    className={`rounded-md border px-1.5 py-2 text-[10px] transition ${estado === item ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                  >
                    {item === "tranquila" ? "😊 Tranquila" : item === "normal" ? "😐 Normal" : item === "vontade" ? "🌊 Vontade" : "😣 Difícil"}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-3">Inicie o contador quando começar um jejum planejado.</p>
            <button onClick={iniciar} className="w-full btn-pixel py-2.5 rounded-md text-xs flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> Iniciar Jejum
            </button>
          </div>
        )}
      </div>

      {protocolo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rpg-panel scanlines border-primary/40 p-5 shadow-[0_0_40px_hsl(var(--primary)/0.18)]">
            <button onClick={() => setProtocolo(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            <p className="text-[9px] uppercase tracking-[0.35em] text-primary flex items-center gap-1.5"><Waves className="w-3 h-3" /> PAUSA → OBSERVAR → ESCOLHER</p>
            <h2 className="font-display text-xl tracking-widest mt-2">VONTADE ≠ COMANDO</h2>

            {etapa === 1 && (
              <div className="mt-5 space-y-4">
                <p className="text-sm leading-relaxed">Pare por alguns segundos. Você não precisa resolver nada agora.</p>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-center">
                  <Brain className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">A vontade é uma experiência passando pela sua mente. Ela não é uma ordem.</p>
                </div>
                <button onClick={() => setEtapa(2)} className="w-full btn-pixel py-2.5 rounded-md text-xs">Observar</button>
              </div>
            )}

            {etapa === 2 && (
              <div className="mt-5 space-y-4">
                <p className="text-sm">Pergunte a si mesmo:</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="rounded-md border border-border p-3"><b className="text-foreground">Pensamento:</b> o que apareceu na minha mente?</div>
                  <div className="rounded-md border border-border p-3"><b className="text-foreground">Sentimento:</b> o que estou sentindo?</div>
                  <div className="rounded-md border border-border p-3"><b className="text-foreground">Vontade:</b> o que estou querendo fazer?</div>
                </div>
                <button onClick={() => setEtapa(3)} className="w-full btn-pixel py-2.5 rounded-md text-xs">Escolher</button>
              </div>
            )}

            {etapa === 3 && (
              <div className="mt-5 space-y-3">
                <p className="text-sm">Agora escolha a próxima ação — sem precisar obedecer ao impulso.</p>
                <button onClick={() => { setProtocolo(false); toast.success("Você criou espaço entre a vontade e a ação."); }} className="w-full rounded-md border border-primary/40 bg-primary/10 p-3 text-left text-xs hover:border-primary"><b>🌊 Esperar 10 minutos</b><span className="block text-muted-foreground mt-1">Observar a onda sem lutar contra ela.</span></button>
                <button onClick={() => { setProtocolo(false); toast.success("Ambiente alterado. Continue consciente."); }} className="w-full rounded-md border border-border p-3 text-left text-xs hover:border-primary/50"><b>🚶 Mudar de ambiente</b><span className="block text-muted-foreground mt-1">Quebrar o automático.</span></button>
                <button onClick={() => { setProtocolo(false); toast.success("Escolha consciente registrada."); }} className="w-full rounded-md border border-border p-3 text-left text-xs hover:border-primary/50"><b>🎯 Fazer outra atividade</b><span className="block text-muted-foreground mt-1">Direcionar a atenção para outra ação.</span></button>
                <button onClick={() => { setProtocolo(false); toast.info("Você decidiu conscientemente o que fazer. Isso não é fracasso."); }} className="w-full rounded-md border border-border p-3 text-left text-xs hover:border-primary/50"><b>🍽️ Encerrar conscientemente</b><span className="block text-muted-foreground mt-1">Encerrar o jejum também pode ser uma decisão consciente.</span></button>
              </div>
            )}

            <div className="mt-5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Pensamentos e vontades não precisam virar ações automaticamente.
            </div>
          </div>
        </div>
      )}
    </>
  );
}