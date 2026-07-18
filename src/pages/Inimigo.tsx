import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchInimigoAtivo } from "@/lib/api";
import Shell from "@/components/Shell";
import { motion } from "framer-motion";

export default function InimigoPage() {
  const { user } = useAuth();
  const { data: inim } = useQuery({ queryKey: ["inimigo", user?.id], queryFn: () => fetchInimigoAtivo(user!.id), enabled: !!user });

  if (!inim) return <Shell><p className="text-muted-foreground text-sm">Sem inimigo ativo.</p></Shell>;

  const pct = (inim.hp_atual / inim.hp_max) * 100;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="rpg-panel neon-glow p-6 text-center space-y-4">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-7xl">
            {(inim.avatar_config as any)?.emoji ?? "😈"}
          </motion.div>
          <div>
            <p className="text-xs uppercase tracking-widest text-destructive">Inimigo interno</p>
            <h1 className="font-display text-3xl tracking-wider text-foreground">{inim.nome}</h1>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 flex justify-between">
              <span>HP</span><span>{inim.hp_atual}/{inim.hp_max}</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div className="h-full bg-destructive" animate={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="rpg-panel p-5 space-y-3">
          <h3 className="font-display text-sm tracking-widest text-primary">MENTIRAS QUE ELE CONTA</h3>
          <ul className="space-y-2">
            {inim.mentiras.map((m, i) => (
              <li key={i} className="text-sm italic text-muted-foreground border-l-2 border-destructive/40 pl-3">
                #{i + 1} — "{m}"
              </li>
            ))}
          </ul>
        </div>

        {inim.gatilho && (
          <div className="rpg-panel p-5 space-y-2">
            <h3 className="font-display text-sm tracking-widest text-primary">GATILHO PRINCIPAL</h3>
            <p className="text-sm text-foreground">{inim.gatilho}</p>
          </div>
        )}
      </div>
    </Shell>
  );
}