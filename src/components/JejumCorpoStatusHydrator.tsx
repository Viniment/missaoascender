import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Brain, ChevronDown, Droplets, Flame, Gauge, HeartPulse, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Phase = { max: number; title: string; summary: string };
const PHASES: Phase[] = [
  { max: 4, title: "Energia da Última Refeição", summary: "Seu corpo ainda está usando principalmente a energia que acabou de receber." },
  { max: 8, title: "Começando a Usar Reservas", summary: "A energia da refeição anterior vai diminuindo e o corpo começa a recorrer mais às próprias reservas." },
  { max: 12, title: "Modo Queima de Gordura", summary: "A utilização de gordura como combustível começa a ganhar espaço." },
  { max: 16, title: "Troca de Combustível", summary: "O corpo aumenta gradualmente a participação da gordura enquanto reduz a dependência do glicogênio." },
  { max: 20, title: "Cetonas Entrando em Cena", summary: "O fígado começa a produzir mais cetonas a partir da gordura para ampliar as fontes de energia." },
  { max: 24, title: "Gordura Ganhando Espaço", summary: "A gordura e a produção interna de glicose assumem um papel cada vez mais importante." },
  { max: 36, title: "Combustível Alternativo", summary: "O organismo está cada vez mais adaptado a utilizar gordura e cetonas como fontes de energia." },
  { max: 48, title: "Modo Cetônico", summary: "As cetonas podem estar mais elevadas e o cérebro passa a aproveitá-las mais." },
  { max: 72, title: "Corpo se Adaptando", summary: "A utilização de gordura e cetonas ganha ainda mais importância durante o jejum prolongado." },
  { max: 120, title: "Adaptação ao Jejum Prolongado", summary: "O organismo permanece adaptado à baixa disponibilidade de energia e aumenta a dependência de gordura e cetonas." },
  { max: Infinity, title: "Adaptação Prolongada", summary: "O corpo mantém mecanismos de utilização de gordura, cetonas e produção contínua de glicose." },
];

function phaseFor(hours: number) { return PHASES.find(p => hours < p.max) ?? PHASES[PHASES.length - 1]; }
function minutesBetween(a: string, b: string) { return Math.max(0, Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 60000)); }
function formatDuration(min: number) { return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}min`; }

export default function JejumCorpoStatusHydrator({ userId }: { userId: string }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [activeStart, setActiveStart] = useState<string | null>(null);
  const [maxHours, setMaxHours] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [expanded, setExpanded] = useState<string | null>(null);

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
    { icon: Flame, label: "Modo Queima de Gordura", value: fat, intro: "Seu corpo está aumentando a participação da gordura como fonte de energia.", detail: "Ácidos graxos liberados do tecido adiposo passam a participar cada vez mais do combustível usado pelos tecidos." },
    { icon: Zap, label: "Cetonas Entrando em Cena", value: ketones, intro: "O fígado começa a transformar gordura em um combustível alternativo.", detail: "Parte dos ácidos graxos é convertida em corpos cetônicos, como beta-hidroxibutirato e acetoacetato." },
    { icon: Gauge, label: "Reservas Rápidas em Baixa", value: glycogen, intro: "O estoque de glicogênio do fígado está sendo usado para manter a glicose disponível.", detail: "Conforme o jejum avança, o glicogênio hepático é progressivamente mobilizado e sua contribuição diminui." },
    { icon: Activity, label: "Insulina Mais Baixa", value: insulin, intro: "O ambiente hormonal fica mais favorável à liberação e ao uso de gordura.", detail: "A queda da insulina favorece a lipólise, enquanto glucagon e outros sinais de contrarregulação ganham importância." },
    { icon: Droplets, label: "Glicose Sendo Mantida", value: glucose, intro: "Mesmo sem comer, o organismo continua fornecendo glicose aos tecidos que precisam dela.", detail: "O corpo utiliza o glicogênio hepático e, progressivamente, aumenta a produção interna de glicose por gliconeogênese." },
    { icon: Brain, label: "Cérebro Usando Outro Combustível", value: brain, intro: "Com o prolongamento do jejum, as cetonas ganham participação como combustível cerebral.", detail: "O cérebro passa progressivamente a aproveitar mais corpos cetônicos, reduzindo parte da dependência exclusiva de glicose." },
  ], [fat, ketones, glycogen, insulin, glucose, brain]);

  if (!host) return null;
  return createPortal(
    <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-background/30 to-background/10 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[.24em] text-primary">COMO SEU CORPO ESTÁ REAGINDO</p>
          <p className="mt-1 font-display text-sm tracking-wide">{phase.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{phase.summary}</p>
        </div>
        <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[8px] uppercase tracking-widest text-primary">{formatDuration(minutes)}</span>
      </div>

      <div className="rounded-lg border border-orange-400/15 bg-orange-500/[0.035] p-2.5">
        <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-300" /><p className="text-[9px] uppercase tracking-[.22em] text-orange-200">Foco principal: queima de gordura</p></div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{hours >= 12 ? "A mobilização e a oxidação de gordura estão mais favorecidas do que no estado alimentado. Isso significa que seu corpo está usando mais gordura como combustível — não que toda essa gordura oxidada necessariamente represente perda líquida de gordura corporal, que depende do balanço energético ao longo do tempo." : "A mobilização de gordura já começa a aumentar gradualmente conforme a insulina cai, mas a contribuição relativa de cada combustível ainda depende da duração do jejum, da refeição anterior, atividade e reservas de glicogênio."}</p>
      </div>

      <div className="space-y-2">
        {cards.map(({ icon: Icon, label, value, intro, detail }) => {
          const isOpen = expanded === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setExpanded(current => current === label ? null : label)}
              className={`w-full text-left rounded-lg border transition-all duration-200 ${isOpen ? "border-primary/35 bg-primary/[0.055]" : "border-border/60 bg-background/30 hover:border-primary/20 hover:bg-background/45"}`}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.08]"><Icon className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-foreground/90">{label}</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{value}</p>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
              </div>
              {isOpen && (
                <div className="border-t border-border/50 px-3 pb-3 pt-2.5">
                  <p className="text-[10px] leading-relaxed text-foreground/85">{intro}</p>
                  <div className="mt-2 rounded-md border border-border/40 bg-background/35 p-2.5">
                    <p className="text-[8px] uppercase tracking-[.18em] text-primary">O que está acontecendo</p>
                    <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">{detail}</p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px]">
        <div className="rounded-lg border border-border/50 bg-background/25 p-2.5"><div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /><span className="uppercase tracking-[.18em] text-muted-foreground">O que muda agora</span></div><p className="mt-1 text-muted-foreground">O metabolismo não vira uma chave instantaneamente: a troca de combustível é progressiva e individual. A literatura situa o metabolic switch, em geral, em torno de 12–36h.</p></div>
        <div className="rounded-lg border border-border/50 bg-background/25 p-2.5"><div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /><span className="uppercase tracking-[.18em] text-muted-foreground">Importante</span></div><p className="mt-1 text-muted-foreground">Os horários são estimativas fisiológicas, não um cronômetro biológico exato. A última refeição, atividade física, glicogênio e metabolismo individual alteram a velocidade das mudanças.</p></div>
      </div>
    </div>,
    host
  );
}
