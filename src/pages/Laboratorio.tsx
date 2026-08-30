import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FlaskConical, AlertTriangle, Lightbulb, Target, ChevronLeft, Brain, Heart, Zap, Ruler, Eye, GitBranch, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

type Conf = "forte" | "emergente" | "hipotese";
type Item = { nome?: string; descricao?: string; evidencia?: string; confianca?: Conf };
type Insights = {
  resumo?: string;
  estatisticas?: Record<string, string | number>;
  padroes_cognitivos?: Item[];
  padroes_emocionais?: Item[];
  gatilhos?: { situacao?: string; sequencia?: string[]; evidencia?: string; confianca?: Conf }[];
  sabotagens?: { nome?: string; evidencia?: string; confianca?: Conf; ciclo?: string[] }[];
  mapa?: { pensamento?: string; emocao?: string; comportamento?: string; consequencia?: string; repeticoes?: number }[];
  polarizacao?: { observacao?: string; evidencia?: string; confianca?: Conf } | null;
  distanciamento?: { observacao?: string; evidencia?: string; confianca?: Conf } | null;
  reatribuicao?: { observacao?: string; fatores?: string[]; evidencia?: string; confianca?: Conf } | null;
  hipoteses?: string[];
};

const CONF_META: Record<Conf, { label: string; dot: string; cls: string }> = {
  forte: { label: "Padrão forte", dot: "🟢", cls: "border-emerald-500/40 text-emerald-300 bg-emerald-500/5" },
  emergente: { label: "Padrão emergente", dot: "🟡", cls: "border-amber-500/40 text-amber-300 bg-amber-500/5" },
  hipotese: { label: "Hipótese", dot: "⚪", cls: "border-border text-muted-foreground bg-muted/10" },
};

function ConfBadge({ c }: { c?: Conf }) {
  const m = CONF_META[(c ?? "hipotese") as Conf] ?? CONF_META.hipotese;
  return <span className={`text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border ${m.cls}`}>{m.dot} {m.label}</span>;
}

