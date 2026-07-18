import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { fetchConquistas } from "@/lib/api";
import { Trophy } from "lucide-react";

export default function ConquistasPage() {
  const { user } = useAuth();
  const { data: cs } = useQuery({ queryKey: ["conq", user?.id], queryFn: () => fetchConquistas(user!.id), enabled: !!user });
  return (
    <Shell>
      <div className="space-y-4">
        <h1 className="font-display text-xl tracking-wider text-primary glow-text-purple">CONQUISTAS</h1>
        {(cs ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conquista ainda. Continue.</p>}
        {(cs ?? []).map(c => (
          <div key={c.id} className="rpg-panel p-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-gold" />
            <div className="flex-1">
              <p className="font-display text-sm tracking-wide">{c.titulo}</p>
              {c.descricao && <p className="text-xs text-muted-foreground">{c.descricao}</p>}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {new Date(c.desbloqueada_em).toLocaleDateString("pt-BR")}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  );
}