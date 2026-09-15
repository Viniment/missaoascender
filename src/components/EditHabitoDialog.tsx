import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Coins, Zap, Swords, Target, ShieldAlert, FileText, Play, Link2 } from "lucide-react";
import { toast } from "sonner";
import { updateHabito, type Habito, type Inimigo } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import RichTextEditor from "@/components/RichTextEditor";
import "@/styles/acoes-batalha.css";

function normalizeYoutubeUrl(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (!u.hostname.includes("youtube.com") && !u.hostname.includes("youtu.be")) throw new Error("Use um link do YouTube.");
    return u.toString();
  } catch (e: any) {
    throw new Error(e?.message === "Use um link do YouTube." ? e.message : "URL de vídeo inválida.");
  }
}

export default function EditHabitoDialog({ habito, inimigo, onboarding, onClose, onSaved }: { habito: Habito | null; inimigo: Inimigo | null; onboarding: any; onClose: () => void; onSaved: () => void; }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"positivo" | "negativo">("positivo");
  const [tipoTarefa, setTipoTarefa] = useState<"unica" | "quantidade">("unica");
  const [quantidadeMeta, setQuantidadeMeta] = useState(1);
  const [pesoDano, setPesoDano] = useState(6);
  const [pesoXp, setPesoXp] = useState(10);
  const [pesoOuro, setPesoOuro] = useState(2);
  const [textoApoio, setTextoApoio] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    if (!habito) return;
    setNome(habito.nome); setTipo(habito.tipo);
    setTipoTarefa(((habito as any).tipo_tarefa ?? "unica") as any);
    setQuantidadeMeta(Math.max(1, Number((habito as any).quantidade_meta ?? 1)));
    setPesoDano(habito.peso_dano_cura); setPesoXp(habito.peso_xp); setPesoOuro(habito.peso_ouro ?? 2);
    setTextoApoio(String((habito as any).texto_apoio_html ?? ""));
    setYoutubeUrl(String((habito as any).youtube_url ?? ""));
  }, [habito]);

  const recalcular = async () => {
    if (!nome.trim()) return;
    setRecalculando(true);
    try {
      const { data } = await supabase.functions.invoke("sugerir-pesos-habito", { body: { habito_nome: nome.trim(), tipo, inimigo: inimigo ? { nome: inimigo.nome, gatilho: inimigo.gatilho, mentiras: inimigo.mentiras } : null, onboarding: onboarding ?? null } });
      if (data?.peso_dano_cura) setPesoDano(data.peso_dano_cura);
      if (data?.peso_xp) setPesoXp(data.peso_xp);
      if (data?.peso_ouro) setPesoOuro(data.peso_ouro);
      toast.success("IA recalibrou os pesos.");
    } catch (e: any) { toast.error(e.message ?? "Erro ao recalcular"); }
    finally { setRecalculando(false); }
  };

  const salvar = async () => {
    if (!habito || !nome.trim()) return;
    setSaving(true);
    try {
      await updateHabito(habito.id, {
        nome: nome.trim(), tipo,
        peso_dano_cura: Math.max(2, Math.min(15, pesoDano)),
        peso_xp: Math.max(5, Math.min(25, pesoXp)),
        peso_ouro: Math.max(1, Math.min(6, pesoOuro)),
      });
      const youtube = normalizeYoutubeUrl(youtubeUrl);
      const { error } = await supabase.from("habitos").update({
        tipo_tarefa: tipoTarefa,
        quantidade_meta: tipoTarefa === "quantidade" ? Math.max(1, Math.floor(quantidadeMeta)) : 1,
        texto_apoio_html: textoApoio.trim() || null,
        youtube_url: youtube || null,
      }).eq("id", habito.id);
      if (error) throw error;
      toast.success("Ação atualizada."); onSaved(); onClose();
    } catch (e: any) { toast.error(e.message ?? "Erro ao salvar"); }
    finally { setSaving(false); }
  };

  return <AnimatePresence>{habito && <motion.div className="fixed inset-0 z-[80] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="relative w-full max-w-2xl rpg-panel neon-glow p-5 space-y-4 max-h-[92vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-3 right-3 h-9 w-9 rounded-xl border border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors" aria-label="Fechar"><X className="w-4 h-4 mx-auto" /></button>

      <div className="pr-12">
        <div className="flex items-center gap-2 text-primary"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10"><Swords className="w-4 h-4" /></span><div><p className="text-[9px] uppercase tracking-[0.32em] text-primary">Editar ação de combate</p><h3 className="font-display text-lg tracking-widest mt-0.5">Configurar batalha</h3></div></div>
        <p className="text-[10px] text-muted-foreground mt-2">Além da execução e das recompensas, você pode preparar o material que vai te ajudar a vencer a ação.</p>
      </div>

      <div className="grid gap-3">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] to-background/30 p-3.5 space-y-2">
          <label className="text-[9px] uppercase tracking-[0.25em] text-primary">Identidade da ação</label>
          <input aria-label="Nome da ação" className="w-full bg-background/65 border border-border/70 rounded-xl px-3.5 py-3 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors" value={nome} onChange={e => setNome(e.target.value)} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3.5 space-y-2.5">
          <div><p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Natureza da ação</p><p className="text-[10px] text-muted-foreground mt-1">Defina quem recebe o efeito da execução.</p></div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTipo("positivo")} className={`rounded-xl border p-3 text-left transition-all ${tipo === "positivo" ? "border-primary bg-primary/10 shadow-[0_0_22px_hsl(var(--primary)/.12)]" : "border-border/70 bg-background/25 hover:border-primary/25"}`}><Swords className="w-4 h-4 text-primary mb-2" /><p className="text-xs font-semibold">Ataca o inimigo</p><p className="text-[9px] text-muted-foreground mt-1">Você vence → dano + XP + ouro</p></button>
            <button type="button" onClick={() => setTipo("negativo")} className={`rounded-xl border p-3 text-left transition-all ${tipo === "negativo" ? "border-destructive bg-destructive/10 shadow-[0_0_22px_hsl(var(--destructive)/.10)]" : "border-border/70 bg-background/25 hover:border-destructive/25"}`}><ShieldAlert className="w-4 h-4 text-destructive mb-2" /><p className="text-xs font-semibold">Fere você</p><p className="text-[9px] text-muted-foreground mt-1">O inimigo vence → perda de vida</p></button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3.5 space-y-2.5">
          <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/5"><Target className="w-4 h-4 text-primary" /></span><div><p className="text-[9px] uppercase tracking-[0.25em] text-primary">Formato de execução</p><p className="text-[10px] text-muted-foreground">Escolha como a ação conta no dia.</p></div></div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTipoTarefa("unica")} className={`rounded-xl border p-3 text-left transition-all ${tipoTarefa === "unica" ? "border-primary bg-primary/10" : "border-border/70 bg-background/25 hover:border-primary/25"}`}><p className="text-xs font-semibold">⚔ Única</p><p className="text-[9px] text-muted-foreground mt-1">Uma execução conclui a ação.</p></button>
            <button type="button" onClick={() => setTipoTarefa("quantidade")} className={`rounded-xl border p-3 text-left transition-all ${tipoTarefa === "quantidade" ? "border-primary bg-primary/10" : "border-border/70 bg-background/25 hover:border-primary/25"}`}><p className="text-xs font-semibold">🔢 Quantidade</p><p className="text-[9px] text-muted-foreground mt-1">Acumula execuções até a meta.</p></button>
          </div>
        </div>

        {tipoTarefa === "quantidade" && <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 flex items-center justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.25em] text-primary">Meta diária</p><p className="text-[10px] text-muted-foreground mt-1">Quantas vezes a ação deve ser executada.</p></div><div className="flex items-center gap-2"><input type="number" min={1} max={99} className="w-20 bg-background border border-primary/30 rounded-xl px-3 py-2.5 text-center font-display" value={quantidadeMeta} onChange={e => setQuantidadeMeta(Math.max(1, Number(e.target.value) || 1))} /><span className="text-xs text-muted-foreground">vezes</span></div></div>}

        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Recompensas de batalha</p><p className="text-[10px] text-muted-foreground mt-1">Pesos aplicados em cada execução.</p></div><button onClick={recalcular} disabled={recalculando || !nome.trim()} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/10 text-[10px] text-primary disabled:opacity-50">{recalculando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Recalibrar</button></div>
          <div className="grid grid-cols-3 gap-2"><Stat label="DANO" value={pesoDano} icon={<Swords className="w-3 h-3" />} color="text-destructive" /><Stat label="XP" value={pesoXp} icon={<Zap className="w-3 h-3" />} color="text-primary" />{tipo === "positivo" && <Stat label="OURO" value={pesoOuro} icon={<Coins className="w-3 h-3" />} color="text-yellow-300" />}</div>
          <Slider label="Dano ao inimigo" value={pesoDano} setValue={setPesoDano} min={2} max={15} color="text-destructive" />
          <Slider label="XP" value={pesoXp} setValue={setPesoXp} min={5} max={25} color="text-primary" />
          {tipo === "positivo" && <Slider label="Ouro" value={pesoOuro} setValue={setPesoOuro} min={1} max={6} color="text-yellow-300" />}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.055] to-background/20 p-3.5 space-y-3">
          <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><FileText className="w-4 h-4" /></span><div><p className="text-[9px] uppercase tracking-[0.25em] text-primary">Texto de apoio</p><p className="text-[10px] text-muted-foreground">Guia rico para você consultar durante a execução.</p></div></div>
          <RichTextEditor value={textoApoio} onChange={setTextoApoio} placeholder="Escreva o passo a passo, lembrete, técnica, oração, estratégia..." minHeight="260px" />
        </div>

        <div className="rounded-2xl border border-red-400/15 bg-red-500/[0.025] p-3.5 space-y-3">
          <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/25 bg-red-500/10 text-red-300"><Play className="w-4 h-4 fill-current" /></span><div><p className="text-[9px] uppercase tracking-[0.25em] text-red-300">Vídeo de apoio</p><p className="text-[10px] text-muted-foreground">Cole um link do YouTube para assistir sem sair da ação.</p></div></div>
          <div className="relative"><Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="URL do vídeo do YouTube" className="w-full bg-background/65 border border-border/70 rounded-xl pl-9 pr-3.5 py-3 text-sm outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/10 transition-colors" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} /></div>
          {youtubeUrl && <p className="text-[9px] text-muted-foreground">O botão ▶ Vídeo aparecerá automaticamente na ação depois de salvar.</p>}
        </div>
      </div>

      <div className="pt-1"><button onClick={salvar} disabled={saving || !nome.trim()} className="w-full btn-pixel py-3.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando alterações...</> : "Salvar alterações"}</button></div>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}

function Stat({ label, value, icon, color }: any) {
  return <div className="rounded-xl border border-border/60 bg-background/40 p-2.5 text-center"><div className={`flex justify-center ${color}`}>{icon}</div><p className={`font-display text-lg mt-1 ${color}`}>{value}</p><p className="text-[8px] tracking-[0.2em] text-muted-foreground">{label}</p></div>;
}

function Slider({ label, value, setValue, min, max, color }: any) {
  return <div><div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground"><span>{label}</span><span className={`font-display text-sm ${color}`}>{value}</span></div><input type="range" min={min} max={max} value={value} onChange={e => setValue(Number(e.target.value))} className="w-full accent-primary mt-1" /></div>;
}
