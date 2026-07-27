import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Volume2, VolumeX, Wind, Timer, Eye, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchHeroi, applyXp, checkConquistas, unlockLevelConquistas } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Modo = "silencio" | "ambiente" | "respiracao";
type SomAmb = "chuva" | "vento" | "ondas" | "ruido_branco";

const PRESETS = [60, 180, 300, 600, 900, 1200];
const NIVEIS = [
  { nome: "Iniciante", min: 0 },
  { nome: "Aprendiz", min: 30 * 60 },
  { nome: "Disciplinado", min: 2 * 60 * 60 },
  { nome: "Concentrado", min: 6 * 60 * 60 },
  { nome: "Mestre da Atenção", min: 20 * 60 * 60 },
  { nome: "Mente Inabalável", min: 50 * 60 * 60 },
];

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}
function fmtHoras(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return m ? `${h}h ${m}min` : `${h}h`;
}

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ src?: AudioBufferSourceNode; gain?: GainNode; filter?: BiquadFilterNode; lfo?: OscillatorNode; lfoGain?: GainNode }>({});

  const ensureCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctxRef.current!;
  };

  const stop = () => {
    const n = nodesRef.current;
    try { n.src?.stop(); } catch {}
    try { n.lfo?.stop(); } catch {}
    nodesRef.current = {};
  };

  const playAmbient = (som: SomAmb, vol = 0.08) => {
    stop();
    const ctx = ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = vol;
    const filter = ctx.createBiquadFilter();
    if (som === "chuva") { filter.type = "highpass"; filter.frequency.value = 900; }
    else if (som === "vento") { filter.type = "lowpass"; filter.frequency.value = 500; }
    else if (som === "ondas") { filter.type = "lowpass"; filter.frequency.value = 350; }
    else { filter.type = "allpass"; filter.frequency.value = 1000; }
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
    if (som === "ondas" || som === "vento") {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = som === "ondas" ? 0.15 : 0.3;
      lfoGain.gain.value = vol * 0.7;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      lfo.start();
      nodesRef.current = { src, gain, filter, lfo, lfoGain };
    } else {
      nodesRef.current = { src, gain, filter };
    }
  };

  const playChime = () => {
    const ctx = ensureCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.4);
      g.gain.linearRampToValueAtTime(0.15, now + i * 0.4 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 2.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + i * 0.4);
      o.stop(now + i * 0.4 + 2.6);
    });
  };

  useEffect(() => () => { stop(); ctxRef.current?.close().catch(() => {}); }, []);
  return { playAmbient, stop, playChime };
}

