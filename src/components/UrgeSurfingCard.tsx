import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Waves, TimerReset, TrendingDown, Minus, TrendingUp, Brain, Plus, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type WaveResult = "diminuiu" | "igual" | "aumentou";
type Trigger = "fome" | "sede" | "tedio" | "ansiedade" | "habito" | "comida" | "outro";
type Wave = { id: string; date: string; initial: number; final: number; durationSeconds: number; result: WaveResult; trigger: Trigger; waterMl: number };

const WAVE_STORAGE = (uid: string) => `ascensao:urge-surfing:${uid}`;
const WATER_STORAGE = (uid: string, day: string) => `ascensao:agua:${uid}:${day}`;
const WATER_TARGET_STORAGE = (uid: string) => `ascensao:agua-meta:${uid}`;
const TRIGGERS: { id: Trigger; label: string }[] = [
  { id: "fome", label: "Fome" }, { id: "sede", label: "Sede" }, { id: "tedio", label: "Tédio" },
  { id: "ansiedade", label: "Ansiedade" }, { id: "habito", label: "Hábito" }, { id: "comida", label: "Comida À Vista" }, { id: "outro", label: "Outro" },
];

function today() { return new Date().toISOString().slice(0, 10); }
function loadWaves(uid: string): Wave[] { try { return JSON.parse(localStorage.getItem(WAVE_STORAGE(uid)) || "[]"); } catch { return []; } }
function saveWaves(uid: string, waves: Wave[]) { localStorage.setItem(WAVE_STORAGE(uid), JSON.stringify(waves.slice(0, 100))); }
function loadWater(uid: string) { return Number(localStorage.getItem(WATER_STORAGE(uid, today())) || 0); }
function saveWater(uid: string, ml: number) { localStorage.setItem(WATER_STORAGE(uid, today()), String(Math.max(0, ml))); }
function loadTarget(uid: string) { return Number(localStorage.getItem(WATER_TARGET_STORAGE(uid)) || 2500); }
function formatTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

