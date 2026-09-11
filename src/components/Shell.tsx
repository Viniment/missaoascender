import { Link, useLocation, useNavigate } from "react-router-dom";
import { Swords, Home, Trophy, ListChecks, User, LogOut, Store, Shirt, Shield, Brain, BookOpen, Menu, X, ChevronRight } from "lucide-react";
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

const NAV_GROUPS = [
  { title: "Principal", items: [
    { to: "/", label: "Base", Icon: Home },
    { to: "/inimigo", label: "Inimigo", Icon: Swords },
    { to: "/mente", label: "Mente", Icon: Brain },
  ]},
  { title: "Progressão", items: [
    { to: "/estudos", label: "Estudos", Icon: BookOpen },
    { to: "/mini-vitorias", label: "Vitórias", Icon: ListChecks },
    { to: "/conquistas", label: "Troféus", Icon: Trophy },
  ]},
  { title: "Personagem", items: [
    { to: "/loja", label: "Loja", Icon: Store },
    { to: "/personalizar", label: "Avatar", Icon: Shirt },
    { to: "/perfil", label: "Perfil", Icon: User },
  ]},
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

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {appBg ? <><div className={cn("app-bg-layer", appBg.className)} aria-hidden="true"><span className="app-bg-depth app-bg-depth-one" /><span className="app-bg-depth app-bg-depth-two" /><span className="app-bg-depth app-bg-depth-three" /><span className="app-bg-vignette" /></div><div className="app-bg-scrim" aria-hidden="true" /></> : !lowPower && <div className="fixed inset-0 pointer-events-none opacity-70"><ParticleBackground density={35} /></div>}
      <RewardBurstLayer />
      <InstallPWAPrompt />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="font-display text-lg tracking-widest text-primary glow-text-purple">⚔ NEW LIFEUP</Link>
          <div className="flex items-center gap-2">
            {isAdmin && <Link to="/admin" aria-label="Painel Admin" title="Painel Admin" className="group relative inline-flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-400/10 px-3 py-2 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.22)] transition-all hover:border-amber-200 hover:bg-amber-400/20 hover:text-amber-100 hover:shadow-[0_0_22px_rgba(251,191,36,0.42)] active:scale-95">
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/10 via-transparent to-amber-300/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <Shield className="relative h-4 w-4 drop-shadow-[0_0_6px_rgba(251,191,36,0.65)]" />
              <span className="relative text-[10px] font-black uppercase tracking-[0.18em]">Admin</span>
            </Link>}
            <button onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }} className="text-muted-foreground hover:text-primary p-2" aria-label="Sair"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <aside className="group/sidebar fixed left-0 top-14 bottom-0 z-40 hidden w-[68px] overflow-hidden border-r border-border bg-background/85 backdrop-blur-xl transition-[width,box-shadow] duration-200 hover:w-[224px] hover:shadow-[12px_0_40px_rgba(0,0,0,.22)] lg:flex lg:flex-col">
        <div className="flex h-full w-[224px] flex-col px-2 py-4">
          <div className="mb-3 px-3 text-[8px] font-black uppercase tracking-[0.28em] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">Navegação</div>
          <div className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden">
            {NAV_GROUPS.map((group) => <section key={group.title} className="space-y-1">
              <div className="h-4 px-3 text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">{group.title}</div>
              {group.items.map(({ to, label, Icon }) => {
                const active = loc.pathname === to;
                return <Link key={to} to={to} aria-label={label} title={label} className={cn("group/item relative flex h-11 items-center gap-3 rounded-xl px-3 transition-all", active ? "text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground")}>
                  {active && <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-[hsl(263_90%_40%)] shadow-[0_0_18px_hsl(var(--primary)/0.38)]" />}
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><Icon className="h-5 w-5" /></span>
                  <span className="relative z-10 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] opacity-0 transition-[opacity,transform] duration-150 -translate-x-2 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100">{label}</span>
                  {active && <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary-foreground shadow-[0_0_8px_currentColor] opacity-0 group-hover/sidebar:opacity-100" />}
                </Link>;
              })}
            </section>)}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <div className="mb-2 px-3 text-[8px] font-black uppercase tracking-[0.24em] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">Sistema</div>
            {isAdmin && <Link to="/admin" aria-label="Painel Admin" title="Painel Admin" className="group/item relative flex h-11 items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-400/5 px-3 text-amber-200 transition hover:border-amber-300/40 hover:bg-amber-400/10">
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><Shield className="h-5 w-5" /></span>
              <span className="relative z-10 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">Admin</span>
            </Link>}
          </div>
        </div>
      </aside>

      <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" className="fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-background/95 text-primary shadow-[0_8px_28px_rgba(0,0,0,.35),0_0_20px_hsl(var(--primary)/.2)] backdrop-blur-xl transition-all active:scale-95 hover:border-primary/70 hover:bg-primary/10 lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <Menu className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
      </button>

      {menuOpen && <div className="fixed inset-0 z-50 lg:hidden">
        <button type="button" aria-label="Fechar menu" onClick={closeMenu} className="absolute inset-0 bg-background/75 backdrop-blur-sm" />
        <aside className="absolute right-0 top-0 bottom-0 flex w-[min(86vw,330px)] flex-col border-l border-primary/20 bg-background shadow-[-20px_0_50px_rgba(0,0,0,.45)]">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Navegação</p>
              <p className="font-display text-sm tracking-[0.18em] text-primary">ASCENSÃO</p>
            </div>
            <button type="button" onClick={closeMenu} aria-label="Fechar menu" className="rounded-xl border border-border p-2.5 text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-3 pb-6">
            {NAV_GROUPS.map((group) => <section key={group.title}>
              <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-muted-foreground">{group.title}</div>
              <div className="space-y-1">
                {group.items.map(({ to, label, Icon }) => {
                  const active = loc.pathname === to;
                  return <Link key={to} to={to} onClick={closeMenu} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 transition-all", active ? "bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/.3)]" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground")}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 font-display text-[10px] font-bold uppercase tracking-[0.16em]">{label}</span>
                    <ChevronRight className={cn("h-4 w-4", active ? "opacity-100" : "opacity-35")} />
                  </Link>;
                })}
              </div>
            </section>)}
            {isAdmin && <section className="border-t border-border pt-4">
              <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-amber-300/70">Sistema</div>
              <Link to="/admin" onClick={closeMenu} className="flex min-h-11 items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 text-amber-200 transition hover:bg-amber-400/20">
                <Shield className="h-5 w-5" />
                <span className="flex-1 font-display text-[10px] font-bold uppercase tracking-[0.16em]">Admin</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </Link>
            </section>}
          </div>
        </aside>
      </div>}

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-6 lg:pl-[110px]">{children}</main>
    </div>
  );
}
