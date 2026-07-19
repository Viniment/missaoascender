import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { fetchConquistas, fetchHeroi, fetchInimigoAtivo } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Lock } from "lucide-react";

type Grupo = "nivel" | "batalha" | "consistencia" | "riqueza" | "pureza";

type CatalogItem = {
  tipo: string;
  titulo: string;
  descricao: string;
  como: string;
  unlocked: boolean;
  progresso?: string;
  desbloqueada_em?: string | null;
  grupo: Grupo;
};

const GRUPOS: { id: Grupo | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "nivel", label: "Nível" },
  { id: "batalha", label: "Batalha" },
  { id: "consistencia", label: "Consistência" },
  { id: "riqueza", label: "Riqueza" },
  { id: "pureza", label: "Pureza" },
];

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

  const { data: economia } = useQuery({
    queryKey: ["econ-conq", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("transacoes_ouro")
        .select("valor,origem")
        .eq("user_id", uid!);
      const rows = data ?? [];
      const ouroGanho = rows.filter(r => (r.valor ?? 0) > 0).reduce((s, r) => s + (r.valor ?? 0), 0);
      const compras = rows.filter(r => (r.origem ?? "") === "loja").length;
      return { ouroGanho, compras };
    },
    enabled: !!uid,
  });

  const { data: pureza } = useQuery({
    queryKey: ["pureza-conq", uid],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from("habito_logs")
        .select("data, completado, habitos!inner(tipo)")
        .eq("user_id", uid!)
        .eq("completado", true);
      const byDay = new Map<string, { pos: number; neg: number }>();
      for (const l of logs ?? []) {
        const d = l.data as string;
        const t = (l as any).habitos?.tipo as string | undefined;
        const cur = byDay.get(d) ?? { pos: 0, neg: 0 };
        if (t === "positivo") cur.pos++;
        else if (t === "negativo") cur.neg++;
        byDay.set(d, cur);
      }
      let perfeitos = 0;
      let semArmadilhas = 0;
      for (const { pos, neg } of byDay.values()) {
        if (pos > 0 && neg === 0) perfeitos++;
        if (neg === 0 && pos > 0) semArmadilhas++;
      }
      return { perfeitos, semArmadilhas };
    },
    enabled: !!uid,
  });

  const [aberta, setAberta] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Grupo | "todas">("todas");

  const catalog = useMemo<CatalogItem[]>(() => {
    if (!heroi) return [];
    const map = new Map((cs ?? []).map(c => [c.tipo, c] as const));
    const nivelAtual = heroi.nivel ?? 1;
    const streak = heroi.streak_atual ?? 0;
    const ouroAtual = heroi.ouro ?? 0;
    const ouroGanho = economia?.ouroGanho ?? 0;
    const compras = economia?.compras ?? 0;
    const perfeitos = pureza?.perfeitos ?? 0;
    const semArmadilhas = pureza?.semArmadilhas ?? 0;
    const kills = derrotados ?? 0;
    const abriuBau = !!heroi.ultimo_bau_data || map.has("bau_lendario");
    const primeiroInimigo = kills >= 1 || map.has("primeiro_inimigo_derrotado");

    const items: CatalogItem[] = [];

    // Nível
    const teto = Math.max(10, nivelAtual + 8);
    const marcos = Array.from(new Set([2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, teto])).sort((a, b) => a - b);
    for (const n of marcos) {
      if (n < 2) continue;
      const unlocked = nivelAtual >= n;
      const c = map.get(`nivel_${n}`);
      items.push({
        tipo: `nivel_${n}`,
        titulo: `Nível ${n} alcançado`,
        descricao: `Evolua para o nível ${n}.`,
        como: `Acumule XP marcando hábitos positivos até chegar ao nível ${n}.`,
        progresso: unlocked ? undefined : `Nível ${nivelAtual}/${n}`,
        unlocked,
        desbloqueada_em: unlocked ? c?.desbloqueada_em ?? null : null,
        grupo: "nivel",
      });
    }

    // Consistência (streaks + baú)
    const streakMarcos = [3, 7, 14, 30, 60, 100];
    for (const n of streakMarcos) {
      const unlocked = streak >= n;
      items.push({
        tipo: `streak_${n}`,
        titulo: `${n} dias de streak`,
        descricao: `Mantenha ${n} dias seguidos de foco.`,
        como: `Complete pelo menos um hábito positivo por ${n} dias consecutivos.`,
        progresso: unlocked ? undefined : `${streak}/${n} dias`,
        unlocked,
        desbloqueada_em: unlocked ? map.get(`streak_${n}`)?.desbloqueada_em ?? null : null,
        grupo: "consistencia",
      });
    }
    items.push({
      tipo: "bau_lendario",
      titulo: "Baú aberto",
      descricao: "Abra o baú diário pela primeira vez.",
      como: "Toque no baú do dia na tela inicial e abra a recompensa.",
      unlocked: abriuBau,
      desbloqueada_em: abriuBau ? map.get("bau_lendario")?.desbloqueada_em ?? null : null,
      grupo: "consistencia",
    });

    // Batalha
    const teveInimigo = !!inimigo || kills > 0 || map.has("primeira_batalha");
    items.push({
      tipo: "primeira_batalha",
      titulo: "Primeira batalha",
      descricao: "Encare o seu primeiro inimigo interno.",
      como: "Cadastre um inimigo (padrão de sabotagem) para começar a batalha.",
      unlocked: teveInimigo,
      desbloqueada_em: teveInimigo ? map.get("primeira_batalha")?.desbloqueada_em ?? null : null,
      grupo: "batalha",
    });
    const killMarcos = [1, 3, 5, 10, 25];
    for (const n of killMarcos) {
      const unlocked = kills >= n;
      const tipo = n === 1 ? "primeiro_inimigo_derrotado" : `inimigos_${n}`;
      items.push({
        tipo,
        titulo: n === 1 ? "Primeiro inimigo derrotado" : `${n} inimigos derrotados`,
        descricao: n === 1 ? "Um padrão a menos te controlando." : `Elimine ${n} padrões de sabotagem.`,
        como: "Zere o HP de um inimigo cumprindo seus hábitos positivos.",
        progresso: unlocked ? undefined : `${kills}/${n}`,
        unlocked,
        desbloqueada_em: unlocked ? map.get(tipo)?.desbloqueada_em ?? null : null,
        grupo: "batalha",
      });
    }

    // Riqueza — ouro ganho, ouro guardado, compras
    const ganhoMarcos = [100, 500, 1000, 5000, 10000];
    for (const n of ganhoMarcos) {
      const unlocked = ouroGanho >= n;
      items.push({
        tipo: `ouro_ganho_${n}`,
        titulo: `${n.toLocaleString("pt-BR")} de ouro ganho`,
        descricao: `Acumule ${n.toLocaleString("pt-BR")} de ouro somando todos os ganhos.`,
        como: "Cumpra hábitos positivos, abra baús e derrote inimigos para ganhar ouro.",
        progresso: unlocked ? undefined : `${ouroGanho}/${n}`,
        unlocked,
        desbloqueada_em: unlocked ? map.get(`ouro_ganho_${n}`)?.desbloqueada_em ?? null : null,
        grupo: "riqueza",
      });
    }
    const cofreMarcos = [500, 2000, 5000];
    for (const n of cofreMarcos) {
      const unlocked = ouroAtual >= n;
      items.push({
        tipo: `ouro_cofre_${n}`,
        titulo: `${n.toLocaleString("pt-BR")} guardados`,
        descricao: `Tenha ${n.toLocaleString("pt-BR")} de ouro guardados ao mesmo tempo.`,
        como: "Segure a mão: economize ouro sem gastar tudo na loja.",
        progresso: unlocked ? undefined : `${ouroAtual}/${n}`,
        unlocked,
        desbloqueada_em: unlocked ? map.get(`ouro_cofre_${n}`)?.desbloqueada_em ?? null : null,
        grupo: "riqueza",
      });
    }
    const compraMarcos = [1, 5, 15, 30];
    for (const n of compraMarcos) {
      const unlocked = compras >= n;
      items.push({
        tipo: `compras_${n}`,
        titulo: n === 1 ? "Primeira compra" : `${n} compras na loja`,
        descricao: n === 1 ? "Estreie a loja com sua primeira compra." : `Realize ${n} compras na loja.`,
        como: "Acesse a loja e troque ouro por itens.",
        progresso: unlocked ? undefined : `${compras}/${n}`,
        unlocked,
        desbloqueada_em: unlocked ? map.get(`compras_${n}`)?.desbloqueada_em ?? null : null,
        grupo: "riqueza",
      });
    }

    // Pureza — dias perfeitos e sem armadilhas
    const perfMarcos = [1, 5, 15, 30];
    for (const n of perfMarcos) {
      const unlocked = perfeitos >= n;
      items.push({
        tipo: `dias_perfeitos_${n}`,
        titulo: n === 1 ? "Primeiro dia perfeito" : `${n} dias perfeitos`,
        descricao: `Complete ${n} dia${n > 1 ? "s" : ""} sem cair em nenhuma armadilha.`,
        como: "Marque pelo menos um hábito positivo e nenhum negativo no mesmo dia.",
        progresso: unlocked ? undefined : `${perfeitos}/${n} dias`,
        unlocked,
        desbloqueada_em: unlocked ? map.get(`dias_perfeitos_${n}`)?.desbloqueada_em ?? null : null,
        grupo: "pureza",
      });
    }
    const semArmMarcos = [3, 7, 21, 60];
    for (const n of semArmMarcos) {
      const unlocked = semArmadilhas >= n;
      items.push({
        tipo: `sem_armadilhas_${n}`,
        titulo: `${n} dias sem armadilhas`,
        descricao: `Fique ${n} dias sem cair nas armadilhas do inimigo.`,
        como: "Evite marcar hábitos negativos e mantenha o dia limpo.",
        progresso: unlocked ? undefined : `${semArmadilhas}/${n} dias`,
        unlocked,
        desbloqueada_em: unlocked ? map.get(`sem_armadilhas_${n}`)?.desbloqueada_em ?? null : null,
        grupo: "pureza",
      });
    }

    items.push({
      tipo: "mestre_habitos",
      titulo: "Mestre dos hábitos",
      descricao: "Consistência virou identidade.",
      como: "Mantenha 30 dias de streak e derrote pelo menos um inimigo.",
      unlocked: streak >= 30 && primeiroInimigo,
      desbloqueada_em:
        streak >= 30 && primeiroInimigo ? map.get("mestre_habitos")?.desbloqueada_em ?? null : null,
      grupo: "consistencia",
    });

    return items;
  }, [cs, heroi, inimigo, derrotados, economia, pureza]);

  const total = catalog.length;
  const obtidas = catalog.filter(c => c.unlocked).length;
  const filtrado = filtro === "todas" ? catalog : catalog.filter(c => c.grupo === filtro);

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

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {GRUPOS.map(g => {
            const count = g.id === "todas" ? catalog.length : catalog.filter(c => c.grupo === g.id).length;
            const got = g.id === "todas"
              ? obtidas
              : catalog.filter(c => c.grupo === g.id && c.unlocked).length;
            const active = filtro === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setFiltro(g.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest border transition ${
                  active
                    ? "bg-primary/20 border-primary text-primary glow-text-purple"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {g.label} <span className="opacity-70">{got}/{count}</span>
              </button>
            );
          })}
        </div>

        {filtrado.map(c => {
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