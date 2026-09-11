import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, Check, Coins, Flame, Heart, History, Shield, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { applyXp, fetchHeroi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { todayISO, formatBRDate } from "@/lib/utils";
import { emitGameEvent } from "@/game/events";
import { toast } from "sonner";

type DiaryEntry = { id: string; date: string; text: string; type: string; xp: number; gold: number };

type Reward = { id: string; title: string; description: string; xp: number; gold: number; attribute: string };

const rewards: Reward[] = [
  { id: "reflection", title: "Registrar reflexão", description: "Escreva algo que você percebeu sobre seu dia.", xp: 20, gold: 3, attribute: "Atenção" },
  { id: "urge", title: "Superar um impulso", description: "Registre uma vontade que você observou sem obedecer automaticamente.", xp: 40, gold: 6, attribute: "Autocontrole" },
  { id: "action", title: "Registrar uma ação real", description: "Anote uma ação concreta que aproximou você do objetivo.", xp: 60, gold: 10, attribute: "Disciplina" },
];

function loadEntries(userId: string): DiaryEntry[] {
  try { return JSON.parse(localStorage.getItem(`ascensao:diario:${userId}`) || "[]"); } catch { return []; }
}

export default function Diario() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Reward>(rewards[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (uid) setEntries(loadEntries(uid)); }, [uid]);

  const todayEntries = useMemo(() => entries.filter((e) => e.date === todayISO()), [entries]);
  const usedToday = (id: string) => todayEntries.some((e) => e.type === id);

  async function register() {
    if (!uid || !heroi || !text.trim()) { toast.error("Escreva algo antes de registrar."); return; }
    if (usedToday(selected.id)) { toast.info("Essa recompensa já foi conquistada hoje."); return; }

    const nextHero = applyXp(heroi, selected.xp);
    const ouro = (heroi.ouro ?? 0) + selected.gold;
    const { error } = await supabase.from("users").update({ xp_atual: nextHero.xp_atual, nivel: nextHero.nivel, xp_proximo_nivel: nextHero.xp_proximo_nivel, ouro }).eq("id", uid);
    if (error) { toast.error(error.message); return; }
    await supabase.from("transacoes_ouro").insert({ user_id: uid, valor: selected.gold, origem: "diario", descricao: selected.title });
    if (nextHero.conquistas.length) await supabase.from("conquistas").upsert(nextHero.conquistas.map(c => ({ user_id: uid, tipo: c.tipo, titulo: c.titulo, descricao: c.descricao })), { onConflict: "user_id,tipo", ignoreDuplicates: true });

    const entry: DiaryEntry = { id: crypto.randomUUID(), date: todayISO(), text: text.trim(), type: selected.id, xp: selected.xp, gold: selected.gold };
    const nextEntries = [entry, ...entries].slice(0, 100);
    localStorage.setItem(`ascensao:diario:${uid}`, JSON.stringify(nextEntries));
    setEntries(nextEntries);
    setText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    await qc.invalidateQueries({ queryKey: ["heroi", uid] });

    if (selected.id === "reflection") emitGameEvent("THOUGHT_RECORDED", { recordId: entry.id, category: "diario" }, "Diario");
    if (selected.id === "urge") emitGameEvent("URGE_RESISTED", { context: entry.text, xpDelta: selected.xp, goldDelta: selected.gold }, "Diario");
    if (selected.id === "action") emitGameEvent("MISSION_COMPLETED", { missionId: entry.id, missionName: selected.title, xpDelta: selected.xp, goldDelta: selected.gold }, "Diario");
  }

  if (!heroi) return <div className="p-8 text-muted-foreground">Carregando diário...</div>;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-primary/25 bg-card p-5 shadow-lg sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-primary"><BookOpen className="h-4 w-4" /> Diário de Campanha</div>
            <h1 className="text-3xl font-black tracking-tight">Hoje você joga a sua próxima fase.</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Cada registro pode virar progresso real no Ascensão. XP e ouro entram no mesmo personagem usado pelos hábitos, missões e conquistas.</p>
          </div>
          <Link to="/" className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-muted">← HQ</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-muted/40 p-4"><div className="text-[10px] font-black text-muted-foreground">NÍVEL</div><div className="mt-1 text-2xl font-black">{heroi.nivel}</div></div>
          <div className="rounded-2xl bg-muted/40 p-4"><div className="text-[10px] font-black text-muted-foreground">XP</div><div className="mt-1 text-2xl font-black">{heroi.xp_atual}/{heroi.xp_proximo_nivel}</div></div>
          <div className="rounded-2xl bg-muted/40 p-4"><div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground"><Coins className="h-3 w-3" /> OURO</div><div className="mt-1 text-2xl font-black">{heroi.ouro}</div></div>
          <div className="rounded-2xl bg-muted/40 p-4"><div className="text-[10px] font-black text-muted-foreground">HOJE</div><div className="mt-1 text-2xl font-black">{todayEntries.length}/3</div></div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-7">
          <div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Brain className="h-5 w-5" /></div><div><h2 className="text-xl font-black">Entrada de hoje</h2><p className="text-xs text-muted-foreground">O que aconteceu? O que você percebeu? O que fez?</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {rewards.map((r) => <button key={r.id} onClick={() => setSelected(r)} disabled={usedToday(r.id)} className={`rounded-2xl border p-4 text-left transition ${selected.id === r.id ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:bg-muted/40"} disabled:cursor-not-allowed disabled:opacity-45`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-black">{r.title}</span><Sparkles className="h-4 w-4 text-primary" /></div><p className="mt-2 text-xs text-muted-foreground">{r.description}</p><div className="mt-3 flex gap-2 text-[11px] font-black"><span>+{r.xp} XP</span><span>+{r.gold} 🪙</span><span>+{r.attribute}</span></div></button>)}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua entrada..." className="mt-5 min-h-44 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={register} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-black text-primary-foreground shadow-lg hover:opacity-90"><Check className="h-4 w-4" /> Registrar e ganhar +{selected.xp} XP</button>
          {saved && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4 text-center text-sm font-black"><Trophy className="mr-2 inline h-4 w-4" /> RECOMPENSA CONQUISTADA • +{selected.xp} XP • +{selected.gold} OURO</motion.div>}
        </div>

        <aside className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-7">
          <div className="flex items-center gap-3"><History className="h-5 w-5 text-primary" /><h2 className="text-xl font-black">Histórico</h2></div>
          <p className="mt-1 text-xs text-muted-foreground">Suas ações registradas no Diário.</p>
          <div className="mt-5 space-y-3">{entries.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Seu primeiro registro começa aqui.</div> : entries.slice(0, 8).map((e) => <div key={e.id} className="rounded-2xl border border-border bg-muted/20 p-4"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-primary">{formatBRDate(e.date)}</span><span className="text-[10px] font-black">+{e.xp} XP</span></div><p className="mt-2 line-clamp-3 text-sm">{e.text}</p></div>)}</div>
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[{ icon: Flame, title: "Consistência", text: "O Diário é uma atividade recorrente da campanha." }, { icon: Shield, title: "Atributos", text: "Cada tipo de registro fortalece uma capacidade diferente." }, { icon: Target, title: "Vida real", text: "O jogo recompensa ações e decisões que você realmente executa." }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-border bg-card p-5"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-3 font-black">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>)}
      </section>
    </div>
  );
}
