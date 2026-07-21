import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Shell from "@/components/Shell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchInimigoAtivo, fetchOnboarding } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Brain, Loader2, Lightbulb, Scale, Sparkles, CheckCircle2,
} from "lucide-react";

type Analise = {
  distorcoes: string[];
  resumo_distorcao: string;
  pensamento_alternativo: string;
  perguntas_socraticas: string[];
  proximo_passo: string;
};

const EMOCOES = [
  "Ansiedade", "Tristeza", "Raiva", "Vergonha", "Medo",
  "Culpa", "Frustração", "Solidão", "Inveja", "Vazio",
];

const DISTORCAO_LABEL: Record<string, string> = {
  catastrofizacao: "Catastrofização",
  tudo_ou_nada: "Tudo ou nada",
  leitura_mental: "Leitura mental",
  adivinhacao: "Adivinhação",
  personalizacao: "Personalização",
  filtro_mental: "Filtro mental",
  desqualificar_positivo: "Desqualificar o positivo",
  rotulacao: "Rotulação",
  raciocinio_emocional: "Raciocínio emocional",
  deveria: "Deveria/Tinha que",
  minimizacao: "Minimização",
  magnificacao: "Magnificação",
  culpa: "Culpa desproporcional",
  comparacao_injusta: "Comparação injusta",
};

