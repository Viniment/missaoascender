import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Info, X, RotateCcw } from "lucide-react";
import Shell from "@/components/Shell";
import { cn } from "@/lib/utils";

const PRESETS = [21, 54, 108, 216];

function useChime() {
  const ctxRef = useRef<AudioContext | null>(null);
  return (freqs: number[] = [528, 792], dur = 1.6, vol = 0.12) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        const t = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.05);
      });
    } catch {}
  };
}

export default function Japamala() {
  const [total, setTotal] = useState(108);
  const [custom, setCustom] = useState("");
  const [iniciado, setIniciado] = useState(false);
  const [count, setCount] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const [ciclos, setCiclos] = useState(0);
  const [showEstrutura, setShowEstrutura] = useState(false);
  const [pulse, setPulse] = useState(0);
  const chime = useChime();

  const beads = useMemo(() => {
    const n = Math.min(total, 108);
    return Array.from({ length: n }, (_, i) => i);
  }, [total]);

  const beadsFeitas = total <= 108 ? count : Math.floor((count / total) * beads.length);

  const tocar = () => {
    if (concluido) return;
    const next = count + 1;
    setCount(next);
    setPulse((p) => p + 1);
    try { navigator.vibrate?.(12); } catch {}
    if (next >= total) {
      setConcluido(true);
      setCiclos((c) => c + 1);
      chime();
    }
  };

  const continuar = () => { setCount(0); setConcluido(false); };
  const encerrar = () => { setCount(0); setConcluido(false); setIniciado(false); };

  const progresso = Math.min(1, count / total);

  return (
    <Shell>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/mente" className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Mente
          </Link>
          <button
            onClick={() => setShowEstrutura(true)}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition"
          >
            <Info className="w-3.5 h-3.5" /> Estrutura
          </button>
        </div>

        <header className="text-center space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Prática mental</p>
          <h1 className="font-display text-lg tracking-widest">🧠 Japamala</h1>
        </header>

        {!iniciado ? (
          <div className="rpg-panel p-5 space-y-4">
            <p className="text-[12px] text-muted-foreground text-center">
              Escolha quantas repetições você vai fazer neste ciclo.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setTotal(p); setCustom(""); }}
                  className={cn(
                    "py-3 rounded-md border text-sm font-display tracking-widest transition",
                    total === p && !custom
                      ? "border-primary text-primary bg-primary/10 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={1008}
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  const v = parseInt(e.target.value, 10);
                  if (v > 0) setTotal(Math.min(v, 1008));
                }}
                placeholder="Personalizado"
                className="flex-1 bg-background/60 border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => { setIniciado(true); setCount(0); setConcluido(false); }}
              className="w-full py-3.5 rounded-md bg-primary/15 border border-primary text-primary font-display text-sm tracking-widest hover:bg-primary/25 transition"
            >
              INICIAR · {total}
            </button>
            {ciclos > 0 && (
              <p className="text-[11px] text-muted-foreground text-center">Ciclos concluídos nesta sessão: {ciclos}</p>
            )}
          </div>
        ) : (
          <div className="rpg-panel p-5 space-y-6">
            <div className="relative mx-auto w-[min(78vw,340px)] aspect-square select-none">
              {/* mala ring */}
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
                <circle cx="100" cy="100" r="86" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
                {beads.map((i) => {
                  const a = (i / beads.length) * Math.PI * 2 - Math.PI / 2;
                  const x = 100 + Math.cos(a) * 86;
                  const y = 100 + Math.sin(a) * 86;
                  const done = i < beadsFeitas;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={done ? 3.1 : 2}
                      fill={done ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                      opacity={done ? 1 : 0.5}
                      style={done ? { filter: "drop-shadow(0 0 3px hsl(var(--primary)))" } : undefined}
                    />
                  );
                })}
              </svg>

              {/* central bead / button */}
              <button
                onClick={tocar}
                disabled={concluido}
                className="absolute inset-[18%] rounded-full grid place-items-center bg-primary/10 border border-primary/50 backdrop-blur-sm active:scale-95 transition disabled:opacity-60"
                style={{ boxShadow: "0 0 40px rgba(139,92,246,0.18) inset" }}
                aria-label="Registrar conta"
              >
                <motion.div
                  key={pulse}
                  initial={{ scale: 0.94, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="text-center"
                >
                  <div className="font-display text-3xl tracking-widest text-primary">{count}</div>
                  <div className="text-[11px] text-muted-foreground tracking-[0.3em]">/ {total}</div>
                </motion.div>
              </button>

              <AnimatePresence>
                <motion.span
                  key={`ripple-${pulse}`}
                  initial={{ scale: 0.6, opacity: 0.35 }}
                  animate={{ scale: 1.15, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-[18%] rounded-full border border-primary pointer-events-none"
                />
              </AnimatePresence>
            </div>

            <div className="h-[3px] rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progresso * 100}%` }} />
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              Crie a frase mentalmente, repita e toque na conta.
            </p>

            <div className="flex justify-center">
              <button onClick={encerrar} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition">
                <RotateCcw className="w-3.5 h-3.5" /> Encerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estrutura */}
      <AnimatePresence>
        {showEstrutura && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setShowEstrutura(false)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rpg-panel p-5 max-w-md w-full max-h-[80vh] overflow-y-auto space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm tracking-widest">Estrutura da frase</h2>
                <button onClick={() => setShowEstrutura(false)} className="text-muted-foreground hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {[
                ["Causa e efeito", "Se eu continuar [COMPORTAMENTO/PADRÃO], [EFEITO NEGATIVO/CONSEQUÊNCIA]."],
                ["Nova escolha", "Quando escolho [NOVO COMPORTAMENTO], [EFEITO POSITIVO/RECOMPENSA]."],
                ["Enfrentamento", "Eu posso [EMOÇÃO/DESCONFORTO/MEDO] sem [CEDER AO PADRÃO]."],
                ["Identidade", "Cada vez que faço isso, enfraqueço [VELHA IDENTIDADE/PADRÃO] e fortaleço [NOVA IDENTIDADE]."],
                ["Sonho", "Estou me tornando [QUEM QUERO SER], para construir [SONHO/VIDA QUE QUERO]."],
              ].map(([t, d]) => (
                <div key={t} className="space-y-0.5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-primary">{t}</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{d}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  A cada conta, crie mentalmente uma nova frase. Não precisa repetir a mesma frase. Use a estrutura como guia e deixe a frase surgir intuitivamente.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conclusão */}
      <AnimatePresence>
        {concluido && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="rpg-panel p-6 max-w-xs w-full text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mx-auto w-16 h-16 rounded-full border border-primary bg-primary/10 grid place-items-center text-primary text-2xl"
                style={{ boxShadow: "0 0 40px rgba(139,92,246,0.35)" }}
              >
                ●
              </motion.div>
              <div>
                <h2 className="font-display text-sm tracking-widest">Ciclo concluído</h2>
                <p className="text-[12px] text-muted-foreground mt-1">Você completou {total} contas.</p>
              </div>
              <p className="text-[11px] text-muted-foreground">Continuar?</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={continuar} className="py-2.5 rounded-md bg-primary/15 border border-primary text-primary text-[12px] font-display tracking-widest hover:bg-primary/25 transition">
                  Continuar
                </button>
                <button onClick={encerrar} className="py-2.5 rounded-md border border-border text-muted-foreground text-[12px] font-display tracking-widest hover:border-primary/50 transition">
                  Encerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}
