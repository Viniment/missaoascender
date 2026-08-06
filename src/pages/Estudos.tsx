import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, MoreHorizontal, Trash2, Copy, Pencil, FileText, Clock, Star, Pin, Undo2, X,
} from "lucide-react";
import Shell from "@/components/Shell";
import { useAuth } from "@/hooks/useAuth";
import CategoriaDialog, { BannerFundo } from "@/components/estudos/CategoriaDialog";
import {
  atualizarCategoria, criarCategoria, duplicarCategoria, excluirCategoria, excluirNotaDefinitivo,
  formatarData, listCategorias, listNotas, restaurarNota, type Categoria,
} from "@/lib/estudos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Ordem = "recentes" | "antigas" | "az" | "za";

export default function Estudos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [dialog, setDialog] = useState<{ open: boolean; cat?: Categoria | null }>({ open: false });
  const [menu, setMenu] = useState<string | null>(null);
  const [verLixeira, setVerLixeira] = useState(false);

  const { data: categorias = [] } = useQuery({
    queryKey: ["estudo-categorias", user?.id],
    queryFn: () => listCategorias(user!.id),
    enabled: !!user,
  });
  const { data: notas = [] } = useQuery({
    queryKey: ["estudo-notas-all", user?.id],
    queryFn: () => listNotas(user!.id),
    enabled: !!user,
  });
  const { data: lixeira = [] } = useQuery({
    queryKey: ["estudo-lixeira", user?.id],
    queryFn: () => listNotas(user!.id, { lixeira: true }),
    enabled: !!user,
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["estudo-categorias", user?.id] });
    qc.invalidateQueries({ queryKey: ["estudo-notas-all", user?.id] });
    qc.invalidateQueries({ queryKey: ["estudo-lixeira", user?.id] });
  };

  const contagem = useMemo(() => {
    const m: Record<string, number> = {};
    notas.forEach((n) => { if (n.categoria_id) m[n.categoria_id] = (m[n.categoria_id] ?? 0) + 1; });
    return m;
  }, [notas]);

  const ultimaEdicao = useMemo(() => {
    const m: Record<string, string> = {};
    notas.forEach((n) => {
      if (!n.categoria_id) return;
      if (!m[n.categoria_id] || n.updated_at > m[n.categoria_id]) m[n.categoria_id] = n.updated_at;
    });
    return m;
  }, [notas]);

  const termo = busca.trim().toLowerCase();

  const resultados = useMemo(() => {
    if (!termo) return [];
    return notas.filter((n) => {
      const cat = categorias.find((c) => c.id === n.categoria_id);
      return (
        n.titulo.toLowerCase().includes(termo) ||
        n.conteudo_texto.toLowerCase().includes(termo) ||
        n.tags.some((t) => t.toLowerCase().includes(termo)) ||
        (cat?.nome.toLowerCase().includes(termo) ?? false)
      );
    });
  }, [termo, notas, categorias]);

  const listaCategorias = useMemo(() => {
    const arr = categorias.filter((c) => !termo || c.nome.toLowerCase().includes(termo));
    const t = (c: Categoria) => ultimaEdicao[c.id] ?? c.updated_at;
    switch (ordem) {
      case "az": return [...arr].sort((a, b) => a.nome.localeCompare(b.nome));
      case "za": return [...arr].sort((a, b) => b.nome.localeCompare(a.nome));
      case "antigas": return [...arr].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
      default: return [...arr].sort((a, b) => t(b).localeCompare(t(a)));
    }
  }, [categorias, ordem, termo, ultimaEdicao]);

  if (!user) return null;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Workspace</p>
            <h1 className="font-display text-xl tracking-widest">📚 Estudos</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              Seus cadernos, anotações e documentação — tudo num lugar só.
            </p>
          </div>
          <button
            onClick={() => setDialog({ open: true, cat: null })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Novo caderno
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título, conteúdo, categoria ou tag..."
              className="w-full rounded-xl border border-border bg-card/60 pl-9 pr-9 py-2.5 text-sm outline-none focus:border-primary"
            />
            {busca && (
              <button onClick={() => setBusca("")} aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            aria-label="Ordenar cadernos"
            className="rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs outline-none focus:border-primary"
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigas">Mais antigas</option>
            <option value="az">Nome A-Z</option>
            <option value="za">Nome Z-A</option>
          </select>
          <button
            onClick={() => setVerLixeira((v) => !v)}
            className={cn("inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs transition",
              verLixeira ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground")}
          >
            <Trash2 className="w-3.5 h-3.5" /> Lixeira {lixeira.length > 0 && `(${lixeira.length})`}
          </button>
        </div>

        {/* Resultados da busca em anotações */}
        {termo && (
          <section className="rpg-panel scanlines p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              {resultados.length} anotação(ões) encontradas
            </p>
            <div className="space-y-1.5">
              {resultados.slice(0, 12).map((n) => {
                const cat = categorias.find((c) => c.id === n.categoria_id);
                return (
                  <Link key={n.id} to={`/estudos/${n.categoria_id}?nota=${n.id}`}
                    className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 hover:border-primary/40 hover:bg-primary/5">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{n.titulo}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{cat?.emoji} {cat?.nome}</span>
                  </Link>
                );
              })}
              {resultados.length === 0 && <p className="text-xs text-muted-foreground">Nada por aqui.</p>}
            </div>
          </section>
        )}

        {/* Lixeira */}
        {verLixeira && (
          <section className="rpg-panel scanlines p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Lixeira</p>
            {lixeira.length === 0 && <p className="text-xs text-muted-foreground">Vazia.</p>}
            <div className="space-y-1.5">
              {lixeira.map((n) => (
                <div key={n.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{n.titulo}</span>
                  <button onClick={async () => { await restaurarNota(n.id); invalidar(); toast.success("Anotação restaurada."); }}
                    className="text-xs text-primary inline-flex items-center gap-1"><Undo2 className="w-3.5 h-3.5" /> Restaurar</button>
                  <button onClick={async () => { await excluirNotaDefinitivo(n.id); invalidar(); }}
                    aria-label="Excluir definitivamente" className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cadernos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaCategorias.map((c) => (
            <div key={c.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 transition hover:border-primary/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]">
              <button onClick={() => nav(`/estudos/${c.id}`)} className="block w-full text-left">
                <BannerFundo cat={c} className="h-24 w-full transition-transform duration-300 group-hover:scale-[1.03]" />
                <div className="p-4 pt-6 relative">
                  <div className="absolute -top-5 left-4 h-10 w-10 grid place-items-center rounded-xl border border-border bg-card text-xl">
                    {c.emoji}
                  </div>
                  <h3 className="font-display text-sm tracking-wide truncate">{c.nome}</h3>
                  {c.descricao && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.descricao}</p>}
                  <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> {contagem[c.id] ?? 0} anotações</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {formatarData(ultimaEdicao[c.id] ?? c.updated_at)}</span>
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setMenu(menu === c.id ? null : c.id); }}
                aria-label="Opções do caderno"
                className="absolute right-2 top-2 h-8 w-8 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/70"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menu === c.id && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
                  <div className="absolute right-2 top-11 z-40 w-44 rounded-xl border border-border bg-popover p-1 shadow-xl">
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                      onClick={() => { setMenu(null); setDialog({ open: true, cat: c }); }}>
                      <Pencil className="w-3.5 h-3.5" /> Editar / banner
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                      onClick={async () => { setMenu(null); await duplicarCategoria(user.id, c); invalidar(); toast.success("Caderno duplicado."); }}>
                      <Copy className="w-3.5 h-3.5" /> Duplicar
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        setMenu(null);
                        if (!confirm(`Excluir "${c.nome}" e todas as anotações dele?`)) return;
                        await excluirCategoria(c.id); invalidar(); toast.success("Caderno excluído.");
                      }}>
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <button
            onClick={() => setDialog({ open: true, cat: null })}
            className="min-h-[180px] rounded-2xl border border-dashed border-border grid place-items-center text-muted-foreground hover:border-primary hover:text-primary transition"
          >
            <span className="flex flex-col items-center gap-2 text-xs">
              <Plus className="w-6 h-6" /> Criar caderno
            </span>
          </button>
        </div>

        {categorias.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Comece criando um caderno: Pentest, Programação, Faculdade, Metas…
          </p>
        )}

        {/* Atalhos */}
        {notas.some((n) => n.favorita || n.fixada) && (
          <section className="rpg-panel scanlines p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Favoritas e fixadas</p>
            <div className="flex flex-wrap gap-2">
              {notas.filter((n) => n.favorita || n.fixada).slice(0, 10).map((n) => (
                <Link key={n.id} to={`/estudos/${n.categoria_id}?nota=${n.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] hover:border-primary hover:text-primary">
                  {n.fixada ? <Pin className="w-3 h-3" /> : <Star className="w-3 h-3" />} {n.titulo}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {dialog.open && (
        <CategoriaDialog
          userId={user.id}
          inicial={dialog.cat}
          onClose={() => setDialog({ open: false })}
          onSave={async (patch) => {
            if (dialog.cat) await atualizarCategoria(dialog.cat.id, patch);
            else await criarCategoria(user.id, patch);
            invalidar();
          }}
        />
      )}
    </Shell>
  );
}