function Sessao({
  duracao, modo, som, mostrarTimer, onEnd, onCancel,
}: {
  duracao: number; modo: Modo; som: SomAmb; mostrarTimer: boolean;
  onEnd: (elapsed: number, concluida: boolean) => void;
  onCancel: () => void;
}) {
  const [restante, setRestante] = useState(duracao);
  const startRef = useRef(Date.now());
  const audio = useAudio();
  const wakeRef = useRef<any>(null);

  useEffect(() => {
    if (modo === "ambiente") audio.playAmbient(som);
    (async () => {
      try { wakeRef.current = await (navigator as any).wakeLock?.request?.("screen"); } catch {}
    })();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const r = Math.max(0, duracao - elapsed);
      setRestante(r);
      if (r <= 0) {
        clearInterval(id);
        audio.stop();
        audio.playChime();
        onEnd(duracao, true);
      }
    }, 250);
    return () => {
      clearInterval(id);
      audio.stop();
      try { wakeRef.current?.release?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sair = () => {
    const elapsed = Math.min(duracao, Math.floor((Date.now() - startRef.current) / 1000));
    audio.stop();
    onCancel();
    onEnd(elapsed, false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-black text-white/90 flex items-center justify-center overflow-hidden"
    >
      <motion.div
        animate={modo === "respiracao" ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={modo === "respiracao" ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
        className="rounded-full"
        style={{
          width: 14, height: 14,
          background: "radial-gradient(circle, #fff 0%, #f5e6b8 60%, rgba(245,230,184,0) 100%)",
          boxShadow: "0 0 24px 4px rgba(255,240,200,0.35)",
        }}
      />
      {mostrarTimer && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.4em] text-white/25 font-mono">
          {fmt(restante)}
        </div>
      )}
      <button
        onClick={sair}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] uppercase text-white/25 hover:text-white/60 transition py-2 px-4"
      >
        sair
      </button>
    </motion.div>
  );
}

export default function Trataka() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [duracao, setDuracao] = useState(300);
  const [custom, setCustom] = useState("");
  const [modo, setModo] = useState<Modo>("silencio");
  const [som, setSom] = useState<SomAmb>("chuva");
  const [mostrarTimer, setMostrarTimer] = useState(true);
  const [emSessao, setEmSessao] = useState(false);

  const { data: sessoes = [] } = useQuery({
    queryKey: ["trataka-sessoes", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from("trataka_sessoes")
        .select("*").eq("user_id", user!.id).order("criado_em", { ascending: false }).limit(200);
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const concluidas = sessoes.filter((s: any) => s.concluida);
    const total = concluidas.reduce((a: number, s: any) => a + (s.duracao_seg || 0), 0);
    const dias = new Set(concluidas.map((s: any) => (s.criado_em as string).slice(0, 10))).size;
    const daysSorted = [...new Set(concluidas.map((s: any) => (s.criado_em as string).slice(0, 10)))].sort() as string[];
    let maior = 0, atual = 0, prev: string | null = null;
    for (const d of daysSorted) {
      if (!prev) atual = 1;
      else {
        const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86400000;
        atual = diff === 1 ? atual + 1 : 1;
      }
      maior = Math.max(maior, atual);
      prev = d;
    }
    const hoje = new Date().toISOString().slice(0, 10);
    const setDias = new Set(daysSorted);
    let seq = 0;
    let cursor = hoje;
    while (setDias.has(cursor)) {
      seq++;
      cursor = new Date(new Date(cursor).getTime() - 86400000).toISOString().slice(0, 10);
    }
    const nivel = [...NIVEIS].reverse().find(n => total >= n.min) ?? NIVEIS[0];
    const proxNivel = NIVEIS.find(n => n.min > total);
    return { total, dias, sessoes: concluidas.length, maior, seq, nivel, proxNivel };
  }, [sessoes]);

  const setCustomDur = () => {
    const n = parseInt(custom, 10);
    if (n > 0 && n <= 120) setDuracao(n * 60);
  };

  const onEnd = async (elapsed: number, concluida: boolean) => {
    setEmSessao(false);
    if (!user) return;
    if (elapsed < 20) return;
    await (supabase as any).from("trataka_sessoes").insert({
      user_id: user.id,
      duracao_seg: elapsed,
      duracao_alvo_seg: duracao,
      modo,
      som_ambiente: modo === "ambiente" ? som : null,
      concluida,
    });
    if (concluida) {
      const heroi = await fetchHeroi(user.id);
      if (heroi) {
        const xpGanho = Math.min(60, 10 + Math.floor(elapsed / 60) * 3);
        const { xp_atual, nivel, xp_proximo_nivel, conquistas } = applyXp(heroi, xpGanho);
        await supabase.from("users").update({ xp_atual, nivel, xp_proximo_nivel }).eq("id", user.id);
        if (nivel > heroi.nivel) await unlockLevelConquistas(user.id, heroi.nivel, nivel);
        if (conquistas.length) await checkConquistas(user.id, conquistas);
        const totalNovo = stats.total + elapsed;
        const sessNovo = stats.sessoes + 1;
        const jaHoje = sessoes.some((s: any) => s.concluida && (s.criado_em as string).slice(0, 10) === new Date().toISOString().slice(0, 10));
        const seqNovo = stats.seq + (jaHoje ? 0 : 1);
        const rows: { tipo: string; titulo: string; descricao: string }[] = [];
        if (sessNovo === 1) rows.push({ tipo: "trataka_primeira", titulo: "Primeiro olhar", descricao: "Concluiu sua primeira sessão de Trataka." });
        if (seqNovo >= 7) rows.push({ tipo: "trataka_7dias", titulo: "7 dias de presença", descricao: "Uma semana consecutiva praticando Trataka." });
        if (seqNovo >= 30) rows.push({ tipo: "trataka_30dias", titulo: "30 dias de presença", descricao: "Um mês inteiro de foco visual." });
        if (totalNovo >= 3600) rows.push({ tipo: "trataka_1h", titulo: "1 hora acumulada", descricao: "Uma hora total olhando para o ponto." });
        if (totalNovo >= 36000) rows.push({ tipo: "trataka_10h", titulo: "10 horas acumuladas", descricao: "Dez horas totais de Trataka." });
        if (sessNovo >= 100) rows.push({ tipo: "trataka_100", titulo: "100 sessões", descricao: "Cem sessões de Trataka concluídas." });
        if (rows.length) await checkConquistas(user.id, rows);
        toast.success(`+${xpGanho} XP • ${fmtHoras(elapsed)} de foco`);
      }
    } else {
      toast(`Sessão registrada • ${fmtHoras(elapsed)}`);
    }
    qc.invalidateQueries({ queryKey: ["trataka-sessoes", user.id] });
    qc.invalidateQueries({ queryKey: ["heroi", user.id] });
  };

  return (
    <>
      <AnimatePresence>
        {emSessao && (
          <Sessao
            duracao={duracao}
            modo={modo}
            som={som}
            mostrarTimer={mostrarTimer}
            onEnd={onEnd}
            onCancel={() => setEmSessao(false)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#050505] text-white/85">
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <Link to="/mente" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.3em] uppercase text-white/40 hover:text-white/80 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> voltar
            </Link>
            <div className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.4em] uppercase text-white/30">
              <Eye className="w-3 h-3" /> Trataka
            </div>
          </div>

          <div className="text-center space-y-3 py-6">
            <h1 className="font-display text-3xl tracking-[0.35em] text-white/90">FOCO VISUAL</h1>
            <p className="text-[12px] text-white/40 max-w-md mx-auto leading-relaxed">
              Olhe para o ponto. Deixe a mente desacelerar. Presença absoluta.
            </p>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase text-white/40">
              <Timer className="w-3 h-3" /> duração
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESETS.map(s => (
                <button
                  key={s}
                  onClick={() => setDuracao(s)}
                  className={cn(
                    "py-2.5 rounded-md border text-[13px] tracking-wider transition",
                    duracao === s
                      ? "border-white/60 bg-white/10 text-white"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                  )}
                >
                  {s < 60 ? `${s}s` : `${s / 60}min`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={custom}
                onChange={e => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={setCustomDur}
                onKeyDown={e => e.key === "Enter" && setCustomDur()}
                placeholder="Personalizado"
                className="flex-1 bg-transparent border border-white/10 rounded-md px-3 py-2 text-[13px] text-white/80 placeholder:text-white/25 focus:border-white/40 focus:outline-none"
              />
              <span className="text-[11px] text-white/40 tracking-widest">min</span>
            </div>
          </section>

          <section className="space-y-3">
            <div className="text-[10px] tracking-[0.35em] uppercase text-white/40">modo</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "silencio", label: "Silêncio", Icon: VolumeX, desc: "Apenas o ponto" },
                { id: "ambiente", label: "Ambiente", Icon: Volume2, desc: "Som discreto" },
                { id: "respiracao", label: "Respiração", Icon: Wind, desc: "Pulso lento" },
              ].map(({ id, label, Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setModo(id as Modo)}
                  className={cn(
                    "p-3 rounded-md border text-left transition",
                    modo === id ? "border-white/60 bg-white/10" : "border-white/10 hover:border-white/30"
                  )}
                >
                  <Icon className="w-4 h-4 mb-2 text-white/70" />
                  <div className="text-[12px] tracking-widest text-white/90">{label}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
            {modo === "ambiente" && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {(["chuva", "vento", "ondas", "ruido_branco"] as SomAmb[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSom(s)}
                    className={cn(
                      "py-2 rounded-md border text-[11px] tracking-wider capitalize transition",
                      som === s ? "border-white/50 bg-white/10 text-white" : "border-white/10 text-white/45 hover:border-white/30"
                    )}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="flex items-center justify-between text-[11px] text-white/50">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarTimer}
                onChange={e => setMostrarTimer(e.target.checked)}
                className="accent-white/70"
              />
              Mostrar cronômetro
            </label>
            <span className="inline-flex items-center gap-1 text-white/30">
              <Settings2 className="w-3 h-3" /> tela permanece ligada
            </span>
          </section>

          <button
            onClick={() => setEmSessao(true)}
            className="w-full py-4 rounded-md border border-white/60 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white transition"
          >
            <span className="inline-flex items-center gap-3 text-[13px] tracking-[0.4em] uppercase text-white/90">
              <Play className="w-4 h-4" /> iniciar sessão · {fmt(duracao)}
            </span>
          </button>

          <section className="rounded-md border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.35em] uppercase text-white/40">nível</div>
                <div className="font-display text-lg tracking-[0.25em] text-white/90 mt-1">{stats.nivel.nome}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">acumulado</div>
                <div className="text-sm text-white/80 mt-1">{fmtHoras(stats.total)}</div>
              </div>
            </div>
            {stats.proxNivel && (
              <div className="space-y-1">
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-white/60"
                    style={{ width: `${Math.min(100, (stats.total / stats.proxNivel.min) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-white/35 tracking-wider">
                  próximo: {stats.proxNivel.nome} · faltam {fmtHoras(stats.proxNivel.min - stats.total)}
                </div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { l: "Sessões", v: stats.sessoes },
              { l: "Sequência", v: `${stats.seq}d` },
              { l: "Maior seq.", v: `${stats.maior}d` },
              { l: "Dias praticados", v: stats.dias },
            ].map((s, i) => (
              <div key={i} className="rounded-md border border-white/10 p-3 text-center">
                <div className="text-lg text-white/90 font-display tracking-wider">{s.v}</div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-white/35 mt-1">{s.l}</div>
              </div>
            ))}
          </section>

          <section className="rounded-md border border-white/5 p-5 space-y-2">
            <div className="text-[10px] tracking-[0.35em] uppercase text-white/40">a prática desenvolve</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["foco", "atenção", "concentração", "autocontrole", "menos ansiedade", "mente mais calma", "disciplina", "presença"].map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-white/55">
                  {t}
                </span>
              ))}
            </div>
          </section>

          <div className="h-8" />
        </div>
      </div>
    </>
  );
}
