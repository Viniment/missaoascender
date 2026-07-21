import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchInimigoAtivo, fetchOnboarding } from "@/lib/api";
import { Loader2, Radar, Shield, ChevronLeft, Zap, AlertTriangle, Target, Clock } from "lucide-react";
import { Link } from "react-router-dom";

type Predicao = {
  risco_nivel: "baixo" | "medio" | "alto";
  risco_score: number;
  janela: string;
  leitura: string;
  tecnica_recomendada: { nome: string; motivo: string };
  blindagem: string[];
  gatilho_provavel: string;
};

export default function PredicaoPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: ob } = useQuery({ queryKey: ["ob", uid], queryFn: () => fetchOnboarding(uid!), enabled: !!uid });

  const { data: fissuras } = useQuery({
    queryKey: ["pred-fissuras", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("fissuras").select("*").eq("user_id", uid!).order("criado_em", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: urges } = useQuery({
    queryKey: ["pred-urges", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("urge_surfs").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: pensamentos } = useQuery({
    queryKey: ["pred-pens", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("pensamentos").select("*").eq("user_id", uid!).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const resumo = useMemo(() => {
    const f = fissuras ?? [];
    const u = urges ?? [];
    const p = pensamentos ?? [];

    const media = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

    // janelas de risco (top 3 horas + top 2 dias)
    const porHora = new Array(24).fill(0);
    const porDia = new Array(7).fill(0);
    f.forEach((x: any) => {
      const d = new Date(x.criado_em);
      porHora[d.getHours()] += 1;
      porDia[d.getDay()] += 1;
    });
    const topHoras = porHora
      .map((n, h) => ({ h, n }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 3);
    const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const topDias = porDia
      .map((n, d) => ({ d: dias[d], n }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 2);

    // eficácia por técnica
    const fissurasResolvidas = f.filter((x: any) => x.finalizado_em && x.intensidade_final != null);
    const quedaFissura = media(fissurasResolvidas.map((x: any) => (x.intensidade_inicial ?? 0) - (x.intensidade_final ?? 0)));

    const pensResolvidos = p.filter((x: any) => x.intensidade_depois != null && x.intensidade_antes != null);
    const quedaTCC = media(pensResolvidos.map((x: any) => (x.intensidade_antes ?? 0) - (x.intensidade_depois ?? 0)));

    const urgeTravessia = u.filter((x: any) => x.cedeu === false).length;
    const urgeTotal = u.length;
    const taxaUrge = urgeTotal ? urgeTravessia / urgeTotal : 0;

    const tecnicas_eficacia = [
      { nome: "Protocolo de Fissura", usos: fissurasResolvidas.length, queda_media_intensidade: +quedaFissura.toFixed(1), taxa_sucesso: fissurasResolvidas.length ? +(f.filter((x: any) => x.resolvida).length / f.length).toFixed(2) : 0 },
      { nome: "Reestruturação", usos: pensResolvidos.length, queda_media_intensidade: +quedaTCC.toFixed(1), taxa_sucesso: null },
      { nome: "Urge Surfing", usos: urgeTotal, queda_media_intensidade: null, taxa_sucesso: +taxaUrge.toFixed(2) },
    ];

    // contexto atual
    const agora = new Date();
    const ultima = f[0]?.criado_em ? (Date.now() - new Date(f[0].criado_em).getTime()) / 3_600_000 : null;
    const ultimaUrgeCedeu = u.find((x: any) => x.cedeu === true);
    const horasSemCeder = ultimaUrgeCedeu ? (Date.now() - new Date(ultimaUrgeCedeu.created_at).getTime()) / 3_600_000 : null;

    const topEmocoes: Record<string, number> = {};
    f.forEach((x: any) => { if (x.emocao) topEmocoes[x.emocao] = (topEmocoes[x.emocao] ?? 0) + 1; });

    return {
      janelas_risco: {
        top_horas: topHoras,
        top_dias: topDias,
      },
      tecnicas_eficacia,
      contexto_atual: {
        hora: agora.getHours(),
        dia_semana: dias[agora.getDay()],
        horas_desde_ultima_fissura: ultima != null ? +ultima.toFixed(1) : null,
        horas_sem_ceder: horasSemCeder != null ? +horasSemCeder.toFixed(1) : null,
        top_emocoes: Object.entries(topEmocoes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([nome, n]) => ({ nome, n })),
      },
      totais: { fissuras: f.length, urges: u.length, pensamentos: p.length },
    };
  }, [fissuras, urges, pensamentos]);

  // score heurístico local (mostra algo mesmo antes da IA)
  const riscoLocal = useMemo(() => {
    const agora = new Date();
    const hora = agora.getHours();
    const dia = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][agora.getDay()];
    const horaMatch = resumo.janelas_risco.top_horas.find((x) => Math.abs(x.h - hora) <= 1);
    const diaMatch = resumo.janelas_risco.top_dias.find((x) => x.d === dia);
    let s = 0;
    if (horaMatch) s += Math.min(50, horaMatch.n * 8);
    if (diaMatch) s += Math.min(30, diaMatch.n * 4);
    if ((resumo.contexto_atual.horas_desde_ultima_fissura ?? 999) < 6) s += 20;
    return Math.min(100, s);
  }, [resumo]);

  const [gerando, setGerando] = useState(false);
  const [pred, setPred] = useState<Predicao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const totalDados = resumo.totais.fissuras + resumo.totais.urges + resumo.totais.pensamentos;

  async function prever() {
    setGerando(true); setErro(null);
    try {
      const { data, error } = await supabase.functions.invoke("predicao-risco", {
        body: {
          heroi_nome: heroi?.nome,
          inimigo_nome: inimigo?.nome,
          sonho: ob?.sonho,
          resumo,
        },
      });
      if (error) throw error;
      setPred(data as Predicao);
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao gerar previsão.");
    } finally {
      setGerando(false);
    }
  }

  useEffect(() => {
    if (totalDados >= 3 && !pred && !gerando) prever();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDados]);

  const nivel = pred?.risco_nivel ?? (riscoLocal >= 60 ? "alto" : riscoLocal >= 30 ? "medio" : "baixo");
  const score = pred?.risco_score ?? riscoLocal;

  const cor = nivel === "alto" ? "destructive" : nivel === "medio" ? "amber" : "emerald";
  const corHex = nivel === "alto" ? "#ef4444" : nivel === "medio" ? "#f59e0b" : "#10b981";

  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          <ChevronLeft className="w-3 h-3" /> voltar
        </Link>

        <header className="rpg-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md grid place-items-center bg-primary/15 border border-primary/40 text-primary">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Radar Preditivo</p>
              <h1 className="font-display text-lg tracking-widest">Próxima Onda</h1>
              <p className="text-[11px] text-muted-foreground">A IA aprende com você e antecipa a próxima fissura antes dela chegar.</p>
            </div>
          </div>
        </header>

        {/* Score ring */}
        <div className="rpg-panel p-4 flex items-center gap-4">
          <RiskRing score={score} color={corHex} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: corHex }}>Risco {nivel}</p>
            <p className="font-display text-lg tracking-widest" style={{ color: corHex }}>
              {nivel === "alto" ? "Blindagem agora" : nivel === "medio" ? "Atenção" : "Zona calma"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {pred?.janela ? <><Clock className="inline w-3 h-3 mr-1" />{pred.janela}</> : "Janela sendo calculada..."}
            </p>
          </div>
        </div>

        {totalDados < 3 && (
          <div className="rpg-panel p-4 text-xs text-muted-foreground">
            Registre pelo menos 3 fissuras/pensamentos/ondas pra o radar aprender seu padrão.
          </div>
        )}

        {erro && <div className="rpg-panel p-3 text-xs text-destructive">{erro}</div>}

        {/* IA leitura */}
        {pred && (
          <>
            <div className="rpg-panel p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Leitura da IA</p>
              <p className="text-sm italic text-foreground/90">"{pred.leitura}"</p>
              {pred.gatilho_provavel && (
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-muted-foreground"><span className="text-foreground/80">Gatilho provável:</span> {pred.gatilho_provavel}</p>
                </div>
              )}
            </div>

            {/* Técnica recomendada */}
            <div className="rpg-panel p-4 border-primary/40 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1">
                <Zap className="w-3 h-3" /> Técnica com melhor efeito pra você
              </p>
              <p className="font-display text-base tracking-widest">{pred.tecnica_recomendada.nome}</p>
              <p className="text-[11px] text-muted-foreground">{pred.tecnica_recomendada.motivo}</p>
              <div className="flex gap-2 pt-1 flex-wrap">
                <Link to="/fissura" className="text-[11px] px-2.5 py-1 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10">Fissura</Link>
                <Link to="/reestruturacao" className="text-[11px] px-2.5 py-1 rounded-md border border-primary/40 text-primary hover:bg-primary/10">Reestruturar</Link>
                <Link to="/urge-surfing" className="text-[11px] px-2.5 py-1 rounded-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10">Surfar</Link>
              </div>
            </div>

            {/* Blindagem */}
            {pred.blindagem?.length > 0 && (
              <div className="rpg-panel p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Blindagem preventiva
                </p>
                <ul className="space-y-1.5">
                  {pred.blindagem.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Target className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-foreground/90">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* janelas + eficácia (transparência dos dados) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rpg-panel p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Janelas de risco</p>
            {resumo.janelas_risco.top_horas.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <ul className="space-y-1 text-xs">
                {resumo.janelas_risco.top_horas.map((h) => (
                  <li key={h.h} className="flex justify-between"><span>{String(h.h).padStart(2, "0")}h</span><span className="text-primary font-mono">{h.n}×</span></li>
                ))}
                {resumo.janelas_risco.top_dias.map((d) => (
                  <li key={d.d} className="flex justify-between"><span>{d.d}</span><span className="text-primary font-mono">{d.n}×</span></li>
                ))}
              </ul>
            )}
          </div>
          <div className="rpg-panel p-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Eficácia das técnicas</p>
            <ul className="space-y-1 text-xs">
              {resumo.tecnicas_eficacia.map((t) => (
                <li key={t.nome} className="flex justify-between gap-2">
                  <span className="truncate">{t.nome}</span>
                  <span className="text-primary font-mono text-[11px]">
                    {t.queda_media_intensidade != null ? `−${t.queda_media_intensidade}` : t.taxa_sucesso != null ? `${Math.round((t.taxa_sucesso ?? 0) * 100)}%` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={prever}
          disabled={gerando || totalDados < 3}
          className="w-full px-3 py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {gerando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Radar className="w-3 h-3" />}
          {pred ? "Recalcular previsão" : "Gerar previsão"}
        </button>
      </div>
    </Shell>
  );
}

function RiskRing({ score, color }: { score: number; color: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="hsl(var(--muted) / 0.3)" strokeWidth="6" fill="none" />
        <circle
          cx="40" cy="40" r={r}
          stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 800ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-xl tracking-widest" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}