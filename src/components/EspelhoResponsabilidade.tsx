import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Cookie, Mirror, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Espelho = {
  id: string;
  categoria: string;
  aconteceu: string;
  fiz: string;
  buscava: string;
  sob_controle: string;
  proxima_vez: string;
  pote_biscoito_id: string | null;
  created_at: string;
};

const CATEGORIAS = ["Alimentação", "Mentalidade", "Ação", "Procrastinação", "Emoções", "Disciplina", "Espiritualidade", "Outro"];

const perguntas = [
  ["aconteceu", "O que aconteceu?", "Descreva o fato, sem julgamento."],
  ["fiz", "O que eu fiz?", "Qual foi sua resposta ao que aconteceu?"],
  ["buscava", "O que eu estava tentando conseguir?", "Alívio, conforto, prazer, segurança ou outra coisa?"],
  ["sob_controle", "O que estava sob meu controle?", "Separe o que aconteceu do que você podia escolher."],
  ["proxima_vez", "O que farei diferente na próxima vez?", "Uma ação concreta, pequena e possível."],
] as const;

export default function EspelhoResponsabilidade({ userId }: { userId: string }) {
  const [items, setItems] = useState<Espelho[]>([]);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Espelho | null>(null);
  const [categoria, setCategoria] = useState("Outro");
  const [form, setForm] = useState({ aconteceu: "", fiz: "", buscava: "", sob_controle: "", proxima_vez: "" });
  const [saving, setSaving] = useState(false);
  const [savingCookie, setSavingCookie] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("espelhos_responsabilidade")
      .select("id,categoria,aconteceu,fiz,buscava,sob_controle,proxima_vez,pote_biscoito_id,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    void load();
    const channel = supabase.channel(`espelhos-responsabilidade-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "espelhos_responsabilidade", filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  const reset = () => {
    setForm({ aconteceu: "", fiz: "", buscava: "", sob_controle: "", proxima_vez: "" });
    setCategoria("Outro");
  };

  const save = async () => {
    if (Object.values(form).some(v => !v.trim())) return;
    setSaving(true);
    const { data, error } = await supabase.from("espelhos_responsabilidade").insert({
      user_id: userId, categoria, ...form
    }).select("id,categoria,aconteceu,fiz,buscava,sob_controle,proxima_vez,pote_biscoito_id,created_at").single();
    setSaving(false);
    if (error || !data) return;
    setItems(prev => [data, ...prev]);
    reset();
    setFormOpen(false);
    setOpen(true);
    setSelected(data);
  };

  const guardarBiscoito = async () => {
    if (!selected || selected.pote_biscoito_id || savingCookie) return;
    setSavingCookie(true);
    const titulo = `${selected.categoria} — eu assumi minha parte`;
    const descricao = [
      `O que aconteceu: ${selected.aconteceu}`,
      `O que eu fiz: ${selected.fiz}`,
      `O que estava sob meu controle: ${selected.sob_controle}`,
      `O que farei diferente: ${selected.proxima_vez}`,
    ].join("\n\n");
    const { data: cookie, error } = await supabase.from("pote_biscoitos")
      .insert({ user_id: userId, titulo, descricao })
      .select("id").single();
    if (!error && cookie) {
      await supabase.from("espelhos_responsabilidade")
        .update({ pote_biscoito_id: cookie.id }).eq("id", selected.id).eq("user_id", userId);
      const updated = { ...selected, pote_biscoito_id: cookie.id };
      setSelected(updated);
      setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
    }
    setSavingCookie(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("espelhos_responsabilidade").delete().eq("id", id).eq("user_id", userId);
    if (!error) { setSelected(null); await load(); }
  };

  return <section className="rpg-panel overflow-hidden border-violet-400/30 bg-gradient-to-br from-violet-500/[0.08] via-background/30 to-indigo-500/[0.04]">
    <button type="button" onClick={() => setOpen(v => !v)} className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-violet-500/[0.04]" aria-expanded={open}>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-violet-400/35 bg-violet-500/10 text-violet-300 shadow-[0_0_20px_hsl(265_80%_60%/0.12)] group-hover:scale-105 transition">
        <BookOpen className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-black uppercase tracking-[0.25em] text-violet-300">DIÁRIO DA RESPONSABILIDADE</div>
        <h2 className="mt-1 font-display text-base tracking-widest">ESPELHO DA RESPONSABILIDADE</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Encare os fatos, assuma sua parte e escolha a próxima ação.</p>
      </div>
      <div className="flex items-center gap-2"><span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[9px] font-black text-violet-200">{items.length}</span><ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180 text-violet-300" : ""}`} /></div>
    </button>

    {open && <div className="border-t border-violet-400/15 px-4 pb-4 pt-3">
      <div className="mb-3 rounded-xl border border-violet-400/15 bg-background/25 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-violet-200">A regra do espelho</p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">Você não precisa controlar tudo o que acontece. O foco é reconhecer o que estava sob seu controle e decidir o próximo movimento.</p>
      </div>

      <button type="button" onClick={() => setFormOpen(v => !v)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-violet-200 hover:bg-violet-500/15">
        <Plus className="h-4 w-4" /> Novo espelho
      </button>

      {formOpen && <div className="mt-3 space-y-3 rounded-xl border border-violet-400/15 bg-background/30 p-3">
        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs outline-none focus:border-violet-400/50">
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        {perguntas.map(([key, label, placeholder]) => <div key={key}>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</label>
          <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} rows={key === "aconteceu" || key === "fiz" ? 3 : 2} className="w-full resize-none rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-violet-400/50" />
        </div>)}
        <div className="flex gap-2">
          <button type="button" onClick={() => { reset(); setFormOpen(false); }} className="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-bold">Cancelar</button>
          <button type="button" disabled={saving || Object.values(form).some(v => !v.trim())} onClick={() => void save()} className="flex-1 rounded-lg bg-violet-500 px-3 py-2 text-[10px] font-black text-white disabled:opacity-40">{saving ? "Salvando..." : "Salvar espelho"}</button>
        </div>
      </div>}

      <div className="mt-4 space-y-2">
        {items.length === 0 ? <div className="rounded-xl border border-dashed border-violet-400/20 bg-background/20 p-4 text-center"><BookOpen className="mx-auto h-7 w-7 text-violet-300/60" /><p className="mt-2 text-xs font-bold">Seu diário ainda está vazio.</p><p className="mt-1 text-[10px] text-muted-foreground">O primeiro espelho pode começar por uma situação pequena.</p></div> :
          items.map(item => <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/25 p-3 text-left hover:border-violet-400/30 hover:bg-violet-500/[0.04]">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-300"><BookOpen className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-xs font-bold">{item.categoria}</p>{item.pote_biscoito_id && <Cookie className="h-3.5 w-3.5 text-amber-300" />}</div><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.fiz}</p></div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>)}
      </div>
    </div>}

    {selected && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-violet-400/30 bg-background p-5 shadow-[0_20px_80px_-30px_hsl(265_80%_60%/0.45)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300"><BookOpen className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-[9px] font-black uppercase tracking-[0.22em] text-violet-300">{selected.categoria}</div><h3 className="mt-1 font-display text-lg tracking-widest">ESPELHO DA RESPONSABILIDADE</h3><p className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">{new Date(selected.created_at).toLocaleString("pt-BR")}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div>
        <div className="mt-5 space-y-4">
          {perguntas.map(([key, label]) => <div key={key} className="rounded-xl border border-border/50 bg-background/30 p-3"><div className="text-[9px] font-black uppercase tracking-wider text-violet-300">{label}</div><p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{selected[key]}</p></div>)}
        </div>
        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-200"><Cookie className="h-4 w-4" /> Pote de Biscoitos</div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{selected.pote_biscoito_id ? "Esta reflexão já virou uma prova de resiliência no seu pote." : "Se esta reflexão contém uma vitória concreta, guarde-a como prova para lembrar quando sua mente duvidar de você."}</p>
          {!selected.pote_biscoito_id && <button type="button" disabled={savingCookie} onClick={() => void guardarBiscoito()} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-black text-black disabled:opacity-40"><Cookie className="h-3.5 w-3.5" />{savingCookie ? "Guardando..." : "Guardar no Pote"}</button>}
        </div>
        <div className="mt-5 flex justify-between border-t border-border/50 pt-3"><span className="text-[9px] text-muted-foreground">Responsabilidade sem autopunição.</span><button type="button" onClick={() => void remove(selected.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-[10px] font-bold text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Excluir</button></div>
      </div>
    </div>}
  </section>;
}
