import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { fetchConquistas, fetchHeroi, fetchInimigoAtivo } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Lock } from "lucide-react";

type CatalogItem = {
  tipo: string;
  titulo: string;
  descricao: string;
  como: string;
  unlocked: boolean;
  progresso?: string;
  desbloqueada_em?: string | null;
};

export default function ConquistasPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: cs } = useQuery({
    queryKey: ["conq", uid],
    queryFn: () => fetchConquistas(uid!),
    enabled: !!uid,
  });
  const { data: heroi } = useQuery({
    queryKey: ["heroi", uid],
    queryFn: () => fetchHeroi(uid!),
    enabled: !!uid,
  });
  const { data: inimigo } = useQuery({
    queryKey: ["inimigo-ativo", uid],
    queryFn: () => fetchInimigoAtivo(uid!),
    enabled: !!uid,
  });
  const { data: derrotados } = useQuery({
    queryKey: ["inimigos-derrotados", uid],
    queryFn: async () => {
      const { count } = await supabase
        .from("inimigo")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid!)
        .eq("ativo", false);
      return count ?? 0;
    },
    enabled: !!uid,
  });

  const [aberta, setAberta] = useState<string | null>(null);

  const catalog = useMemo<CatalogItem[]>(() => {
    if (!heroi) return [];
    const map = new Map((cs ?? []).map(c => [c.tipo, c] as const));
    const nivelAtual = heroi.nivel ?? 1;
    const streak = heroi.streak_atual ?? 0;
    const abriuBau = !!heroi.ultimo_bau_data || map.has("bau_lendario");
    const primeiroInimigo = (derrotados ?? 0) >= 1 || map.has("primeiro_inimigo_derrotado");

    const items: CatalogItem[] = [];

    const teto = Math.max(10, nivelAtual + 8);
    for (let n = 2; n <= teto; n++) {
      const unlocked = nivelAtual >= n;
      const c = map.get(`nivel_${n}`);
      items.push({
        tipo: `nivel_${n}`,
        titulo: `Nível ${n} alcançado`,
        descricao: `Você evoluiu para o nível ${n}.`,
        como: `Acumule XP marcando hábitos positivos até chegar ao nível ${n}.`,
        progresso: unlocked ? undefined : `Nível ${nivelAtual}/${n}`,
        unlocked,
        desbloqueada_em: unlocked ? c?.desbloqueada_em ?? null : null,
      });
    }

    items.push({
      tipo: "streak_7",
      titulo: "7 dias de streak",
      descricao: "Uma semana inteira de consistência.",
      como: "Complete pelo menos um hábito positivo por 7 dias seguidos.",
      progresso: streak >= 7 ? undefined : `${streak}/7 dias`,
      unlocked: streak >= 7,
      desbloqueada_em: streak >= 7 ? map.get("streak_7")?.desbloqueada_em ?? null : null,
    });
    items.push({
      tipo: "streak_30",
      titulo: "30 dias de streak",
      descricao: "Um mês de disciplina implacável.",
      como: "Mantenha o streak diário por 30 dias sem falhar.",
      progresso: streak >= 30 ? undefined : `${streak}/30 dias`,
      unlocked: streak >= 30,
      desbloqueada_em: streak >= 30 ? map.get("streak_30")?.desbloqueada_em ?? null : null,
    });

    items.push({
      tipo: "bau_lendario",
      titulo: "Baú aberto",
      descricao: "Você abriu o baú diário pela primeira vez.",
      como: "Toque no baú do dia na tela inicial e abra a recompensa.",
      unlocked: abriuBau,
      desbloqueada_em: abriuBau ? map.get("bau_lendario")?.desbloqueada_em ?? null : null,
    });

    const teveInimigo = !!inimigo || (derrotados ?? 0) > 0 || map.has("primeira_batalha");
    items.push({
      tipo: "primeira_batalha",
      titulo: "Primeira batalha",
      descricao: "Você encarou o seu primeiro inimigo interno.",
      como: "Cadastre um inimigo (padrão de sabotagem) para começar a batalha.",
      unlocked: teveInimigo,
      desbloqueada_em: teveInimigo ? map.get("primeira_batalha")?.desbloqueada_em ?? null : null,
    });

    items.push({
      tipo: "primeiro_inimigo_derrotado",
      titulo: "Primeiro inimigo derrotado",
      descricao: "Um padrão a menos te controlando.",
      como: "Zere o HP de um inimigo cumprindo seus hábitos positivos.",
      progresso: primeiroInimigo ? undefined : `${derrotados ?? 0}/1 derrotado`,
      unlocked: primeiroInimigo,
      desbloqueada_em: primeiroInimigo ? map.get("primeiro_inimigo_derrotado")?.desbloqueada_em ?? null : null,
    });

    items.push({
      tipo: "mestre_habitos",
      titulo: "Mestre dos hábitos",
      descricao: "Consistência virou identidade.",
      como: "Mantenha 30 dias de streak e derrote pelo menos um inimigo.",
      unlocked: streak >= 30 && primeiroInimigo,
      desbloqueada_em:
        streak >= 30 && primeiroInimigo ? map.get("mestre_habitos")?.desbloqueada_em ?? null : null,
    });

    return items;
  }, [cs, heroi, inimigo, derrotados]);

  const total = catalog.length;
  const obtidas = catalog.filter(c => c.unlocked).length;

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-xl tracking-wider text-primary glow-text-purple">
            CONQUISTAS
          </h1>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {obtidas}/{total} desbloqueadas
          </span>
        </div>

        {catalog.map(c => {
          const open = aberta === c.tipo;
          return (
            <button
              key={c.tipo}
              onClick={() => setAberta(open ? null : c.tipo)}
              className={`w-full text-left rpg-panel p-4 flex items-start gap-3 transition ${
                c.unlocked ? "" : "opacity-55 hover:opacity-80"
              }`}
            >
              {c.unlocked ? (
                <Trophy className="w-6 h-6 text-gold shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-display text-sm tracking-wide ${
                    c.unlocked ? "" : "text-muted-foreground"
                  }`}
                >
                  {c.titulo}
                </p>
                <p className="text-xs text-muted-foreground">{c.descricao}</p>
                {open && (
                  <div className="mt-2 space-y-1 border-t border-border/60 pt-2">
                    <p className="text-[11px] uppercase tracking-widest text-primary">
                      Como conseguir
                    </p>
                    <p className="text-xs text-foreground/90">{c.como}</p>
                    {c.progresso && (
                      <p className="text-[11px] text-muted-foreground">Progresso: {c.progresso}</p>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {c.unlocked && c.desbloqueada_em
                  ? new Date(c.desbloqueada_em).toLocaleDateString("pt-BR")
                  : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}