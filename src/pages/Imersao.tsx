import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, ChevronRight, Crosshair, Flame, Gamepad2, Heart, Shield, Sparkles, Swords, Target, Trophy, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { emitGameEvent } from "@/game/events";

type Step = "INTRO" | "ATTENTION" | "THOUGHT" | "DISTANCING" | "ACTION" | "REWARD" | "SUMMARY";

const steps: { id: Step; title: string; description: string; icon: typeof Brain }[] = [
  { id: "INTRO", title: "Preparação", description: "Entre na missão e defina seu próximo objetivo.", icon: Gamepad2 },
  { id: "ATTENTION", title: "Atenção", description: "Observe o que está acontecendo agora.", icon: Target },
  { id: "THOUGHT", title: "Pensamento", description: "Identifique o pensamento automático.", icon: Brain },
  { id: "DISTANCING", title: "Distanciamento", description: "Perceba o pensamento sem tratá-lo como um comando.", icon: Shield },
  { id: "ACTION", title: "Ação", description: "Escolha e execute uma ação alinhada ao objetivo.", icon: Swords },
  { id: "REWARD", title: "Recompensa", description: "Sua ação alimenta a progressão do personagem.", icon: Sparkles },
  { id: "SUMMARY", title: "Resultado", description: "Registre a vitória e avance na campanha.", icon: Trophy },
];

export default function Imersao() {
  const [step, setStep] = useState<Step>("INTRO");
  const [thought, setThought] = useState("");
  const [action, setAction] = useState("");
  const [completed, setCompleted] = useState(false);
  const [xp, setXp] = useState(0);
  const [attribute, setAttribute] = useState(0);

  const currentIndex = useMemo(() => steps.findIndex((item) => item.id === step), [step]);
  const current = steps[currentIndex];

  function next() {
    const nextStep = steps[currentIndex + 1];
    if (nextStep) setStep(nextStep.id);
  }

  function completeSession() {
    if (completed) return;
    setCompleted(true);
    setXp(60);
    setAttribute(2);
    emitGameEvent("COMPLETE_CAMPAIGN_STEP", {
      campaignStepId: "imersao-dominio-do-impulso",
      campaignStepName: "Domínio do Impulso",
      xpDelta: 60,
      goldDelta: 12,
    }, "Imersao");
  }

  const canAdvance = step !== "THOUGHT" || thought.trim().length > 0;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              <Gamepad2 className="h-4 w-4" /> Imersão • Gameplay
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Domínio do Impulso</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Uma missão da campanha. O desafio acontece na vida real; o Ascensão transforma sua execução em progressão.</p>
          </div>
          <Link to="/" className="hidden rounded-xl border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted sm:block">Voltar ao HQ</Link>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-4">
          {[
            ["NÍVEL", "—", Zap],
            ["XP DA MISSÃO", completed ? "+60" : "60", Sparkles],
            ["RECOMPENSA", "+12", Trophy],
            ["ATRIBUTO", completed ? "+2" : "—", Shield],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-border bg-card/70 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
              <div className="mt-2 text-2xl font-black">{value}</div>
            </div>
          ))}
        </section>

        <div className="mb-5 rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>PROGRESSO DA FASE</span><span>{currentIndex + 1}/{steps.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><current.icon className="h-5 w-5" /></div>
              <div><div className="text-xs font-bold uppercase tracking-wider text-primary">Fase {currentIndex + 1}</div><h2 className="text-xl font-black">{current.title}</h2></div>
            </div>
          </div>

          <div className="min-h-[360px] p-5 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mx-auto max-w-2xl">
                <p className="text-muted-foreground">{current.description}</p>

                {step === "INTRO" && <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6"><div className="flex items-start gap-4"><Flame className="mt-1 h-6 w-6 text-primary" /><div><h3 className="font-bold">Missão ativa</h3><p className="mt-1 text-sm text-muted-foreground">Observe uma vontade, pensamento ou impulso e pratique uma resposta consciente antes de agir.</p></div></div></div>}

                {step === "ATTENTION" && <div className="mt-8 grid gap-3 sm:grid-cols-2">{["Pensamento", "Emoção", "Vontade", "Situação"].map((item) => <div key={item} className="rounded-2xl border border-border p-5"><div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item}</div><div className="mt-3 text-sm">Observe sem tentar mudar imediatamente.</div></div>)}</div>}

                {step === "THOUGHT" && <div className="mt-8"><label className="text-sm font-bold">Qual pensamento automático apareceu?</label><textarea value={thought} onChange={(e) => setThought(e.target.value)} placeholder="Ex.: Eu preciso fazer isso agora..." className="mt-3 min-h-32 w-full rounded-2xl border border-border bg-background p-4 outline-none ring-primary focus:ring-2" /></div>}

                {step === "DISTANCING" && <div className="mt-8 space-y-4"><div className="rounded-2xl border border-border bg-muted/30 p-5"><div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pensamento</div><p className="mt-2 font-semibold">“{thought || "O pensamento identificado"}”</p></div><div className="text-center text-2xl text-muted-foreground">↓</div><div className="rounded-2xl border border-primary/30 bg-primary/5 p-5"><div className="text-xs font-bold uppercase tracking-wider text-primary">Distanciamento</div><p className="mt-2 font-semibold">“Estou tendo o pensamento de que {thought || "preciso agir agora"}.”</p></div></div>}

                {step === "ACTION" && <div className="mt-8"><label className="text-sm font-bold">Qual ação você vai executar?</label><input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Ex.: esperar 10 minutos, beber água, caminhar..." className="mt-3 w-full rounded-2xl border border-border bg-background p-4 outline-none ring-primary focus:ring-2" /><p className="mt-3 text-xs text-muted-foreground">Escolha uma ação pequena, concreta e executável agora.</p></div>}

                {step === "REWARD" && <div className="mt-8 grid gap-4 sm:grid-cols-3">{[["+60 XP", Sparkles], ["+12 Ouro", Trophy], ["+2 Autocontrole", Shield]].map(([text, Icon]) => <motion.div key={String(text)} initial={{ scale: .85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"><Icon className="mx-auto h-7 w-7 text-primary" /><div className="mt-3 font-black">{text}</div></motion.div>)}</div>}

                {step === "SUMMARY" && <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6"><div className="flex items-center gap-3"><Heart className="h-5 w-5 text-primary" /><h3 className="font-black">Sessão concluída</h3></div><p className="mt-3 text-sm text-muted-foreground">Você transformou uma situação real em progresso dentro da campanha.</p>{action && <p className="mt-4 text-sm"><strong>Ação:</strong> {action}</p>}<div className="mt-6 flex flex-wrap gap-3"><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold">+{xp} XP</span><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold">+{attribute} Autocontrole</span></div></div>}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-end border-t border-border bg-muted/20 p-5 sm:p-6">
            {step !== "SUMMARY" ? <button disabled={!canAdvance} onClick={() => { if (step === "REWARD") completeSession(); next(); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{step === "REWARD" ? "Concluir missão" : step === "INTRO" ? "Iniciar missão" : "Continuar"}<ChevronRight className="h-4 w-4" /></button> : <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground"><Check className="h-4 w-4" /> Voltar ao HQ</Link>}
          </div>
        </section>
      </div>
    </main>
  );
}