export default function Laboratorio() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: pensamentos } = useQuery({
    queryKey: ["lab-pens", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("pensamentos").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(120);
      if (error) throw error;
      return data ?? [];
    },
  });
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

  const topCount = (arr: (string | null | undefined)[], k = 5) => {
    const c: Record<string, number> = {};
    arr.forEach((v) => { if (v) c[v] = (c[v] ?? 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, k).map(([nome, n]) => ({ nome, n }));
  };
  const media = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

  const resumo = useMemo(() => {
    const p: any[] = pensamentos ?? [];
    const f: any[] = fissuras ?? [];
    const u: any[] = urges ?? [];

    const emocoesFlat = p.flatMap((x) => (x.emocoes?.length ? x.emocoes : x.emocao ? [x.emocao] : []));
    const intensidadePorEmocao: Record<string, number[]> = {};
    p.forEach((x) => {
      const es = x.emocoes?.length ? x.emocoes : x.emocao ? [x.emocao] : [];
      es.forEach((e: string) => {
        (intensidadePorEmocao[e] ??= []).push(x.intensidade_emocao ?? 0);
      });
    });
    const emocaoMaisIntensa = Object.entries(intensidadePorEmocao)
      .map(([e, arr]) => ({ e, m: media(arr) }))
      .sort((a, b) => b.m - a.m)[0];

    const contValores = p.map((x) => x.continuum_valor).filter((v) => v != null) as number[];
    const extremos = contValores.filter((v) => v <= 10 || v >= 90).length;

    const comDistanciamento = p.filter((x) => x.distanciamento_texto || x.distanciamento_status);
    const observou = p.filter((x) => x.distanciamento_status === "observei").length;

    return {
      registros: {
        total: p.length,
        top_emocoes: topCount(emocoesFlat),
        emocao_maior_intensidade: emocaoMaisIntensa ? { nome: emocaoMaisIntensa.e, media: +emocaoMaisIntensa.m.toFixed(1) } : null,
        intensidade_media_inicial: +media(p.map((x) => x.intensidade_emocao ?? 0)).toFixed(1),
        intensidade_media_final: +media(p.filter((x) => x.intensidade_final != null).map((x) => x.intensidade_final)).toFixed(1),
        sem_alternativo: p.filter((x) => x.sem_alternativo).length,
        com_alternativo: p.filter((x) => x.pensamento_alternativo).length,
        continuum: {
          registros_com_valor: contValores.length,
          media: +media(contValores).toFixed(1),
          extremos_0_10_ou_90_100: extremos,
        },
        distanciamento: {
          registros: comDistanciamento.length,
          observou_como_pensamento: observou,
          ainda_envolvido: p.filter((x) => x.distanciamento_status === "envolvido").length,
        },
        comportamentos_frequentes: topCount(p.map((x) => x.comportamento)),
        consequencias_frequentes: topCount(p.map((x) => x.consequencia)),
      },
      fissuras: { total: f.length, resolvidas: f.filter((x) => x.resolvida).length, top_emocoes: topCount(f.map((x) => x.emocao)) },
      urge: { total: u.length, cedeu: u.filter((x) => x.cedeu === true).length, atravessou: u.filter((x) => x.cedeu === false).length },
    };
  }, [pensamentos, fissuras, urges]);

  const registrosPayload = useMemo(
    () =>
      (pensamentos ?? []).slice(0, 40).map((x: any) => ({
        data: x.created_at,
        situacao: x.situacao,
        pensamento_automatico: x.pensamento_automatico,
        emocoes: x.emocoes?.length ? x.emocoes : x.emocao ? [x.emocao] : [],
        intensidade: x.intensidade_emocao,
        intensidade_final: x.intensidade_final,
        evidencias_favor: x.evidencias_favor,
        evidencias_contra: x.evidencias_contra,
        pensamento_alternativo: x.sem_alternativo ? null : x.pensamento_alternativo,
        sem_alternativo: x.sem_alternativo,
        distanciamento: { texto: x.distanciamento_texto, status: x.distanciamento_status },
        continuum: { valor: x.continuum_valor, zero: x.continuum_zero, cem: x.continuum_cem, motivo: x.continuum_motivo },
        comportamento: x.comportamento,
        consequencia: x.consequencia,
      })),
    [pensamentos]
  );

  const [gerando, setGerando] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function analisar() {
    setGerando(true); setErro(null);
    try {
      const { data, error } = await supabase.functions.invoke("laboratorio-padroes", {
        body: { resumo, registros: registrosPayload },
      });
      if (error) throw error;
      setInsights(data as Insights);
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao analisar padrões.");
    } finally {
      setGerando(false);
    }
  }

  const total = resumo.registros.total;

  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-4 space-y-4 pb-10">
        <Link to="/mente" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
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
              <p className="text-[11px] text-muted-foreground">A IA cruza seus dados e mostra o que se repete.</p>
            </div>
          </div>
        </header>

        {/* Estatísticas calculadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Registros" value={total} sub={`${resumo.registros.com_alternativo} com alternativo`} />
          <Metric label="Emoção mais frequente" value={resumo.registros.top_emocoes[0]?.nome ?? "—"} sub={resumo.registros.top_emocoes[0] ? `${resumo.registros.top_emocoes[0].n}x` : ""} />
          <Metric
            label="Maior intensidade média"
            value={resumo.registros.emocao_maior_intensidade?.nome ?? "—"}
            sub={resumo.registros.emocao_maior_intensidade ? `${resumo.registros.emocao_maior_intensidade.media}/10` : ""}
          />
          <Metric
            label="Extremos no continuum"
            value={resumo.registros.continuum.extremos_0_10_ou_90_100}
            sub={`de ${resumo.registros.continuum.registros_com_valor} avaliações`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TopList title="Emoções nos registros" items={resumo.registros.top_emocoes} />
          <TopList title="Comportamentos" items={resumo.registros.comportamentos_frequentes} />
          <TopList title="Consequências" items={resumo.registros.consequencias_frequentes} />
        </div>

        {/* Análise IA */}
        <div className="rpg-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Análise da IA</p>
              <h3 className="font-display tracking-widest text-sm">Cruzar o histórico</h3>
            </div>
            <button
              onClick={analisar}
              disabled={gerando || total < 3}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold tracking-widest uppercase disabled:opacity-50 flex items-center gap-2"
            >
              {gerando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              {insights ? "Reanalisar" : "Analisar"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            A IA não corrige nem reescreve seus pensamentos. Ela só mostra o que se repete no seu histórico.
          </p>
          {total < 3 && <p className="text-[11px] text-muted-foreground">Faça pelo menos 3 registros na Mente para haver padrão a observar.</p>}
          {erro && <p className="text-xs text-destructive">{erro}</p>}
        </div>

        {insights && (
          <div className="space-y-3">
            {insights.resumo && (
              <div className="rpg-panel p-4">
                <p className="text-sm italic text-foreground/90">"{insights.resumo}"</p>
              </div>
            )}

            {insights.estatisticas && Object.keys(insights.estatisticas).length > 0 && (
              <div className="rpg-panel p-4 space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Leitura do histórico</p>
                {Object.entries(insights.estatisticas).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 text-xs border-b border-border/40 py-1 last:border-0">
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                    <span className="text-foreground/90 text-right">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}

            <Bloco icon={<Brain className="w-3 h-3" />} title="Padrões de pensamento" items={insights.padroes_cognitivos} color="text-primary" />
            <Bloco icon={<Heart className="w-3 h-3" />} title="Padrões emocionais" items={insights.padroes_emocionais} color="text-rose-300" />

            {!!insights.gatilhos?.length && (
              <div className="rpg-panel p-4 space-y-2">
                <p className={`text-[10px] uppercase tracking-[0.3em] text-amber-300 flex items-center gap-1`}><Zap className="w-3 h-3" /> Gatilhos recorrentes</p>
                {insights.gatilhos.map((g, i) => (
                  <div key={i} className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-foreground/90">{g.situacao}</p>
                      <ConfBadge c={g.confianca} />
                    </div>
                    {!!g.sequencia?.length && <Fluxo passos={g.sequencia} />}
                    {g.evidencia && <p className="text-[11px] text-muted-foreground">{g.evidencia}</p>}
                  </div>
                ))}
              </div>
            )}

            {!!insights.sabotagens?.length && (
              <div className="rpg-panel p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Sabotagens (padrões comportamentais)</p>
                {insights.sabotagens.map((s, i) => (
                  <div key={i} className="rounded-md border border-destructive/40 bg-destructive/5 p-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-xs tracking-widest text-destructive">{s.nome}</p>
                      <ConfBadge c={s.confianca} />
                    </div>
                    {!!s.ciclo?.length && <Fluxo passos={s.ciclo} />}
                    {s.evidencia && <p className="text-[11px] text-muted-foreground">{s.evidencia}</p>}
                  </div>
                ))}
              </div>
            )}

            {!!insights.mapa?.length && (
              <div className="rpg-panel p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300 flex items-center gap-1"><GitBranch className="w-3 h-3" /> Pensamento → Emoção → Comportamento</p>
                {insights.mapa.map((m, i) => (
                  <div key={i} className="rounded-md border border-cyan-500/30 bg-cyan-500/5 p-2.5 space-y-1">
                    <Fluxo passos={[m.pensamento, m.emocao, m.comportamento, m.consequencia].filter(Boolean) as string[]} />
                    {!!m.repeticoes && <p className="text-[10px] text-muted-foreground">aparece {m.repeticoes}x nos registros</p>}
                  </div>
                ))}
              </div>
            )}

            {insights.polarizacao?.observacao && (
              <Observacao icon={<Ruler className="w-3 h-3" />} title="Continuum — polarização" o={insights.polarizacao} />
            )}
            {insights.distanciamento?.observacao && (
              <Observacao icon={<Eye className="w-3 h-3" />} title="Distanciamento ao longo do tempo" o={insights.distanciamento} />
            )}
            {insights.reatribuicao?.observacao && (
              <div className="rpg-panel p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Padrão de atribuição</p>
                  <ConfBadge c={insights.reatribuicao.confianca} />
                </div>
                <p className="text-xs text-foreground/90">{insights.reatribuicao.observacao}</p>
                {!!insights.reatribuicao.fatores?.length && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {insights.reatribuicao.fatores.map((f, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground">{f}</span>
                    ))}
                  </div>
                )}
                {insights.reatribuicao.evidencia && <p className="text-[11px] text-muted-foreground">{insights.reatribuicao.evidencia}</p>}
              </div>
            )}

            {!!insights.hipoteses?.length && (
              <div className="rpg-panel p-4 space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Hipóteses para investigar</p>
                <ul className="space-y-1">
                  {insights.hipoteses.map((h, i) => (
                    <li key={i} className="text-xs text-muted-foreground pl-3 border-l border-border">{h}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center px-6">
              O Laboratório mostra o que se repete. Quem observa, questiona e decide continua sendo você.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Bloco({ icon, title, items, color }: { icon: React.ReactNode; title: string; items?: Item[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="rpg-panel p-4 space-y-2">
      <p className={`text-[10px] uppercase tracking-[0.3em] ${color} flex items-center gap-1`}>{icon} {title}</p>
      {items.map((it, i) => (
        <div key={i} className="rounded-md border border-border/60 bg-background/30 p-2.5 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-display tracking-widest text-foreground/90">{it.nome}</p>
            <ConfBadge c={it.confianca} />
          </div>
          {it.descricao && <p className="text-[11px] text-muted-foreground">{it.descricao}</p>}
          {it.evidencia && <p className="text-[11px] text-foreground/70">{it.evidencia}</p>}
        </div>
      ))}
    </div>
  );
}

function Observacao({ icon, title, o }: { icon: React.ReactNode; title: string; o: { observacao?: string; evidencia?: string; confianca?: Conf } }) {
  return (
    <div className="rpg-panel p-4 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-1">{icon} {title}</p>
        <ConfBadge c={o.confianca} />
      </div>
      <p className="text-xs text-foreground/90">{o.observacao}</p>
      {o.evidencia && <p className="text-[11px] text-muted-foreground">{o.evidencia}</p>}
    </div>
  );
}

function Fluxo({ passos }: { passos: string[] }) {
  return (
    <div className="space-y-0.5">
      {passos.map((p, i) => (
        <div key={i} className="text-[11px] text-foreground/85">
          <span className="text-muted-foreground mr-1">{i === 0 ? "•" : "↓"}</span>
          {p}
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rpg-panel p-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="font-display text-lg tracking-widest text-primary truncate">{value}</p>
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
