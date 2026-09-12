import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Session = { id: string; minutes: number };
const STORAGE = (uid: string) => `ascensao:jejum:${uid}`;
const MILESTONES = Array.from({ length: 63 }, (_, i) => (i + 1) * 8);
const titleFor = (hours: number) => `${hours} Horas de Jejum`;
const load = (uid: string): Session[] => { try { return JSON.parse(localStorage.getItem(STORAGE(uid)) || "[]"); } catch { return []; } };
const maxHours = (sessions: Session[]) => Math.max(0, ...sessions.map(s => (s.minutes || 0) / 60));

export default function ConquistaJejumPopup() {
  const { user } = useAuth();
  const uid = user?.id;
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let previousMax = maxHours(load(uid));
    const sync = async (currentMax: number) => {
      if (currentMax < 8) return;
      const rows = MILESTONES.filter(h => currentMax >= h).map(h => ({
        user_id: uid,
        tipo: `jejum_${h}h`,
        titulo: titleFor(h),
        descricao: `Você alcançou ${h} horas de jejum em uma sessão registrada.`,
      }));
      if (rows.length) await supabase.from("conquistas").upsert(rows, { onConflict: "user_id,tipo" });
    };
    void sync(previousMax);
    const timer = window.setInterval(() => {
      const sessions = load(uid);
      const currentMax = maxHours(sessions);
      if (currentMax > previousMax) {
        const newlyReached = MILESTONES.filter(h => h > previousMax && h <= currentMax);
        if (newlyReached.length) setTitle(titleFor(Math.max(...newlyReached)));
        void sync(currentMax);
      }
      previousMax = currentMax;
    }, 700);
    return () => window.clearInterval(timer);
  }, [uid]);

  return <AnimatePresence>
    {title && <motion.div className="fx-essential fixed inset-0 z-[120] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ scale: .75, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .9, opacity: 0 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="relative w-full max-w-sm rpg-panel border-primary/60 p-7 text-center shadow-[0_0_60px_hsl(var(--primary)/.25)]">
        <button onClick={() => setTitle(null)} aria-label="Fechar" className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <motion.div initial={{ scale: .5, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/50 bg-primary/10 text-primary"><Trophy className="h-8 w-8" /></motion.div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[.35em] text-primary">✦ Nova Conquista ✦</p>
        <h2 className="mt-2 font-display text-2xl tracking-widest">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">Marco desbloqueado. As conquistas anteriores também foram registradas nos Troféus.</p>
        <button onClick={() => setTitle(null)} className="mt-6 w-full btn-pixel rounded-md py-2.5 text-xs font-black uppercase tracking-[.25em]">Continuar</button>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
