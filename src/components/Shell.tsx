import { Link, useLocation, useNavigate } from "react-router-dom";
import { Swords, Home, Trophy, ListChecks, User, LogOut, Store, Shirt, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import RewardBurstLayer from "@/components/fx/RewardBurst";
import ParticleBackground from "@/components/fx/ParticleBackground";
import { motion } from "framer-motion";

const NAV = [
  { to: "/", label: "Base", Icon: Home },
  { to: "/inimigo", label: "Inimigo", Icon: Swords },
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
  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-70">
        <ParticleBackground density={35} />
      </div>
      <RewardBurstLayer />
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-lg tracking-widest text-primary glow-text-purple">
            ⚔ NEW LIFEUP
          </Link>
          <div className="flex items-center gap-1">
          {isAdmin && (
            <Link to="/admin" className="text-primary hover:text-primary/80 p-2" aria-label="Admin" title="Admin">
              <Shield className="w-5 h-5" />
            </Link>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }}
            className="text-muted-foreground hover:text-primary p-2"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md px-3 pb-3 pt-2">
          <div className="relative flex items-center justify-between gap-1 rounded-2xl border border-primary/25 bg-background/85 backdrop-blur-xl px-2 py-2 shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5),0_0_0_1px_hsl(var(--primary)/0.08)_inset]">
            {NAV.map(({ to, label, Icon }) => {
              const active = loc.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  className={cn(
                    "relative flex items-center justify-center rounded-xl transition-all",
                    "min-h-[44px] flex-1",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary to-[hsl(263_90%_40%)] shadow-[0_0_16px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.2)]"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 px-2 py-1.5">
                    <Icon className={cn("w-5 h-5 shrink-0", !active && "drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)]")} />
                    {active && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="font-display text-[10px] tracking-[0.2em] uppercase whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </span>
                  {active && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}