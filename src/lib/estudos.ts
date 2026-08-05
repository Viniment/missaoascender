import { supabase } from "@/integrations/supabase/client";

export type Categoria = {
  id: string;
  user_id: string;
  nome: string;
  emoji: string;
  descricao: string | null;
  banner_url: string | null;
  banner_preset: string | null;
  banner_pos: number;
  banner_zoom: number;
  ordem: number;
  criado_em: string;
  updated_at: string;
};

export type Nota = {
  id: string;
  user_id: string;
  categoria_id: string | null;
  titulo: string;
  conteudo: any;
  conteudo_texto: string;
  tags: string[];
  favorita: boolean;
  fixada: boolean;
  na_lixeira: boolean;
  excluida_em: string | null;
  criado_em: string;
  updated_at: string;
};

/** Banners prontos (gradientes CSS — sem assets externos). */
export const BANNER_PRESETS: Record<string, { nome: string; css: string }> = {
  neon: { nome: "Neon Roxo", css: "linear-gradient(120deg,#2e1065 0%,#7b2ff7 50%,#c084fc 100%)" },
  abismo: { nome: "Abismo", css: "linear-gradient(160deg,#020617 0%,#0f172a 60%,#1e293b 100%)" },
  ciber: { nome: "Ciber", css: "linear-gradient(120deg,#082f49 0%,#0ea5e9 60%,#22d3ee 100%)" },
  brasa: { nome: "Brasa", css: "linear-gradient(120deg,#450a0a 0%,#dc2626 55%,#f59e0b 100%)" },
  floresta: { nome: "Floresta", css: "linear-gradient(120deg,#052e16 0%,#16a34a 60%,#a3e635 100%)" },
  aurora: { nome: "Aurora", css: "linear-gradient(120deg,#1e1b4b 0%,#7c3aed 40%,#06b6d4 75%,#f472b6 100%)" },
  ouro: { nome: "Ouro", css: "linear-gradient(120deg,#292524 0%,#a16207 55%,#fde047 100%)" },
  rosa: { nome: "Nebulosa", css: "linear-gradient(120deg,#3b0764 0%,#db2777 60%,#fb7185 100%)" },
  grafite: { nome: "Grafite", css: "linear-gradient(120deg,#0f172a 0%,#334155 55%,#64748b 100%)" },
};

export const EMOJIS_SUGERIDOS = [
  "📚","📖","💻","🔒","🧠","⚡","🎯","📈","🎨","📄","🧪","🛠️","🌱","🚀","🧩","🗂️",
  "✍️","🔬","🎓","💡","🕹️","🧭","📌","🔥","🌌","🧿","⚙️","📝","🏹","💎",
];

export const EMOJIS_EDITOR = [
  "😀","😄","😉","😍","🤔","😎","😭","😡","🥳","🤯","🙏","👍","👎","👏","💪","🙌",
  "🔥","⭐","✨","💡","✅","❌","⚠️","📌","📎","🔗","🧠","❤️","💜","🎯","🚀","⚡",
];

// ---------- Categorias ----------