export default function UrgeSurfingCard() {
  const { user } = useAuth();
  const uid = user?.id;
  const [waves, setWaves] = useState<Wave[]>([]);
  const [water, setWater] = useState(0);
  const [waterTarget, setWaterTarget] = useState(2500);
  const [fasting, setFasting] = useState(false);
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState(5);
  const [finalIntensity, setFinalIntensity] = useState(5);
  const [trigger, setTrigger] = useState<Trigger>("fome");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setWaves(loadWaves(uid));
    setWater(loadWater(uid));
    setWaterTarget(loadTarget(uid));
    const sync = () => setFasting(Boolean(localStorage.getItem(`ascensao:jejum:${uid}:active`)));
    sync();
    const timer = window.setInterval(sync, 1000);
    return () => window.clearInterval(timer);
  }, [uid]);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const todayWaves = useMemo(() => waves.filter(w => w.date.slice(0, 10) === today()), [waves]);
  const decreased = waves.filter(w => w.result === "diminuiu").length;
  const decreaseRate = waves.length ? Math.round((decreased / waves.length) * 100) : 0;
  const progress = Math.min(100, (water / Math.max(1, waterTarget)) * 100);
  const graph = [...waves].slice(0, 8).reverse();

  const addWater = (ml: number) => {
    if (!uid) return;
    const next = water + ml;
    setWater(next);
    saveWater(uid, next);
  };

  const startWave = () => {
    if (!fasting) return;
    setInitial(5); setFinalIntensity(5); setTrigger("fome"); setSeconds(0); setStartedAt(Date.now()); setOpen(true);
  };

  const finishWave = (result: WaveResult) => {
    if (!uid || !startedAt) return;
    setSaving(true);
    const wave: Wave = { id: crypto.randomUUID(), date: new Date().toISOString(), initial, final: finalIntensity, durationSeconds: seconds, result, trigger, waterMl: water };
    const next = [wave, ...waves];
    saveWaves(uid, next); setWaves(next); setStartedAt(null); setOpen(false); setSaving(false);
  };

  return <div className="rpg-panel border-primary/20 overflow-hidden">
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md grid place-items-center bg-primary/10 border border-primary/30 text-primary"><Waves className="w-5 h-5" /></div>
        <div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[.3em] text-primary">URGE SURFING</p><h3 className="font-display tracking-widest">Surfar A Vontade</h3><p className="text-[10px] text-muted-foreground">Observe a onda antes de decidir o próximo passo.</p></div>
      </div>

      <button onClick={startWave} disabled={!fasting || Boolean(startedAt)} className="w-full btn-pixel py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
        <Waves className="w-4 h-4" /> {startedAt ? `Onda Em Andamento · ${formatTime(seconds)}` : "⚡ Estou Com Vontade"}
      </button>
      {!fasting && <p className="text-[10px] text-center text-muted-foreground">Inicie um jejum para ativar o Urge Surfing.</p>}

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-2 mb-2"><Droplets className="w-4 h-4 text-primary" /><p className="text-[10px] uppercase tracking-[.25em] text-muted-foreground">Hidratação De Hoje</p><span className="ml-auto font-display text-xs">{water} / {waterTarget} ml</span></div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden"><motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} /></div>
        <div className="flex gap-2 mt-2"><button onClick={() => addWater(250)} className="flex-1 border border-border rounded-md py-1.5 text-[10px] hover:border-primary/50"><Plus className="w-3 h-3 inline" /> 250 ml</button><button onClick={() => addWater(500)} className="flex-1 border border-border rounded-md py-1.5 text-[10px] hover:border-primary/50"><Plus className="w-3 h-3 inline" /> 500 ml</button></div>
      </div>

      {waves.length > 0 && <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-md border border-border p-2"><p className="font-display text-lg">{waves.length}</p><p className="text-[9px] text-muted-foreground uppercase">Ondas</p></div><div className="rounded-md border border-border p-2"><p className="font-display text-lg">{decreaseRate}%</p><p className="text-[9px] text-muted-foreground uppercase">Diminuíram</p></div><div className="rounded-md border border-border p-2"><p className="font-display text-lg">{todayWaves.length}</p><p className="text-[9px] text-muted-foreground uppercase">Hoje</p></div></div>}

      {graph.length > 0 && <div className="space-y-2"><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><p className="text-[10px] uppercase tracking-[.25em] text-muted-foreground">Últimas Ondas</p></div><div className="space-y-1">{graph.map(w => <div key={w.id} className="flex items-center gap-2 text-[10px]"><span className="w-8 text-muted-foreground">{w.initial}</span><div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.max(4, (w.final / 10) * 100)}%` }} /></div><span className="w-8 text-right">{w.final}</span><span className="w-5">{w.result === "diminuiu" ? "↓" : w.result === "aumentou" ? "↑" : "→"}</span></div>)}</div></div>}
    </div>

    <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-background/85 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ y: 20, scale: .98 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-lg rpg-panel border-primary/40 p-5 space-y-5">
      <div className="text-center"><Waves className="w-8 h-8 mx-auto text-primary" /><p className="text-[10px] uppercase tracking-[.3em] text-primary mt-2">SURFE A VONTADE</p><h2 className="font-display text-2xl tracking-widest mt-1">VONTADE ≠ COMANDO</h2><p className="text-xs text-muted-foreground mt-2">Apenas observe. A onda pode mudar sem que você precise obedecê-la.</p></div>
      <div className="text-center"><p className="text-[9px] uppercase tracking-[.25em] text-muted-foreground">Tempo De Observação</p><p className="font-display text-4xl text-primary tracking-widest">{formatTime(seconds)}</p><p className="text-[10px] text-muted-foreground">{seconds < 600 ? `Continue por mais ${formatTime(600 - seconds)}` : "10 minutos completos"}</p></div>
      <div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Intensidade Inicial: {initial}/10</p><input type="range" min="1" max="10" value={initial} onChange={e => setInitial(Number(e.target.value))} className="w-full accent-primary" /></div>
      <div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Possível Gatilho</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{TRIGGERS.map(t => <button key={t.id} onClick={() => setTrigger(t.id)} className={`rounded-md border px-2 py-2 text-[10px] ${trigger === t.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t.label}</button>)}</div></div>
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3"><p className="text-[10px] text-muted-foreground flex items-center gap-2"><Droplets className="w-4 h-4 text-primary" /> Água registrada hoje: <strong>{water} ml</strong></p><div className="flex gap-2 mt-2"><button onClick={() => addWater(250)} className="flex-1 border border-border rounded-md py-1.5 text-[10px]">+250 ml</button><button onClick={() => addWater(500)} className="flex-1 border border-border rounded-md py-1.5 text-[10px]">+500 ml</button></div></div>
      {seconds >= 600 ? <><div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Intensidade Agora: {finalIntensity}/10</p><input type="range" min="1" max="10" value={finalIntensity} onChange={e => setFinalIntensity(Number(e.target.value))} className="w-full accent-primary" /></div><div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Como A Onda Terminou?</p><div className="grid grid-cols-3 gap-2"><button disabled={saving} onClick={() => finishWave("diminuiu")} className="border border-primary/40 rounded-md p-2 text-xs text-primary"><TrendingDown className="w-4 h-4 mx-auto mb-1" />Diminuiu</button><button disabled={saving} onClick={() => finishWave("igual")} className="border border-border rounded-md p-2 text-xs"><Minus className="w-4 h-4 mx-auto mb-1" />Igual</button><button disabled={saving} onClick={() => finishWave("aumentou")} className="border border-destructive/40 rounded-md p-2 text-xs text-destructive"><TrendingUp className="w-4 h-4 mx-auto mb-1" />Aumentou</button></div></div></> : <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><TimerReset className="w-4 h-4" /> Primeiro observe por 10 minutos.</div>}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Brain className="w-4 h-4 text-primary" /> Registrar a onda não significa que você precisa continuar ou interromper o jejum; significa apenas observar e escolher conscientemente.</div>
      <button onClick={() => { setStartedAt(null); setOpen(false); }} className="w-full border border-border rounded-md py-2 text-xs">Fechar Sem Registrar</button>
    </motion.div></motion.div>}</AnimatePresence>
  </div>;
}
