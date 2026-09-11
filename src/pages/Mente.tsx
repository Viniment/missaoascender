import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { Link } from "react-router-dom";
import { Brain, Waves, FlaskConical, BookMarked, ChevronRight, Coins, Sparkles, Target, Shield, ScrollText, X, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { applyXp, fetchHeroi } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/utils";
import { toast } from "sonner";

const tools = [
  { to: "/diario", icon: BookMarked, eyebrow: "PROGRESSÃO", title: "Diário", description: "Registre o que aconteceu, reflita e transforme experiências reais em XP e Ouro.", reward: "+20 a +60 XP", className: "border-primary/40 bg-primary/10 text-primary" },
  { to: "/urge-surfing", icon: Waves, eyebrow: "AUTOCONTROLE", title: "Surfar a vontade", description: "Atravesse uma vontade sem precisar obedecer ao impulso.", reward: "XP de autocontrole", className: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300" },
  { to: "/laboratorio", icon: FlaskConical, eyebrow: "ANÁLISE", title: "Laboratório", description: "Veja padrões dos seus registros e descubra o que está se repetindo.", reward: "Insights", className: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
];

const CARTA_FALLBACK = `Quando a vontade aparecer, pare antes de agir.\n\nO que estou sentindo é uma experiência, não uma ordem.\nO pensamento que apareceu na minha mente não precisa ser verdadeiro só porque apareceu.\nA vontade pode ser forte e ainda assim passar.\n\nEu posso esperar. Eu posso observar. Eu posso escolher.\n\nNão preciso resolver tudo neste momento. Preciso apenas escolher o próximo comportamento consciente.`;
const CARTA_XP = 20;
const CARTA_OURO = 3;
const CARTA_LIMITE = 3;

export default function Mente() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: heroi } = useQuery({ queryKey: ["heroi", user?.id], queryFn: () => fetchHeroi(user!.id), enabled: !!user });
  const [cartaAberta, setCartaAberta] = useState(false);
  const [rewardCount, setRewardCount] = useState(() => {
    if (!user?.id) return 0;
    try {
      const raw = JSON.parse(localStorage.getItem(`ascensao:carta:${user.id}`) || "null");
      return raw?.date === todayISO() ? Number(raw.count || 0) : 0;
    } catch { return 0; }
  });
  const carta = useMemo(() => heroi?.carta_enfrentamento?.trim() || CARTA_FALLBACK, [heroi?.carta_enfrentamento]);

  async function lerCarta() {
    if (!user?.id || !heroi) return;
    if (rewardCount >= CARTA_LIMITE) {
      toast.info("Você já recebeu a recompensa da Carta 3 vezes hoje. Amanhã ela estará disponível novamente.");
      return;
    }
    const nextHero = applyXp(heroi, CARTA_XP);
    const ouro = (heroi.ouro ?? 0) + CARTA_OURO;
    const { error } = await supabase.from("users").update({ xp_atual: nextHero.xp_atual, nivel: nextHero.nivel, xp_proximo_nivel: nextHero.xp_proximo_nivel, ouro }).eq("id", user.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("transacoes_ouro").insert({ user_id: user.id, valor: CARTA_OURO, origem: "carta_enfrentamento", descricao: "Leitura da Carta de Enfrentamento" });
    const nextCount = rewardCount + 1;
    localStorage.setItem(`ascensao:carta:${user.id}`, JSON.stringify({ date: todayISO(), count: nextCount }));
    setRewardCount(nextCount);
    await qc.invalidateQueries({ queryKey: ["heroi", user.id] });
    toast.success(`Carta lida. +${CARTA_XP} XP • +${CARTA_OURO} Ouro`);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rpg-panel overflow-hidden p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary"><Brain className="h-4 w-4" /> Central da Mente</div>
              <h1 className="mt-2 font-display text-2xl tracking-widest">MENTE</h1>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Perceba, registre e aja. O que você faz aqui também faz parte da evolução do seu personagem.</p>
            </div>
            <Link to="/diario" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:opacity-90"><BookMarked className="h-4 w-4" /> Abrir Diário</Link>
          </div>
          {heroi && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Nível" value={String(heroi.nivel)} icon={<Sparkles className="h-3 w-3" />} />
            <Stat label="XP" value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} />
            <Stat label="Ouro" value={String(heroi.ouro ?? 0)} icon={<Coins className="h-3 w-3" />} />
            <Stat label="Foco" value="Evolução" icon={<Target className="h-3 w-3" />} />
          </div>}
        </header>

        <section className="rpg-panel overflow-hidden border-primary/40 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary"><ScrollText className="h-6 w-6" /></div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Treino diário</div>
                <h2 className="mt-1 font-display text-xl tracking-widest">CARTA DE ENFRENTAMENTO</h2>
                <p className="mt-2 text-sm text-muted-foreground">Quando eu estiver prestes a ceder, eu leio antes de escolher.</p>
              </div>
            </div>
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-black text-primary">{rewardCount}/{CARTA_LIMITE} hoje</div>
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4 sm:p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-foreground/90 line-clamp-5">{carta}</p>
            <button onClick={() => setCartaAberta(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary/15">Ler carta completa <ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>Leia com atenção antes de tomar a decisão.</span>
            <span className="font-black text-primary">Cada leitura: +{CARTA_XP} XP • +{CARTA_OURO} 🪙</span>
          </div>
        </section>

        <section>
          <div className="mb-3"><h2 className="font-display text-sm tracking-widest">COMO VOCÊ QUER EVOLUIR?</h2><p className="mt-1 text-[11px] text-muted-foreground">Escolha uma ação. A progressão usa o mesmo personagem, XP e Ouro do Ascensão.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {tools.map(({ to, icon: Icon, eyebrow, title, description, reward, className }) => <Link key={to} to={to} className="rpg-panel group flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_0_25px_hsl(var(--primary)/0.14)]">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${className} transition group-hover:scale-105`}><Icon className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</span><span className="rounded-full border border-border bg-background/30 px-2 py-0.5 text-[9px] font-bold text-primary">{reward}</span></div><h3 className="mt-1 font-display text-sm tracking-widest">{title}</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p></div>
              <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </Link>)}
          </div>
        </section>

        <section className="rpg-panel p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Shield className="h-4 w-4" /></div><div><h3 className="text-xs font-black uppercase tracking-wider">Regra simples</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Você não precisa usar tudo. Escolha a ferramenta que faz sentido agora. Registre, aja e deixe a consistência virar progressão.</p></div></div></section>

        {cartaAberta && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-3xl border border-primary/30 bg-card p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Antes de escolher</div><h2 className="mt-1 font-display text-xl tracking-widest">SUA CARTA DE ENFRENTAMENTO</h2></div><button onClick={() => setCartaAberta(false)} className="rounded-lg border border-border p-2 hover:bg-muted" aria-label="Fechar"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 max-h-[55vh] overflow-y-auto rounded-2xl border border-border bg-background/50 p-5"><p className="whitespace-pre-line text-base leading-8">{carta}</p></div>
            <button onClick={async () => { await lerCarta(); setCartaAberta(false); }} className="mt-4 w-full rounded-2xl bg-primary px-5 py-3 font-black text-primary-foreground shadow-lg hover:opacity-90 disabled:opacity-50" disabled={rewardCount >= CARTA_LIMITE}><Check className="mr-2 inline h-4 w-4" />Li minha carta e quero seguir consciente</button>
          </div>
        </div>}
      </div>
    </Shell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="rounded-2xl border border-border bg-background/30 p-3"><div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground">{icon}{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>; }
