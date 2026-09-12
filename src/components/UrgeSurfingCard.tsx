import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Waves, TrendingDown, Minus, TrendingUp, Brain, RotateCcw, Trash2, GlassWater, Sparkles, Coins, ShieldCheck, Eye, Compass, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { applyXp, fetchHeroi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { fireReward } from "@/components/fx/RewardBurst";

type WaveResult = "diminuiu" | "igual" | "aumentou";
type Trigger = "fome" | "sede" | "tedio" | "ansiedade" | "habito" | "comida" | "outro";
type Step = "perceber" | "distanciar" | "investigar" | "observar" | "escolher";
type Wave = { id: string; date: string; initial: number; final: number; durationSeconds: number; result: WaveResult; trigger: Trigger; waterMl: number };
type Props = { embedded?: boolean };

const WAVE_STORAGE = (uid: string) => `ascensao:urge-surfing:${uid}`;
const WATER_STORAGE = (uid: string, day: string) => `ascensao:agua:${uid}:${day}`;
const WATER_ACTIONS_STORAGE = (uid: string, day: string) => `ascensao:agua-acoes:${uid}:${day}`;
const WATER_TARGET_STORAGE = (uid: string) => `ascensao:agua-meta:${uid}`;
const DEFAULT_WATER_TARGET = 4000;
const TRIGGERS: { id: Trigger; label: string; emoji: string }[] = [
  { id: "fome", label: "Fome", emoji: "🍔" }, { id: "sede", label: "Sede", emoji: "🥤" }, { id: "tedio", label: "Tédio", emoji: "😶" },
  { id: "ansiedade", label: "Ansiedade", emoji: "😰" }, { id: "habito", label: "Hábito", emoji: "🔁" }, { id: "comida", label: "Comida À Vista", emoji: "👀" }, { id: "outro", label: "Outro", emoji: "❓" },
];
const STEPS: { id: Step; label: string; emoji: string }[] = [
  { id: "perceber", label: "Perceber", emoji: "👁️" }, { id: "distanciar", label: "Distanciar", emoji: "🧠" }, { id: "investigar", label: "Investigar", emoji: "🔎" },
  { id: "observar", label: "Observar", emoji: "🌊" }, { id: "escolher", label: "Escolher", emoji: "🧭" },
];

function today() { return new Date().toLocaleDateString("en-CA"); }
function loadWaves(uid: string): Wave[] { try { return JSON.parse(localStorage.getItem(WAVE_STORAGE(uid)) || "[]"); } catch { return []; } }
function saveWaves(uid: string, waves: Wave[]) { localStorage.setItem(WAVE_STORAGE(uid), JSON.stringify(waves.slice(0, 100))); }
function loadWater(uid: string) { return Number(localStorage.getItem(WATER_STORAGE(uid, today())) || 0); }
function saveWater(uid: string, ml: number) { localStorage.setItem(WATER_STORAGE(uid, today()), String(Math.max(0, ml))); }
function loadActions(uid: string): number[] { try { return JSON.parse(localStorage.getItem(WATER_ACTIONS_STORAGE(uid, today())) || "[]"); } catch { return []; } }
function saveActions(uid: string, actions: number[]) { localStorage.setItem(WATER_ACTIONS_STORAGE(uid, today()), JSON.stringify(actions.slice(-30))); }
function loadTarget(uid: string) { return Number(localStorage.getItem(WATER_TARGET_STORAGE(uid)) || DEFAULT_WATER_TARGET); }
function formatTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function msUntilTomorrow() { const n = new Date(); const next = new Date(n); next.setHours(24, 0, 0, 0); return Math.max(1000, next.getTime() - n.getTime()); }
function randomReward() { return Math.floor(Math.random() * 2) + 1; }

export default function UrgeSurfingCard({ embedded = false }: Props) {
  const { user } = useAuth(); const uid = user?.id;
  const [waves, setWaves] = useState<Wave[]>([]); const [water, setWater] = useState(0); const [waterTarget, setWaterTarget] = useState(DEFAULT_WATER_TARGET); const [waterActions, setWaterActions] = useState<number[]>([]);
  const [fasting, setFasting] = useState(false); const [open, setOpen] = useState(false); const [step, setStep] = useState<Step>("perceber");
  const [initial, setInitial] = useState(5); const [finalIntensity, setFinalIntensity] = useState(5); const [trigger, setTrigger] = useState<Trigger>("fome");
  const [startedAt, setStartedAt] = useState<number | null>(null); const [seconds, setSeconds] = useState(0); const [targetSeconds, setTargetSeconds] = useState(600); const [saving, setSaving] = useState(false); const [choice, setChoice] = useState("");

  const resetDailyWater = () => { if (!uid) return; setWater(0); setWaterActions([]); saveWater(uid, 0); saveActions(uid, []); };
  useEffect(() => {
    if (!uid) return;
    setWaves(loadWaves(uid)); setWater(loadWater(uid)); setWaterActions(loadActions(uid)); setWaterTarget(loadTarget(uid));
    const sync = () => setFasting(Boolean(localStorage.getItem(`ascensao:jejum:${uid}:active`)));
    sync(); const timer = window.setInterval(sync, 1000);
    let midnightTimer = 0;
    const scheduleMidnight = () => { midnightTimer = window.setTimeout(() => { resetDailyWater(); scheduleMidnight(); }, msUntilTomorrow()); };
    scheduleMidnight();
    return () => { window.clearInterval(timer); window.clearTimeout(midnightTimer); };
  }, [uid]);
  useEffect(() => { if (!startedAt) return; const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, [startedAt]);

  const todayWaves = useMemo(() => waves.filter(w => w.date.slice(0, 10) === today()), [waves]);
  const decreased = waves.filter(w => w.result === "diminuiu").length; const decreaseRate = waves.length ? Math.round((decreased / waves.length) * 100) : 0;
  const progress = Math.min(100, (water / Math.max(1, waterTarget)) * 100);
  const addWater = (ml: number) => { if (!uid || ml <= 0) return; const next = water + ml; const actions = [...waterActions, ml]; setWater(next); setWaterActions(actions); saveWater(uid, next); saveActions(uid, actions); };
  const undoWater = () => { if (!uid || !waterActions.length) return; const last = waterActions[waterActions.length - 1]; const actions = waterActions.slice(0, -1); const next = Math.max(0, water - last); setWater(next); setWaterActions(actions); saveWater(uid, next); saveActions(uid, actions); };

  const startWave = () => {
    if (!fasting) return;
    setInitial(5); setFinalIntensity(5); setTrigger("fome"); setChoice(""); setStep("perceber"); setTargetSeconds(600); setSeconds(0); setStartedAt(Date.now()); setOpen(true);
  };
  const closeWave = () => { if (saving) return; setStartedAt(null); setOpen(false); setStep("perceber"); };

  const finishWave = async (result: WaveResult) => {
    if (!uid || !startedAt || saving) return;
    setSaving(true);
    try {
      const xp = randomReward(); const ouro = randomReward(); const atributoDelta = randomReward();
      const current = await fetchHeroi(uid); if (!current) throw new Error("Herói não encontrado.");
      const nextXp = applyXp(current, xp);
      await supabase.from("users").update({ xp_atual: nextXp.xp_atual, nivel: nextXp.nivel, xp_proximo_nivel: nextXp.xp_proximo_nivel, ouro: current.ouro + ouro }).eq("id", uid);
      await supabase.from("transacoes_ouro").insert({ user_id: uid, valor: ouro, origem: "urge_surfing", descricao: "Urge Surfing" });
      const { data: attr } = await (supabase as any).from("hero_attributes").select("*").eq("user_id", uid).maybeSingle();
      await (supabase as any).from("hero_attributes").upsert({ user_id: uid, consciencia: attr?.consciencia ?? 0, foco: attr?.foco ?? 0, autodominio: (attr?.autodominio ?? 0) + atributoDelta, coragem: attr?.coragem ?? 0, disciplina: attr?.disciplina ?? 0, gestao: attr?.gestao ?? 0, resiliencia: attr?.resiliencia ?? 0 });
      const wave: Wave = { id: crypto.randomUUID(), date: new Date().toISOString(), initial, final: finalIntensity, durationSeconds: seconds, result, trigger, waterMl: water };
      const next = [wave, ...waves]; saveWaves(uid, next); setWaves(next); setStartedAt(null); setOpen(false); setStep("perceber");
      fireReward(`+${xp} XP`, "#a855f7"); setTimeout(() => fireReward(`+${ouro} Ouro`, "#facc15"), 180); setTimeout(() => fireReward(`+${atributoDelta} Autodomínio`, "#22c55e"), 360);
    } finally { setSaving(false); }
  };

  const waterPanel = <div className="relative overflow-hidden rounded-xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[.09] via-primary/[.04] to-background shadow-[0_0_24px_hsl(190_90%_50%/.06)]">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,hsl(190_90%_55%/.10),transparent_45%)]" />
    <div className="relative p-3 sm:p-3.5">
      <div className="flex items-center gap-2.5"><div className="grid place-items-center w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/25"><GlassWater className="w-4 h-4 text-cyan-300" /></div><div className="flex-1 min-w-0"><p className="text-[8px] uppercase tracking-[.28em] text-cyan-300">💧 RECURSO · HIDRATAÇÃO</p><p className="font-display text-sm tracking-wider">ÁGUA DE HOJE</p></div><span className="font-display text-sm text-cyan-300">{Math.round(progress)}%</span></div>
      <div className="mt-3 flex items-end justify-between"><div><span className="font-display text-2xl sm:text-3xl text-cyan-200">{water.toLocaleString("pt-BR")}</span><span className="ml-1 text-xs text-muted-foreground">ml</span></div><span className="text-[9px] text-muted-foreground">Meta {waterTarget.toLocaleString("pt-BR")} ml</span></div>
      <div className="mt-2 h-2 rounded-full bg-black/25 border border-white/5 overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300" animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} /></div>
      <div className="grid grid-cols-3 gap-1.5 mt-3"><button onClick={() => addWater(100)} className="rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] hover:bg-cyan-400/[.12] py-2 text-[10px] font-semibold text-cyan-200 transition">+100 ml</button><button onClick={() => addWater(200)} className="rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] hover:bg-cyan-400/[.12] py-2 text-[10px] font-semibold text-cyan-200 transition">+200 ml</button><button onClick={() => addWater(400)} className="rounded-lg border border-cyan-400/20 bg-cyan-400/[.06] hover:bg-cyan-400/[.12] py-2 text-[10px] font-semibold text-cyan-200 transition">+400 ml</button></div>
      <div className="flex items-center justify-between gap-2 mt-2"><button onClick={undoWater} disabled={!waterActions.length} className="flex items-center gap-1.5 text-[9px] text-muted-foreground hover:text-cyan-200 disabled:opacity-30 transition"><RotateCcw className="w-3 h-3" /> Desfazer{waterActions.length ? ` · -${waterActions[waterActions.length - 1]} ml` : ""}</button><button onClick={resetDailyWater} disabled={!water} className="flex items-center gap-1.5 text-[9px] text-muted-foreground hover:text-destructive disabled:opacity-30 transition"><Trash2 className="w-3 h-3" /> Zerar Hoje</button></div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center"><div className="rounded-lg border border-white/5 bg-white/[.02] py-2"><p className="text-[8px] text-muted-foreground">🌊 ONDAS</p><p className="font-display text-sm">{todayWaves.length}</p></div><div className="rounded-lg border border-white/5 bg-white/[.02] py-2"><p className="text-[8px] text-muted-foreground">📉 DIMINUÍRAM</p><p className="font-display text-sm">{decreaseRate}%</p></div><div className="rounded-lg border border-white/5 bg-white/[.02] py-2"><p className="text-[8px] text-muted-foreground">🏆 TOTAL</p><p className="font-display text-sm">{waves.length}</p></div></div>
    </div>
  </div>;

  const modal = <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
    <motion.div initial={{ y: 24, scale: .97 }} animate={{ y: 0, scale: 1 }} className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-primary/30 bg-card/95 shadow-[0_0_60px_hsl(var(--primary)/.12)]">
      <button onClick={closeWave} disabled={saving} className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-white/5"><X className="w-4 h-4" /></button>
      <div className="p-5 sm:p-6 space-y-5">
        <div className="text-center"><motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto grid place-items-center w-14 h-14 rounded-2xl border border-primary/30 bg-primary/10"><Waves className="w-7 h-7 text-primary" /></motion.div><p className="text-[9px] uppercase tracking-[.32em] text-primary mt-3">🌊 PROTOCOLO DE ONDA</p><h2 className="font-display text-2xl sm:text-3xl tracking-widest mt-1">VONTADE ≠ COMANDO</h2><p className="text-xs text-muted-foreground mt-2">Observe → distancie → interprete → escolha.</p></div>
        <div className="flex items-center gap-1.5">{STEPS.map((s, i) => <div key={s.id} className="flex-1"><div className={`h-1 rounded-full ${STEPS.findIndex(x => x.id === step) >= i ? "bg-primary" : "bg-white/10"}`} /><p className={`mt-1 text-center text-[7px] uppercase tracking-wider ${step === s.id ? "text-primary" : "text-muted-foreground"}`}>{s.emoji} {s.label}</p></div>)}</div>

        {step === "perceber" && <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4 text-center"><p className="text-[9px] uppercase tracking-[.25em] text-primary">👁️ PERCEBA</p><p className="font-display text-lg mt-2">Existe uma vontade acontecendo agora.</p><p className="text-xs text-muted-foreground mt-2">“Estou percebendo uma vontade de {trigger === "sede" ? "beber" : "comer"}.”</p></div>
          <div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">O que apareceu?</p><div className="grid grid-cols-2 gap-2">{TRIGGERS.map(t => <button key={t.id} onClick={() => setTrigger(t.id)} className={`rounded-xl border p-3 text-left transition ${trigger === t.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"}`}><span className="text-lg">{t.emoji}</span><span className="ml-2 text-[10px]">{t.label}</span></button>)}</div></div>
          <button onClick={() => setStep("distanciar")} className="w-full rounded-xl bg-primary py-3 text-xs font-bold tracking-wider text-primary-foreground">PERCEBI → CONTINUAR</button>
        </motion.div>}

        {step === "distanciar" && <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4"><div className="flex items-center gap-2 text-primary"><Brain className="w-4 h-4" /><span className="text-[9px] uppercase tracking-[.25em]">🧠 DISTANCIE</span></div><p className="font-display text-lg mt-3">“Estou tendo o pensamento de que preciso agir agora.”</p><p className="text-xs text-muted-foreground mt-2">A vontade pode estar presente sem virar uma ordem.</p></div>
          <div className="rounded-xl border border-white/5 bg-white/[.02] p-4 text-center"><p className="text-[10px] text-muted-foreground">Você percebe a onda.</p><p className="font-display text-xl text-primary mt-1">Você não é a onda.</p></div>
          <button onClick={() => setStep("investigar")} className="w-full rounded-xl bg-primary py-3 text-xs font-bold tracking-wider text-primary-foreground">DISTANCIEI → CONTINUAR</button>
        </motion.div>}

        {step === "investigar" && <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4"><div className="flex items-center gap-2 text-primary"><Compass className="w-4 h-4" /><span className="text-[9px] uppercase tracking-[.25em]">🔎 INVESTIGUE</span></div><p className="font-display text-lg mt-3">Que significado estou dando a isso agora?</p><p className="text-xs text-muted-foreground mt-2">A percepção é sua. A interpretação é sua. A próxima ação também é sua.</p></div>
          <div className="grid grid-cols-1 gap-2">{["Preciso aliviar isso agora.", "Não vou conseguir resistir.", "Meu corpo está pedindo isso.", "É só uma vontade passando."].map(text => <button key={text} onClick={() => setChoice(text)} className={`rounded-xl border p-3 text-left text-xs transition ${choice === text ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"}`}>{text}</button>)}</div>
          <button disabled={!choice} onClick={() => setStep("observar")} className="w-full rounded-xl bg-primary py-3 text-xs font-bold tracking-wider text-primary-foreground disabled:opacity-40">ESCOLHI UMA INTERPRETAÇÃO → OBSERVAR</button>
        </motion.div>}

        {step === "observar" && <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="text-center"><p className="text-[9px] uppercase tracking-[.25em] text-primary">🌊 OBSERVE A ONDA</p><p className="font-display text-5xl text-primary tracking-widest mt-2">{formatTime(seconds)}</p><p className="text-xs text-muted-foreground mt-1">{seconds < targetSeconds ? `Observe por mais ${formatTime(targetSeconds - seconds)}` : "Tempo concluído — escolha quando estiver pronto."}</p></div>
          <div className="relative h-36 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[.035]"><motion.div animate={{ y: [8, -8, 8], scaleX: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute left-[-10%] right-[-10%] top-1/2 h-24 rounded-[50%] border-t-2 border-primary/60 bg-primary/[.08] shadow-[0_-12px_35px_hsl(var(--primary)/.10)]" /><div className="absolute inset-0 grid place-items-center"><div className="rounded-full border border-primary/30 bg-background/70 px-5 py-3 text-center backdrop-blur"><p className="text-[8px] uppercase tracking-[.25em] text-muted-foreground">INTENSIDADE</p><p className="font-display text-2xl text-primary">{initial}/10</p></div></div></div>
          <div><div className="flex justify-between text-[9px] text-muted-foreground"><span>1 · baixa</span><span>{initial}/10</span><span>10 · alta</span></div><input type="range" min="1" max="10" value={initial} onChange={e => setInitial(Number(e.target.value))} className="w-full accent-primary mt-2" /></div>
          <div className="grid grid-cols-4 gap-1.5">{[60, 180, 300, 600].map(s => <button key={s} onClick={() => setTargetSeconds(s)} className={`rounded-lg border py-2 text-[9px] ${targetSeconds === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s / 60} min</button>)}</div>
          {seconds >= targetSeconds ? <button onClick={() => setStep("escolher")} className="w-full rounded-xl bg-primary py-3 text-xs font-bold tracking-wider text-primary-foreground">🌊 ONDA OBSERVADA → ESCOLHER</button> : <div className="text-center text-[9px] text-muted-foreground">Respire. Observe. Não precisa resolver nada neste instante.</div>}
        </motion.div>}

        {step === "escolher" && <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4 text-center"><p className="text-[9px] uppercase tracking-[.25em] text-primary">🧭 ESCOLHA</p><p className="font-display text-xl mt-2">A onda mudou?</p><p className="text-xs text-muted-foreground mt-1">Você não precisa obedecer. Você pode escolher.</p></div>
          <div><div className="flex justify-between text-[9px] text-muted-foreground"><span>Antes: {initial}/10</span><span>Agora: {finalIntensity}/10</span></div><input type="range" min="1" max="10" value={finalIntensity} onChange={e => setFinalIntensity(Number(e.target.value))} className="w-full accent-primary mt-2" /></div>
          <div className="grid grid-cols-3 gap-2"><button disabled={saving} onClick={() => finishWave("diminuiu")} className="rounded-xl border border-emerald-400/30 bg-emerald-400/[.06] p-3 text-xs text-emerald-300"><TrendingDown className="w-5 h-5 mx-auto mb-1" />Diminuiu</button><button disabled={saving} onClick={() => finishWave("igual")} className="rounded-xl border border-border bg-white/[.02] p-3 text-xs"><Minus className="w-5 h-5 mx-auto mb-1" />Igual</button><button disabled={saving} onClick={() => finishWave("aumentou")} className="rounded-xl border border-amber-400/30 bg-amber-400/[.06] p-3 text-xs text-amber-300"><TrendingUp className="w-5 h-5 mx-auto mb-1" />Aumentou</button></div>
          <div className="rounded-xl border border-white/5 bg-white/[.02] p-3"><p className="text-[9px] uppercase tracking-[.2em] text-muted-foreground">Escolha consciente</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px]">🛡️ Continuar meu plano</span><span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px]">💧 Tomar água</span><span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px]">🚶 Mudar de ambiente</span></div></div>
        </motion.div>}

        <div className="rounded-xl border border-white/5 bg-white/[.02] p-3 flex items-center gap-3"><Eye className="w-4 h-4 text-primary" /><p className="text-[9px] text-muted-foreground">Você está treinando a capacidade de perceber uma experiência interna sem transformar automaticamente essa experiência em ação.</p></div>
      </div>
    </motion.div>
  </motion.div>}</AnimatePresence>;

  if (embedded) return <>
    <button onClick={startWave} disabled={!fasting} className="group w-full rounded-lg border border-primary/25 bg-primary/[.045] hover:bg-primary/[.09] py-2.5 px-3 transition disabled:opacity-40 disabled:cursor-not-allowed"><div className="flex items-center justify-center gap-2"><Waves className="w-4 h-4 text-primary group-hover:scale-110 transition" /><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Estou Com Vontade</span><span className="text-xs">🌊</span></div></button>
    {modal}
  </>;

  return <>
    {waterPanel}
    {modal}
  </>;
}
