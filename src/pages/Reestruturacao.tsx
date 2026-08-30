import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "@/components/Shell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Brain, Loader2, CheckCircle2, Eye, Ruler, Info,
} from "lucide-react";

const EMOCOES = [
  "Ansiedade", "Tristeza", "Raiva", "Vergonha", "Medo",
  "Culpa", "Frustração", "Solidão", "Inveja", "Vazio", "Outra",
];

export default function Reestruturacao() {
  const { user } = useAuth();
  const nav = useNavigate();
  const uid = user?.id;

  const [situacao, setSituacao] = useState("");
  const [pensamento, setPensamento] = useState("");
  const [emocoes, setEmocoes] = useState<string[]>([]);
  const [intensidade, setIntensidade] = useState(6);
  const [favor, setFavor] = useState("");
  const [contra, setContra] = useState("");

  const [distTexto, setDistTexto] = useState("");
  const [distStatus, setDistStatus] = useState<string | null>(null);

  const [contValor, setContValor] = useState(50);
  const [contZero, setContZero] = useState("");
  const [contCem, setContCem] = useState("");
  const [contMotivo, setContMotivo] = useState("");
  const [mostrarExemplo, setMostrarExemplo] = useState(false);

  const [alternativo, setAlternativo] = useState("");
  const [semAlternativo, setSemAlternativo] = useState(false);

  const [comportamento, setComportamento] = useState("");
  const [consequencia, setConsequencia] = useState("");
  const [intensidadeFinal, setIntensidadeFinal] = useState(5);
  const [salvando, setSalvando] = useState(false);

  const toggleEmocao = (e: string) =>
    setEmocoes((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  const salvar = async () => {
    if (!uid) return;
    if (!situacao.trim() || !pensamento.trim()) {
      toast.error("Descreva a situação e o pensamento automático.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("pensamentos").insert({
      user_id: uid,
      situacao,
      pensamento_automatico: pensamento,
      emocao: emocoes[0] ?? null,
      emocoes,
      intensidade_emocao: intensidade,
      evidencias_favor: favor,
      evidencias_contra: contra,
      pensamento_alternativo: semAlternativo ? null : alternativo,
      sem_alternativo: semAlternativo,
      distanciamento_texto: distTexto || null,
      distanciamento_status: distStatus,
      continuum_valor: contValor,
      continuum_zero: contZero || null,
      continuum_cem: contCem || null,
      continuum_motivo: contMotivo || null,
      comportamento: comportamento || null,
      consequencia: consequencia || null,
      intensidade_final: intensidadeFinal,
    } as any);
    setSalvando(false);
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Registro salvo. Ele vai alimentar o Laboratório.");
    nav("/mente");
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto space-y-4 pb-10">
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        <div className="rpg-panel p-4 sm:p-5 border-primary/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md grid place-items-center bg-primary/15 border border-primary/40 text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Registro de pensamento</p>
              <h1 className="font-display text-lg sm:text-xl tracking-widest">Auto-observação</h1>
              <p className="text-xs text-muted-foreground">Aqui não há análise automática. Você observa, você interpreta.</p>
            </div>
          </div>
        </div>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rpg-panel p-4 sm:p-5 space-y-4">
          <Campo label="Situação — o que aconteceu?" hint="Descreva o que aconteceu da forma mais objetiva possível.">
            <textarea value={situacao} onChange={(e) => setSituacao(e.target.value)} rows={2} maxLength={500}
              className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60"
              placeholder="Ex.: recebi um feedback no trabalho." />
          </Campo>

          <Campo label="Pensamento automático" hint="O que passou pela sua cabeça naquele momento?">
            <textarea value={pensamento} onChange={(e) => setPensamento(e.target.value)} rows={2} maxLength={500}
              className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60"
              placeholder="Escreva com as suas palavras." />
          </Campo>

          <div>
            <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Emoção (pode marcar várias)</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {EMOCOES.map((e) => (
                <button key={e} onClick={() => toggleEmocao(e)}
                  className={`text-[11px] px-2.5 py-1 rounded border transition ${
                    emocoes.includes(e) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Intensidade: <span className="text-primary">{intensidade}/10</span>
            </label>
            <input type="range" min={0} max={10} value={intensidade} onChange={(e) => setIntensidade(+e.target.value)}
              className="w-full accent-primary mt-1.5" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Campo label="Evidências a favor" hint="Que fatos parecem apoiar esse pensamento?">
              <textarea value={favor} onChange={(e) => setFavor(e.target.value)} rows={3} maxLength={400}
                className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60" />
            </Campo>
            <Campo label="Evidências contra" hint="Que fatos não combinam totalmente com esse pensamento?">
              <textarea value={contra} onChange={(e) => setContra(e.target.value)} rows={3} maxLength={400}
                className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60" />
            </Campo>
          </div>
        </motion.section>

        {/* Distanciamento cognitivo */}
        <section className="rpg-panel p-4 sm:p-5 space-y-3 border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-300" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Distanciamento cognitivo</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Observe o pensamento. Não precisa concordar nem discordar dele imediatamente.
          </p>
          <Campo label="Como consigo observar esse pensamento de fora?">
            <textarea value={distTexto} onChange={(e) => setDistTexto(e.target.value)} rows={2} maxLength={400}
              className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-cyan-400/60"
              placeholder="Estou tendo o pensamento de que…" />
          </Campo>
          <div className="space-y-1.5">
            {[
              { id: "observei", label: "Consegui observar o pensamento como um pensamento." },
              { id: "envolvido", label: "Ainda estou muito envolvido com ele." },
            ].map((o) => (
              <button key={o.id} onClick={() => setDistStatus(distStatus === o.id ? null : o.id)}
                className={`w-full text-left text-xs px-3 py-2 rounded border transition ${
                  distStatus === o.id ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-border text-muted-foreground hover:border-cyan-400/40"
                }`}>
                {distStatus === o.id ? "☑" : "☐"} {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Continuum cognitivo */}
        <section className="rpg-panel p-4 sm:p-5 space-y-3 border-amber-500/30">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-amber-300" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300">Continuum cognitivo</p>
          </div>
          <p className="text-xs text-muted-foreground">Onde essa situação realmente está nessa escala?</p>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
            <span>0</span><span>50</span><span>100</span>
          </div>
          <input type="range" min={0} max={100} value={contValor} onChange={(e) => setContValor(+e.target.value)}
            className="w-full accent-amber-400" />
          <p className="text-center font-display text-lg tracking-widest text-amber-300">{contValor}</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <Campo label="O que seria 0?">
              <input value={contZero} onChange={(e) => setContZero(e.target.value)} maxLength={200}
                className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-amber-400/60" />
            </Campo>
            <Campo label="O que seria 100?">
              <input value={contCem} onChange={(e) => setContCem(e.target.value)} maxLength={200}
                className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-amber-400/60" />
            </Campo>
          </div>
          <Campo label="Por que coloquei nessa posição?">
            <textarea value={contMotivo} onChange={(e) => setContMotivo(e.target.value)} rows={2} maxLength={400}
              className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-amber-400/60" />
          </Campo>

          <button onClick={() => setMostrarExemplo((v) => !v)} className="text-[11px] text-muted-foreground hover:text-amber-300 flex items-center gap-1">
            <Info className="w-3 h-3" /> Como funciona essa ferramenta?
          </button>
          {mostrarExemplo && (
            <div className="text-[11px] text-muted-foreground rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-1">
              <p>“Sou um fracasso.” pode virar uma escala:</p>
              <p>0 = fracasso absoluto · 100 = desempenho excepcional</p>
              <p>E então <span className="text-foreground/90">você</span> decide onde a realidade daquela situação se encontra.</p>
            </div>
          )}
        </section>

        {/* Pensamento alternativo */}
        <section className="rpg-panel p-4 sm:p-5 space-y-3 border-primary/40">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Pensamento alternativo</p>
          <p className="text-xs text-muted-foreground">
            Depois de observar os fatos e as evidências, existe outra forma de interpretar essa situação?
          </p>
          <textarea value={alternativo} onChange={(e) => setAlternativo(e.target.value)} rows={3} maxLength={500}
            disabled={semAlternativo}
            className="w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60 disabled:opacity-40"
            placeholder="Escreva com as suas palavras. Só você escreve aqui." />
          <button onClick={() => setSemAlternativo((v) => !v)}
            className={`w-full text-left text-xs px-3 py-2 rounded border transition ${
              semAlternativo ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            }`}>
            {semAlternativo ? "☑" : "☐"} Não consigo encontrar um pensamento alternativo agora.
          </button>
        </section>

        {/* Depois */}
        <section className="rpg-panel p-4 sm:p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Campo label="Comportamento (opcional)" hint="O que você fez depois?">
              <input value={comportamento} onChange={(e) => setComportamento(e.target.value)} maxLength={200}
                className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60" />
            </Campo>
            <Campo label="Consequência (opcional)" hint="O que veio depois disso?">
              <input value={consequencia} onChange={(e) => setConsequencia(e.target.value)} maxLength={200}
                className="mt-1 w-full rpg-panel bg-background/40 p-2.5 text-sm outline-none focus:border-primary/60" />
            </Campo>
          </div>

          <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground block">
            Intensidade agora: <span className="text-primary">{intensidadeFinal}/10</span>
          </label>
          <input type="range" min={0} max={10} value={intensidadeFinal} onChange={(e) => setIntensidadeFinal(+e.target.value)}
            className="w-full accent-primary" />

          <button onClick={salvar} disabled={salvando}
            className="w-full rpg-panel p-3 border-primary/60 hover:border-primary bg-primary/10 hover:bg-primary/15 transition font-display tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
            Salvar registro
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            Seus registros alimentam o Laboratório, onde a IA cruza o histórico e mostra o que se repete.
          </p>
        </section>
      </div>
    </Shell>
  );
}

function Campo({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</label>
      {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}
