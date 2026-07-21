import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Shell from "@/components/Shell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchInimigoAtivo, fetchOnboarding } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Flame,
  Heart, Loader2, Sparkles, Target, Waves, Wind, Brain, Anchor, Activity,
} from "lucide-react";

type Passo = {
  titulo: string;
  tecnica: string;
  descricao: string;
  duracao_min: number;
};

type Protocolo = {
  tipo: string;
  resumo: string;
  protocolo: Passo[];
  missao_imediata: string;
};

const EMOCOES = [
  "Ansiedade", "Tédio", "Solidão", "Raiva", "Tristeza",
  "Medo", "Frustração", "Vazio", "Culpa", "Excitação",
];

const TECNICA_ICON: Record<string, JSX.Element> = {
  respiracao: <Wind className="w-4 h-4" />,
  mindfulness: <Waves className="w-4 h-4" />,
  reestruturacao: <Brain className="w-4 h-4" />,
  defusao: <Brain className="w-4 h-4" />,
  urge_surfing: <Waves className="w-4 h-4" />,
  acao_minima: <Target className="w-4 h-4" />,
  questionamento_socratico: <Brain className="w-4 h-4" />,
  exposicao: <Activity className="w-4 h-4" />,
  aterramento: <Anchor className="w-4 h-4" />,
  movimento: <Activity className="w-4 h-4" />,
  estoicismo: <Sparkles className="w-4 h-4" />,
  visualizacao: <Sparkles className="w-4 h-4" />,
};

