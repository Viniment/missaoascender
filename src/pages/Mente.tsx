import Shell from "@/components/Shell";
import { Link } from "react-router-dom";
import { Brain, BookMarked, ChevronRight, Coins, Sparkles, Target, Shield, Swords } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchHeroi } from "@/lib/api";
import CartaEnfrentamentoDialog from "@/components/CartaEnfrentamentoDialog";
import { useState } from "react";

export default function Mente() {
  const { user } = useAuth();
  const [cartaOpen, setCartaOpen] = useState(false);
  const { data: heroi } = useQuery({ queryKey: ["heroi", user?.id], queryFn: () => fetchHeroi(user!.id), enabled: !!user });
  return <Shell><div className="mx-auto max-w-4xl space-y-5">
    <header className="rpg-panel overflow-hidden p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary"><Brain className="h-4 w-4" /> Central da Mente</div><h1 className="mt-2 font-display text-2xl tracking-widest">MENTE</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Perceba, registre e aja. O que você faz aqui também faz parte da evolução do seu personagem.</p></div><Link to="/diario" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:opacity-90"><BookMarked className="h-4 w-4" /> Abrir Diário</Link></div>{heroi && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Nível" value={String(heroi.nivel)} icon={<Sparkles className="h-3 w-3" />} /><Stat label="XP" value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} /><Stat label="Ouro" value={String(heroi.ouro ?? 0)} icon={<Coins className="h-3 w-3" />} /><Stat label="Foco" value="Evolução" icon={<Target className="h-3 w-3" />} /></div>}</header>

    <button type="button" onClick={() => setCartaOpen(true)} className="rpg-panel group flex w-full items-center gap-4 border-destructive/35 p-4 text-left transition hover:-translate-y-0.5 hover:border-destructive/70"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-destructive/40 bg-destructive/10 text-destructive group-hover:scale-105 transition"><Swords className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-[9px] font-black uppercase tracking-[0.22em] text-destructive">LEMBRETE DIÁRIO</div><h3 className="mt-1 font-display text-sm tracking-widest">Carta de Enfrentamento</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Abra a Carta aqui mesmo para ler seu lembrete diário e registrar sua leitura.</p></div><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:translate-x-1 group-hover:text-destructive" /></button>

    <section className="rpg-panel p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Shield className="h-4 w-4" /></div><div><h3 className="text-xs font-black uppercase tracking-wider">Regra simples</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Você não precisa usar tudo. Escolha a ferramenta que faz sentido agora. Registre, aja e deixe a consistência virar progressão.</p></div></div></section>
  </div>
  <CartaEnfrentamentoDialog open={cartaOpen} onClose={() => setCartaOpen(false)} heroi={heroi} inimigo={undefined} habitos={undefined} onboarding={undefined} onChanged={async () => { await fetchHeroi(user!.id); }} />
  </Shell>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="rounded-2xl border border-border bg-background/30 p-3"><div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-muted-foreground">{icon}{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>; }
