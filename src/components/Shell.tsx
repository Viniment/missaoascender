import { Link, useLocation, useNavigate } from "react-router-dom";
import { Swords, Home, Trophy, ListChecks, User, LogOut, Store, Shirt, Shield, Brain, BookOpen, Menu, X, ChevronRight, FolderKanban, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import RewardBurstLayer from "@/components/fx/RewardBurst";
import ParticleBackground from "@/components/fx/ParticleBackground";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchHeroi } from "@/lib/api";
import { APP_BACKGROUNDS } from "@/lib/itens";
import { useLowPower } from "@/hooks/useLowPower";
import { useState } from "react";

const NAV = [
  { to: "/", label: "Base", group: "NÚCLEO", Icon: Home },
  { to: "/inimigo", label: "Inimigo", group: "COMBATE", Icon: Swords },
  { to: "/mente", label: "Mente", group: "MENTE", Icon: Brain },
  { to: "/projetos", label: "Projetos", group: "MISSÕES", Icon: FolderKanban },
  { to: "/estudos", label: "Estudos", group: "MISSÕES", Icon: BookOpen },
  { to: "/mini-vitorias", label: "Vitórias", group: "PROGRESSO", Icon: ListChecks },
  { to: "/loja", label: "Loja", group: "PERSONAGEM", Icon: Store },
  { to: "/personalizar", label: "Avatar", group: "PERSONAGEM", Icon: Shirt },
  { to: "/conquistas", label: "Troféus", group: "PROGRESSO", Icon: Trophy },
  { to: "/perfil", label: "Perfil", group: "PERSONAGEM", Icon: User },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const { lowPower } = useLowPower();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: heroi } = useQuery({ queryKey: ["heroi", user?.id], queryFn: () => fetchHeroi(user!.id), enabled: !!user });
  const appBgId = (heroi?.avatar_equipado as any)?.appBg as string | undefined;
  const appBg = !lowPower && appBgId ? APP_BACKGROUNDS[appBgId] : null;

  const closeMenu = () => setMenuOpen(false);
  const isActive = (to: string) => loc.pathname === to || (to !== "/" && loc.pathname.startsWith(`${to}/`));
  const grouped = NAV.reduce<Record<string, typeof NAV>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const renderNav = (mobile = false) => (
    <div className={cn("space-y-4", mobile && "space-y-5")}>
      {Object.entries(grouped).map(([group, items]) => (
        <section key={group}>
          <div className="mb-2 flex items-center gap-2 px-2">
            <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            <span className="font-display text-[8px] font-black tracking-[0.28em] text-muted-foreground/70">{group}</span>
            <span className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
          </div>
          <div className="space-y-1">
            {items.map(({ to, label, Icon }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={mobile ? closeMenu : undefined}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "group/item relative flex items-center overflow-hidden rounded-xl border transition-all duration-200",
                    mobile ? "h-12 px-3 gap-3" : "h-11 w-full px-3 gap-3",
                    active
                      ? "border-primary/50 bg-primary/15 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.18),inset_0_0_18px_hsl(var(--primary)/0.08)]"
                      : "border-transparent text-muted-foreground hover:border-primary/20 hover:bg-primary/8 hover:text-foreground"
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.9)]" />}
                  <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all", active ? "border-primary/40 bg-primary/20 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.22)]" : "border-border/50 bg-background/30 group-hover/item:border-primary/30 group-hover/item:text-primary")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="relative z-10 flex min-w-0 flex-1 flex-col">
                    <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em]">{label}</span>
                    {mobile && active && <span className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-primary/65">selecionado</span>}
                  </span>
                  <ChevronRight className={cn("relative z-10 h-3.5 w-3.5 transition-all", active ? "text-primary opacity-100" : "opacity-0 group-hover/item:opacity-50 group-hover/item:translate-x-0.5")} />
                  {active && <span className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-primary/10 to-transparent" />}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <style>{`.xp-bar-fill .bar-sheen, .life-bar-fill .bar-sheen { display: none !important; animation: none !important; }`}</style>
      {appBg ? <><div className={cn("app-bg-layer", appBg.className)} aria-hidden="true"><span className="app-bg-depth app-bg-depth-one" /><span className="app-bg-depth app-bg-depth-two" /><span className="app-bg-depth app-bg-depth-three" /><span className="app-bg-vignette" /></div><div className="app-bg-scrim" aria-hidden="true" /></> : !lowPower && <div className="fixed inset-0 pointer-events-none opacity-70"><ParticleBackground density={35} /></div>}
      <RewardBurstLayer />
      <InstallPWAPrompt />

      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/75 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,.12)]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/5 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.12)] transition-all hover:border-primary/60 hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] active:scale-95 lg:hidden">
              <Menu className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
            <Link to="/" className="group flex min-w-0 items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.18)] transition-transform group-hover:rotate-[-4deg]">⚔</span>
              <span className="truncate font-display text-base font-black tracking-[0.22em] text-primary glow-text-purple">ASCENSÃO</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <Link to="/admin" aria-label="Painel Admin" title="Painel Admin" className="group relative inline-flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-400/10 px-3 py-2 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.22)] transition-all hover:border-amber-200 hover:bg-amber-400/20 hover:text-amber-100 hover:shadow-[0_0_22px_rgba(251,191,36,0.42)] active:scale-95"><Shield className="relative h-4 w-4 drop-shadow-[0_0_6px_rgba(251,191,36,0.65)]" /><span className="relative text-[10px] font-black uppercase tracking-[0.18em]">Admin</span></Link>}
            <button onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }} className="rounded-xl border border-transparent p-2 text-muted-foreground transition hover:border-border hover:bg-primary/5 hover:text-primary" aria-label="Sair"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <aside className="group fixed left-0 top-16 bottom-0 z-40 hidden w-[82px] border-r border-primary/10 bg-background/78 backdrop-blur-2xl transition-[width,box-shadow] duration-300 ease-out hover:w-[238px] hover:shadow-[18px_0_45px_rgba(0,0,0,.30)] lg:flex lg:flex-col">
        <div className="flex h-full w-full flex-col px-2 py-4">
          <div className="mb-4 flex items-center gap-2 overflow-hidden rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="font-display text-[9px] font-black uppercase tracking-[0.2em] text-primary">Painel de Comando</p>
              <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground">Sua jornada continua</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">{renderNav()}</div>
          <div className="mt-3 border-t border-primary/10 pt-3">
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-2 text-center opacity-70">
              <p className="font-display text-[8px] font-black uppercase tracking-[0.22em] text-muted-foreground">ASCENSÃO</p>
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 z-50 lg:hidden">
        <button type="button" aria-label="Fechar menu" onClick={closeMenu} className="absolute inset-0 bg-background/75 backdrop-blur-sm" />
        <aside className="absolute left-0 top-0 bottom-0 flex w-[min(86vw,330px)] flex-col border-r border-primary/25 bg-background/96 shadow-[25px_0_60px_rgba(0,0,0,.55)]">
          <div className="flex h-20 items-center justify-between border-b border-primary/15 px-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.18)]">⚔</span>
              <div><p className="text-[8px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Sistema</p><p className="font-display text-sm font-black tracking-[0.2em] text-primary">ASCENSÃO</p></div>
            </div>
            <button type="button" onClick={closeMenu} aria-label="Fechar menu" className="rounded-xl border border-border/50 p-2 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">{renderNav(true)}
            {isAdmin && <Link to="/admin" onClick={closeMenu} className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-3 text-amber-200 transition hover:bg-amber-400/20"><Shield className="h-5 w-5" /><span className="flex-1 font-display text-xs uppercase tracking-[0.16em]">Admin</span><ChevronRight className="h-4 w-4 opacity-60" /></Link>}
          </div>
          <div className="border-t border-primary/10 p-3"><p className="text-center text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">SISTEMA ONLINE • ASCENSÃO</p></div>
        </aside>
      </div>}

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-6 lg:pl-[110px]">{children}</main>
    </div>
  );
}
