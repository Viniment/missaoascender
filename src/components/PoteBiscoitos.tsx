import { useEffect, useState } from "react";
import { Award, ChevronDown, Cookie, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Biscoito = {
  id: string;
  titulo: string;
  descricao: string;
  created_at: string;
};

export default function PoteBiscoitos({ userId }: { userId: string }) {
  const [items, setItems] = useState<Biscoito[]>([]);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Biscoito | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("pote_biscoitos")
      .select("id,titulo,descricao,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`pote-biscoitos-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pote_biscoitos", filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  const add = async () => {
    if (!titulo.trim() || !descricao.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("pote_biscoitos").insert({
      user_id: userId,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
    });
    setSaving(false);
    if (error) return;
    setTitulo("");
    setDescricao("");
    setFormOpen(false);
    setOpen(true);
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("pote_biscoitos").delete().eq("id", id).eq("user_id", userId);
    if (!error) {
      setSelected(null);
      await load();
    }
  };

  return (
    <section className="rpg-panel overflow-hidden border-amber-400/30 bg-gradient-to-br from-amber-500/[0.08] via-background/30 to-orange-500/[0.04]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-amber-500/[0.04]"
        aria-expanded={open}
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-amber-400/35 bg-amber-500/10 text-amber-300 shadow-[0_0_20px_hsl(38_90%_55%/0.12)] transition group-hover:scale-105">
          <Cookie className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-300">RESERVA DE RESILIÊNCIA</div>
          <h2 className="mt-1 font-display text-base tracking-widest">POTE DE BISCOITOS</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Guarde provas reais de que você já conseguiu fazer coisas difíceis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-black text-amber-200">
            {items.length}
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180 text-amber-300" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-amber-400/15 px-4 pb-4 pt-3">
          <div className="mb-3 rounded-xl border border-amber-400/15 bg-background/25 p-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-200">
              <Award className="h-4 w-4" />
              Abra quando sua mente disser que você não consegue.
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              Cada biscoito é uma evidência concreta: uma dificuldade que você enfrentou, uma vontade que atravessou ou uma promessa que cumpriu.
            </p>
          </div>

          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-400/20 bg-background/20 p-4 text-center">
                <Cookie className="mx-auto h-7 w-7 text-amber-300/60" />
                <p className="mt-2 text-xs font-bold">Seu pote ainda está vazio.</p>
                <p className="mt-1 text-[10px] text-muted-foreground">A primeira prova pode ser pequena. O importante é que seja verdadeira.</p>
              </div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/25 p-3 text-left transition hover:border-amber-400/30 hover:bg-amber-500/[0.04]"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-amber-400/20 bg-amber-500/10 text-amber-300">
                    <Cookie className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{item.titulo}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.descricao}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setFormOpen(v => !v)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-amber-200 transition hover:bg-amber-500/15"
          >
            <Plus className="h-4 w-4" />
            Guardar novo biscoito
          </button>

          {formOpen && (
            <div className="mt-3 space-y-3 rounded-xl border border-amber-400/15 bg-background/30 p-3">
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex.: Resisti à vontade de comer"
                maxLength={100}
                className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs outline-none focus:border-amber-400/50"
              />
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="O que aconteceu? Qual foi a prova de que você conseguiu?"
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-amber-400/50"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 rounded-lg border border-border px-3 py-2 text-[10px] font-bold">Cancelar</button>
                <button type="button" disabled={saving || !titulo.trim() || !descricao.trim()} onClick={() => void add()} className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-black text-black disabled:opacity-40">
                  {saving ? "Guardando..." : "Guardar biscoito"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-amber-400/30 bg-background p-5 shadow-[0_20px_80px_-30px_hsl(38_90%_55%/0.45)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-300">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-300">PROVA DE RESILIÊNCIA</div>
                <h3 className="mt-1 font-display text-lg tracking-widest">{selected.titulo}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{selected.descricao}</p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                {new Date(selected.created_at).toLocaleDateString("pt-BR")}
              </span>
              <button type="button" onClick={() => void remove(selected.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-[10px] font-bold text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