export async function listCategorias(userId: string) {
  const { data, error } = await supabase
    .from("estudo_categorias")
    .select("*")
    .eq("user_id", userId)
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

export async function getCategoria(id: string) {
  const { data, error } = await supabase.from("estudo_categorias").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Categoria | null;
}

export async function criarCategoria(userId: string, patch: Partial<Categoria>) {
  const { data, error } = await supabase
    .from("estudo_categorias")
    .insert({
      user_id: userId,
      nome: patch.nome ?? "Novo caderno",
      emoji: patch.emoji ?? "📚",
      descricao: patch.descricao ?? null,
      banner_preset: patch.banner_preset ?? "neon",
      banner_url: patch.banner_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Categoria;
}

export async function atualizarCategoria(id: string, patch: Partial<Categoria>) {
  const { error } = await supabase.from("estudo_categorias").update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function excluirCategoria(id: string) {
  const { error } = await supabase.from("estudo_categorias").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicarCategoria(userId: string, cat: Categoria) {
  const nova = await criarCategoria(userId, {
    nome: `${cat.nome} (cópia)`,
    emoji: cat.emoji,
    descricao: cat.descricao,
    banner_preset: cat.banner_preset,
    banner_url: cat.banner_url,
  });
  const { data } = await supabase
    .from("estudo_notas")
    .select("*")
    .eq("categoria_id", cat.id)
    .eq("na_lixeira", false);
  const notas = (data ?? []) as Nota[];
  if (notas.length) {
    await supabase.from("estudo_notas").insert(
      notas.map((n) => ({
        user_id: userId,
        categoria_id: nova.id,
        titulo: n.titulo,
        conteudo: n.conteudo,
        conteudo_texto: n.conteudo_texto,
        tags: n.tags,
        favorita: n.favorita,
        fixada: n.fixada,
      })) as any,
    );
  }
  return nova;
}

// ---------- Notas ----------

export async function listNotas(userId: string, opts: { categoriaId?: string; lixeira?: boolean } = {}) {
  let q = supabase.from("estudo_notas").select("*").eq("user_id", userId).eq("na_lixeira", !!opts.lixeira);
  if (opts.categoriaId) q = q.eq("categoria_id", opts.categoriaId);
  const { data, error } = await q.order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Nota[];
}

export async function criarNota(userId: string, categoriaId: string | null, titulo = "Sem título") {
  const { data, error } = await supabase
    .from("estudo_notas")
    .insert({ user_id: userId, categoria_id: categoriaId, titulo })
    .select()
    .single();
  if (error) throw error;
  return data as Nota;
}

export async function atualizarNota(id: string, patch: Partial<Nota>) {
  const { error } = await supabase.from("estudo_notas").update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function moverParaLixeira(id: string) {
  await atualizarNota(id, { na_lixeira: true, excluida_em: new Date().toISOString() } as any);
}

export async function restaurarNota(id: string) {
  await atualizarNota(id, { na_lixeira: false, excluida_em: null } as any);
}

export async function excluirNotaDefinitivo(id: string) {
  const { error } = await supabase.from("estudo_notas").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicarNota(userId: string, nota: Nota) {
  const { data, error } = await supabase
    .from("estudo_notas")
    .insert({
      user_id: userId,
      categoria_id: nota.categoria_id,
      titulo: `${nota.titulo} (cópia)`,
      conteudo: nota.conteudo,
      conteudo_texto: nota.conteudo_texto,
      tags: nota.tags,
    } as any)
    .select()
    .single();
  if (error) throw error;
  return data as Nota;
}

// ---------- Upload ----------

/** Envia um arquivo para o bucket privado e devolve uma URL assinada de longa duração. */
export async function uploadArquivo(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("estudos").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("estudos").createSignedUrl(path, 60 * 60 * 24 * 365);
  if (e2) throw e2;
  return { url: data!.signedUrl, path, nome: file.name };
}

// ---------- Utilidades ----------

export function formatarData(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const dias = Math.floor(h / 24);
  if (dias < 7) return `há ${dias}d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/** Converte o HTML do editor num Markdown simples. */
export function htmlParaMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const kids = Array.from(el.childNodes).map(walk).join("");
    switch (el.tagName) {
      case "H1": return `\n# ${kids}\n`;
      case "H2": return `\n## ${kids}\n`;
      case "H3": return `\n### ${kids}\n`;
      case "STRONG": case "B": return `**${kids}**`;
      case "EM": case "I": return `*${kids}*`;
      case "U": return `_${kids}_`;
      case "S": case "DEL": return `~~${kids}~~`;
      case "CODE": return `\`${kids}\``;
      case "PRE": return `\n\`\`\`\n${el.textContent}\n\`\`\`\n`;
      case "BLOCKQUOTE": return `\n> ${kids.trim()}\n`;
      case "HR": return `\n---\n`;
      case "BR": return `\n`;
      case "LI": {
        const parent = el.parentElement?.tagName;
        if (el.getAttribute("data-checked") !== null) {
          return `- [${el.getAttribute("data-checked") === "true" ? "x" : " "}] ${kids.trim()}\n`;
        }
        return parent === "OL" ? `1. ${kids.trim()}\n` : `- ${kids.trim()}\n`;
      }
      case "A": return `[${kids}](${el.getAttribute("href") ?? ""})`;
      case "IMG": return `![${el.getAttribute("alt") ?? "imagem"}](${el.getAttribute("src") ?? ""})`;
      case "P": return `\n${kids}\n`;
      default: return kids;
    }
  };
  return walk(doc.body).replace(/\n{3,}/g, "\n\n").trim();
}

export function baixarArquivo(nome: string, conteudo: string, mime: string) {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarPDF(titulo: string, html: string) {
  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
    h1,h2,h3{font-weight:700;margin:1.2em 0 .4em}
    pre{background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto}
    code{background:#f4f4f5;padding:2px 4px;border-radius:4px}
    blockquote{border-left:3px solid #ccc;margin:0;padding-left:12px;color:#555}
    img{max-width:100%}
    table{border-collapse:collapse;width:100%}
    td,th{border:1px solid #ddd;padding:6px}
  </style></head><body><h1>${titulo}</h1>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}