export default function Fissura() {
  const { user } = useAuth();
  const nav = useNavigate();
  const uid = user?.id;

  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: ob } = useQuery({ queryKey: ["ob", uid], queryFn: () => fetchOnboarding(uid!), enabled: !!uid });

  const [stage, setStage] = useState<"form" | "loading" | "protocolo" | "final">("form");
  const [intensidade, setIntensidade] = useState(6);
  const [emocao, setEmocao] = useState<string>("");
  const [contexto, setContexto] = useState("");
  const [desejo, setDesejo] = useState("");
  const [duracao, setDuracao] = useState("");

  const [protocolo, setProtocolo] = useState<Protocolo | null>(null);
  const [passoIdx, setPassoIdx] = useState(0);
  const [feitos, setFeitos] = useState<Set<number>>(new Set());
  const [fissuraId, setFissuraId] = useState<string | null>(null);
  const [intensidadeFinal, setIntensidadeFinal] = useState(3);
  const [missaoFeita, setMissaoFeita] = useState(false);
  const inicioRef = useRef<number>(Date.now());

  const iniciar = async () => {
    if (!uid) return;
    if (!emocao) { toast.error("Escolha uma emoção."); return; }
    setStage("loading");
    inicioRef.current = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("protocolo-fissura", {
        body: {
          intensidade, emocao, contexto, desejo, duracao,
          heroi_nome: heroi?.nome,
          inimigo_nome: inimigo?.nome,
          sonho: (ob as any)?.sonho ?? null,
          mentiras: inimigo?.mentiras ?? [],
        },
      });
      if (error) throw error;
      const p = data as Protocolo;
      if (!p?.protocolo?.length) throw new Error("Protocolo vazio.");
      setProtocolo(p);

      const { data: inserted, error: e2 } = await supabase.from("fissuras").insert({
        user_id: uid,
        intensidade_inicial: intensidade,
        emocao, contexto, desejo, duracao_relatada: duracao,
        tipo_detectado: p.tipo,
        protocolo: p as any,
        missao_imediata: p.missao_imediata,
      }).select("id").maybeSingle();
      if (e2) throw e2;
      setFissuraId(inserted?.id ?? null);

      setStage("protocolo");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao gerar protocolo");
      setStage("form");
    }
  };

  const marcarPasso = (i: number) => {
    setFeitos(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const irFinal = () => setStage("final");

  const salvarFinal = async (resolvida: boolean) => {
    if (!fissuraId) { nav("/"); return; }
    const tecnicas = (protocolo?.protocolo ?? [])
      .filter((_, i) => feitos.has(i))
      .map(p => p.tecnica);
    await supabase.from("fissuras").update({
      finalizado_em: new Date().toISOString(),
      intensidade_final: intensidadeFinal,
      resolvida,
      missao_concluida: missaoFeita,
      tecnicas_usadas: tecnicas,
    }).eq("id", fissuraId);
    toast.success(resolvida ? "Fissura superada." : "Registro salvo.");
    nav("/");
  };

  return (
    <Shell>
      <div className="space-y-5 max-w-2xl mx-auto">
        <button
          onClick={() => nav(-1)}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> voltar
        </button>

        <header className="rpg-panel p-4 sm:p-5 flex items-center gap-3 border-destructive/40">
          <div className="w-10 h-10 rounded-md grid place-items-center bg-destructive/15 border border-destructive/40 text-destructive">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-destructive">Protocolo de Fissura</p>
            <h1 className="font-display text-lg sm:text-xl tracking-widest">Estou em Fissura</h1>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {stage === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="rpg-panel p-4 sm:p-5 space-y-5"
            >
              <Field label={`Intensidade — ${intensidade}/10`}>
                <input
                  type="range" min={1} max={10} value={intensidade}
                  onChange={e => setIntensidade(Number(e.target.value))}
                  className="w-full accent-destructive"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>leve</span><span>insuportável</span>
                </div>
              </Field>

              <Field label="Emoção predominante">
                <div className="flex flex-wrap gap-1.5">
                  {EMOCOES.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmocao(e)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition ${
                        emocao === e
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="O que aconteceu?">
                <textarea
                  rows={2}
                  value={contexto}
                  onChange={e => setContexto(e.target.value)}
                  placeholder="Uma frase basta."
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                />
              </Field>

              <Field label="O que você quer fazer agora?">
                <input
                  value={desejo}
                  onChange={e => setDesejo(e.target.value)}
                  placeholder="Ex: rolar o feed, comer doce, fugir da tarefa..."
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Há quanto tempo essa fissura dura?">
                <div className="flex flex-wrap gap-1.5">
                  {["<5min", "15min", "30min", "1h", ">1h"].map(t => (
                    <button
                      key={t}
                      onClick={() => setDuracao(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border ${
                        duracao === t
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>

              <button
                onClick={iniciar}
                className="w-full btn-pixel py-2.5 rounded-md text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Gerar protocolo
              </button>
            </motion.div>
          )}

          {stage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rpg-panel p-8 flex flex-col items-center gap-3 text-center"
            >
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Montando um protocolo pra você agora…</p>
            </motion.div>
          )}

          {stage === "protocolo" && protocolo && (
            <motion.div
              key="proto"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="rpg-panel p-4 space-y-1 border-primary/40">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Tipo detectado: {protocolo.tipo}
                </p>
                <p className="text-sm text-foreground/90">{protocolo.resumo}</p>
              </div>

              <ol className="space-y-2">
                {protocolo.protocolo.map((p, i) => {
                  const feito = feitos.has(i);
                  const ativo = i === passoIdx;
                  return (
                    <li
                      key={i}
                      className={`rpg-panel p-3 sm:p-4 transition ${
                        ativo ? "border-primary/60 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : ""
                      } ${feito ? "opacity-70" : ""}`}
                    >
                      <button
                        onClick={() => setPassoIdx(i)}
                        className="w-full text-left flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-md grid place-items-center bg-primary/10 border border-primary/30 text-primary shrink-0">
                          {TECNICA_ICON[p.tecnica] ?? <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                              Passo {i + 1}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {p.duracao_min}min
                            </span>
                            <span className="text-[10px] text-primary/80">{p.tecnica.replace(/_/g, " ")}</span>
                          </div>
                          <h3 className="font-display text-sm tracking-wider mt-0.5">{p.titulo}</h3>
                          {ativo && (
                            <p className="text-xs text-foreground/85 mt-2 leading-relaxed whitespace-pre-line">
                              {p.descricao}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); marcarPasso(i); }}
                          className={`shrink-0 p-1.5 rounded-md border ${
                            feito
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                          title={feito ? "Feito" : "Marcar como feito"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="rpg-panel p-4 border-primary/40 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1">
                  <Target className="w-3 h-3" /> Missão imediata (≤ 2min)
                </p>
                <p className="text-sm text-foreground/95">{protocolo.missao_imediata}</p>
                <label className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <input
                    type="checkbox"
                    checked={missaoFeita}
                    onChange={e => setMissaoFeita(e.target.checked)}
                    className="accent-primary"
                  />
                  Feito
                </label>
              </div>

              <button
                onClick={irFinal}
                className="w-full btn-pixel py-2.5 rounded-md text-sm flex items-center justify-center gap-2"
              >
                Concluir <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {stage === "final" && (
            <motion.div
              key="final"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rpg-panel p-4 sm:p-5 space-y-5"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Intensidade agora</p>
                <p className="font-display text-2xl">{intensidadeFinal}/10</p>
                <input
                  type="range" min={0} max={10} value={intensidadeFinal}
                  onChange={e => setIntensidadeFinal(Number(e.target.value))}
                  className="w-full accent-primary mt-1"
                />
                <p className="text-[10px] text-muted-foreground">
                  Começou em {intensidade}/10 · {Math.round((Date.now() - inicioRef.current) / 60000)}min atrás
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => salvarFinal(true)}
                  className="btn-pixel py-2.5 rounded-md text-sm flex items-center justify-center gap-1"
                >
                  <Heart className="w-4 h-4" /> Superei
                </button>
                <button
                  onClick={() => salvarFinal(false)}
                  className="py-2.5 rounded-md text-sm border border-border hover:border-primary/60 text-muted-foreground hover:text-foreground"
                >
                  Ainda lidando
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}