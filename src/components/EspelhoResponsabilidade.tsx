import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Eye, Flame, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Espelho = {
  id: string;
  categoria: string;
  promessa: string;
  sabia: string;
  instante: string;
  negociacao: string;
  verdade: string;
  distancia: string;
  sonhos: string;
  preco: string;
  futuro: string;
  arrependimento: string;
  reconquista: string;
  pacto: string;
  created_at: string;
};

const CATEGORIAS = ["Alimentação", "Mentalidade", "Ação", "Procrastinação", "Emoções", "Disciplina", "Espiritualidade", "Outro"];

const perguntas = [
  ["promessa", "01 — O que você prometeu a si mesmo?", "Antes da queda existia uma decisão. Escreva exatamente o que você prometeu."],
  ["sabia", "02 — O que você sabia que precisava fazer?", "Não explique. Escreva a escolha que você já sabia que precisava fazer."],
  ["instante", "03 — Volte para aquele instante.", "Onde você estava? O que sentia? O que acontecia dentro de você? Descreva quando começou a ceder."],
  ["negociacao", "04 — Qual foi a negociação?", "Que frase, pensamento ou justificativa sua mente usou para abrir a porta?"],
  ["verdade", "05 — Retire a desculpa.", "Complete: Eu escolhi... Escreva sem justificar."],
  ["distancia", "06 — O que você fez contra quem queria se tornar?", "Qual distância você criou entre quem diz querer ser e aquilo que suas ações estão construindo?"],
  ["sonhos", "07 — E os seus sonhos?", "O que essa escolha está fazendo com a vida que você quer construir? O que está sendo adiado?"],
  ["preco", "08 — O que você recebeu e o que entregou?", "O que ganhou naquele momento? E o que entregou em troca daquele prazer, alívio ou conforto?"],
  ["futuro", "09 — Se nada mudar...", "Imagine 1 ano e 5 anos repetindo o mesmo padrão. O que terá perdido?"],
  ["arrependimento", "10 — Do que você se arrepende?", "Leia o que escreveu. Agora diga a verdade: do que você se arrepende?"],
  ["reconquista", "11 — O que você não aceita mais repetir?", "Transforme o arrependimento em clareza. O que termina aqui?"],
  ["pacto", "12 — O próximo pacto.", "O que você fará agora para provar a si mesmo que sua palavra ainda significa alguma coisa? Escreva uma ação concreta."],
] as const;

const initialForm = Object.fromEntries(perguntas.map(([key]) => [key, ""])) as Record<string, string>;

