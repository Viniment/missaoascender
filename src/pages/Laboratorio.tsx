import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchInimigoAtivo, fetchOnboarding } from "@/lib/api";
import { Loader2, FlaskConical, AlertTriangle, Lightbulb, Target, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

type Insights = {
  leitura: string;
  insights: string[];
  sabotagens: { nome: string; evidencia: string; contra_jogada: string }[];
  proxima_semana: string;
};

export default function Laboratorio() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: ob } = useQuery({ queryKey: ["ob", uid], queryFn: () => fetchOnboarding(uid!), enabled: !!uid });

  const { data: fissuras } = useQuery({
    queryKey: ["lab-fissuras", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("fissuras").select("*").eq("user_id", uid!).order("criado_em", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: urges } = useQuery({
    queryKey: ["lab-urges", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("urge_surfs").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: pensamentos } = useQuery({
    queryKey: ["lab-pens", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("pensamentos").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: negLogs } = useQuery({
    queryKey: ["lab-neg", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habito_logs")
        .select("id, data, completado, habito_id, habitos:habito_id(nome, tipo)")
        .eq("user_id", uid!)
        .eq("completado", true)
        .order("data", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []).filter((r: any) => r.habitos?.tipo === "negativo");
    },
  });

  const resumo = useMemo(() => {
    const f = fissuras ?? [];
    const u = urges ?? [];
    const p = pensamentos ?? [];
    const n = negLogs ?? [];

    const topCount = (arr: (string | null | undefined)[], k = 5) => {
      const c: Record<string, number> = {};
      arr.forEach((v) => { if (v) c[v] = (c[v] ?? 0) + 1; });
      return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, k).map(([nome, n]) => ({ nome, n }));
    };

    const porHora = new Array(24).fill(0);
    const porDia = new Array(7).fill(0);
    f.forEach((x: any) => {
      const d = new Date(x.criado_em);
      porHora[d.getHours()] += 1;
      porDia[d.getDay()] += 1;
    });

    const finalizadas = f.filter((x: any) => x.finalizado_em && x.intensidade_final != null);
    const media = (nums: number[]) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

    return {
      fissuras: {
        total: f.length,
        resolvidas: f.filter((x: any) => x.resolvida).length,
        intensidade_media_inicial: +media(f.map((x: any) => x.intensidade_inicial ?? 0)).toFixed(1),
        intensidade_media_final: +media(finalizadas.map((x: any) => x.intensidade_final ?? 0)).toFixed(1),
        top_emocoes: topCount(f.map((x: any) => x.emocao)),
        top_tipos: topCount(f.map((x: any) => x.tipo_detectado)),
        por_hora: porHora,
        por_diasemana: porDia,
      },
      urge: {
        total: u.length,
        cedeu: u.filter((x: any) => x.cedeu === true).length,
        atravessou: u.filter((x: any) => x.cedeu === false).length,
        ciclos_medios: +media(u.map((x: any) => x.ciclos_respiracao ?? 0)).toFixed(1),
      },
      pensamentos: {
        total: p.length,
        top_distorcoes: topCount(p.flatMap((x: any) => x.distorcoes ?? [])),
      },
      habitos_neg: {
        top_nomes: topCount(n.map((x: any) => x.habitos?.nome)),
        total_recaidas: n.length,
      },
    };
  }, [fissuras, urges, pensamentos, negLogs]);

  const [gerando, setGerando] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function analisar() {
    setGerando(true); setErro(null);
    try {
      const { data, error } = await supabase.functions.invoke("laboratorio-padroes", {
        body: {
          heroi_nome: heroi?.nome,
          inimigo_nome: inimigo?.nome,
          sonho: ob?.sonho,
          mentiras: inimigo?.mentiras,
          resumo,
        },
      });
      if (error) throw error;
      setInsights(data as Insights);
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao analisar padrões.");
    } finally {
      setGerando(false);
    }
  }

  const totalDados = (fissuras?.length ?? 0) + (urges?.length ?? 0) + (pensamentos?.length ?? 0);

  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ChevronLeft className="w-3 h-3" /> voltar
        </Link>

        <header className="rpg-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md grid place-items-center bg-primary/15 border border-primary/40 text-primary">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Laboratório</p>
              <h1 className="font-display text-lg tracking-widest">Padrões & Sabotagens</h1>
              <p className="text-[11px] text-muted-foreground">A IA cruza suas fissuras, pensamentos e recaídas pra mostrar o que se repete.</p>
            </div>
          </div>
        </header>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Fissuras" value={resumo.fissuras.total} sub={`${resumo.fissuras.resolvidas} resolvidas`} />
          <Metric
            label="Queda média"
            value={resumo.fissuras.intensidade_media_inicial && resumo.fissuras.intensidade_media_final
              ? `${(resumo.fissuras.intensidade_media_inicial - resumo.fissuras.intensidade_media_final).toFixed(1)}`
              : "—"}
            sub={`${resumo.fissuras.intensidade_media_inicial}→${resumo.fissuras.intensidade_media_final}`}
          />
          <Metric label="Ondas atravessadas" value={resumo.urge.atravessou} sub={`${resumo.urge.cedeu} cederam`} />
          <Metric label="Recaídas" value={resumo.habitos_neg.total_recaidas} sub={`${resumo.habitos_neg.top_nomes[0]?.nome ?? "—"}`} />
        </div>

        {/* Top emoções / tipos / distorções */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TopList title="Emoções gatilho" items={resumo.fissuras.top_emocoes} />
          <TopList title="Tipos de fissura" items={resumo.fissuras.top_tipos} />
          <TopList title="Distorções cognitivas" items={resumo.pensamentos.top_distorcoes} />
        </div>

        {/* Heatmap simples */}
        <div className="rpg-panel p-3.5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Fissuras por hora do dia</p>
          <Heatmap values={resumo.fissuras.por_hora} labels={Array.from({length:24}, (_,i)=>String(i).padStart(2,"0"))} />
        </div>
        <div className="rpg-panel p-3.5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Fissuras por dia da semana</p>
          <Heatmap values={resumo.fissuras.por_diasemana} labels={["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]} />
        </div>

        {/* Análise IA */}
        <div className="rpg-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Análise da IA</p>
              <h3 className="font-display tracking-widest text-sm">Ler os padrões</h3>
            </div>
            <button
              onClick={analisar}
              disabled={gerando || totalDados < 3}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold tracking-widest uppercase disabled:opacity-50 flex items-center gap-2"
            >
              {gerando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              {insights ? "Reanalisar" : "Analisar"}
            </button>
          </div>
          {totalDados < 3 && (
            <p className="text-[11px] text-muted-foreground">Registre pelo menos 3 fissuras/pensamentos/ondas pra ter uma leitura útil.</p>
          )}
          {erro && <p className="text-xs text-destructive">{erro}</p>}

          {insights && (
            <div className="space-y-3 pt-1">
              <p className="text-sm italic text-foreground/90">"{insights.leitura}"</p>

              {insights.insights?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Insights</p>
                  <ul className="space-y-1">
                    {insights.insights.map((i, k) => (
                      <li key={k} className="text-xs text-muted-foreground pl-3 border-l border-cyan-500/40">{i}</li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.sabotagens?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Armadilhas de sabotagem</p>
                  {insights.sabotagens.map((s, k) => (
                    <div key={k} className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5">
                      <p className="font-display text-xs tracking-widest text-destructive">{s.nome}</p>
                      <p className="text-[11px] text-muted-foreground mt-1"><span className="text-foreground/80">Evidência:</span> {s.evidencia}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5"><span className="text-foreground/80">Contra-jogada:</span> {s.contra_jogada}</p>
                    </div>
                  ))}
                </div>
              )}

              {insights.proxima_semana && (
                <div className="rounded-md border border-primary/40 bg-primary/5 p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1"><Target className="w-3 h-3" /> Experimento da próxima semana</p>
                  <p className="text-xs text-foreground/90 mt-1">{insights.proxima_semana}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Metric({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rpg-panel p-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="font-display text-xl tracking-widest text-primary">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}

function TopList({ title, items }: { title: string; items: { nome: string; n: number }[] }) {
  return (
    <div className="rpg-panel p-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1.5">{title}</p>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Sem dados ainda.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.nome} className="flex items-center justify-between text-xs">
              <span className="text-foreground/90 truncate">{i.nome}</span>
              <span className="text-primary font-mono">{i.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Heatmap({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0,1fr))`, gap: 3 }}>
      {values.map((v, i) => {
        const intensity = v / max;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm border border-primary/20"
              style={{
                aspectRatio: "1 / 1.4",
                background: v === 0 ? "hsl(var(--muted) / 0.15)" : `hsl(280 90% ${Math.max(20, 60 - intensity * 40)}% / ${0.3 + intensity * 0.7})`,
              }}
              title={`${labels[i]}: ${v}`}
            />
            <span className="text-[8px] text-muted-foreground">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}