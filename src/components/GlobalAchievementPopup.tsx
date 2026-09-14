import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Achievement = { id: string; tipo: string; titulo: string | null; descricao: string | null; desbloqueada_em: string };

export default function GlobalAchievementPopup({ userId }: { userId: string }) {
  const { user } = useAuth();
  const uid = user?.id ?? userId;
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [displayed, setDisplayed] = useState(false);

  const loadPending = useCallback(async () => {
    if (!uid) return;
    const { data: achievements, error: achievementsError } = await supabase
      .from("conquistas")
      .select("id,tipo,titulo,descricao,desbloqueada_em")
      .eq("user_id", uid)
      .order("desbloqueada_em", { ascending: true });
    if (achievementsError || !achievements?.length) return;

    const { data: received, error: receivedError } = await supabase
      .from("conquista_notificacoes")
      .select("conquista_tipo")
      .eq("user_id", uid);
    if (receivedError) return;

    const seen = new Set((received ?? []).map((row: any) => row.conquista_tipo));
    const pending = (achievements as Achievement[]).filter(item => !seen.has(item.tipo));
    setQueue(prev => {
      const known = new Set([...prev.map(item => item.tipo), ...(current ? [current.tipo] : [])]);
      return [...prev, ...pending.filter(item => !known.has(item.tipo))];
    });
  }, [uid, current]);

  useEffect(() => { void loadPending(); }, [loadPending]);

  useEffect(() => {
    if (!current && queue.length) {
      setCurrent(queue[0]);
      setQueue(items => items.slice(1));
      setDisplayed(false);
    }
  }, [current, queue]);

  // This effect runs after the popup has rendered. Only then do we persist
  // that the user received this notification, and the RPC is idempotent.
  useEffect(() => {
    if (!current || displayed) return;
    const timer = window.setTimeout(async () => {
      const { data, error } = await (supabase.rpc as any)("registrar_recebimento_conquista", { p_conquista_tipo: current.tipo });
      if (!error && data === true) setDisplayed(true);
      else if (!error && data === false) setDisplayed(true);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [current, displayed]);

  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`achievement-popup-${uid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conquistas", filter: `user_id=eq.${uid}` }, payload => {
        const item = payload.new as Achievement;
        if (!item?.tipo) return;
        setQueue(prev => prev.some(x => x.tipo === item.tipo) || current?.tipo === item.tipo ? prev : [...prev, item]);
      })
      .subscribe();
    const timer = window.setInterval(() => void loadPending(), 2500);
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [uid, current, loadPending]);

  const close = () => { setCurrent(null); setDisplayed(false); };

  return <AnimatePresence>
    {current && <motion.div className="fx-essential fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ opacity: 0, scale: .78, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .92 }} transition={{ type: "spring", stiffness: 220, damping: 20 }} className="relative w-full max-w-md overflow-hidden rounded-3xl border border-fuchsia-400/40 bg-[#09090f] p-7 text-center shadow-[0_0_100px_rgba(217,70,239,.22)]">
        <button type="button" onClick={close} aria-label="Fechar" className="absolute right-3 top-3 rounded-xl p-2 text-white/35 transition hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
        <motion.div initial={{ scale: .4, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200 shadow-[0_0_35px_rgba(217,70,239,.2)]"><Trophy className="h-9 w-9" /></motion.div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[.35em] text-fuchsia-300">✦ NOVA CONQUISTA ✦</p>
        <h2 className="mt-3 text-2xl font-black tracking-wide text-white">{current.titulo || "Conquista desbloqueada"}</h2>
        {current.descricao && <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">{current.descricao}</p>}
        <button type="button" onClick={close} className="mt-7 w-full rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/15 py-3 text-xs font-black uppercase tracking-[.22em] text-fuchsia-100 transition hover:bg-fuchsia-500/25">Continuar</button>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
