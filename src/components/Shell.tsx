import { Link, useLocation, useNavigate } from "react-router-dom";
import { Swords, Home, Trophy, ListChecks, User, LogOut, Store, Shirt, Shield, Brain, BookOpen, Menu, X, ChevronRight, FolderKanban, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Base", group: "NÚCLEO", Icon: Home },
  { to: "/mente", label: "Mente", group: "MENTE", Icon: Brain },
  { to: "/projetos", label: "Projetos", group: "MISSÕES", Icon: FolderKanban },
  { to: "/estudos", label: "Estudos", group: "MISSÕES", Icon: BookOpen },
  { to: "/mini-vitorias", label: "Vitórias", group: "PROGRESSO", Icon: ListChecks },
  { to: "/conquistas", label: "Troféus", group: "PROGRESSO", Icon: Trophy },
  { to: "/loja", label: "Loja", group: "PERSONAGEM", Icon: Store },
  { to: "/personalizar", label: "Avatar", group: "PERSONAGEM", Icon: Shirt },
  { to: "/perfil", label: "Perfil", group: "PERSONAGEM", Icon: User },
];

const AUTO_EXPAND_ROUTES = ["/mente", "/projetos", "/estudos", "/mini-vitorias", "/conquistas"];

export default function Shell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const { lowPower } = useLowPower();
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const { data: heroi } = useQuery({ queryKey: ["heroi", user?.id], queryFn: () => fetchHeroi(user!.id), enabled: !!user });
  const appBgId = (heroi?.avatar_equipado as any)?.appBg as string | undefined;
  const appBg = !lowPower && appBgId ? APP_BACKGROUNDS[appBgId] : null;

  const closeMenu = () => setMenuOpen(false);
  const isActive = (to: string) => loc.pathname === to || (to !== "/" && loc.pathname.startsWith(`${to}/`));
  const autoExpanded = AUTO_EXPAND_ROUTES.some((route) => isActive(route));

  useEffect(() => {
    if (autoExpanded) setDesktopExpanded(true);
  }, [loc.pathname, autoExpanded]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const grouped = NAV.reduce<Record<string, typeof NAV>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  const renderNav = (mobile = false) => (
    <div className={cn("space-y-3", mobile && "space-y-4")}>
      {Object.entries(grouped).map(([group, items]) => (
        <section key={group}>
          <div className={cn("mb-2 flex items-center gap-2 px-2", !mobile && !desktopExpanded && "justify-center px-0")}>
            <span className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            <span className={cn("font-display text-[7px] font-black tracking-[0.28em] text-primary/55", !mobile && !desktopExpanded && "sr-only")}>{group}</span>
            <span className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
          </div>
          <div className={cn("space-y-1", !mobile && !desktopExpanded && "space-y-2")}>
            {items.map(({ to, label, Icon }) => {
              const active = isActive(to);
              return (
                <Link key={to} to={to} onClick={mobile ? closeMenu : undefined} aria-label={label} title={!mobile && !desktopExpanded ? label : undefined}
                  className={cn("group/item relative flex items-center overflow-hidden rounded-xl border transition-all duration-200", mobile ? "min-h-11 gap-3 px-3" : desktopExpanded ? "h-10.5 gap-3 px-2.5" : "h-[50px] justify-center px-2",
                    active ? "border-primary/55 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-primary shadow-[0_0_22px_hsl(var(--primary)/0.18),inset_0_0_18px_hsl(var(--primary)/0.07)]" : "border-transparent text-muted-foreground hover:border-primary/20 hover:bg-white/[0.025] hover:text-foreground")}>
                  {active && <span className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.95)]" />}
                  <span className={cn("relative z-10 flex shrink-0 items-center justify-center rounded-lg border transition-all", mobile ? "h-8 w-8" : desktopExpanded ? "h-8 w-8" : "h-10 w-10 p-2.5", active ? "border-primary/50 bg-primary/20 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]" : "border-border/40 bg-background/30 group-hover/item:border-primary/30 group-hover/item:bg-primary/10 group-hover/item:text-primary")}>
                    <Icon className={cn(mobile ? "h-4 w-4" : desktopExpanded ? "h-[18px] w-[18px]" : "h-[22px] w-[22px]")} />
                  </span>
                  <span className={cn("relative z-10 min-w-0 flex-1 truncate font-display font-black uppercase tracking-[0.16em] text-[9px]", !mobile && !desktopExpanded && "sr-only")}>{label}</span>
                  {(mobile || desktopExpanded) && <ChevronRight className={cn("relative z-10 h-3 w-3 transition-all", active ? "text-primary opacity-100" : "opacity-0 group-hover/item:opacity-50 group-hover/item:translate-x-0.5")} />}
                  {active && <span className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-primary/10 to-transparent" />}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <style>{`.xp-bar-fill .bar-sheen, .life-bar-fill .bar-sheen { display: none !important; animation: none !important; } .new-lifeup-scroll::-webkit-scrollbar { width: 6px; } .new-lifeup-scroll::-webkit-scrollbar-track { background: hsl(var(--primary) / 0.035); border-left: 1px solid hsl(var(--primary) / 0.08); margin: 10px 4px; border-radius: 999px; } .new-lifeup-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg, hsl(var(--primary) / 0.48), hsl(var(--primary) / 0.16)); border: 1px solid hsl(var(--primary) / 0.22); border-radius: 999px; box-shadow: 0 0 8px hsl(var(--primary) / 0.18); } .new-lifeup-scroll::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary) / 0.65); } .new-lifeup-scroll { scrollbar-width: thin; scrollbar-color: hsl(var(--primary) / 0.42) hsl(var(--primary) / 0.035); }`}</style>
      {appBg ? <><div className={cn("app-bg-layer", appBg.className)} aria-hidden="true"><span className="app-bg-depth app-bg-depth-one" /><span className="app-bg-depth app-bg-depth-two" /><span className="app-bg-depth app-bg-depth-three" /><span className="app-bg-vignette" /></div><div className="app-bg-scrim" aria-hidden="true" /></> : !lowPower && <div className="fixed inset-0 pointer-events-none opacity-70"><ParticleBackground density={35} /></div>}
      <RewardBurstLayer />
      <InstallPWAPrompt />

      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/75 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,.12)]">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/5 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.12)] transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-95 lg:hidden"><Menu className="h-4 w-4 sm:h-5 sm:w-5" /></button>
            <Link to="/" className="group flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)] sm:h-9 sm:w-9">⚔</span><span className="truncate font-display text-sm font-black tracking-[0.14em] text-primary glow-text-purple sm:text-base sm:tracking-[0.2em]">NEW LIFEUP</span></Link>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isAdmin && <Link to="/admin" aria-label="Painel Admin" title="Painel Admin" className="group inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-300/60 bg-amber-400/10 px-2.5 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.18)] transition-all hover:border-amber-200 hover:bg-amber-400/20 active:scale-95 sm:h-auto sm:px-3 sm:py-2"><Shield className="h-3.5 w-3.5" /><span className="hidden text-[10px] font-black uppercase tracking-[0.18em] min-[420px]:inline">Admin</span></Link>}
            <button onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }} className="rounded-xl border border-transparent p-2 text-muted-foreground transition hover:border-border hover:bg-primary/5 hover:text-primary" aria-label="Sair"><LogOut className="h-4 w-4 sm:h-5 sm:w-5" /></button>
          </div>
        </div>
      </header>

      <aside className={cn("fixed left-0 top-14 bottom-0 z-40 hidden border-r border-primary/15 bg-background/82 backdrop-blur-2xl transition-[width,box-shadow] duration-300 ease-out lg:flex lg:flex-col xl:top-16", desktopExpanded ? "w-[250px] shadow-[14px_0_45px_rgba(0,0,0,.24)]" : "w-[88px]")}>
        <div className="flex h-full w-full min-h-0 flex-col px-3 py-3">
          <div className="min-h-0 flex-1 overflow-hidden px-1">
            <div className="new-lifeup-scroll h-full overflow-y-auto pr-3 pl-1 py-1">{renderNav()}</div>
          </div>
          <div className="mt-3 shrink-0 border-t border-primary/10 pt-2.5">
            <button type="button" onClick={() => setDesktopExpanded((value) => !value)} aria-label={desktopExpanded ? "Recolher menu" : "Expandir menu"} title={desktopExpanded ? "Recolher menu" : "Expandir menu"} className={cn("relative flex h-10 w-full items-center rounded-lg border border-transparent text-muted-foreground transition hover:border-primary/20 hover:bg-primary/5 hover:text-primary", desktopExpanded ? "justify-center px-2" : "justify-center")}>
              {desktopExpanded && <PanelLeftClose className="absolute left-2 h-4 w-4" />}
              {desktopExpanded ? <span className="font-display text-center text-[8px] font-black uppercase tracking-[0.16em]">Recolher painel</span> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            {desktopExpanded && <p className="mt-1 text-center text-[6px] uppercase tracking-[0.2em] text-muted-foreground/35">SISTEMA ONLINE</p>}
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button type="button" aria-label="Fechar menu" onClick={closeMenu} className="absolute inset-0 bg-background/80 backdrop-blur-md" /><aside className="absolute inset-y-0 left-0 flex h-[100dvh] w-[min(88vw,350px)] max-w-full flex-col border-r border-primary/25 bg-[hsl(var(--background)/0.98)] shadow-[25px_0_70px_rgba(0,0,0,.65)]"><div className="relative flex h-20 shrink-0 items-center justify-between border-b border-primary/15 px-4"><div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" /><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.2)]">⚔</span><div className="min-w-0"><p className="text-[7px] font-bold uppercase tracking-[0.28em] text-muted-foreground">SISTEMA</p><p className="truncate font-display text-sm font-black tracking-[0.2em] text-primary glow-text-purple">NEW LIFEUP</p></div></div><button type="button" onClick={closeMenu} aria-label="Fechar menu" className="shrink-0 rounded-xl border border-border/50 p-2.5 text-muted-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary active:scale-95"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3"><div className="mb-3 rounded-xl border border-primary/10 bg-primary/[0.035] px-3 py-2 text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">NAVEGAÇÃO DO JOGADOR</div>{renderNav(true)}{isAdmin && <Link to="/admin" onClick={closeMenu} className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 text-amber-200 transition hover:bg-amber-400/20"><span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-300/30 bg-amber-400/10"><Shield className="h-4 w-4" /></span><span className="flex-1 font-display text-[9px] font-black uppercase tracking-[0.16em]">Painel Admin</span><ChevronRight className="h-3.5 w-3.5 opacity-60" /></Link>}</div><div className="shrink-0 border-t border-primary/10 p-3"><div className="rounded-lg border border-primary/10 bg-primary/[0.03] py-2"><p className="text-center text-[7px] font-bold uppercase tracking-[0.24em] text-muted-foreground/40">NEW LIFEUP • SISTEMA ONLINE</p></div></div></aside></div>}

      <main className={cn("relative z-10 mx-auto w-full max-w-5xl px-3 py-4 transition-[padding] duration-300 sm:px-4 sm:py-6", desktopExpanded ? "lg:pl-[270px]" : "lg:pl-[108px]", "xl:pr-5")}>{children}</main>
    </div>
  );
}
