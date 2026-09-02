import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Swords, Pencil, Sparkles, Heart, Coins } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fireReward } from "@/components/fx/RewardBurst";
import { registrarEnfrentamento, salvarCartaEnfrentamento, type Heroi, type Inimigo, type Habito } from "@/lib/api";

type Modo = "vazio" | "ler" | "editar" | "gerando" | "revisar" | "vitoria";

const FRASES_VITORIA = [
  "Eu escolhi não me abandonar.",
  "Eu senti a vontade e não obedeci.",
  "Eu permaneci leal a quem estou me tornando.",
  "Eu não troquei meu futuro por alívio.",
  "Eu venci esta escolha.",
];

export default function CartaEnfrentamentoDialog({
  open, onClose, heroi, inimigo, habitos, onboarding, onChanged,
}: {
  open: boolean;
  onClose: () => void;
  heroi: Heroi | null | undefined;
  inimigo: Inimigo | null | undefined;
  habitos: Habito[] | undefined;
  onboarding: any;
  onChanged: () => Promise<unknown> | void;
}) {
  const carta = heroi?.carta_enfrentamento?.trim() || null;
  const [modo, setModo] = useState<Modo>("vazio");
  const [texto, setTexto] = useState("");
  const [rascunhoIA, setRascunhoIA] = useState("");
  const [saving, setSaving] = useState(false);
  const [loot, setLoot] = useState<{ vida: number; ouro: number; frase: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoot(null);
    setModo(carta ? "ler" : "vazio");
  }, [open]);

  const salvar = async (t: string) => {
    if (!heroi) return;
    const limpo = t.trim();
    if (!limpo) { toast.error("A carta está vazia."); return; }
    setSaving(true);
    try {
      await salvarCartaEnfrentamento(heroi.id, limpo);
      await onChanged();
      toast.success("Carta salva.");
      setModo("ler");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally { setSaving(false); }
  };

  const gerar = async () => {
    if (!heroi) return;
    setModo("gerando");
    try {
      const { data, error } = await supabase.functions.invoke("carta-enfrentamento", {
        body: {
          heroi_nome: heroi.nome,
          titulo: heroi.titulo,
          sonho: onboarding?.sonho ?? null,
          desculpas: onboarding?.desculpas ?? [],
          funcao_protetora: onboarding?.funcao_protetora ?? null,
          custo_procrastinacao: onboarding?.custo_procrastinacao ?? null,
          inimigo_nome: inimigo?.nome ?? null,
          gatilho: inimigo?.gatilho ?? null,
          mentiras: inimigo?.mentiras ?? [],
          habitos_positivos: (habitos ?? []).filter(h => h.tipo === "positivo").map(h => h.nome),
          habitos_negativos: (habitos ?? []).filter(h => h.tipo === "negativo").map(h => h.nome),
          streak: heroi.streak_atual,
        },
      });
      if (error || !data?.carta) throw new Error(error?.message ?? data?.error ?? "Falha ao gerar");
      setRascunhoIA(String(data.carta).trim());
      setModo("revisar");
    } catch (e: any) {
      toast.error("Não consegui gerar agora. Tente de novo.");
      setModo(carta ? "ler" : "vazio");
    }
  };

  const enfrentei = async () => {
    if (!heroi || saving) return;
    setSaving(true);
    try {
      const r = await registrarEnfrentamento(heroi);
      await onChanged();
      fireReward(`+${r.ouro} ouro`);
      setLoot({ ...r, frase: FRASES_VITORIA[Math.floor(Math.random() * FRASES_VITORIA.length)] });
      setModo("vitoria");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar");
    } finally { setSaving(false); }
  };

  const fecharSeguro = () => { if (modo !== "gerando") onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fx-essential fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={fecharSeguro} />
          <motion.div
            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-md rpg-panel danger-glow scanlines border-destructive/40 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {modo !== "gerando" && (
              <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="w-4 h-4" />
              </button>
            )}

            {modo !== "vitoria" && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-destructive flex items-center gap-1"><Swords className="w-3 h-3" /> Carta de Enfrentamento</p>
                <h3 className="font-display text-lg tracking-widest mt-1">
                  {modo === "vazio" && "Eu ainda não tenho uma carta."}
                  {modo === "ler" && "Leia antes de escolher."}
                  {modo === "editar" && "Minha carta"}
                  {modo === "gerando" && "Escrevendo..."}
                  {modo === "revisar" && "Nova versão gerada"}
                </h3>
              </div>
            )}

            {modo === "vazio" && (
              <div className="space-y-2 pt-2">
                <button onClick={gerar} className="w-full btn-pixel py-3 rounded-md text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Gerar com IA
                </button>
                <button
                  onClick={() => { setTexto(""); setModo("editar"); }}
                  className="w-full py-3 rounded-md border border-border hover:border-primary text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" /> Escrever minha carta
                </button>
              </div>
            )}

            {modo === "ler" && carta && (
              <>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/95 border-l-2 border-destructive/50 pl-3 py-1 font-medium">
                  {carta}
                </div>
                <button
                  onClick={enfrentei}
                  disabled={saving}
                  className="w-full btn-pixel py-3.5 rounded-md text-sm uppercase tracking-[0.35em] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />} Enfrentei
                </button>
                <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                  <button onClick={() => { setTexto(carta); setModo("editar"); }} className="hover:text-foreground flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Personalizar
                  </button>
                  <button onClick={gerar} className="hover:text-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gerar nova com IA
                  </button>
                </div>
              </>
            )}

            {modo === "editar" && (
              <>
                <textarea
                  autoFocus
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Eu não vou me abandonar agora..."
                  className="w-full min-h-[260px] bg-secondary border border-border rounded-md px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:border-primary"
                />
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => setTexto("")} className="text-[11px] text-muted-foreground hover:text-destructive">Apagar tudo</button>
                  <div className="flex gap-2">
                    <button onClick={() => setModo(carta ? "ler" : "vazio")} className="px-3 py-2 rounded-md border border-border text-xs uppercase tracking-widest">Cancelar</button>
                    <button onClick={() => salvar(texto)} disabled={saving} className="btn-pixel px-4 py-2 rounded-md text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-60">
                      {saving && <Loader2 className="w-3 h-3 animate-spin" />} Salvar
                    </button>
                  </div>
                </div>
              </>
            )}

            {modo === "gerando" && (
              <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-destructive" />
                <p className="text-xs uppercase tracking-[0.3em]">Reunindo quem eu quero ser...</p>
              </div>
            )}

            {modo === "revisar" && (
              <>
                <textarea
                  value={rascunhoIA}
                  onChange={e => setRascunhoIA(e.target.value)}
                  className="w-full min-h-[260px] bg-secondary border border-border rounded-md px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground">Você pode ajustar o texto. {carta ? "Sua carta atual só é substituída ao confirmar." : ""}</p>
                <div className="flex items-center justify-between gap-2">
                  <button onClick={gerar} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> Gerar outra</button>
                  <div className="flex gap-2">
                    <button onClick={() => setModo(carta ? "ler" : "vazio")} className="px-3 py-2 rounded-md border border-border text-xs uppercase tracking-widest">Cancelar</button>
                    <button onClick={() => salvar(rascunhoIA)} disabled={saving} className="btn-pixel px-4 py-2 rounded-md text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-60">
                      {saving && <Loader2 className="w-3 h-3 animate-spin" />} {carta ? "Substituir" : "Salvar"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {modo === "vitoria" && loot && (
              <div className="text-center py-4 space-y-4">
                <motion.p initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[11px] uppercase tracking-[0.5em] text-gold">✦ Vitória registrada ✦</motion.p>
                <motion.h2
                  initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="font-display text-3xl tracking-[0.25em] glow-text-purple flex items-center justify-center gap-2"
                >
                  <Swords className="w-6 h-6" /> ENFRENTEI
                </motion.h2>
                <div className="flex justify-center gap-3">
                  <motion.div
                    initial={{ scale: 0, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 260 }}
                    className="rpg-panel no-frame px-4 py-3 border-destructive/40 flex items-center gap-2"
                  >
                    <Heart className="w-5 h-5 text-destructive fill-destructive" />
                    <span className="font-display text-xl tracking-widest">+{loot.vida}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Vida</span>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, rotate: 8 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 260 }}
                    className="rpg-panel no-frame px-4 py-3 border-gold/40 flex items-center gap-2"
                  >
                    <Coins className="w-5 h-5 text-gold" />
                    <span className="font-display text-xl tracking-widest">+{loot.ouro}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Ouro</span>
                  </motion.div>
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-sm italic text-primary">
                  “{loot.frase}”
                </motion.p>
                <button onClick={onClose} className="w-full btn-pixel py-2.5 rounded-md text-xs uppercase tracking-[0.3em]">Continuar</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
