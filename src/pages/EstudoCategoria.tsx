import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Search, Star, Pin, MoreHorizontal, Copy, Trash2, FileText, Pencil,
  FolderInput, FileDown, FileType, FileCode, Check, Loader2, History, Tag, X,
} from "lucide-react";
import Shell from "@/components/Shell";
import { useAuth } from "@/hooks/useAuth";
import NoteEditor from "@/components/estudos/NoteEditor";
import CategoriaDialog, { BannerFundo } from "@/components/estudos/CategoriaDialog";
import {
  atualizarCategoria, atualizarNota, baixarArquivo, criarNota, duplicarNota, exportarPDF, formatarData,
  getCategoria, htmlParaMarkdown, listCategorias, listNotas, moverParaLixeira, type Nota,
} from "@/lib/estudos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filtro = "todas" | "favoritas" | "fixadas";
type Ordem = "editadas" | "criadas" | "az" | "za" | "antigas";

export default function EstudoCategoria() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [ordem, setOrdem] = useState<Ordem>("editadas");
  const [editarCat, setEditarCat] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<"idle" | "salvando" | "salvo">("idle");
  const [historico, setHistorico] = useState<{ em: string; titulo: string }[]>([]);
  const [verHistorico, setVerHistorico] = useState(false);

  const notaId = params.get("nota");

  const { data: categoria } = useQuery({
    queryKey: ["estudo-categoria", id],
    queryFn: () => getCategoria(id!),
    enabled: !!id,
  });
  const { data: categorias = [] } = useQuery({
    queryKey: ["estudo-categorias", user?.id],
    queryFn: () => listCategorias(user!.id),
    enabled: !!user,
  });
  const { data: notas = [] } = useQuery({
    queryKey: ["estudo-notas", id],
    queryFn: () => listNotas(user!.id, { categoriaId: id }),
    enabled: !!user && !!id,
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["estudo-notas", id] });
    qc.invalidateQueries({ queryKey: ["estudo-notas-all", user?.id] });
    qc.invalidateQueries({ queryKey: ["estudo-categoria", id] });
  };

  const notaAberta = notas.find((n) => n.id === notaId) ?? null;

  // ----- rascunho local + autosave -----
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState<any>(null);
  const htmlRef = useRef("");
  const textoRef = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notaAberta) return;
    setTitulo(notaAberta.titulo);
    setConteudo(notaAberta.conteudo);
    setSalvando("idle");
    setHistorico([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notaAberta?.id]);

  const agendarSalvar = (patch: Partial<Nota>) => {
    if (!notaAberta) return;
    setSalvando("salvando");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await atualizarNota(notaAberta.id, patch);
        setSalvando("salvo");
        setHistorico((h) => [{ em: new Date().toISOString(), titulo: patch.titulo ?? titulo }, ...h].slice(0, 20));
        invalidar();
      } catch {
        toast.error("Não consegui salvar automaticamente.");
        setSalvando("idle");
      }
    }, 800);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // ----- lista filtrada -----
  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    let arr = notas.filter((n) =>
      !t ||
      n.titulo.toLowerCase().includes(t) ||
      n.conteudo_texto.toLowerCase().includes(t) ||
      n.tags.some((tag) => tag.toLowerCase().includes(t)),
    );
    if (filtro === "favoritas") arr = arr.filter((n) => n.favorita);
    if (filtro === "fixadas") arr = arr.filter((n) => n.fixada);
    const sorters: Record<Ordem, (a: Nota, b: Nota) => number> = {
      editadas: (a, b) => b.updated_at.localeCompare(a.updated_at),
      criadas: (a, b) => b.criado_em.localeCompare(a.criado_em),
      antigas: (a, b) => a.criado_em.localeCompare(b.criado_em),
      az: (a, b) => a.titulo.localeCompare(b.titulo),
      za: (a, b) => b.titulo.localeCompare(a.titulo),
    };
    return [...arr].sort(sorters[ordem]).sort((a, b) => Number(b.fixada) - Number(a.fixada));
  }, [notas, busca, filtro, ordem]);

  if (!user) return null;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-4">
        <button onClick={() => nav("/estudos")} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Todos os cadernos
        </button>

        {/* Banner da categoria */}
        {categoria && (
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <BannerFundo cat={categoria} className="h-32 sm:h-40 w-full" />
            <button onClick={() => setEditarCat(true)}
              className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] text-white hover:bg-black/75">
              <Pencil className="w-3.5 h-3.5" /> Editar capa
            </button>
            <div className="bg-card/70 backdrop-blur px-4 pb-4 pt-6 relative">
              <div className="absolute -top-6 left-4 h-12 w-12 grid place-items-center rounded-xl border border-border bg-card text-2xl">
                {categoria.emoji}
              </div>
              <h1 className="font-display text-lg tracking-widest">{categoria.nome}</h1>
              {categoria.descricao && <p className="text-[11px] text-muted-foreground mt-0.5">{categoria.descricao}</p>}
            </div>
          </div>
        )}

        {/* Barra de ferramentas */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nesta categoria..."
              className="w-full rounded-xl border border-border bg-card/60 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {([["todas", "Todas"], ["favoritas", "⭐"], ["fixadas", "📌"]] as [Filtro, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setFiltro(v)}
                className={cn("px-3 py-2.5 text-xs transition", filtro === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {l}
              </button>
            ))}
          </div>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar anotações"
            className="rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs outline-none focus:border-primary">
            <option value="editadas">Última edição</option>
            <option value="criadas">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>
          <button
            onClick={async () => {
              const n = await criarNota(user.id, id!);
              invalidar();
              setParams({ nota: n.id });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            <Plus className="w-4 h-4" /> Nova anotação
          </button>
        </div>

        {/* Editor aberto */}
        {notaAberta ? (
          <section className="rounded-3xl border border-border/40 bg-card/30 p-6 sm:p-10 shadow-2xl backdrop-blur-sm relative overflow-visible">
            <div className="flex items-center justify-between gap-2 mb-8 border-b border-border/10 pb-6">
              <button onClick={() => setParams({})} className="px-4 py-2 rounded-xl bg-muted/30 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-2 transition-all">
                <ArrowLeft className="w-4 h-4" /> Voltar à lista
              </button>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background/40 px-3 py-1.5 rounded-full border border-border/20">
                  {salvando === "salvando" && <><Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> salvando…</>}
                  {salvando === "salvo" && <><Check className="w-3.5 h-3.5 text-green-400" /> salvo</>}
                  {salvando === "idle" && <>editado {formatarData(notaAberta.updated_at)}</>}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 mb-8 group/header">
              <div className="flex items-center gap-4">
                <input
                  value={titulo}
                  onChange={(e) => { setTitulo(e.target.value); agendarSalvar({ titulo: e.target.value || "Sem título" }); }}
                  placeholder="Título da anotação"
                  className="flex-1 bg-transparent font-display text-4xl sm:text-5xl tracking-tight outline-none placeholder:text-muted-foreground/30 font-black text-foreground transition-all focus:placeholder:opacity-0"
                />
                <div className="flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
                  <button onClick={async () => { await atualizarNota(notaAberta.id, { favorita: !notaAberta.favorita }); invalidar(); }}
                    aria-label="Favoritar" className={cn("w-10 h-10 grid place-items-center rounded-xl bg-background/40 border border-border/30 hover:bg-muted transition-all", notaAberta.favorita ? "text-yellow-400 border-yellow-400/30" : "text-muted-foreground")}>
                    <Star className="w-5 h-5" fill={notaAberta.favorita ? "currentColor" : "none"} />
                  </button>
                  <button onClick={async () => { await atualizarNota(notaAberta.id, { fixada: !notaAberta.fixada }); invalidar(); }}
                    aria-label="Fixar" className={cn("w-10 h-10 grid place-items-center rounded-xl bg-background/40 border border-border/30 hover:bg-muted transition-all", notaAberta.fixada ? "text-primary border-primary/30" : "text-muted-foreground")}>
                    <Pin className="w-5 h-5" fill={notaAberta.fixada ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => setVerHistorico((v) => !v)} aria-label="Histórico de edições"
                    className="w-10 h-10 grid place-items-center rounded-xl bg-background/40 border border-border/30 text-muted-foreground hover:bg-muted transition-all"><History className="w-5 h-5" /></button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {notaAberta.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px]">
                  <Tag className="w-3 h-3" /> {t}
                  <button aria-label={`Remover tag ${t}`} onClick={async () => {
                    await atualizarNota(notaAberta.id, { tags: notaAberta.tags.filter((x) => x !== t) }); invalidar();
                  }}><X className="w-3 h-3" /></button>
                </span>
              ))}
              <button
                onClick={async () => {
                  const t = window.prompt("Nova tag");
                  if (!t?.trim()) return;
                  await atualizarNota(notaAberta.id, { tags: [...notaAberta.tags, t.trim()] });
                  invalidar();
                }}
                className="rounded-full border border-dashed border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:border-primary hover:text-primary">
                + tag
              </button>
            </div>

            {/* Ações da anotação */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              <select
                aria-label="Mover para outra categoria"
                value={notaAberta.categoria_id ?? ""}
                onChange={async (e) => { await atualizarNota(notaAberta.id, { categoria_id: e.target.value }); invalidar(); nav(`/estudos/${e.target.value}`); }}
                className="rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-[11px] outline-none focus:border-primary">
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
              </select>
              <button onClick={() => exportarPDF(titulo, htmlRef.current)} className="acao-nota"><FileDown className="w-3.5 h-3.5" /> PDF</button>
              <button onClick={() => baixarArquivo(`${titulo}.md`, htmlParaMarkdown(htmlRef.current), "text/markdown")} className="acao-nota"><FileCode className="w-3.5 h-3.5" /> Markdown</button>
              <button onClick={() => baixarArquivo(`${titulo}.txt`, textoRef.current, "text/plain")} className="acao-nota"><FileType className="w-3.5 h-3.5" /> TXT</button>
              <button onClick={async () => { await duplicarNota(user.id, notaAberta); invalidar(); toast.success("Anotação duplicada."); }} className="acao-nota"><Copy className="w-3.5 h-3.5" /> Duplicar</button>
              <button onClick={async () => { await moverParaLixeira(notaAberta.id); invalidar(); setParams({}); toast.success("Movida para a lixeira."); }}
                className="acao-nota text-destructive"><Trash2 className="w-3.5 h-3.5" /> Lixeira</button>
            </div>

            {verHistorico && (
              <div className="mb-3 rounded-xl border border-border p-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Histórico desta sessão</p>
                {historico.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">Criada {formatarData(notaAberta.criado_em)} · editada {formatarData(notaAberta.updated_at)}</p>
                ) : historico.map((h, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">{new Date(h.em).toLocaleTimeString("pt-BR")} — “{h.titulo}”</p>
                ))}
              </div>
            )}

            <NoteEditor
              userId={user.id}
              conteudo={conteudo}
              onChange={({ json, html, texto }) => {
                htmlRef.current = html;
                textoRef.current = texto;
                agendarSalvar({ conteudo: json, conteudo_texto: texto } as any);
              }}
            />
          </section>
        ) : (
          /* Lista de anotações */
          <div className="space-y-2">
            {lista.map((n) => (
              <div key={n.id} className="group relative flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-3 transition hover:border-primary/50">
                <button onClick={() => setParams({ nota: n.id })} className="flex flex-1 min-w-0 items-center gap-3 text-left">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {n.fixada && <Pin className="w-3 h-3 text-primary" />}
                      {n.favorita && <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />}
                      <span className="text-sm truncate">{n.titulo}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {n.conteudo_texto.slice(0, 90) || "Vazia"} · {formatarData(n.updated_at)}
                    </p>
                    {n.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {n.tags.map((t) => <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] text-primary">#{t}</span>)}
                      </div>
                    )}
                  </div>
                </button>
                <button onClick={() => setMenu(menu === n.id ? null : n.id)} aria-label="Opções da anotação"
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><MoreHorizontal className="w-4 h-4" /></button>
                {menu === n.id && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
                    <div className="absolute right-2 top-11 z-40 w-44 rounded-xl border border-border bg-popover p-1 shadow-xl">
                      <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        onClick={async () => { setMenu(null); await atualizarNota(n.id, { favorita: !n.favorita }); invalidar(); }}>
                        <Star className="w-3.5 h-3.5" /> {n.favorita ? "Desfavoritar" : "Favoritar"}
                      </button>
                      <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        onClick={async () => { setMenu(null); await atualizarNota(n.id, { fixada: !n.fixada }); invalidar(); }}>
                        <Pin className="w-3.5 h-3.5" /> {n.fixada ? "Desafixar" : "Fixar"}
                      </button>
                      <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        onClick={async () => { setMenu(null); await duplicarNota(user.id, n); invalidar(); }}>
                        <Copy className="w-3.5 h-3.5" /> Duplicar
                      </button>
                      <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        onClick={() => { setMenu(null); setParams({ nota: n.id }); }}>
                        <FolderInput className="w-3.5 h-3.5" /> Abrir e mover
                      </button>
                      <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                        onClick={async () => { setMenu(null); await moverParaLixeira(n.id); invalidar(); }}>
                        <Trash2 className="w-3.5 h-3.5" /> Mover p/ lixeira
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {lista.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma anotação por aqui ainda.</p>
                <button onClick={async () => { const n = await criarNota(user.id, id!); invalidar(); setParams({ nota: n.id }); }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs text-primary-foreground">
                  <Plus className="w-4 h-4" /> Criar a primeira
                </button>
              </div>
            )}
            <p className="pt-2 text-center text-[11px] text-muted-foreground">
              Precisa de outro caderno? <Link to="/estudos" className="text-primary">Voltar aos cadernos</Link>
            </p>
          </div>
        )}
      </div>

      {editarCat && categoria && (
        <CategoriaDialog
          userId={user.id}
          inicial={categoria}
          onClose={() => setEditarCat(false)}
          onSave={async (patch) => { await atualizarCategoria(categoria.id, patch); invalidar(); qc.invalidateQueries({ queryKey: ["estudo-categorias", user.id] }); }}
        />
      )}
    </Shell>
  );
}