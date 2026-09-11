import { Link, useLocation, useNavigate } from "react-router-dom";
import { Swords, Home, Trophy, ListChecks, User, LogOut, Store, Shirt, Shield, Brain, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import RewardBurstLayer from "@/components/fx/RewardBurst";
import ParticleBackground from "@/components/fx/ParticleBackground";
import InstallPWAPrompt from "@/components/InstallPWAPrompt";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchHeroi } from "@/lib/api";
import { APP_BACKGROUNDS } from "@/lib/itens";
import { useLowPower } from "@/hooks/useLowPower";

const NAV = [
  { to: "/", label: "Base", Icon: Home },
  { to: "/inimigo", label: "Inimigo", Icon: Swords },
  { to: "/mente", label: "Mente", Icon: Brain },
  { to: "/estudos", label: "Estudos", Icon: BookOpen },
  { to: "/mini-vitorias", label: "Vitórias", Icon: ListChecks },
  { to: "/loja", label: "Loja", Icon: Store },
  { to: "/personalizar", label: "Avatar", Icon: Shirt },
  { to: "/conquistas", label: "Troféus", Icon: Trophy },
  { to: "/perfil", label: "Perfil", Icon: User },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const { lowPower } = useLowPower();
  const { data: heroi } = useQuery({ queryKey: ["heroi", user?.id], queryFn: () => fetchHeroi(user!.id), enabled: !!user });
  const appBgId = (heroi?.avatar_equipado as any)?.appBg as string | undefined;
  const appBg = !lowPower && appBgId ? APP_BACKGROUNDS[appBgId] : null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden">
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
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md px-3 pb-3 pt-2">
          <div className="relative flex items-center justify-between gap-1 rounded-2xl border border-primary/25 bg-background/85 backdrop-blur-xl px-2 py-2 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5),0_0_0_1px_hsl(var(--primary)/0.08)_inset]">
            {NAV.map(({ to, label, Icon }) => { const active = loc.pathname === to; return <Link key={to} to={to} aria-label={label} className={cn("relative flex items-center justify-center rounded-xl transition-all min-h-[44px] flex-1", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {active && !lowPower && <motion.span layoutId="nav-active-pill" transition={{ type: "spring", stiffness: 380, damping: 30 }} className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary to-[hsl(263_90%_40%)] shadow-[0_0_16px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.2)]" />}
              {active && lowPower && <span className="absolute inset-0 rounded-xl bg-primary" />}
              <span className="relative z-10 flex items-center gap-1.5 px-2 py-1.5"><Icon className={cn("w-5 h-5 shrink-0", !active && "drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)")} />{active && !lowPower && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} transition={{ duration: 0.25, delay: 0.05 }} className="font-display text-[10px] tracking-[0.2em] uppercase whitespace-nowrap overflow-hidden">{label}</motion.span>}{active && lowPower && <span className="relative z-10 font-display text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">{label}</span>}</span>
              {active && <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
            </Link>; })}
          </div>
        </div>
      </nav>
    </div>
  );
}
