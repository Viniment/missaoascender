import { useEffect, useMemo, useState } from "react";
import { applyXp, fetchHeroi } from "@/lib/api";
import { getOrMigrateLegacyState, setUserState, deleteUserState } from "@/lib/userState";
import { supabase } from "@/integrations/supabase/client";
import { fireReward } from "@/components/fx/RewardBurst";
import { Clock3, ChevronDown, ChevronUp, Play, Square, Trophy, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import UrgeSurfingCard from "@/components/UrgeSurfingCard";

type Reward = { xp: number; ouro: number; vida: number; atributo: string; atributoDelta: number; horas: number };
type Session = { id: string; startedAt: string; endedAt: string; minutes: number; reward?: Reward };
type ActiveFast = { startedAt: string };
const SESSION_KEY = "jejum_sessoes";
const ACTIVE_KEY = "jejum_ativo";
const legacySessionKey = (uid: string) => `ascensao:jejum:${uid}`;
const legacyActiveKey = (uid: string) => `${legacySessionKey(uid)}:active`;
const MILESTONES = Array.from({ length: 63 }, (_, i) => (i + 1) * 8);
function pad(n: number) { return String(n).padStart(2, "0"); }
function toInputValue(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`; }
function formatDate(iso: string) { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" }); }
function durationText(minutes: number) { return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}min`; }
function getMinutes(start: string, end: string) { return Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000)); }
function tituloPorHoras(h: number) { return h >= 8 ? `${Math.floor(h / 8) * 8} Horas de Jejum` : "Jejum Em Andamento"; }
function randomPerHour() { return Math.floor(Math.random() * 3) + 1; }

