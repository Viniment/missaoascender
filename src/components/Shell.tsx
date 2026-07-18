import { Link, useLocation, useNavigate } from "react-router-dom";
import { Swords, Home, Trophy, ListChecks, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Base", Icon: Home },
  { to: "/inimigo", label: "Inimigo", Icon: Swords },
  { to: "/mini-vitorias", label: "Mini Vitórias", Icon: ListChecks },
  { to: "/conquistas", label: "Conquistas", Icon: Trophy },
  { to: "/perfil", label: "Perfil", Icon: User },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-lg tracking-widest text-primary glow-text-purple">
            ⚔ NEW LIFEUP
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav("/auth"); }}
            className="text-muted-foreground hover:text-primary p-2"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto grid grid-cols-5">
          {NAV.map(({ to, label, Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link key={to} to={to} className={cn(
                "flex flex-col items-center gap-1 py-2 text-[10px] tracking-wider uppercase transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}>
                <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}