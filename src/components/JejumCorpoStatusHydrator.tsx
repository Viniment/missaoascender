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
    { icon: Flame, label: "Gordura Ganhando Espaço", summary: "A gordura passa a participar cada vez mais do combustível usado pelo corpo.", value: fat, detail: "A mobilização de ácidos graxos do tecido adiposo aumenta conforme a insulina diminui. Esses ácidos graxos podem ser oxidados pelos tecidos para produzir energia.", benefit: "🔥 Foco: maior utilização de gordura como combustível.", note: "Usar mais gordura como combustível durante o jejum não significa, sozinho, perda líquida de gordura corporal. Isso depende do balanço energético ao longo do tempo." },
    { icon: Zap, label: "Cetonas Entrando em Cena", summary: "O fígado começa a produzir um combustível alternativo a partir da gordura.", value: ketones, detail: "Parte dos ácidos graxos é convertida pelo fígado em corpos cetônicos, principalmente beta-hidroxibutirato e acetoacetato.", benefit: "⚡ Foco: ampliar as fontes de energia disponíveis.", note: "A velocidade e a intensidade dessa mudança variam bastante entre pessoas." },
    { icon: Gauge, label: "Reservas Rápidas em Baixa", summary: "O estoque de glicogênio do fígado vai sendo utilizado para manter a glicose disponível.", value: glycogen, detail: "O glicogênio hepático é mobilizado para ajudar a manter a glicose sanguínea. Com o avanço do jejum, sua contribuição diminui e a produção interna de glicose ganha importância.", benefit: "🔋 Foco: transição das reservas rápidas para outras fontes de energia.", note: "A quantidade inicial de glicogênio varia conforme alimentação, atividade física e metabolismo individual." },
    { icon: Activity, label: "Insulina Mais Baixa", summary: "O ambiente hormonal fica mais favorável à liberação e ao uso de gordura.", value: insulin, detail: "A queda da insulina favorece a lipólise. Outros sinais hormonais, como o glucagon, ajudam o organismo a manter a disponibilidade de energia.", benefit: "🧬 Foco: facilitar a mobilização das reservas energéticas.", note: "Isso é uma mudança fisiológica progressiva, não um interruptor que muda em uma hora exata." },
    { icon: Droplets, label: "Glicose Sendo Mantida", summary: "Mesmo sem comer, o organismo continua fornecendo glicose aos tecidos que precisam dela.", value: glucose, detail: "O corpo utiliza inicialmente o glicogênio hepático e aumenta progressivamente a gliconeogênese, produzindo glicose a partir de outros substratos.", benefit: "🛡️ Foco: manter a glicose disponível para os tecidos que dependem dela.", note: "O organismo não simplesmente fica sem glicose durante o jejum." },
    { icon: Brain, label: "Cérebro Usando Outro Combustível", summary: "Com o prolongamento do jejum, as cetonas ganham participação como combustível cerebral.", value: brain, detail: "O cérebro passa progressivamente a utilizar mais corpos cetônicos, reduzindo parte da necessidade de obter toda a sua energia exclusivamente da glicose.", benefit: "🧠 Foco: adaptação progressiva do cérebro às cetonas.", note: "A participação das cetonas aumenta gradualmente e varia conforme a duração do jejum e as características individuais." },
  ], [fat, ketones, glycogen, insulin, glucose, brain]);

  if (!host) return null;
  return createPortal(
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.045] via-background/20 to-background/5 p-3.5 shadow-[0_12px_40px_-28px_hsl(var(--primary)/0.5)]">
      <div className="mb-3.5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <HeartPulse className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[.25em] text-primary">COMO SEU CORPO ESTÁ REAGINDO</p>
          <p className="mt-0.5 text-[8px] uppercase tracking-[.14em] text-muted-foreground/70">Toque em um item para entender melhor</p>
        </div>
      </div>

      <div className="space-y-2">
        {cards.map(({ icon: Icon, label, summary, value, detail, benefit, note }) => {
          const isOpen = expanded === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setExpanded(current => current === label ? null : label)}
              className={`group w-full overflow-hidden rounded-xl border text-left transition-all duration-200 ${isOpen ? "border-primary/35 bg-primary/[0.045] shadow-[0_8px_28px_-22px_hsl(var(--primary)/0.65)]" : "border-border/55 bg-background/25 hover:border-primary/20 hover:bg-background/40"}`}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 px-3.5 py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${isOpen ? "border-primary/30 bg-primary/10" : "border-border/50 bg-background/35 group-hover:border-primary/20"}`}>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-tight tracking-wide text-foreground/95">{label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{summary}</p>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
              </div>

              {isOpen && (
                <div className="border-t border-primary/10 px-3.5 pb-3.5 pt-3">
                  <div className="rounded-lg border border-primary/10 bg-background/35 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[8px] font-semibold uppercase tracking-[.2em] text-primary">Estado agora</p>
                      <span className="rounded-full border border-primary/15 bg-primary/5 px-2 py-1 text-[8px] text-primary">{value}</span>
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-foreground/85">{detail}</p>
                    <p className="mt-2.5 text-[10px] font-medium leading-relaxed text-foreground/80">{benefit}</p>
                    <p className="mt-2 border-t border-border/40 pt-2 text-[9px] leading-relaxed text-muted-foreground">{note}</p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 text-[9px]">
          <div className="rounded-xl border border-border/45 bg-background/20 p-3">
            <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /><span className="uppercase tracking-[.18em] text-muted-foreground">O que muda agora</span></div>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">A troca de combustível é progressiva e individual. A literatura situa o chamado metabolic switch, em geral, em torno de 12–36h.</p>
          </div>
          <div className="rounded-xl border border-border/45 bg-background/20 p-3">
            <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /><span className="uppercase tracking-[.18em] text-muted-foreground">Importante</span></div>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">Os horários são estimativas fisiológicas, não um cronômetro biológico exato. Refeição anterior, atividade física, glicogênio e metabolismo individual alteram a velocidade das mudanças.</p>
          </div>
        </div>
      )}
    </div>,
    host
  );
}
