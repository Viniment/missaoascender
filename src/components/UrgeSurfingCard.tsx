import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Waves, TimerReset, TrendingDown, Minus, TrendingUp, Brain, RotateCcw, Trash2, GlassWater, Sparkles, Coins, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { applyXp, fetchHeroi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { fireReward } from "@/components/fx/RewardBurst";

type WaveResult = "diminuiu" | "igual" | "aumentou";
type Trigger = "fome" | "sede" | "tedio" | "ansiedade" | "habito" | "comida" | "outro";
type Wave = { id: string; date: string; initial: number; final: number; durationSeconds: number; result: WaveResult; trigger: Trigger; waterMl: number };
type Props = { embedded?: boolean };
const WAVE_STORAGE = (uid: string) => `ascensao:urge-surfing:${uid}`;
const WATER_STORAGE = (uid: string, day: string) => `ascensao:agua:${uid}:${day}`;
const WATER_ACTIONS_STORAGE = (uid: string, day: string) => `ascensao:agua-acoes:${uid}:${day}`;
const WATER_TARGET_STORAGE = (uid: string) => `ascensao:agua-meta:${uid}`;
const DEFAULT_WATER_TARGET = 4000;
const TRIGGERS: { id: Trigger; label: string }[] = [
  { id: "fome", label: "Fome" }, { id: "sede", label: "Sede" }, { id: "tedio", label: "Tédio" },
  { id: "ansiedade", label: "Ansiedade" }, { id: "habito", label: "Hábito" }, { id: "comida", label: "Comida À Vista" }, { id: "outro", label: "Outro" },
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
  const [fasting, setFasting] = useState(false); const [open, setOpen] = useState(false); const [initial, setInitial] = useState(5); const [finalIntensity, setFinalIntensity] = useState(5);
  const [trigger, setTrigger] = useState<Trigger>("fome"); const [startedAt, setStartedAt] = useState<number | null>(null); const [seconds, setSeconds] = useState(0); const [saving, setSaving] = useState(false);

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
  const startWave = () => { if (!fasting) return; setInitial(5); setFinalIntensity(5); setTrigger("fome"); setSeconds(0); setStartedAt(Date.now()); setOpen(true); };

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
      const next = [wave, ...waves]; saveWaves(uid, next); setWaves(next); setStartedAt(null); setOpen(false);
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
    </div>
  </div>;

  const modal = <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[95] bg-background/85 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ y: 20, scale: .98 }} animate={{ y: 0, scale: 1 }} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rpg-panel border-primary/40 p-5 space-y-5">
    <div className="text-center"><Waves className="w-8 h-8 mx-auto text-primary" /><p className="text-[10px] uppercase tracking-[.3em] text-primary mt-2">🌊 SURFE A VONTADE</p><h2 className="font-display text-2xl tracking-widest mt-1">VONTADE ≠ COMANDO</h2><p className="text-xs text-muted-foreground mt-2">Você percebe a onda. Não precisa obedecer ao impulso.</p></div>
    <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-3 space-y-2"><p className="text-[9px] uppercase tracking-[.25em] text-primary">🧠 DISTANCIAMENTO</p><p className="text-xs">“Estou percebendo uma vontade de {trigger === "sede" ? "beber" : "comer"}.”</p><p className="text-[10px] text-muted-foreground">Observe o sinal como um evento interno. Depois pergunte: <span className="text-foreground">“Que significado estou dando a isso agora?”</span></p><p className="text-[10px] text-muted-foreground">A percepção é sua. A interpretação é sua. A próxima ação também é sua.</p></div>
    <div className="text-center"><p className="text-[9px] uppercase tracking-[.25em] text-muted-foreground">Tempo De Observação</p><p className="font-display text-4xl text-primary tracking-widest">{formatTime(seconds)}</p><p className="text-[10px] text-muted-foreground">{seconds < 600 ? `Continue por mais ${formatTime(600 - seconds)}` : "10 minutos completos"}</p></div>
    <div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Intensidade Inicial: {initial}/10</p><input type="range" min="1" max="10" value={initial} onChange={e => setInitial(Number(e.target.value))} className="w-full accent-primary" /></div>
    <div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Possível Gatilho</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{TRIGGERS.map(t => <button key={t.id} onClick={() => setTrigger(t.id)} className={`rounded-md border px-2 py-2 text-[10px] ${trigger === t.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t.label}</button>)}</div></div>
    {seconds >= 600 ? <><div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Intensidade Agora: {finalIntensity}/10</p><input type="range" min="1" max="10" value={finalIntensity} onChange={e => setFinalIntensity(Number(e.target.value))} className="w-full accent-primary" /></div><div><p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mb-2">Como A Onda Terminou?</p><div className="grid grid-cols-3 gap-2"><button disabled={saving} onClick={() => finishWave("diminuiu")} className="border border-primary/40 rounded-md p-2 text-xs text-primary"><TrendingDown className="w-4 h-4 mx-auto mb-1" />Diminuiu</button><button disabled={saving} onClick={() => finishWave("igual")} className="border border-border rounded-md p-2 text-xs"><Minus className="w-4 h-4 mx-auto mb-1" />Igual</button><button disabled={saving} onClick={() => finishWave("aumentou")} className="border border-destructive/40 rounded-md p-2 text-xs text-destructive"><TrendingUp className="w-4 h-4 mx-auto mb-1" />Aumentou</button></div></div></> : <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><TimerReset className="w-4 h-4" /> Primeiro observe por 10 minutos.</div>}
    <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg border border-primary/20 bg-primary/[.04] p-2"><Sparkles className="w-3.5 h-3.5 mx-auto text-primary" /><p className="text-[8px] text-muted-foreground mt-1">XP</p><p className="font-display text-sm">+1–2</p></div><div className="rounded-lg border border-amber-400/20 bg-amber-400/[.04] p-2"><Coins className="w-3.5 h-3.5 mx-auto text-amber-300" /><p className="text-[8px] text-muted-foreground mt-1">OURO</p><p className="font-display text-sm">+1–2</p></div><div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[.04] p-2"><ShieldCheck className="w-3.5 h-3.5 mx-auto text-emerald-300" /><p className="text-[8px] text-muted-foreground mt-1">ATRIBUTO</p><p className="font-display text-sm">+1–2</p></div></div>
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Brain className="w-4 h-4 text-primary" /> Observe → distancie → interprete → escolha.</div>
    <button onClick={() => { setStartedAt(null); setOpen(false); }} className="w-full border border-border rounded-md py-2 text-xs">Fechar Sem Registrar</button>
  </motion.div></motion.div>}</AnimatePresence>;

  if (embedded) return <><button onClick={startWave} disabled={!fasting || Boolean(startedAt)} className="w-full border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-md py-2.5 px-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.2em] text-primary disabled:opacity-40 disabled:cursor-not-allowed"><Waves className="w-4 h-4" /> {startedAt ? `Estou Com Vontade · ${formatTime(seconds)}` : "🌊 Estou Com Vontade"}</button>{modal}</>;

  return <div className="space-y-2.5">{waterPanel}{waves.length > 0 && <div className="grid grid-cols-3 gap-1.5 text-center"><div className="border border-border rounded-lg p-1.5"><b className="font-display text-sm">{waves.length}</b><span className="block text-[7px] text-muted-foreground uppercase">Ondas</span></div><div className="border border-border rounded-lg p-1.5"><b className="font-display text-sm">{decreaseRate}%</b><span className="block text-[7px] text-muted-foreground uppercase">Diminuíram</span></div><div className="border border-border rounded-lg p-1.5"><b className="font-display text-sm">{todayWaves.length}</b><span className="block text-[7px] text-muted-foreground uppercase">Hoje</span></div></div>}</div>;
}