export default function JejumCard() {
  const { user } = useAuth(); const uid = user?.id;
  const [active, setActive] = useState<ActiveFast | null>(null); const [sessions, setSessions] = useState<Session[]>([]); const [now, setNow] = useState(Date.now()); const [expanded, setExpanded] = useState(false);
  const [startOpen, setStartOpen] = useState(false); const [finishOpen, setFinishOpen] = useState(false); const [startValue, setStartValue] = useState(toInputValue(new Date())); const [finishValue, setFinishValue] = useState(toInputValue(new Date())); const [saving, setSaving] = useState(false); const [finishError, setFinishError] = useState<string | null>(null);
  useEffect(() => { if (!uid) return; void Promise.all([getOrMigrateLegacyState<Session[]>(uid, SESSION_KEY, legacySessionKey(uid), []), getOrMigrateLegacyState<ActiveFast | null>(uid, ACTIVE_KEY, legacyActiveKey(uid), null)]).then(([savedSessions, savedActive]) => { setSessions(savedSessions); setActive(savedActive?.startedAt ? savedActive : null); }); }, [uid]);
  useEffect(() => { if (!active) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [active]);
  const elapsedMinutes = active ? getMinutes(active.startedAt, new Date(now).toISOString()) : 0; const elapsedHours = Math.floor(elapsedMinutes / 60); const nextMilestone = MILESTONES.find(x => x > elapsedHours) ?? null; const progress = nextMilestone ? Math.min(100, elapsedMinutes / (nextMilestone * 60) * 100) : 100; const maxHours = useMemo(() => Math.max(0, ...sessions.map(s => s.minutes / 60), active ? elapsedMinutes / 60 : 0), [sessions, active, elapsedMinutes]);
  const start = async () => { if (!uid) return; const next: ActiveFast = { startedAt: new Date(startValue).toISOString() }; try { await setUserState(uid, ACTIVE_KEY, next); setActive(next); setNow(Date.now()); setStartOpen(false); setExpanded(true); window.dispatchEvent(new Event("ascensao:jejum-active-changed")); } catch (error) { console.error(error); } };
  const openFinish = () => { setFinishError(null); setFinishValue(toInputValue(new Date())); setFinishOpen(true); };
  const confirmFinish = async () => {
    if (!active || !uid || saving) return;
    const endedAt = new Date(finishValue).toISOString();
    const minutes = getMinutes(active.startedAt, endedAt);
    setSaving(true);
    setFinishError(null);
    const fullHours = Math.floor(minutes / 60);
    const xp = Array.from({ length: fullHours }, () => randomPerHour()).reduce((a, b) => a + b, 0);
    const ouro = Array.from({ length: fullHours }, () => randomPerHour()).reduce((a, b) => a + b, 0);
    const vida = fullHours;
    const atributoDelta = Array.from({ length: fullHours }, () => randomPerHour()).reduce((a, b) => a + b, 0);
    const session: Session = { id: crypto.randomUUID(), startedAt: active.startedAt, endedAt, minutes, reward: { xp, ouro, vida, atributo: "autodominio", atributoDelta, horas: fullHours } };
    const nextSessions = [session, ...sessions];

    try {
      await setUserState(uid, SESSION_KEY, nextSessions);
      await deleteUserState(uid, ACTIVE_KEY);
      setSessions(nextSessions);
      setActive(null);
      setFinishOpen(false);
      setFinishError(null);
      window.dispatchEvent(new Event("ascensao:jejum-active-changed"));

      try {
        const current = await fetchHeroi(uid);
        if (!current) throw new Error("Herói não encontrado.");
        const nextXp = applyXp(current, xp);
        const nextVida = Math.min(current.vida_max, current.vida_atual + vida);
        const { error: heroError } = await supabase.from("users").update({ xp_atual: nextXp.xp_atual, nivel: nextXp.nivel, xp_proximo_nivel: nextXp.xp_proximo_nivel, vida_atual: nextVida, ouro: current.ouro + ouro }).eq("id", uid);
        if (heroError) throw heroError;
        if (ouro > 0) {
          const { error } = await supabase.from("transacoes_ouro").insert({ user_id: uid, valor: ouro, origem: "jejum", descricao: `Jejum de ${durationText(minutes)}` });
          if (error) throw error;
        }
        const { data: attr } = await (supabase as any).from("hero_attributes").select("*").eq("user_id", uid).maybeSingle();
        const { error: attrError } = await (supabase as any).from("hero_attributes").upsert({ user_id: uid, consciencia: attr?.consciencia ?? 0, foco: attr?.foco ?? 0, autodominio: (attr?.autodominio ?? 0) + atributoDelta, coragem: attr?.coragem ?? 0, disciplina: attr?.disciplina ?? 0, gestao: attr?.gestao ?? 0, resiliencia: attr?.resiliencia ?? 0 });
        if (attrError) throw attrError;
        if (nextXp.conquistas.length) {
          const { error } = await supabase.from("conquistas").upsert(nextXp.conquistas.map(c => ({ user_id: uid, tipo: c.tipo, titulo: c.titulo, descricao: c.descricao })), { onConflict: "user_id,tipo", ignoreDuplicates: true });
          if (error) throw error;
        }
        if (fullHours > 0) {
          fireReward(`+${xp} XP`, "#a855f7");
          setTimeout(() => fireReward(`+${ouro} Ouro`, "#facc15"), 180);
          setTimeout(() => fireReward(`+${vida} Vida`, "#ef4444"), 360);
          setTimeout(() => fireReward(`+${atributoDelta} Autodomínio`, "#22c55e"), 540);
        }
      } catch (rewardError) {
        console.error("Jejum encerrado, mas houve erro ao aplicar recompensas:", rewardError);
      }
    } catch (error) {
      console.error(error);
      setFinishError("Não foi possível salvar o encerramento. Tente confirmar novamente.");
    } finally {
      setSaving(false);
    }
  };
  const elapsedSeconds = active ? Math.max(0, Math.floor((now - new Date(active.startedAt).getTime()) / 1000)) : 0; const hoursDisplay = `${pad(Math.floor(elapsedSeconds / 3600))}:${pad(Math.floor((elapsedSeconds % 3600) / 60))}:${pad(elapsedSeconds % 60)}`;
  return <div className="rpg-panel overflow-hidden border-primary/30 shadow-[0_0_28px_hsl(var(--primary)/.06)]"><button type="button" onClick={() => setExpanded(v => !v)} className="w-full p-3 text-left hover:bg-primary/5 transition"><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-md grid place-items-center bg-primary/10 border border-primary/30 text-primary"><Clock3 className="w-4 h-4" /></div><div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-[.28em] text-primary">JEJUM</p><h3 className="font-display text-sm tracking-widest">{active ? tituloPorHoras(elapsedHours) : "Jejum Atual"}</h3><p className="text-[10px] text-muted-foreground">{active ? `${durationText(elapsedMinutes)} · Em andamento` : sessions.length ? `Último: ${durationText(sessions[0].minutes)}` : "Nenhum jejum registrado"}</p></div><div className="text-right"><p className="font-display text-base text-primary">{active ? durationText(elapsedMinutes) : "—"}</p>{expanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />}</div></div>{active && <div className="mt-2"><div className="h-1.5 rounded-full bg-secondary overflow-hidden"><motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} /></div><div className="flex justify-between mt-1 text-[8px] uppercase tracking-widest text-muted-foreground"><span>{durationText(elapsedMinutes)}</span><span>{nextMilestone ? `Próximo Marco: ${nextMilestone}h` : "Marcos Superados"}</span></div></div>}</button><AnimatePresence initial={false}>{expanded && <motion.div initial={{ height: 0, opacity: 1 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border"><div className="p-3 space-y-3">{!active ? <><div className="flex items-center justify-between"><div><p className="text-[9px] uppercase tracking-[.25em] text-muted-foreground">Maior Jejum</p><p className="font-display text-lg">{maxHours ? durationText(Math.round(maxHours * 60)) : "Nenhum Registro"}</p></div><Trophy className="w-5 h-5 text-gold" /></div><div className="rounded-md border border-primary/20 bg-primary/5 p-2.5"><p className="font-display text-xs tracking-widest">RECOMPENSA POR HORA</p><p className="text-[9px] text-muted-foreground mt-1">Cada hora completa: XP 1–3, Ouro 1–3, Vida +1 e Autodomínio 1–3 por hora.</p></div><button onClick={() => { setStartValue(toInputValue(new Date())); setStartOpen(true); }} className="w-full btn-pixel py-2 rounded-md flex items-center justify-center gap-2 text-xs"><Play className="w-3.5 h-3.5" /> Começar Jejum</button></> : <><div className="text-center"><p className="text-[8px] uppercase tracking-[.3em] text-muted-foreground">Cronômetro</p><p className="font-display text-2xl sm:text-3xl tracking-widest text-primary">{hoursDisplay}</p><p className="text-[9px] text-muted-foreground mt-1">Início: {formatDate(active.startedAt)}</p></div><UrgeSurfingCard embedded /><div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 text-center"><p className="font-display text-xs tracking-widest">VONTADE ≠ COMANDO</p><p className="text-[9px] text-muted-foreground mt-1">Você percebe a vontade sem precisar obedecer a ela. Você ainda escolhe o próximo passo.</p></div><button onClick={openFinish} className="w-full border border-destructive/40 text-destructive py-2 rounded-md flex items-center justify-center gap-2 text-xs"><Square className="w-3.5 h-3.5" /> Encerrar Jejum</button></>}</div></motion.div>}</AnimatePresence><AnimatePresence>{startOpen && <motion.div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rpg-panel p-5 space-y-4"><div className="flex items-center justify-between"><h3 className="font-display tracking-widest">INICIAR JEJUM</h3><button onClick={() => setStartOpen(false)}><X className="w-4 h-4" /></button></div><p className="text-xs text-muted-foreground">Confirme a data e a hora exatas, incluindo os segundos.</p><input type="datetime-local" step="1" value={startValue} onChange={e => setStartValue(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm" /><button onClick={() => void start()} className="w-full btn-pixel py-2.5 rounded-md text-xs">Confirmar Início</button></motion.div></motion.div>}</AnimatePresence><AnimatePresence>{finishOpen && <motion.div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"><motion.div initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rpg-panel p-5 space-y-4"><div className="flex items-center justify-between"><h3 className="font-display tracking-widest">ENCERRAR JEJUM</h3><button onClick={() => setFinishOpen(false)}><X className="w-4 h-4" /></button></div><p className="text-xs text-muted-foreground">Confirme a data e a hora exatas, incluindo os segundos.</p><input type="datetime-local" step="1" value={finishValue} onChange={e => { setFinishValue(e.target.value); setFinishError(null); }} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm" />{finishError && <p className="text-xs text-destructive">{finishError}</p>}<button disabled={saving} onClick={() => void confirmFinish()} className="w-full btn-pixel py-2.5 rounded-md text-xs disabled:opacity-50">{saving ? "Salvando..." : "Confirmar Encerramento"}</button></motion.div></motion.div>}</AnimatePresence></div>;
}
