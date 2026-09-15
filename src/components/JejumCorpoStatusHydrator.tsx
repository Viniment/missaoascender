import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Brain, Droplets, Flame, Gauge, HeartPulse, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Phase = { max: number; title: string; summary: string };
const PHASES: Phase[] = [
  { max: 4, title: "Pós-refeição / absorção", summary: "A energia da última refeição ainda domina o cenário metabólico." },
  { max: 8, title: "Estado pós-absortivo", summary: "A insulina começa a cair e o fígado passa a sustentar a glicose usando glicogênio." },
  { max: 12, title: "Mobilização de gordura", summary: "A liberação de ácidos graxos aumenta e as cetonas começam a subir gradualmente." },
  { max: 16, title: "Transição metabólica", summary: "A participação da gordura como combustível cresce enquanto a dependência do glicogênio diminui." },
  { max: 20, title: "Cetogênese em ascensão", summary: "O fígado transforma parte dos ácidos graxos em corpos cetônicos para ampliar as fontes de energia." },
  { max: 24, title: "Glicogênio hepático bem reduzido", summary: "A gordura e a gliconeogênese ganham importância para manter o fornecimento energético." },
  { max: 36, title: "Mudança de combustível", summary: "O organismo entra progressivamente no chamado metabolic switch: mais ácidos graxos e cetonas." },
  { max: 48, title: "Cetose mais evidente", summary: "As cetonas podem estar bem mais elevadas e o cérebro passa a utilizá-las mais." },
  { max: 72, title: "Adaptação ao jejum prolongado", summary: "A utilização de gordura e cetonas fica mais importante e mecanismos de conservação de glicose se intensificam." },
  { max: 120, title: "Jejum prolongado", summary: "A fisiologia está profundamente adaptada à baixa disponibilidade de energia." },
  { max: Infinity, title: "Adaptação prolongada", summary: "O corpo mantém forte dependência de gordura e cetonas, com produção contínua de glicose." },
];
function phaseFor(hours: number) { return PHASES.find(p => hours < p.max) ?? PHASES[PHASES.length - 1]; }
function minutesBetween(a: string, b: string) { return Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 60000)); }
function formatDuration(min: number) { return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}min`; }

export default function JejumCorpoStatusHydrator({ userId }: { userId: string }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [activeStart, setActiveStart] = useState<string | null>(null);
  const [maxHours, setMaxHours] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const findHost = () => {
      const candidates = Array.from(document.querySelectorAll("div.rounded-xl.border.border-primary\\/25.bg-primary\\/5"));
      const el = candidates.find(node => node.textContent?.includes("O QUE ESTÁ ACONTECENDO") || node.textContent?.includes("FASE ATUAL")) as HTMLElement | undefined;
      if (!el) { setHost(null); return; }
      el.style.display = "none";
      let mount = el.parentElement?.querySelector("[data-jejum-corpo-status]") as HTMLElement | null;
      if (!mount && el.parentElement) {
        mount = document.createElement("div");
        mount.dataset.jejumCorpoStatus = "1";
        el.parentElement.insertBefore(mount, el.nextSibling);
      }
      setHost(mount);
    };
    findHost();
    const observer = new MutationObserver(findHost);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [host]);

  useEffect(() => {
    const load = async () => {
      const [{ data: active }, { data: sessions }] = await Promise.all([
        supabase.from("jejum_ativo").select("inicio").eq("user_id", userId).maybeSingle(),
        supabase.from("jejum_sessoes").select("inicio,fim,minutos").eq("user_id", userId).order("inicio", { ascending: false }),
      ]);
      setActiveStart(active?.inicio ?? null);
      setMaxHours(Math.max(0, ...(sessions ?? []).map((s: any) => Number(s.minutos ?? 0) / 60)));
    };
    void load();
    const channel = supabase.channel(`jejum-corpo-status-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jejum_ativo", filter: `user_id=eq.${userId}` }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "jejum_sessoes", filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => { if (!activeStart) return; const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, [activeStart]);

  const minutes = activeStart ? minutesBetween(activeStart, new Date(now).toISOString()) : Math.round(maxHours * 60);
  const hours = minutes / 60;
  const phase = phaseFor(hours);
  const fat = hours < 4 ? "Baixa → moderada" : hours < 8 ? "Começando a aumentar" : hours < 12 ? "Em aumento" : hours < 24 ? "Alta / crescente" : hours < 48 ? "Predominante entre os combustíveis" : "Muito elevada";
  const ketones = hours < 8 ? "Baixas" : hours < 12 ? "Começando a subir" : hours < 24 ? "Em ascensão" : hours < 48 ? "Mais evidentes" : "Elevadas — grande variação individual";
  const glycogen = hours < 8 ? "Ainda relevante" : hours < 16 ? "Sendo utilizado" : hours < 24 ? "Bastante reduzido" : hours < 36 ? "Muito reduzido" : "Contribuição hepática muito menor";
  const insulin = hours < 8 ? "Caindo após a refeição" : "Mais baixa que no estado alimentado";
  const glucose = hours < 24 ? "Glicogênio hepático + produção de glicose" : "Gliconeogênese ganha importância";
  const brain = hours < 12 ? "Principalmente glicose" : hours < 24 ? "Começa a receber mais cetonas" : hours < 48 ? "Uso crescente de cetonas" : "Maior participação das cetonas";

  const cards = useMemo(() => [
    { icon: Flame, label: "OXIDAÇÃO DE GORDURA", value: fat, detail: "Ácidos graxos liberados do tecido adiposo passam a participar cada vez mais do combustível usado pelos tecidos." },
    { icon: Zap, label: "CETONAS", value: ketones, detail: "O fígado converte parte dos ácidos graxos em beta-hidroxibutirato e acetoacetato." },
    { icon: Gauge, label: "GLICOGÊNIO HEPÁTICO", value: glycogen, detail: "O estoque de glicogênio do fígado vai sendo mobilizado para ajudar a manter a glicose sanguínea." },
    { icon: Activity, label: "INSULINA / HORMÔNIOS", value: insulin, detail: "A queda da insulina favorece lipólise; glucagon e outros sinais de contrarregulação ganham importância." },
    { icon: Droplets, label: "COMO A GLICOSE É MANTIDA", value: glucose, detail: "Mesmo em jejum, o corpo continua produzindo glicose para tecidos que precisam dela." },
    { icon: Brain, label: "COMBUSTÍVEL DO CÉREBRO", value: brain, detail: "Com o prolongamento do jejum, o cérebro passa progressivamente a aproveitar mais corpos cetônicos." },
  ], [fat, ketones, glycogen, insulin, glucose, brain]);

  if (!host) return null;
  return createPortal(<div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-background/30 to-background/10 p-3 space-y-3">
    <div className="flex items-start gap-2">
      <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-[.24em] text-primary">O QUE ESTÁ ACONTECENDO NO SEU CORPO</p>
        <p className="mt-1 font-display text-sm tracking-wide">{phase.title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{phase.summary}</p>
      </div>
      <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[8px] uppercase tracking-widest text-primary">{formatDuration(minutes)}</span>
    </div>
    <div className="rounded-lg border border-orange-400/15 bg-orange-500/[0.035] p-2.5">
      <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-300" /><p className="text-[9px] uppercase tracking-[.22em] text-orange-200">Foco principal: queima de gordura</p></div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{hours >= 12 ? "A mobilização e a oxidação de gordura estão mais favorecidas do que no estado alimentado. Isso significa que seu corpo está usando mais gordura como combustível — não que toda essa gordura oxidada necessariamente represente perda líquida de gordura corporal, que depende do balanço energético ao longo do tempo." : "A mobilização de gordura já começa a aumentar gradualmente conforme a insulina cai, mas a contribuição relativa de cada combustível ainda depende da duração do jejum, da refeição anterior, atividade e reservas de glicogênio."}</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {cards.map(({ icon: Icon, label, value, detail }) => <div key={label} className="rounded-lg border border-border/60 bg-background/35 p-2.5"><div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-primary" /><p className="text-[8px] uppercase tracking-[.18em] text-muted-foreground">{label}</p></div><p className="mt-1.5 text-[10px] font-medium text-foreground/90">{value}</p><p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{detail}</p></div>)}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px]">
      <div className="rounded-lg border border-border/50 bg-background/25 p-2.5"><div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /><span className="uppercase tracking-[.18em] text-muted-foreground">O que muda agora</span></div><p className="mt-1 text-muted-foreground">O metabolismo não vira uma chave instantaneamente: a troca de combustível é progressiva e individual. A literatura situa o metabolic switch, em geral, em torno de 12–36h.</p></div>
      <div className="rounded-lg border border-border/50 bg-background/25 p-2.5"><div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /><span className="uppercase tracking-[.18em] text-muted-foreground">Importante</span></div><p className="mt-1 text-muted-foreground">Os horários são estimativas fisiológicas, não um cronômetro biológico exato. A última refeição, atividade física, glicogênio e metabolismo individual alteram a velocidade das mudanças.</p></div>
    </div>
  </div>, host);
}
