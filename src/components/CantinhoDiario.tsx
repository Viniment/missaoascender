import { supabase } from "@/integrations/supabase/client";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, Clock3, FileText, Heart, HelpCircle, Lightbulb, PenLine, Trash2, X } from "lucide-react";

type Area = { id: string; nome: string; emoji: string; descricao: string };
type Diario = { id: string; area_id: string; titulo: string; conteudo: string; data: string; created_at: string; updated_at: string };
const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const isoHoje = () => new Date().toISOString().slice(0, 10);
const formatDate = (s: string) => { const [y, m, d] = s.split("-"); return d && m && y ? `${d}/${m}/${y}` : s; };

export default function CantinhoDiario({ area, userId, close }: { area: Area; userId: string; close: () => void }) {
  const [entries, setEntries] = useState<Diario[]>([]);
  const [selected, setSelected] = useState<Diario | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [tutorialLoaded, setTutorialLoaded] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    setLoading(true);
    const r = await supabase.from("cantinho_diarios" as any).select("id,area_id,titulo,conteudo,data,created_at,updated_at").eq("user_id", userId).eq("area_id", area.id).order("data", { ascending: false }).order("created_at", { ascending: false });
    if (r.error) { alert(`Não foi possível carregar o diário: ${r.error.message}`); setLoading(false); return; }
    setEntries((r.data || []) as Diario[]); setLoading(false);
  };

  useEffect(() => {
    load();
    let active = true;
    (async () => {
      const r = await supabase.from("cantinho_diario_preferencias" as any).select("tutorial_visto").eq("user_id", userId).maybeSingle();
      if (!active) return;
      if (r.error) { console.error("Erro ao carregar preferência do tutorial:", r.error); setTutorial(false); setTutorialLoaded(true); return; }
      setTutorial(r.data?.tutorial_visto !== true);
      setTutorialLoaded(true);
    })();
    return () => { active = false; };
  }, [userId, area.id]);

  const hideTutorial = async () => {
    setTutorial(false);
    const r = await supabase.rpc("marcar_cantinho_diario_tutorial_visto" as any);
    if (r.error) console.error("Não foi possível registrar tutorial visto:", r.error);
  };
  const showTutorial = () => setTutorial(true);
  const startNew = () => { setSelected(null); setTitle(`Diário de ${hoje()}`); setContent(""); void hideTutorial(); window.setTimeout(() => editorRef.current?.focus(), 100); };
  const openEntry = (entry: Diario) => { setSelected(entry); setTitle(entry.titulo); setContent(entry.conteudo); void hideTutorial(); window.setTimeout(() => editorRef.current?.focus(), 100); };

  const save = async () => {
    if (!content.trim()) { alert("Escreva sua experiência antes de salvar."); return; }
    setSaving(true);
    const payload = { user_id: userId, area_id: area.id, titulo: title.trim() || `Diário de ${hoje()}`, conteudo: content.trim(), data: selected?.data || isoHoje() };
    const r = selected ? await supabase.from("cantinho_diarios" as any).update(payload).eq("id", selected.id).eq("user_id", userId).select("id,area_id,titulo,conteudo,data,created_at,updated_at").single() : await supabase.from("cantinho_diarios" as any).insert(payload).select("id,area_id,titulo,conteudo,data,created_at,updated_at").single();
    setSaving(false); if (r.error) { alert(`Erro ao salvar diário: ${r.error.message}`); return; }
    const saved = r.data as Diario; setSelected(saved); setTitle(saved.titulo); setContent(saved.conteudo); await load();
  };
  const del = async () => { if (!selected || !window.confirm("Excluir esta entrada do diário? Esta ação não pode ser desfeita.")) return; const r = await supabase.from("cantinho_diarios" as any).delete().eq("id", selected.id).eq("user_id", userId); if (r.error) { alert(`Erro ao excluir: ${r.error.message}`); return; } setSelected(null); setTitle(""); setContent(""); await load(); };

  const contentNode = (
    <div className="fixed inset-0 z-[2147483647] overflow-y-auto bg-[#030206] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,70,239,.13),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(168,85,247,.08),transparent_30%)]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-2xl"><div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-7">
        <button type="button" onClick={close} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.04] hover:border-fuchsia-300/30"><X className="h-4 w-4" /></button>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.3em] text-fuchsia-300"><BookOpen className="h-3.5 w-3.5" /> Diário da área</div><h1 className="mt-1 truncate font-display text-lg tracking-widest sm:text-2xl">{area.emoji} {area.nome}</h1></div>
        <button type="button" onClick={showTutorial} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20" title="Ajuda: como usar o diário"><HelpCircle className="h-4 w-4" /></button>
        <button type="button" onClick={startNew} className="rounded-xl bg-fuchsia-500 px-3 py-2.5 text-[9px] font-black uppercase shadow-lg shadow-fuchsia-950/30"><PenLine className="mr-1 inline h-4 w-4" /> Novo dia</button>
      </div></header>
      <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-7 sm:py-8">
        {tutorial && tutorialLoaded && <div className="mb-6 rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/10 via-white/[.025] to-transparent p-5 shadow-2xl shadow-fuchsia-950/20 sm:p-6">
          <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-200"><Lightbulb className="h-6 w-6" /></div><div className="min-w-0 flex-1"><div className="text-[9px] font-black uppercase tracking-[.3em] text-fuchsia-300">Como usar seu diário</div><h2 className="mt-2 font-display text-lg tracking-wide">Escreva como se você já estivesse vivendo essa vida.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">Não escreva “eu quero”. Imagine que você já está vivendo essa realidade e registre como foi seu dia: o que aconteceu, quem estava com você, o que viu, o que sentiu e os pequenos detalhes que tornam essa vida real.</p><div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/60"><b className="text-white">01.</b> Comece pela cena: “Hoje...”</div><div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/60"><b className="text-white">02.</b> Conte o dia, não explique o sonho.</div><div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/60"><b className="text-white">03.</b> Escreva no presente, como se estivesse lá.</div></div><div className="mt-4 flex flex-wrap items-center gap-4"><button type="button" onClick={startNew} className="rounded-xl bg-fuchsia-500 px-5 py-2.5 text-[9px] font-black uppercase text-white shadow-lg shadow-fuchsia-950/30"><PenLine className="mr-1 inline h-4 w-4" /> Começar a escrever</button><button type="button" onClick={hideTutorial} className="text-[9px] font-black uppercase tracking-wider text-fuchsia-300 hover:text-white">Entendi, ocultar ajuda →</button></div></div></div></div>}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[.025] p-3 lg:sticky lg:top-24 lg:h-fit"><div className="flex items-center justify-between px-2 pb-3"><div><div className="text-[8px] font-black uppercase tracking-[.25em] text-white/35">Histórico</div><div className="mt-1 text-xs text-white/70">{entries.length} {entries.length === 1 ? "dia registrado" : "dias registrados"}</div></div><Clock3 className="h-4 w-4 text-fuchsia-300/70" /></div>
            {loading ? <div className="p-5 text-center text-[10px] text-white/40">Carregando...</div> : entries.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center"><FileText className="mx-auto h-6 w-6 text-white/20" /><p className="mt-2 text-[10px] leading-5 text-white/40">Seu primeiro dia ainda não foi escrito.</p></div> : <div className="max-h-[55vh] space-y-1 overflow-y-auto">{entries.map(e => <button type="button" key={e.id} onClick={() => openEntry(e)} className={`w-full rounded-2xl p-3 text-left transition ${selected?.id === e.id ? "border border-fuchsia-300/20 bg-fuchsia-500/10" : "border border-transparent hover:bg-white/[.04]"}`}><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-wider text-fuchsia-300"><CalendarDays className="h-3 w-3" />{formatDate(e.data)}</div><div className="mt-1 truncate text-xs font-bold text-white/80">{e.titulo || "Sem título"}</div><div className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{e.conteudo}</div></button>)}</div>}
          </aside>
          <section className="min-w-0">{!selected && !title ? <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/[.025] p-8 text-center"><div className="grid h-16 w-16 place-items-center rounded-3xl border border-fuchsia-300/20 bg-fuchsia-500/10"><PenLine className="h-7 w-7 text-fuchsia-300" /></div><h2 className="mt-6 font-display text-xl tracking-widest">SEU PRIMEIRO DIA</h2><p className="mt-2 max-w-md text-sm leading-6 text-white/45">Abra uma página e conte como foi um dia da vida que você está construindo.</p><button type="button" onClick={startNew} className="mt-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 px-6 py-3 text-[10px] font-black uppercase shadow-xl shadow-fuchsia-950/30"><PenLine className="mr-1 inline h-4 w-4" /> Escrever meu primeiro dia</button></div> : <div className="rounded-[32px] border border-white/10 bg-white/[.025] p-5 shadow-2xl shadow-fuchsia-950/10 sm:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.3em] text-fuchsia-300"><CalendarDays className="h-3 w-3" /> {selected ? formatDate(selected.data) : hoje()}</div><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do dia" className="mt-2 w-full bg-transparent font-display text-xl tracking-wide text-white outline-none placeholder:text-white/20 sm:text-2xl" /></div>{selected && <button type="button" onClick={del} className="rounded-xl border border-red-400/15 bg-red-500/5 p-2.5 text-red-300/70 hover:bg-red-500/10 hover:text-red-200" title="Excluir entrada"><Trash2 className="h-4 w-4" /></button>}</div>
            <div className="rounded-3xl border border-fuchsia-300/10 bg-black/30 p-1 shadow-inner"><textarea ref={editorRef} value={content} onChange={e => setContent(e.target.value)} onClick={() => editorRef.current?.focus()} onFocus={hideTutorial} placeholder={'Hoje foi um dia...\n\nComece contando como sua manhã começou. Onde você acordou? Quem estava com você? O que aconteceu ao longo do dia?\n\nEscreva como se esta realidade já fosse sua.'} className="pointer-events-auto block min-h-[52vh] w-full cursor-text resize-none rounded-[22px] border-0 bg-transparent px-4 py-4 text-[15px] leading-8 text-white/90 outline-none focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20 placeholder:text-white/20 sm:min-h-[58vh] sm:px-6 sm:py-5" /><div className="flex items-center justify-between border-t border-white/5 px-4 py-3"><span className="text-[9px] text-white/25">{content.trim() ? content.trim().split(/\s+/).length : 0} palavras</span><button type="button" onClick={save} disabled={saving || !content.trim()} className="rounded-xl bg-fuchsia-500 px-5 py-2.5 text-[9px] font-black uppercase text-white shadow-lg shadow-fuchsia-950/30 disabled:opacity-40">{saving ? "Salvando..." : "Guardar este dia"}</button></div></div>
            <div className="mt-4 flex items-center gap-2 text-[10px] leading-5 text-white/30"><Heart className="h-3.5 w-3.5 shrink-0 text-fuchsia-300/60" /> Este texto pertence somente ao seu Diário. Ele não aparece no “Meu Porquê” nem altera suas mídias.</div>
          </div>}</section>
        </div>
      </main>
    </div>
  );
  return createPortal(contentNode, document.body);
}