export default function EspelhoResponsabilidade({ userId }: { userId: string }) {
  const [items, setItems] = useState<Espelho[]>([]);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [step, setStep] = useState(-1);
  const [selected, setSelected] = useState<Espelho | null>(null);
  const [categoria, setCategoria] = useState("Outro");
  const [form, setForm] = useState<Record<string, string>>(initialForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("espelhos_autotraicao")
      .select("id,categoria,promessa,sabia,instante,negociacao,verdade,distancia,sonhos,preco,futuro,arrependimento,reconquista,pacto,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    void load();
    const channel = supabase.channel(`espelhos-autotraicao-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "espelhos_autotraicao", filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  const reset = () => {
    setForm({ ...initialForm });
    setCategoria("Outro");
    setStep(-1);
  };

  const start = () => {
    setFormOpen(true);
    setStep(0);
  };

  const save = async () => {
    if (Object.values(form).some(v => !v.trim())) return;
    setSaving(true);
    const { data, error } = await supabase.from("espelhos_autotraicao").insert({
      user_id: userId, categoria, ...form
    }).select("id,categoria,promessa,sabia,instante,negociacao,verdade,distancia,sonhos,preco,futuro,arrependimento,reconquista,pacto,created_at").single();
    setSaving(false);
    if (error || !data) return;
    setItems(prev => [data, ...prev]);
    reset();
    setFormOpen(false);
    setOpen(true);
    setSelected(data);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("espelhos_autotraicao").delete().eq("id", id).eq("user_id", userId);
    if (!error) { setSelected(null); await load(); }
  };

  const current = perguntas[step];
  const isLast = step === perguntas.length - 1;

  return <section className="rpg-panel overflow-hidden border-red-400/30 bg-gradient-to-br from-red-950/30 via-background/30 to-orange-950/10 shadow-[0_0_35px_hsl(0_70%_50%/0.08)]">
    <button type="button" onClick={() => setOpen(v => !v)} className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-red-500/[0.04]" aria-expanded={open}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-red-400/35 bg-red-500/10 text-red-300 shadow-[0_0_25px_hsl(0_80%_55%/0.16)] group-hover:scale-105 transition">
        <Eye className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-black uppercase tracking-[0.28em] text-red-300">CONFRONTO INTERNO</div>
        <h2 className="mt-1 font-display text-base tracking-widest">ESPELHO DA AUTOTRAIÇÃO</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Encare a promessa, a escolha, o preço e o próximo pacto.</p>
      </div>
      <div className="flex items-center gap-2"><span className="rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1 text-[9px] font-black text-red-200">{items.length}</span><ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180 text-red-300" : ""}`} /></div>
    </button>

    {open && <div className="border-t border-red-400/15 px-4 pb-4 pt-4">
      <div className="mb-4 rounded-xl border border-red-400/20 bg-black/20 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-200">O espelho não é um tribunal.</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Você não está aqui para se humilhar. Está aqui para parar de mentir para si mesmo. Escreva a verdade, mesmo quando ela for desconfortável.</p>
      </div>

      <button type="button" onClick={start} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/15">
        <Flame className="h-4 w-4" /> Entrar no espelho
      </button>

      {items.length > 0 && <div className="mt-4 space-y-2">
        {items.map(item => <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/25 p-3 text-left hover:border-red-400/30 hover:bg-red-500/[0.04]">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-red-400/20 bg-red-500/10 text-red-300"><Eye className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.categoria}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.verdade}</p></div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>)}
      </div>}

      {items.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-red-400/20 bg-background/20 p-4 text-center"><Eye className="mx-auto h-7 w-7 text-red-300/60" /><p className="mt-2 text-xs font-bold">Seu espelho ainda está vazio.</p><p className="mt-1 text-[10px] text-muted-foreground">O primeiro confronto começa quando você decide olhar.</p></div>}
    </div>}

    {formOpen && <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col p-4 sm:p-6">
        <div className="flex items-center gap-3 border-b border-red-400/15 pb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300"><Eye className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><div className="text-[9px] font-black uppercase tracking-[0.25em] text-red-300">ESPELHO DA AUTOTRAIÇÃO</div><p className="mt-1 text-[11px] text-muted-foreground">Escreva. Não se defenda. Olhe.</p></div>
          <button type="button" onClick={() => { reset(); setFormOpen(false); }} className="rounded-lg p-2 text-muted-foreground hover:bg-white/5"><X className="h-5 w-5" /></button>
        </div>

        {step === 0 && <div className="mt-4"><label className="mb-2 block text-[9px] font-black uppercase tracking-wider text-red-300">Categoria</label><select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full rounded-xl border border-border bg-background/50 px-3 py-3 text-xs outline-none focus:border-red-400/50">{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></div>}

        {current && <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mb-3 text-[9px] font-black uppercase tracking-[0.25em] text-red-400">CONFRONTO {step + 1} / {perguntas.length}</div>
          <h3 className="font-display text-xl leading-tight tracking-wider sm:text-2xl">{current[1]}</h3>
          <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-muted-foreground">{current[2]}</p>
          <textarea autoFocus value={form[current[0]]} onChange={e => setForm(f => ({ ...f, [current[0]]: e.target.value }))} placeholder="Escreva aqui. Quanto mais honesto, mais útil será este espelho." rows={9} className="mt-6 w-full resize-none rounded-2xl border border-red-400/20 bg-background/40 p-4 text-sm leading-relaxed outline-none transition focus:border-red-400/60 focus:ring-1 focus:ring-red-400/30" />
          <p className="mt-2 text-[9px] text-muted-foreground">Esta resposta é obrigatória para continuar.</p>
        </div>}

        <div className="flex items-center justify-between gap-3 border-t border-red-400/15 pt-4">
          <button type="button" disabled={step === 0} onClick={() => setStep(s => s - 1)} className="rounded-xl border border-border px-4 py-2.5 text-[10px] font-bold disabled:opacity-30">Voltar</button>
          <div className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{current ? `${step + 1} de ${perguntas.length}` : ""}</div>
          {!isLast ? <button type="button" disabled={!current || !form[current[0]]?.trim()} onClick={() => setStep(s => s + 1)} className="rounded-xl bg-red-500 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-30">Continuar</button> :
            <button type="button" disabled={saving || Object.values(form).some(v => !v.trim())} onClick={() => void save()} className="rounded-xl bg-red-500 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-30">{saving ? "Salvando..." : "Assumir o pacto"}</button>}
        </div>
      </div>
    </div>}

    {selected && <div className="fixed inset-0 z-[91] grid place-items-center bg-black/80 p-4 backdrop-blur-md" onClick={() => setSelected(null)}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-red-400/30 bg-background p-5 shadow-[0_20px_90px_-25px_hsl(0_80%_50%/0.35)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-400/25 bg-red-500/10 text-red-300"><Eye className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-[9px] font-black uppercase tracking-[0.22em] text-red-300">{selected.categoria}</div><h3 className="mt-1 font-display text-lg tracking-widest">ESPELHO DA AUTOTRAIÇÃO</h3><p className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">{new Date(selected.created_at).toLocaleString("pt-BR")}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div>
        <div className="mt-5 space-y-3">{perguntas.map(([key, label]) => <div key={key} className="rounded-xl border border-border/50 bg-background/30 p-3"><div className="text-[9px] font-black uppercase tracking-wider text-red-300">{label}</div><p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{selected[key]}</p></div>)}</div>
        <div className="mt-5 flex justify-end border-t border-border/50 pt-3"><button type="button" onClick={() => void remove(selected.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-[10px] font-bold text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Excluir</button></div>
      </div>
    </div>}
  </section>;
}
