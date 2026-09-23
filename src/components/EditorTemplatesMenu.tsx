import { useEffect, useState } from "react";
import { Check, Download, FilePlus2, Loader2, Save, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Template = { id: string; nome: string; conteudo_html: string; updated_at: string };
type Props = { value: string; onApply: (html: string) => void };

export default function EditorTemplatesMenu({ value, onApply }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "save">("list");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadTemplates = async () => {
    if (!user) return;
    setLoading(true); setError("");
    const { data, error: dbError } = await supabase.from("editor_templates" as any).select("id,nome,conteudo_html,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
    if (dbError) setError(`Não foi possível carregar os templates: ${dbError.message}`); else setTemplates((data ?? []) as unknown as Template[]);
    setLoading(false);
  };

  useEffect(() => { if (open) loadTemplates(); }, [open, user?.id]);

  const saveTemplate = async () => {
    if (!user || !name.trim()) return;
    const normalizedName = name.trim();
    setSaving(true); setError("");
    const existing = templates.find(t => t.nome.trim().toLowerCase() === normalizedName.toLowerCase());
    if (existing) {
      const { error: dbError } = await supabase.from("editor_templates" as any).update({ nome: normalizedName, conteudo_html: value }).eq("id", existing.id).eq("user_id", user.id);
      if (dbError) setError(`Não foi possível salvar o template: ${dbError.message}`);
      else { setName(""); setMode("list"); await loadTemplates(); }
      setSaving(false); return;
    }
    const { error: dbError } = await supabase.from("editor_templates" as any).insert({ user_id: user.id, nome: normalizedName, conteudo_html: value });
    if (dbError) setError(dbError.code === "23505" ? "Já existe um template com esse nome." : `Não foi possível salvar o template: ${dbError.message}`);
    else { setName(""); setMode("list"); await loadTemplates(); }
    setSaving(false);
  };

  const applyTemplate = (template: Template) => {
    if (value.replace(/<[^>]*>/g, "").trim() && !window.confirm(`Aplicar “${template.nome}” vai substituir o conteúdo atual do editor.\n\nDeseja continuar?`)) return;
    onApply(template.conteudo_html); setOpen(false);
  };

  const deleteTemplate = async (template: Template) => {
    if (!user) { setError("Não foi possível identificar o usuário atual."); return; }
    if (!window.confirm(`Excluir o template “${template.nome}”?\n\nEssa ação é permanente.\n\nDeseja continuar?`)) return;

    setSelectedId(template.id); setError("");
    try {
      const { data, error: dbError } = await supabase.rpc("delete_editor_template" as any, { p_template_id: template.id });
      if (dbError) {
        setError(`Não foi possível excluir o template: ${dbError.message}`);
        return;
      }
      if (data !== true) {
        setError("O template não foi excluído. Atualize a migração de exclusão dos templates no Supabase.");
        await loadTemplates();
        return;
      }
      setTemplates(current => current.filter(item => item.id !== template.id));
      await loadTemplates();
    } catch (err) {
      setError(`Não foi possível excluir o template: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    } finally {
      setSelectedId(null);
    }
  };

  return <div className="relative">
    <button type="button" title="Templates" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(v => !v); setMode("list"); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/5 text-white/45 transition hover:border-fuchsia-300/20 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"><FilePlus2 className="h-3.5 w-3.5" /></button>
    {open && <div className="absolute right-0 top-10 z-[2147483647] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#08080d]/[.99] shadow-[0_24px_80px_rgba(0,0,0,.9)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[.035] px-3 py-2.5"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-white/80">Templates</div><div className="mt-0.5 text-[8px] text-white/30">Salve e reutilize a formatação completa</div></div><button type="button" onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg text-white/35 hover:bg-white/5 hover:text-white"><X className="h-3.5 w-3.5" /></button></div>
      {mode === "save" ? <div className="p-3"><div className="mb-2 text-[8px] font-black uppercase tracking-[.16em] text-fuchsia-200/55">Salvar template atual</div><input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveTemplate(); }} placeholder="Nome do template" className="h-9 w-full rounded-lg border border-white/10 bg-black px-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-fuchsia-400/50" maxLength={80} /><div className="mt-2 flex gap-2"><button type="button" onClick={() => setMode("list")} className="h-9 flex-1 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-wider text-white/50 hover:bg-white/5">Cancelar</button><button type="button" disabled={saving || !name.trim()} onClick={saveTemplate} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-fuchsia-500/20 text-[9px] font-black uppercase tracking-wider text-fuchsia-100 hover:bg-fuchsia-500/30 disabled:opacity-40">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Salvar</button></div></div> : <>
        <div className="flex gap-2 border-b border-white/5 p-2.5"><button type="button" onClick={() => setMode("save")} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/10 text-[8px] font-black uppercase tracking-wider text-fuchsia-100 hover:bg-fuchsia-500/15"><Save className="h-3 w-3" />Salvar atual</button><button type="button" onClick={loadTemplates} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/40 hover:bg-white/5" title="Atualizar"><Download className="h-3.5 w-3.5" /></button></div>
        <div className="max-h-72 overflow-y-auto p-2.5">{loading ? <div className="flex items-center justify-center gap-2 py-8 text-[9px] text-white/30"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</div> : templates.length === 0 ? <div className="py-8 text-center"><div className="text-2xl">📐</div><div className="mt-2 text-[9px] font-bold text-white/45">Nenhum template salvo</div><div className="mt-1 text-[8px] text-white/20">Formate uma anotação e salve para reutilizar.</div></div> : <div className="space-y-1.5">{templates.map(template => <div key={template.id} className="group flex items-center gap-2 rounded-xl border border-white/5 bg-white/[.02] p-2 hover:border-fuchsia-400/15 hover:bg-fuchsia-500/[.04]"><button type="button" onClick={() => applyTemplate(template)} className="min-w-0 flex-1 text-left"><div className="truncate text-[10px] font-black text-white/75">{template.nome}</div><div className="mt-0.5 text-[7px] text-white/20">Atualizado em {new Date(template.updated_at).toLocaleDateString("pt-BR")}</div></button><button type="button" title="Excluir template" disabled={selectedId === template.id} onClick={e => { e.stopPropagation(); void deleteTemplate(template); }} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40">{selectedId === template.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}</button><Check className="hidden h-3 w-3 text-fuchsia-300/30 group-hover:block" /></div>)}</div>}</div>
      </>}
      {error && <div className="border-t border-red-400/10 bg-red-500/5 px-3 py-2 text-[8px] font-bold text-red-300">{error}</div>}
    </div>}
  </div>;
}
