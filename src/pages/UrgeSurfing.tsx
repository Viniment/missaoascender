import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/Shell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Waves, Play, Pause, Square, CheckCircle2, XCircle, Wind } from "lucide-react";

/**
 * Urge Surfing — o desejo é uma onda: sobe, quebra, desce.
 * O usuário não luta contra ela. Ele observa, respira em ciclo 4-4-6, e cronometra.
 * A maioria das ondas desmonta em 5-10 minutos se você não alimenta.
 */

type Stage = "form" | "surf" | "final";

// 4s inspira, 4s segura, 6s expira = 14s por ciclo (box-ish, adaptado)
const CICLO_SEG = 14;

function fase(t: number): { nome: string; sub: number; total: number } {
  const x = t % CICLO_SEG;
  if (x < 4) return { nome: "Inspire", sub: x, total: 4 };
  if (x < 8) return { nome: "Segure", sub: x - 4, total: 4 };
  return { nome: "Expire", sub: x - 8, total: 6 };
}

function scale(t: number): number {
  const f = fase(t);
  if (f.nome === "Inspire") return 0.6 + (f.sub / f.total) * 0.5;   // 0.6 → 1.1
  if (f.nome === "Segure") return 1.1;
  return 1.1 - (f.sub / f.total) * 0.5;                              // 1.1 → 0.6
}

