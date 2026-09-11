import { useEffect, useMemo, useState } from "react";
import { Clock3, Lock, Trophy, CheckCircle2 } from "lucide-react";
import Conquistas from "./Conquistas";
import { useAuth } from "@/hooks/useAuth";

type Session = { minutes: number };
const MILESTONES = [8, 10, 12, 14, 16, 18, 20, 24];
const TITLES: Record<number, string> = { 8: "Primeiro Jejum", 10: "Dez Horas", 12: "Meio Dia", 14: "Resistência", 16: "Domínio", 18: "Além Do Conforto", 20: "Persistência", 24: "Um Dia Inteiro" };
const RARITY = (h: number) => h >= 24 ? "LENDÁRIA" : h >= 18 ? "ÉPICA" : h >= 14 ? "RARA" : "COMUM";

export default function ConquistasComJejum() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    if (!user) return;
    try { setSessions(JSON.parse(localStorage.getItem(`ascensao:jejum:${user.id}`) || "[]")); } catch { setSessions([]); }
  }, [user]);
  const maxHours = useMemo(() => Math.max(0, ...sessions.map(s => s.minutes / 60)), [sessions]);
  return <>
    <Conquistas />
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 -mt-2">
      <div className="rpg-panel overflow-hidden border-primary/30">
        <div className="p-5 border-b border-border flex items-center gap-3"><Clock3 className="w-5 h-5 text-primary" /><div><p className="text-[10px] uppercase tracking-[.3em] text-primary">NOVA CATEGORIA</p><h2 className="font-display text-lg tracking-widest">Conquistas De Jejum</h2><p className="text-xs text-muted-foreground">Marcos baseados no maior tempo de jejum registrado.</p></div></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">{MILESTONES.map(h => { const unlocked = maxHours >= h; return <div key={h} className={`rounded-lg border p-3 ${unlocked ? "border-primary/50 bg-primary/5" : "border-border opacity-70"}`}><div className="flex items-center justify-between mb-3"><span className={`text-[9px] tracking-widest ${unlocked ? "text-primary" : "text-muted-foreground"}`}>{RARITY(h)}</span>{unlocked ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}</div><Trophy className={`w-5 h-5 mb-2 ${unlocked ? "text-gold" : "text-muted-foreground"}`} /><p className="font-display text-sm tracking-widest">{TITLES[h]}</p><p className="text-[10px] text-muted-foreground mt-1">{h}h de jejum</p><p className="text-[9px] text-muted-foreground mt-2">{unlocked ? "Desbloqueada" : `Faltam ${Math.max(0, h - maxHours).toFixed(1)}h`}</p></div>; })}</div>
      </div>
    </section>
  </>;
}
