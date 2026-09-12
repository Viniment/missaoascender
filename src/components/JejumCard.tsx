import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyXp, fetchHeroi } from "@/lib/api";
import { fireReward } from "@/components/fx/RewardBurst";
import { Clock3, ChevronDown, ChevronUp, CircleCheck, Play, Square, Brain, Waves, Smile, Meh, Frown, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

type Mood = "tranquila" | "normal" | "vontade" | "dificil";
type HourState = { hour: number; mood: Mood; at: string };
type Reward = { xp: number; ouro: number; vida: number; atributo: string; atributoDelta: number; horas: number; niveis: number[] };
type Session = { id: string; startedAt: string; endedAt: string; minutes: number; hourlyStates: HourState[]; reward?: Reward };

const STORAGE = (uid: string) => `ascensao:jejum:${uid}`;
const MOODS = [
  { id: "tranquila", label: "Tranquila", icon: Smile }, { id: "normal", label: "Normal", icon: Meh },
  { id: "vontade", label: "Vontade", icon: Waves }, { id: "dificil", label: "Difícil", icon: Frown },
] as const;
const MILESTONES = Array.from({ length: 63 }, (_, i) => (i + 1) * 8);
function pad(n: number) { return String(n).padStart(2, "0"); }
function toInputValue(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function formatDate(iso: string) { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
function durationText(minutes: number) { return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}min`; }
function loadSessions(uid: string): Session[] { try { return JSON.parse(localStorage.getItem(STORAGE(uid)) || "[]"); } catch { return []; } }
function saveSessions(uid: string, sessions: Session[]) { localStorage.setItem(STORAGE(uid), JSON.stringify(sessions)); }
function getMinutes(start: string, end: string) { return Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000)); }
function tituloPorHoras(h: number) { return h >= 8 ? `${Math.floor(h / 8) * 8} Horas de Jejum` : "Jejum Em Andamento"; }

// Cada hora completa gera 1 nível. Nível 3 é o mais raro e é o teto por hora.
function rollHourlyRewardLevel() {
  const r = Math.random();
  if (r < 0.65) return 1;
  if (r < 0.92) return 2;
  return 3;
}

export default function JejumCard() {
  const { user } = useAuth(); const uid = user?.id;
  const [active, setActive] = useState<{ startedAt: string; hourlyStates: HourState[] } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]); const [now, setNow] = useState(Date.now()); const [expanded, setExpanded] = useState(false);
  const [startOpen, setStartOpen] = useState(false); const [finishOpen, setFinishOpen] = useState(false); const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [startValue, setStartValue] = useState(toInputValue(new Date())); const [finishValue, setFinishValue] = useState(toInputValue(new Date())); const [mood, setMood] = useState<Mood>("normal"); const [saving, setSaving] = useState(false);

  useEffect(() => { if (!uid) return; setSessions(loadSessions(uid)); const raw = localStorage.getItem(`${STORAGE(uid)}:active`); if (raw) { try { setActive(JSON.parse(raw)); } catch { localStorage.removeItem(`${STORAGE(uid)}:active`); } } }, [uid]);
  useEffect(() => { if (!active) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [active]);

  const elapsedMinutes = active ? getMinutes(active.startedAt, new Date(now).toISOString()) : 0;
  const elapsedHours = Math.floor(elapsedMinutes / 60); const nextMilestone = MILESTONES.find(x => x > elapsedHours) ?? null;
  const progress = nextMilestone ? Math.min(100, (elapsedMinutes / (nextMilestone * 60)) * 100) : 100;
  const maxHours = useMemo(() => Math.max(0, ...sessions.map(s => s.minutes / 60), active ? elapsedMinutes / 60 : 0), [sessions, active, elapsedMinutes]);

  useEffect(() => { if (!active || elapsedHours < 1) return; const states = [...active.hourlyStates]; for (let h = 1; h <= elapsedHours; h++) if (!states.some(x => x.hour === h)) states.push({ hour: h, mood, at: new Date(new Date(active.startedAt).getTime() + h * 3600000).toISOString() }); if (states.length !== active.hourlyStates.length) { const next = { ...active, hourlyStates: states }; setActive(next); if (uid) localStorage.setItem(`${STORAGE(uid)}:active`, JSON.stringify(next)); } }, [elapsedHours, mood, active, uid]);

  const chooseMood = (value: Mood) => { setMood(value); if (!active || !uid) return; const updated = { ...active }; const hour = Math.max(1, elapsedHours); const index = updated.hourlyStates.findIndex(x => x.hour === hour); const item = { hour, mood: value, at: new Date().toISOString() }; if (index >= 0) updated.hourlyStates[index] = item; else updated.hourlyStates.push(item); setActive(updated); localStorage.setItem(`${STORAGE(uid)}:active`, JSON.stringify(updated)); };
  const start = () => { const iso = new Date(startValue).toISOString(); const next = { startedAt: iso, hourlyStates: [] }; setActive(next); setNow(Date.now()); if (uid) localStorage.setItem(`${STORAGE(uid)}:active`, JSON.stringify(next)); setStartOpen(false); setExpanded(true); };
  const openFinish = () => { setFinishValue(toInputValue(new Date())); setFinishOpen(true); };

  const confirmFinish = async () => {
    if (!active || !uid) return; const endedAt = new Date(finishValue).toISOString(); const minutes = getMinutes(active.startedAt, endedAt); if (minutes <= 0) return;
    const fullHours = Math.floor(minutes / 60); const levels = Array.from({ length: fullHours }, () => rollHourlyRewardLevel());
    // Nível 1/2/3 por hora = 25/50/75 XP, 8/16/24 ouro, 1/2/3 vida e 1/2/3 atributo.
    const xp = levels.reduce((sum, level) => sum + level * 25, 0); const ouro = levels.reduce((sum, level) => sum + level * 8, 0);
    const vida = levels.reduce((sum, level) => sum + level, 0); const atributoDelta = levels.reduce((sum, level) => sum + level, 0);
    setSaving(true);
    try {
      const current = await fetchHeroi(uid); if (!current) throw new Error("Herói não encontrado."); const nextXp = applyXp(current, xp); const nextVida = Math.min(current.vida_max, current.vida_atual + vida);
      await supabase.from("users").update({ xp_atual: nextXp.xp_atual, nivel: nextXp.nivel, xp_proximo_nivel: nextXp.xp_proximo_nivel, vida_atual: nextVida, ouro: current.ouro + ouro }).eq("id", uid);
      if (ouro > 0) await supabase.from("transacoes_ouro").insert({ user_id: uid, valor: ouro, origem: "jejum", descricao: `Jejum de ${durationText(minutes)}` });
      const { data: attr } = await (supabase as any).from("hero_attributes").select("*").eq("user_id", uid).maybeSingle();
      await (supabase as any).from("hero_attributes").upsert({ user_id: uid, consciencia: attr?.consciencia ?? 0, foco: attr?.foco ?? 0, autodominio: (attr?.autodominio ?? 0) + atributoDelta, coragem: attr?.coragem ?? 0, disciplina: attr?.disciplina ?? 0, gestao: attr?.gestao ?? 0, resiliencia: attr?.resiliencia ?? 0 });
      if (nextXp.conquistas.length) await supabase.from("conquistas").upsert(nextXp.conquistas.map(c => ({ user_id: uid, tipo: c.tipo, titulo: c.titulo, descricao: c.descricao })), { onConflict: "user_id,tipo", ignoreDuplicates: true });
      const hourlyStates = [...active.hourlyStates]; for (let h = 1; h <= fullHours; h++) if (!hourlyStates.some(x => x.hour === h)) hourlyStates.push({ hour: h, mood, at: new Date(new Date(active.startedAt).getTime() + h * 3600000).toISOString() });
      const reward: Reward = { xp, ouro, vida, atributo: "autodominio", atributoDelta, horas: fullHours, niveis: levels }; const session: Session = { id: crypto.randomUUID(), startedAt: active.startedAt, endedAt, minutes, hourlyStates, reward }; const nextSessions = [session, ...sessions];
      saveSessions(uid, nextSessions); setSessions(nextSessions); localStorage.removeItem(`${STORAGE(uid)}:active`); setActive(null); setFinishOpen(false); setFinishConfirmOpen(false);
      if (fullHours > 0) { fireReward(`+${xp} XP`, "#a855f7"); setTimeout(() => fireReward(`+${ouro} Ouro`, "#facc15"), 180); setTimeout(() => fireReward(`+${vida} Vida`, "#ef4444"), 360); setTimeout(() => fireReward(`+${atributoDelta} Autodomínio`, "#22c55e"), 540); }
    } finally { setSaving(false); }
  };

  const elapsedSeconds = active ? Math.max(0, Math.floor((now - new Date(active.startedAt).getTime()) / 1000)) : 0; const hoursDisplay = `${pad(Math.floor(elapsedSeconds / 3600))}:${pad(Math.floor((elapsedSeconds % 3600) / 60))}:${pad(elapsedSeconds % 60)}`;
  return <div className="rpg-panel overflow-hidden border-primary/30 shadow-[0_0_28px_hsl(var(--primary)/.06)]">
    <button type="button" onClick={() => setExpanded(v => !v)} className="w-full p-4 text-left hover:bg-primary/5 transition"><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-md grid place-items-center bg-primary/10 border border-primary/30 text-primary"><Clock3 className="w-5 h-5" /></div><div className="min-w-0 flex-1"><p className="text-[10px] uppercase tracking-[.3em] text-primary">JEJUM</p><h3 className="font-display text-base tracking-widest">{active ? tituloPorHoras(elapsedHours) : "Jejum Atual"}</h3><p className="text-[11px] text-muted-foreground">{active ? `${durationText(elapsedMinutes)} · Em andamento` : sessions.length ? `Último: ${durationText(sessions[0].minutes)}` : "Nenhum jejum registrado"}</p></div><div className="text-right shrink-0"><p className="font-display text-lg text-primary">{active ? durationText(elapsedMinutes) : "—"}</p>{expanded ? <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" /> : <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />}</div></div>{active && <div className="mt-3"><div className="h-2 rounded-full bg-secondary overflow-hidden"><motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} /></div><div className="flex justify-between mt-1 text-[9px] uppercase tracking-widest text-muted-foreground"><span>{durationText(elapsedMinutes)}</span><span>{nextMilestone ? `Próximo Marco: ${nextMilestone}h` : "Marcos Superados"}</span></div></div>}</button>
    <AnimatePresence initial={false}>{expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border"><div className="p-4 space-y-4">
      {!active ? <><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[.25em] text-muted-foreground">Maior Jejum</p><p className="font-display text-xl">{maxHours ? durationText(Math.round(maxHours * 60)) : "Nenhum Registro"}</p></div><Trophy className="w-6 h-6 text-gold" /></div><div className="rounded-md border border-primary/20 bg-primary/5 p-3"><p className="font-display text-sm tracking-widest">RECOMPENSA POR HORA</p><p className="text-[10px] text-muted-foreground mt-1">Cada hora completa sorteia um nível de 1 a 3. Nível 3 é mais raro e rende mais. Menos de 1 hora não gera recompensa.</p></div><button onClick={() => { setStartValue(toInputValue(new Date())); setStartOpen(true); }} className="w-full btn-pixel py-2.5 rounded-md flex items-center justify-center gap-2 text-sm"><Play className="w-4 h-4" /> Começar Jejum</button></> : <><div className="text-center py-1"><p className="text-[9px] uppercase tracking-[.3em] text-muted-foreground">Cronômetro</p><p className="font-display text-3xl sm:text-4xl tracking-widest text-primary">{hoursDisplay}</p><p className="text-[10px] text-muted-foreground mt-1">Início: {formatDate(active.startedAt)}</p></div><div><p className="text-[10px] uppercase tracking-[.25em] text-muted-foreground mb-2">Como Está Sua Mente?</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{MOODS.map(m => { const Icon = m.icon; return <button key={m.id} onClick={() => chooseMood(m.id)} className={`rounded-md border p-2 text-[10px] flex items-center justify-center gap-1.5 transition ${mood === m.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}><Icon className="w-4 h-4" />{m.label}</button>; })}</div></div><div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-center"><p className="font-display text-sm tracking-widest">VONTADE ≠ COMANDO</p><p className="text-[10px] text-muted-foreground mt-1">Seu estado é registrado ao longo das horas. Você ainda escolhe o próximo passo.</p></div><button onClick={openFinish} className="w-full border border-destructive/40 text-destructive hover:bg-destructive/10 py-2.5 rounded-md flex items-center justify-center gap-2 text-sm"><Square className="w-4 h-4" /> Encerrar Jejum</button>{active.hourlyStates.length > 0 && <div className="space-y-2"><p className="text-[10px] uppercase tracking-[.25em] text-muted-foreground">Linha Do Tempo</p>{active.hourlyStates.map(x => { const m = MOODS.find(v => v.id === x.mood); const Icon = m?.icon ?? Brain; return <div key={`${x.hour}-${x.at}`} className="flex items-center gap-2 text-xs"><span className="font-display w-12">{x.hour}h</span><Icon className="w-3.5 h-3.5 text-primary" /><span>{m?.label}</span><span className="ml-auto text-[9px] text-muted-foreground">{formatDate(x.at)}</span></div>; })}</div>}</>}
      {sessions.length > 0 && !active && <div className="space-y-2"><p className="text-[10px] uppercase tracking-[.25em] text-muted-foreground">Histórico</p>{sessions.slice(0, 5).map(s => <div key={s.id} className="rounded-md border border-border p-2.5 flex items-center gap-3"><Clock3 className="w-4 h-4 text-primary" /><div className="min-w-0 flex-1"><p className="text-xs font-display">{durationText(s.minutes)}</p><p className="text-[9px] text-muted-foreground">{formatDate(s.startedAt)} → {formatDate(s.endedAt)}</p></div><span className="text-[10px] text-primary">{s.reward?.horas ? `+${s.reward.xp} XP · ${s.reward.niveis.join("/")}` : "Sem recompensa"}</span></div>)}</div>}
    </div></motion.div>}</AnimatePresence>
    <ConfirmDialog open={startOpen} title="Começar Jejum" onCancel={() => setStartOpen(false)} onConfirm={start} confirmLabel="Confirmar Início"><label className="block text-xs text-muted-foreground">Data e Hora De Início<input type="datetime-local" value={startValue} onChange={e => setStartValue(e.target.value)} className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></label></ConfirmDialog>
    <ConfirmDialog open={finishOpen} title="Encerrar Jejum" onCancel={() => setFinishOpen(false)} onConfirm={() => { setFinishOpen(false); setFinishConfirmOpen(true); }} confirmLabel="Continuar"><label className="block text-xs text-muted-foreground">Data e Hora De Término<input type="datetime-local" value={finishValue} onChange={e => setFinishValue(e.target.value)} className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm" /></label></ConfirmDialog>
    <ConfirmDialog open={finishConfirmOpen} title="Confirmar Encerramento" onCancel={() => setFinishConfirmOpen(false)} onConfirm={confirmFinish} confirmLabel={saving ? "Salvando..." : "Confirmar Jejum"}><div className="text-center space-y-2"><CircleCheck className="w-8 h-8 mx-auto text-primary" /><p className="font-display text-lg">{active ? durationText(getMinutes(active.startedAt, new Date(finishValue).toISOString())) : "—"}</p><p className="text-xs text-muted-foreground">Somente horas completas geram recompensas. O nível de cada hora é sorteado de 1 a 3.</p></div></ConfirmDialog>
  </div>;
}

function ConfirmDialog({ open, title, children, onCancel, onConfirm, confirmLabel }: { open: boolean; title: string; children: ReactNode; onCancel: () => void; onConfirm: () => void | Promise<void>; confirmLabel: string }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"><div className="w-full max-w-md rpg-panel border-primary/30 p-5 space-y-4"><div className="flex items-center justify-between"><h3 className="font-display text-lg tracking-widest">{title}</h3><button onClick={onCancel} className="text-muted-foreground hover:text-foreground">×</button></div>{children}<div className="flex gap-2"><button onClick={onCancel} className="flex-1 border border-border rounded-md py-2 text-sm">Cancelar</button><button onClick={onConfirm} disabled={confirmLabel === "Salvando..."} className="flex-1 btn-pixel rounded-md py-2 text-sm disabled:opacity-50">{confirmLabel}</button></div></div></div>;
}