export default function UrgeSurfing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const uid = user?.id;

  const [stage, setStage] = useState<Stage>("form");
  const [desejo, setDesejo] = useState("");
  const [intensidade, setIntensidade] = useState(7);
  const [intensidadeFinal, setIntensidadeFinal] = useState(4);
  const [cedeu, setCedeu] = useState<boolean | null>(null);

  const [running, setRunning] = useState(true);
  const [seg, setSeg] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (stage !== "surf" || !running) return;
    ref.current = window.setInterval(() => setSeg((s) => s + 1), 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [stage, running]);

  const iniciar = () => {
    setSeg(0);
    setRunning(true);
    setStage("surf");
  };

  const encerrar = () => {
    setRunning(false);
    setIntensidadeFinal(Math.max(0, intensidade - Math.min(6, Math.floor(seg / 60))));
    setStage("final");
  };

  const salvar = async () => {
    if (!uid) return;
    const ciclos = Math.floor(seg / CICLO_SEG);
    const { error } = await supabase.from("urge_surfs").insert({
      user_id: uid,
      desejo: desejo || null,
      intensidade_inicial: intensidade,
      intensidade_final: intensidadeFinal,
      duracao_seg: seg,
      ciclos_respiracao: ciclos,
      cedeu: cedeu,
    });
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success(cedeu === false ? "Onda atravessada. 🌊" : "Registrado.");
    nav("/");
  };

  const f = fase(seg);
  const sc = scale(seg);
  const min = Math.floor(seg / 60).toString().padStart(2, "0");
  const sec = (seg % 60).toString().padStart(2, "0");
  const ciclos = Math.floor(seg / CICLO_SEG);

  return (
    <Shell>
      <div className="max-w-xl mx-auto space-y-4 pb-8">
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        <div className="rpg-panel p-4 sm:p-5 border-cyan-500/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md grid place-items-center bg-cyan-500/15 border border-cyan-500/40 text-cyan-300">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Urge Surfing</p>
              <h1 className="font-display text-lg sm:text-xl tracking-widest">Surfar a onda</h1>
              <p className="text-xs text-muted-foreground">O desejo sobe, quebra e desce. Você só observa.</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {stage === "form" && (
            <motion.section key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rpg-panel p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Desejo (opcional)</label>
                <input value={desejo} onChange={(e) => setDesejo(e.target.value)} maxLength={120}
                  className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-cyan-500/60"
                  placeholder="Ex.: cigarro, rolar feed, comer sem fome, checar ex..." />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  Intensidade agora: <span className="text-cyan-300">{intensidade}/10</span>
                </label>
                <input type="range" min={1} max={10} value={intensidade} onChange={(e) => setIntensidade(+e.target.value)}
                  className="w-full accent-cyan-400 mt-1.5" />
              </div>
              <div className="rpg-panel p-3 bg-cyan-500/5 border-cyan-500/30 space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">Como funciona</p>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  Você vai respirar em ciclo (4s inspira · 4s segura · 6s expira) enquanto observa a onda do desejo. Não julgue, não brigue. Meta: 5 minutos. Se descer antes, ótimo.
                </p>
              </div>
              <button onClick={iniciar} className="w-full rpg-panel p-3 border-cyan-500/60 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition font-display tracking-widest text-sm flex items-center justify-center gap-2">
                <Play className="w-4 h-4 text-cyan-300" /> Entrar na onda
              </button>
            </motion.section>
          )}

          {stage === "surf" && (
            <motion.section key="surf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel p-6 space-y-6">
              <div className="relative h-56 grid place-items-center">
                {/* onda de fundo */}
                <motion.div
                  className="absolute inset-4 rounded-full bg-cyan-500/10 border border-cyan-500/30"
                  animate={{ scale: sc, opacity: 0.4 + (sc - 0.6) * 0.4 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-10 rounded-full bg-cyan-400/15 border border-cyan-400/40"
                  animate={{ scale: sc * 0.9, opacity: 0.5 + (sc - 0.6) * 0.4 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
                <div className="relative text-center z-10">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300 flex items-center justify-center gap-1.5">
                    <Wind className="w-3 h-3" /> {f.nome}
                  </p>
                  <p className="font-display text-4xl tracking-widest mt-1">{min}:{sec}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{ciclos} ciclos</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setRunning((r) => !r)}
                  className="rpg-panel p-2.5 text-xs flex items-center justify-center gap-1.5 hover:border-cyan-500/50">
                  {running ? <><Pause className="w-3.5 h-3.5" /> Pausar</> : <><Play className="w-3.5 h-3.5" /> Retomar</>}
                </button>
                <button onClick={() => { setSeg(0); }}
                  className="rpg-panel p-2.5 text-xs flex items-center justify-center gap-1.5 hover:border-cyan-500/50">
                  Reiniciar
                </button>
                <button onClick={encerrar}
                  className="rpg-panel p-2.5 text-xs flex items-center justify-center gap-1.5 border-primary/50 text-primary hover:bg-primary/10">
                  <Square className="w-3.5 h-3.5" /> Encerrar
                </button>
              </div>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                Observe onde o desejo mora no corpo. Não afaste, não alimente. Só respire e conte.
              </p>
            </motion.section>
          )}

          {stage === "final" && (
            <motion.section key="final" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rpg-panel p-4 sm:p-5 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Você surfou por</p>
                <p className="font-display text-2xl tracking-widest">{min}:{sec} <span className="text-sm text-muted-foreground">· {ciclos} ciclos</span></p>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  Intensidade agora: <span className="text-cyan-300">{intensidadeFinal}/10</span>
                </label>
                <input type="range" min={0} max={10} value={intensidadeFinal} onChange={(e) => setIntensidadeFinal(+e.target.value)}
                  className="w-full accent-cyan-400 mt-1.5" />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">Você cedeu ao impulso?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setCedeu(false)}
                    className={`rpg-panel p-3 flex items-center justify-center gap-2 text-sm transition ${
                      cedeu === false ? "border-green-500 bg-green-500/15 text-green-300" : "hover:border-green-500/50"
                    }`}>
                    <CheckCircle2 className="w-4 h-4" /> Atravessei
                  </button>
                  <button onClick={() => setCedeu(true)}
                    className={`rpg-panel p-3 flex items-center justify-center gap-2 text-sm transition ${
                      cedeu === true ? "border-destructive bg-destructive/15 text-destructive" : "hover:border-destructive/50"
                    }`}>
                    <XCircle className="w-4 h-4" /> Cedi
                  </button>
                </div>
              </div>

              <button onClick={salvar} disabled={cedeu === null}
                className="w-full rpg-panel p-3 border-cyan-500/60 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition font-display tracking-widest text-sm disabled:opacity-50">
                Registrar sessão
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}