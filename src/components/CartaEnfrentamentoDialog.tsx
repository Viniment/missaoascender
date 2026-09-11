import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Swords, Pencil, Sparkles, Heart, Coins, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fireReward } from "@/components/fx/RewardBurst";
import { registrarEnfrentamento, salvarCartaEnfrentamento, type Heroi, type Inimigo, type Habito } from "@/lib/api";
import { todayISO } from "@/lib/utils";

type Modo = "vazio" | "ler" | "editar" | "gerando" | "revisar" | "vitoria";
const FRASES_VITORIA = ["Eu escolhi não me abandonar.", "Eu senti a vontade e não obedeci.", "Eu permaneci leal a quem estou me tornando.", "Eu não troquei meu futuro por alívio.", "Eu venci esta escolha."];
const MAX_LEITURAS_DIA = 3;

export default function CartaEnfrentamentoDialog({ open, onClose, heroi, inimigo, habitos, onboarding, onChanged }: {
  open: boolean; onClose: () => void; heroi: Heroi | null | undefined; inimigo: Inimigo | null | undefined; habitos: Habito[] | undefined; onboarding: any; onChanged: () => Promise<unknown> | void;
}) {
  const carta = heroi?.carta_enfrentamento?.trim() || null;
  const [modo, setModo] = useState<Modo>("vazio");
  const [texto, setTexto] = useState("");
  const [rascunhoIA, setRascunhoIA] = useState("");
  const [saving, setSaving] = useState(false);
  const [leituras, setLeituras] = useState(0);
  const [loot, setLoot] = useState<{ vida: number; ouro: number; xp: number; frase: string } | null>(null);

  const chaveLeituras = heroi ? `ascensao:carta-leituras:${heroi.id}:${todayISO()}` : "";
  const lerContador = () => {
    if (!chaveLeituras) return 0;
    const n = Number(localStorage.getItem(chaveLeituras) || 0);
    return Number.isFinite(n) ? Math.min(n, MAX_LEITURAS_DIA) : 0;
  };

  useEffect(() => {
    if (!open) return;
    setLoot(null);
    setLeituras(lerContador());
    setModo(carta ? "ler" : "vazio");
  }, [open, heroi?.id, carta]);

  const salvar = async (t: string) => {
    if (!heroi) return;
    const limpo = t.trim();
    if (!limpo) { toast.error("A carta está vazia."); return; }
    setSaving(true);
    try { await salvarCartaEnfrentamento(heroi.id, limpo); await onChanged(); toast.success("Carta salva."); setModo("ler"); }
    catch (e: any) { toast.error(e.message ?? "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const gerar = async () => {
    if (!heroi) return;
    setModo("gerando");
    try {
      const { data, error } = await supabase.functions.invoke("carta-enfrentamento", { body: {
        heroi_nome: heroi.nome, titulo: heroi.titulo, sonho: onboarding?.sonho ?? null,
        desculpas: onboarding?.desculpas ?? [], funcao_protetora: onboarding?.funcao_protetora ?? null,
        custo_procrastinacao: onboarding?.custo_procrastinacao ?? null, inimigo_nome: inimigo?.nome ?? null,
        gatilho: inimigo?.gatilho ?? null, mentiras: inimigo?.mentiras ?? [],
        habitos_positivos: (habitos ?? []).filter(h => h.tipo === "positivo").map(h => h.nome),
        habitos_negativos: (habitos ?? []).filter(h => h.tipo === "negativo").map(h => h.nome), streak: heroi.streak_atual,
      } });
      if (error || !data?.carta) throw new Error(error?.message ?? data?.error ?? "Falha ao gerar");
      setRascunhoIA(String(data.carta).trim()); setModo("revisar");
    } catch (e: any) { toast.error("Não consegui gerar agora. Tente de novo."); setModo(carta ? "ler" : "vazio"); }
  };

  const lerCarta = async () => {
    if (!heroi || saving) return;
    const atual = lerContador();
    if (atual >= MAX_LEITURAS_DIA) { toast.info("As 3 recompensas da Carta de hoje já foram recebidas. Você pode continuar lendo sem ganhar mais pontos."); return; }
    setSaving(true);
    try {
      const r = await registrarEnfrentamento(heroi);
      const novoContador = atual + 1;
      localStorage.setItem(chaveLeituras, String(novoContador));
      setLeituras(novoContador);
      await onChanged();
      fireReward(`+${r.xp} XP`);
      setTimeout(() => fireReward(`+${r.ouro} ouro`), 160);
      setLoot({ ...r, frase: FRASES_VITORIA[Math.floor(Math.random() * FRASES_VITORIA.length)] });
      setModo("vitoria");
    } catch (e: any) { toast.error(e.message ?? "Erro ao registrar leitura"); }
    finally { setSaving(false); }
  };

  const fecharSeguro = () => { if (modo !== "gerando") onClose(); };

  return <AnimatePresence>{open && <motion.div className="fx-essential fixed inset-0 z-[80] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={fecharSeguro} />
    <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="relative w-full max-w-md rpg-panel danger-glow scanlines border-destructive/40 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
      {modo !== "gerando" && <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label="Fechar"><X className="w-4 h-4" /></button>}
      {modo !== "vitoria" && <div><p className="text-[10px] uppercase tracking-[0.4em] text-destructive flex items-center gap-1"><Swords className="w-3 h-3" /> Carta de Enfrentamento</p><h3 className="font-display text-lg tracking-widest mt-1">{modo === "vazio" && "Eu ainda não tenho uma carta."}{modo === "ler" && "Um lembrete para todos os dias."}{modo === "editar" && "Minha carta"}{modo === "gerando" && "Escrevendo..."}{modo === "revisar" && "Nova versão gerada"}</h3></div>}

      {modo === "vazio" && <div className="space-y-2 pt-2"><p className="text-sm text-muted-foreground">Crie um texto curto para lembrar diariamente quem você quer ser e como quer agir.</p><button onClick={gerar} className="w-full btn-pixel py-3 rounded-md text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Gerar com IA</button><button onClick={() => { setTexto(""); setModo("editar"); }} className="w-full py-3 rounded-md border border-border hover:border-primary text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2"><Pencil className="w-4 h-4" /> Escrever minha carta</button></div>}

      {modo === "ler" && carta && <>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/95 font-medium">{carta}</p></div>
        <div className="rounded-xl border border-border bg-muted/20 p-3 text-center"><p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Recompensas de hoje</p><p className="mt-1 text-sm font-black">{leituras}/{MAX_LEITURAS_DIA} leituras premiadas</p><p className="mt-1 text-[11px] text-muted-foreground">Cada leitura premiada: +20 XP · +Ouro · +1–5 Vida</p></div>
        <button onClick={lerCarta} disabled={saving || leituras >= MAX_LEITURAS_DIA} className="w-full btn-pixel py-3.5 rounded-md text-sm uppercase tracking-[0.25em] flex items-center justify-center gap-2 disabled:opacity-60"><Swords className="w-4 h-4" />{leituras >= MAX_LEITURAS_DIA ? "Recompensas concluídas" : saving ? "Registrando..." : "Li minha carta"}</button>
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground"><button onClick={() => { setTexto(carta); setModo("editar"); }} className="hover:text-foreground flex items-center gap-1"><Pencil className="w-3 h-3" /> Personalizar</button><button onClick={gerar} className="hover:text-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> Gerar nova com IA</button></div>
      </>}

      {modo === "editar" && <><textarea autoFocus value={texto} onChange={e => setTexto(e.target.value)} placeholder="Eu não vou me abandonar agora..." className="w-full min-h-[260px] bg-secondary border border-border rounded-md px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:border-primary" /><div className="flex items-center justify-between gap-2"><button onClick={() => setTexto("")} className="text-[11px] text-muted-foreground hover:text-destructive">Apagar tudo</button><div className="flex gap-2"><button onClick={() => setModo(carta ? "ler" : "vazio")} className="px-3 py-2 rounded-md border border-border text-xs uppercase tracking-widest">Cancelar</button><button onClick={() => salvar(texto)} disabled={saving} className="btn-pixel px-4 py-2 rounded-md text-xs uppercase tracking-widest">Salvar</button></div></div></>}
      {modo === "gerando" && <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin text-destructive" /><p className="text-xs uppercase tracking-[0.3em]">Reunindo quem eu quero ser...</p></div>}
      {modo === "revisar" && <><textarea value={rascunhoIA} onChange={e => setRascunhoIA(e.target.value)} className="w-full min-h-[260px] bg-secondary border border-border rounded-md px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:border-primary" /><p className="text-[11px] text-muted-foreground">Você pode ajustar o texto antes de salvar.</p><div className="flex justify-end gap-2"><button onClick={() => setModo(carta ? "ler" : "vazio")} className="px-3 py-2 rounded-md border border-border text-xs uppercase tracking-widest">Cancelar</button><button onClick={() => salvar(rascunhoIA)} disabled={saving} className="btn-pixel px-4 py-2 rounded-md text-xs uppercase tracking-widest">Salvar</button></div></>}

      {modo === "vitoria" && loot && <div className="text-center py-4 space-y-4"><motion.p initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[11px] uppercase tracking-[0.5em] text-gold">✦ Leitura registrada ✦</motion.p><motion.h2 initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="font-display text-3xl tracking-[0.2em] glow-text-purple">LEMBRETE ATIVO</motion.h2><div className="grid grid-cols-3 gap-2"><div className="rpg-panel no-frame px-2 py-3 border-primary/30"><Zap className="mx-auto h-5 w-5 text-primary" /><div className="font-display text-xl">+{loot.xp}</div><div className="text-[9px] uppercase tracking-widest text-muted-foreground">XP</div></div><div className="rpg-panel no-frame px-2 py-3 border-destructive/40"><Heart className="mx-auto h-5 w-5 text-destructive fill-destructive" /><div className="font-display text-xl">+{loot.vida}</div><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Vida</div></div><div className="rpg-panel no-frame px-2 py-3 border-gold/40"><Coins className="mx-auto h-5 w-5 text-gold" /><div className="font-display text-xl">+{loot.ouro}</div><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Ouro</div></div></div><p className="text-sm italic text-primary">“{loot.frase}”</p><p className="text-[11px] text-muted-foreground">Leitura {leituras}/{MAX_LEITURAS_DIA} de hoje</p><button onClick={onClose} className="w-full btn-pixel py-2.5 rounded-md text-xs uppercase tracking-[0.3em]">Continuar</button></div>}
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
