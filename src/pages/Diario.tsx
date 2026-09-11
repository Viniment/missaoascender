import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Brain, Check, ChevronRight, Coins, History, Sparkles, Target, Trophy, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { applyXp, fetchHeroi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { todayISO, formatBRDate } from "@/lib/utils";
import { emitGameEvent } from "@/game/events";
import { toast } from "sonner";

type DiaryEntry = { id: string; date: string; text: string; type: string; xp: number; gold: number };
type Mode = "thought" | "urge" | "emotion" | "impulse" | "reflection";
type Step = "thought" | "emotion" | "urge" | "separate" | "distance" | "reframe" | "choice";

const modes: { id: Mode; title: string; description: string; icon: string }[] = [
  { id: "thought", title: "Estou preso em um pensamento", description: "Investigue o que sua mente está dizendo.", icon: "🧠" },
  { id: "urge", title: "Estou sentindo uma vontade", description: "Separe vontade de comando.", icon: "🔥" },
  { id: "emotion", title: "Estou sentindo uma emoção forte", description: "Observe a emoção sem virar a emoção.", icon: "🌊" },
  { id: "impulse", title: "Acabei de agir por impulso", description: "Entenda o ciclo sem se punir.", icon: "⚠️" },
  { id: "reflection", title: "Quero refletir sobre algo", description: "Transforme uma experiência em aprendizado.", icon: "📖" },
];

const emotions = ["Ansiedade", "Tédio", "Tristeza", "Raiva", "Frustração", "Medo", "Culpa", "Solidão", "Estresse", "Entusiasmo", "Alívio", "Outra"];
const thoughtKinds = ["Um fato", "Uma interpretação", "Uma previsão", "Uma cobrança", "Uma justificativa", "Um medo", "Uma conclusão precipitada", "Não sei"];
const actions = ["Agir apesar da vontade", "Esperar e observar", "Fazer uma ação alternativa", "Fazer a ação conscientemente", "Voltar ao que eu estava fazendo", "Outra ação"];

function loadEntries(userId: string): DiaryEntry[] {
  try { return JSON.parse(localStorage.getItem(`ascensao:diario:${userId}`) || "[]"); } catch { return []; }
}

export default function Diario() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<Step>("thought");
  const [thought, setThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [urge, setUrge] = useState("");
  const [thoughtKind, setThoughtKind] = useState("");
  const [distance, setDistance] = useState(false);
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [alternative, setAlternative] = useState("");
  const [choice, setChoice] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  useEffect(() => { if (uid) setEntries(loadEntries(uid)); }, [uid]);
  const todayEntries = useMemo(() => entries.filter((e) => e.date === todayISO()), [entries]);
  const progress = ["thought", "emotion", "urge", "separate", "distance", "reframe", "choice"].indexOf(step) + 1;

  function reset() {
    setMode(null); setStep("thought"); setThought(""); setEmotion(""); setIntensity(5); setUrge(""); setThoughtKind(""); setDistance(false); setEvidenceFor(""); setEvidenceAgainst(""); setAlternative(""); setChoice(""); setSaved(false);
  }

  function begin(next: Mode) {
    setMode(next);
    setStep(next === "emotion" ? "emotion" : "thought");
  }

  function next() {
    const order: Step[] = ["thought", "emotion", "urge", "separate", "distance", "reframe", "choice"];
    const i = order.indexOf(step);
    if (i < order.length - 1) setStep(order[i + 1]);
  }

  function back() {
    const order: Step[] = ["thought", "emotion", "urge", "separate", "distance", "reframe", "choice"];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]); else reset();
  }

  async function finish() {
    if (!uid || !heroi || saving) return;
    setSaving(true);
    const xp = 30 + (distance ? 20 : 0) + (alternative.trim() ? 10 : 0);
    const gold = 5;
    const nextHero = applyXp(heroi, xp);
    const ouro = (heroi.ouro ?? 0) + gold;
    const summary = [
      `PENSAMENTO: ${thought || "não informado"}`,
      `SENTIMENTO: ${emotion || "não informado"} (${intensity}/10)`,
      `VONTADE: ${urge || "não informada"}`,
      `PERSPECTIVA: ${alternative || "não registrada"}`,
      `ESCOLHA: ${choice || "não registrada"}`,
    ].join("\n");
    const { error } = await supabase.from("users").update({ xp_atual: nextHero.xp_atual, nivel: nextHero.nivel, xp_proximo_nivel: nextHero.xp_proximo_nivel, ouro }).eq("id", uid);
    if (error) { toast.error(error.message); setSaving(false); return; }
    await supabase.from("transacoes_ouro").insert({ user_id: uid, valor: gold, origem: "diario", descricao: "Registro metacognitivo" });
    const entry: DiaryEntry = { id: crypto.randomUUID(), date: todayISO(), text: summary, type: mode || "reflection", xp, gold };
    const nextEntries = [entry, ...entries].slice(0, 100);
    localStorage.setItem(`ascensao:diario:${uid}`, JSON.stringify(nextEntries));
    setEntries(nextEntries);
    await qc.invalidateQueries({ queryKey: ["heroi", uid] });
    emitGameEvent("THOUGHT_RECORDED", { recordId: entry.id, category: "metacognicao" }, "Diario");
    if (mode === "urge" || urge.trim()) emitGameEvent("URGE_RESISTED", { context: urge || thought, xpDelta: xp, goldDelta: gold }, "Diario");
    setSaved(true); setSaving(false);
  }

  if (!heroi) return <Shell><div className="p-8 text-muted-foreground">Carregando diário...</div></Shell>;

  return <Shell><div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-3xl border border-primary/25 bg-card p-5 shadow-lg sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-primary"><Brain className="h-4 w-4" /> Diário de Campanha</div><h1 className="text-3xl font-black tracking-tight">Observe. Separe. Escolha. Evolua.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Pensamentos são eventos mentais. Sentimentos são experiências. Vontades são impulsos. Nenhum deles é uma ordem.</p></div><Link to="/" className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:bg-muted">← HQ</Link></div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="NÍVEL" value={String(heroi.nivel)} /><Stat label="XP" value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} /><Stat label="OURO" value={String(heroi.ouro ?? 0)} icon={<Coins className="h-3 w-3" />} /><Stat label="REGISTROS HOJE" value={String(todayEntries.length)} /></div>
    </header>

    {!mode && <section className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-7"><div className="mb-6"><div className="text-xs font-black uppercase tracking-[0.2em] text-primary">Diário interativo</div><h2 className="mt-1 text-2xl font-black">O que está acontecendo agora?</h2><p className="mt-2 text-sm text-muted-foreground">Escolha a porta que mais combina com o momento. Você não precisa responder tudo sempre.</p></div><div className="grid gap-3 md:grid-cols-2">{modes.map((m) => <button key={m.id} onClick={() => begin(m.id)} className="group rounded-2xl border border-border bg-muted/20 p-5 text-left transition hover:border-primary/50 hover:bg-primary/5"><div className="flex items-center gap-4"><span className="text-2xl">{m.icon}</span><div className="min-w-0 flex-1"><h3 className="font-black">{m.title}</h3><p className="mt-1 text-xs text-muted-foreground">{m.description}</p></div><ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div></button>)}</div></section>}

    {mode && !saved && <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Missão mental</div><div className="mt-1 text-sm font-bold">Etapa {progress} de 7</div></div><div className="h-2 w-40 overflow-hidden rounded-full bg-muted"><motion.div className="h-full bg-primary" animate={{ width: `${(progress / 7) * 100}%` }} /></div></div>
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
          {step === "thought" && <Question title="Qual pensamento apareceu?" subtitle="Não precisa ser bonito nem racional. Registre exatamente o que passou pela sua cabeça."><textarea autoFocus value={thought} onChange={(e) => setThought(e.target.value)} placeholder="Ex.: Eu preciso fazer isso agora..." className="min-h-36 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary" /><div className="mt-4"><p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">Esse pensamento parece mais...</p><ChoiceGrid options={thoughtKinds} value={thoughtKind} onChange={setThoughtKind} /></div></Question>}
          {step === "emotion" && <Question title="O que você está sentindo?" subtitle="Uma emoção pode estar presente sem precisar comandar seu comportamento."><ChoiceGrid options={emotions} value={emotion} onChange={setEmotion} /><div className="mt-6"><div className="flex justify-between text-xs font-black"><span>INTENSIDADE</span><span>{intensity}/10</span></div><input type="range" min="0" max="10" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="mt-3 w-full accent-primary" /></div></Question>}
          {step === "urge" && <Question title="O que você está com vontade de fazer?" subtitle="Descreva o impulso sem transformá-lo automaticamente em necessidade."><textarea autoFocus value={urge} onChange={(e) => setUrge(e.target.value)} placeholder="Ex.: Estou com vontade de comer..." className="min-h-32 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary" /><div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-5"><div className="text-center text-lg font-black">VONTADE ≠ COMANDO</div><p className="mt-2 text-center text-xs text-muted-foreground">Uma vontade pode ser intensa e ainda assim não determinar o que você fará.</p></div></Question>}
          {step === "separate" && <Question title="Separe o que está acontecendo" subtitle="Pensamento, sentimento, vontade e ação são experiências diferentes."><div className="grid gap-3 sm:grid-cols-2"><InfoCard title="PENSAMENTO" value={thought || "Ainda não identificado"} /><InfoCard title="SENTIMENTO" value={emotion ? `${emotion} • ${intensity}/10` : "Ainda não identificado"} /><InfoCard title="VONTADE" value={urge || "Ainda não identificada"} /><InfoCard title="AÇÃO" value="Ainda será escolhida" /></div></Question>}
          {step === "distance" && <Question title="Observe o pensamento" subtitle="Você não precisa eliminar o pensamento. Apenas perceber que ele é um evento mental."><div className="rounded-2xl border border-border bg-muted/20 p-5"><div className="text-xs font-black uppercase text-muted-foreground">ANTES</div><p className="mt-2 text-lg font-black">{thought || "Não identifiquei um pensamento específico."}</p><div className="my-5 text-center text-2xl text-primary">↓</div><div className="text-xs font-black uppercase text-muted-foreground">DEPOIS</div><p className="mt-2 text-lg font-black">Estou tendo o pensamento de que {thought || "algo precisa acontecer agora"}.</p></div><button onClick={() => setDistance(!distance)} className={`mt-4 w-full rounded-2xl border p-4 text-left font-bold ${distance ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}><Check className={`mr-2 inline h-4 w-4 ${distance ? "opacity-100" : "opacity-30"}`} />Consegui observar o pensamento sem tratá-lo como uma ordem.</button></Question>}
          {step === "reframe" && <Question title="Investigue e encontre outra perspectiva" subtitle="Você não precisa provar que o pensamento é falso. Procure uma leitura mais completa."><div className="space-y-4"><Field label="O que apoia esse pensamento?" value={evidenceFor} setValue={setEvidenceFor} placeholder="Evidências ou fatos..." /><Field label="O que não apoia?" value={evidenceAgainst} setValue={setEvidenceAgainst} placeholder="O que o pensamento pode estar ignorando?" /><Field label="Existe outra explicação possível?" value={alternative} setValue={setAlternative} placeholder="Uma perspectiva mais equilibrada..." /></div></Question>}
          {step === "choice" && <Question title="Agora é você quem decide" subtitle="O pensamento apareceu. A emoção apareceu. A vontade apareceu. Agora existe uma escolha."><ChoiceGrid options={actions} value={choice} onChange={setChoice} /><div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center"><Target className="mx-auto h-6 w-6 text-primary" /><p className="mt-2 text-sm font-black">Você não controla tudo que aparece.</p><p className="mt-1 text-xs text-muted-foreground">Você pode treinar o que faz com aquilo que aparece.</p></div></Question>}
        </motion.div>
        <div className="mt-7 flex gap-3"><button onClick={back} className="rounded-2xl border border-border px-5 py-3 font-bold hover:bg-muted"><ArrowLeft className="mr-2 inline h-4 w-4" />Voltar</button>{step === "choice" ? <button onClick={finish} disabled={saving} className="flex-1 rounded-2xl bg-primary px-5 py-3 font-black text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-50"><Sparkles className="mr-2 inline h-4 w-4" />{saving ? "Registrando..." : "Concluir e ganhar XP"}</button> : <button onClick={next} className="flex-1 rounded-2xl bg-primary px-5 py-3 font-black text-primary-foreground shadow-lg hover:opacity-90">Continuar <ArrowRight className="ml-2 inline h-4 w-4" /></button>}</div>
      </div>
      <aside className="rounded-3xl border border-border bg-card p-5 shadow-lg"><div className="text-xs font-black uppercase tracking-wider text-primary">Regra da campanha</div><p className="mt-3 text-lg font-black">"Uma vontade não é uma ordem."</p><p className="mt-3 text-xs leading-5 text-muted-foreground">O objetivo não é nunca sentir ansiedade, fome, tédio ou impulso. É perceber o que está acontecendo antes de transformar automaticamente uma experiência interna em ação.</p></aside>
    </section>}

    {saved && <section className="rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-lg"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><Trophy className="h-8 w-8" /></div><h2 className="mt-5 text-2xl font-black">Registro concluído</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Você separou experiência interna de ação e tomou uma decisão consciente.</p><div className="mx-auto mt-6 flex max-w-sm justify-center gap-3"><div className="rounded-2xl bg-primary/10 px-6 py-4 font-black">+{30 + (distance ? 20 : 0) + (alternative.trim() ? 10 : 0)} XP</div><div className="rounded-2xl bg-muted px-6 py-4 font-black">+5 🪙</div></div><div className="mt-6 flex justify-center gap-3"><button onClick={reset} className="rounded-2xl bg-primary px-6 py-3 font-black text-primary-foreground">Novo registro</button><Link to="/mente" className="rounded-2xl border border-border px-6 py-3 font-bold hover:bg-muted">Voltar para Mente</Link></div></section>}

    <section className="rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-7"><div className="flex items-center gap-3"><History className="h-5 w-5 text-primary" /><h2 className="text-xl font-black">Histórico de campanha</h2></div><p className="mt-1 text-xs text-muted-foreground">Toque em qualquer registro para abrir o texto completo.</p><div className="mt-4 space-y-3">{entries.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Seu primeiro registro começa aqui.</div> : entries.slice(0, 6).map((e) => <button key={e.id} onClick={() => setSelectedEntry(e)} className="w-full rounded-2xl border border-border bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-primary">{formatBRDate(e.date)}</span><span className="text-[10px] font-black">+{e.xp} XP • +{e.gold} 🪙</span></div><p className="mt-2 line-clamp-4 whitespace-pre-line text-sm">{e.text}</p><div className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Abrir registro completo <ChevronRight className="h-3 w-3" /></div></button>)}</div></section>

    {selectedEntry && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-2xl rounded-3xl border border-primary/30 bg-card p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Histórico de campanha</div><h2 className="mt-1 font-display text-xl tracking-widest">REGISTRO COMPLETO</h2><p className="mt-1 text-xs text-muted-foreground">{formatBRDate(selectedEntry.date)} • +{selectedEntry.xp} XP • +{selectedEntry.gold} 🪙</p></div><button onClick={() => setSelectedEntry(null)} className="rounded-lg border border-border p-2 hover:bg-muted" aria-label="Fechar"><X className="h-4 w-4" /></button></div><div className="mt-5 max-h-[65vh] overflow-y-auto rounded-2xl border border-border bg-background/50 p-5"><p className="whitespace-pre-line text-sm leading-7">{selectedEntry.text}</p></div><button onClick={() => setSelectedEntry(null)} className="mt-4 w-full rounded-2xl border border-border px-5 py-3 font-bold hover:bg-muted">Fechar</button></div></div>}
  </div></Shell>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="rounded-2xl bg-muted/40 p-4"><div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground">{icon}{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>; }
function Question({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <div><h2 className="text-2xl font-black">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p><div className="mt-6">{children}</div></div>; }
function ChoiceGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) { return <div className="grid gap-2 sm:grid-cols-2">{options.map((o) => <button key={o} onClick={() => onChange(o)} className={`rounded-xl border p-3 text-left text-sm font-bold transition ${value === o ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/20 hover:bg-muted/40"}`}>{o}</button>)}</div>; }
function InfoCard({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-border bg-muted/20 p-4"><div className="text-[10px] font-black tracking-wider text-primary">{title}</div><p className="mt-2 text-sm">{value}</p></div>; }
function Field({ label, value, setValue, placeholder }: { label: string; value: string; setValue: (v: string) => void; placeholder: string }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-muted-foreground">{label}</span><textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="min-h-24 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-primary" /></label>; }