export default function Reestruturacao() {
  const { user } = useAuth();
  const nav = useNavigate();
  const uid = user?.id;

  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: ob } = useQuery({ queryKey: ["ob", uid], queryFn: () => fetchOnboarding(uid!), enabled: !!uid });

  const [stage, setStage] = useState<"form" | "loading" | "analise">("form");
  const [situacao, setSituacao] = useState("");
  const [pensamento, setPensamento] = useState("");
  const [emocao, setEmocao] = useState("");
  const [intensidade, setIntensidade] = useState(6);
  const [favor, setFavor] = useState("");
  const [contra, setContra] = useState("");
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [intensidadeFinal, setIntensidadeFinal] = useState(3);
  const [salvando, setSalvando] = useState(false);

  const analisar = async () => {
    if (!uid) return;
    if (!situacao.trim() || !pensamento.trim()) {
      toast.error("Descreva a situação e o pensamento.");
      return;
    }
    setStage("loading");
    try {
      const { data, error } = await supabase.functions.invoke("reestruturacao-cognitiva", {
        body: {
          situacao,
          pensamento_automatico: pensamento,
          emocao,
          intensidade_emocao: intensidade,
          evidencias_favor: favor,
          evidencias_contra: contra,
          heroi_nome: heroi?.nome,
          inimigo_nome: inimigo?.nome,
          sonho: (ob as any)?.sonhos ?? null,
          mentiras: inimigo?.mentiras ?? [],
        },
      });
      if (error) throw error;
      setAnalise(data as Analise);
      setIntensidadeFinal(Math.max(1, intensidade - 2));
      setStage("analise");
    } catch (e: any) {
      toast.error("Não consegui analisar agora. Tenta de novo.");
      setStage("form");
    }
  };

  const salvar = async () => {
    if (!uid || !analise) return;
    setSalvando(true);
    const { error } = await supabase.from("pensamentos").insert({
      user_id: uid,
      situacao,
      pensamento_automatico: pensamento,
      emocao,
      intensidade_emocao: intensidade,
      distorcoes: analise.distorcoes,
      evidencias_favor: favor,
      evidencias_contra: contra,
      pensamento_alternativo: analise.pensamento_alternativo,
      intensidade_final: intensidadeFinal,
      ai_analise: analise as any,
    });
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Reestruturação registrada.");
    nav("/");
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto space-y-4 pb-8">
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        <div className="rpg-panel p-4 sm:p-5 border-primary/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md grid place-items-center bg-primary/15 border border-primary/40 text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Reestruturação Cognitiva</p>
              <h1 className="font-display text-lg sm:text-xl tracking-widest">Desmontar o pensamento</h1>
              <p className="text-xs text-muted-foreground">Nem toda coisa que a sua cabeça fala é verdade.</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {stage === "form" && (
            <motion.section key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rpg-panel p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Situação (o que aconteceu)</label>
                <textarea
                  value={situacao} onChange={(e) => setSituacao(e.target.value)}
                  rows={2} maxLength={400}
                  className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60"
                  placeholder="Ex.: mensagem não respondida, feedback no trabalho, olhar do espelho..."
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Pensamento automático</label>
                <textarea
                  value={pensamento} onChange={(e) => setPensamento(e.target.value)}
                  rows={2} maxLength={400}
                  className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60"
                  placeholder="Ex.: 'ninguém me suporta', 'nunca vou conseguir', 'sou um fracasso'..."
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Emoção</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {EMOCOES.map((e) => (
                    <button key={e} onClick={() => setEmocao(e)}
                      className={`text-[11px] px-2.5 py-1 rounded border transition ${
                        emocao === e ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      }`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  Intensidade da emoção: <span className="text-primary">{intensidade}/10</span>
                </label>
                <input type="range" min={1} max={10} value={intensidade} onChange={(e) => setIntensidade(+e.target.value)}
                  className="w-full accent-primary mt-1.5" />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Evidências a favor</label>
                  <textarea
                    value={favor} onChange={(e) => setFavor(e.target.value)}
                    rows={2} maxLength={300}
                    className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60"
                    placeholder="O que sustenta esse pensamento?"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Evidências contra</label>
                  <textarea
                    value={contra} onChange={(e) => setContra(e.target.value)}
                    rows={2} maxLength={300}
                    className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60"
                    placeholder="O que fura esse pensamento?"
                  />
                </div>
              </div>

              <button onClick={analisar} className="w-full rpg-panel p-3 border-primary/60 hover:border-primary bg-primary/10 hover:bg-primary/15 transition font-display tracking-widest text-sm flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Analisar com o mentor
              </button>
            </motion.section>
          )}

          {stage === "loading" && (
            <motion.section key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="font-display tracking-widest text-sm">Investigando o pensamento…</p>
            </motion.section>
          )}

          {stage === "analise" && analise && (
            <motion.section key="analise" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rpg-panel p-4 border-yellow-500/40">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-yellow-400" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-yellow-300">Padrão detectado</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {analise.distorcoes.map((d) => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-200">
                      {DISTORCAO_LABEL[d] ?? d}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-foreground/90">{analise.resumo_distorcao}</p>
              </div>

              <div className="rpg-panel p-4 border-primary/50 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Pensamento alternativo</p>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{analise.pensamento_alternativo}</p>
              </div>

              <div className="rpg-panel p-4">
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Perguntas para levar</p>
                <ul className="space-y-1.5">
                  {analise.perguntas_socraticas.map((q, i) => (
                    <li key={i} className="text-sm text-foreground/85 flex gap-2">
                      <span className="text-primary">›</span> {q}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rpg-panel p-4 border-green-500/40">
                <p className="text-[10px] uppercase tracking-[0.3em] text-green-300 mb-1">Próximo passo (≤ 2min)</p>
                <p className="text-sm text-foreground/90">{analise.proximo_passo}</p>
              </div>

              <div className="rpg-panel p-4 space-y-2">
                <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  Intensidade agora: <span className="text-primary">{intensidadeFinal}/10</span>
                </label>
                <input type="range" min={0} max={10} value={intensidadeFinal} onChange={(e) => setIntensidadeFinal(+e.target.value)}
                  className="w-full accent-primary" />
                <button onClick={salvar} disabled={salvando}
                  className="w-full rpg-panel p-3 border-primary/60 hover:border-primary bg-primary/10 hover:bg-primary/15 transition font-display tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                  Registrar e voltar
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}