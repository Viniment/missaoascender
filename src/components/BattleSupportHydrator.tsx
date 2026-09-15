import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Play, ChevronDown, ChevronUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Support = { id: string; nome: string; texto_apoio_html: string | null; youtube_url: string | null };

function youtubeId(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      const i = parts.findIndex(x => x === "embed" || x === "shorts" || x === "live");
      return i >= 0 ? parts[i + 1] || null : null;
    }
  } catch {}
  return null;
}

function safeHtml(html: string) {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form,svg,math").forEach(n => n.remove());
  doc.querySelectorAll("*").forEach(el => [...el.attributes].forEach(attr => {
    const n = attr.name.toLowerCase(); const v = attr.value.trim();
    if (n.startsWith("on") || (n === "href" && !/^(https?:|mailto:|tel:|#)/i.test(v)) || (n === "src" && !/^(https?:|data:image\/)/i.test(v))) el.removeAttribute(attr.name);
  }));
  return doc.body.innerHTML;
}

function SupportActions({ item }: { item: Support }) {
  const hasText = !!item.texto_apoio_html?.replace(/<[^>]+>/g, "").trim();
  const videoId = useMemo(() => youtubeId(item.youtube_url), [item.youtube_url]);
  const hasVideo = !!videoId;
  const [open, setOpen] = useState<"text" | "video" | null>(null);
  if (!hasText && !hasVideo) return null;
  return <div className="mt-3 rounded-xl border border-primary/15 bg-background/25 p-2.5" data-battle-support>
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[8px] font-black uppercase tracking-[.22em] text-primary/65">APOIO DA MISSÃO</span>
      {hasText && <button type="button" onClick={() => setOpen(open === "text" ? null : "text")} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-bold transition ${open === "text" ? "border-primary/45 bg-primary/10 text-primary" : "border-border/70 bg-background/35 text-muted-foreground hover:border-primary/30 hover:text-primary"}`}><FileText className="h-3.5 w-3.5" /> Texto {open === "text" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>}
      {hasVideo && <button type="button" onClick={() => setOpen(open === "video" ? null : "video")} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-bold transition ${open === "video" ? "border-red-400/40 bg-red-500/10 text-red-300" : "border-border/70 bg-background/35 text-muted-foreground hover:border-red-400/30 hover:text-red-300"}`}><Play className="h-3.5 w-3.5 fill-current" /> Vídeo {open === "video" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>}
    </div>
    {open === "text" && hasText && <div className="relative mt-2.5 rounded-xl border border-white/10 bg-[#090910] p-3.5 text-white/85 shadow-inner">
      <button type="button" onClick={() => setOpen(null)} className="absolute right-2 top-2 rounded-md p-1 text-white/35 hover:text-white" aria-label="Fechar texto"><X className="h-3.5 w-3.5" /></button>
      <div className="rich-notes-editor pr-5 text-[13px] leading-7 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h4]:text-base [&_h5]:text-sm [&_h6]:text-xs [&_h1]:font-extrabold [&_h2]:font-extrabold [&_h3]:font-extrabold [&_h4]:font-extrabold [&_h5]:font-extrabold [&_h6]:font-extrabold [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/60 [&_blockquote]:bg-primary/5 [&_blockquote]:px-3 [&_blockquote]:py-2 [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: safeHtml(item.texto_apoio_html || "") }} />
    </div>}
    {open === "video" && videoId && <div className="relative mt-2.5 overflow-hidden rounded-xl border border-red-400/15 bg-black shadow-[0_0_25px_rgba(239,68,68,.08)]"><div className="aspect-video"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`} title={`Vídeo de apoio: ${item.nome}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></div>}
  </div>;
}

export default function BattleSupportHydrator({ userId }: { userId: string }) {
  const [items, setItems] = useState<Support[]>([]);
  const [targets, setTargets] = useState<Array<{ el: HTMLElement; item: Support }>>([]);

  const load = async () => {
    const { data } = await supabase.from("habitos").select("id,nome,texto_apoio_html,youtube_url").eq("user_id", userId).eq("ativo", true);
    setItems((data || []) as Support[]);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel(`battle-support-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "habitos", filter: `user_id=eq.${userId}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    let timer: number | undefined;
    const scan = () => {
      const next: Array<{ el: HTMLElement; item: Support }> = [];
      for (const item of items) {
        const nodes = Array.from(document.querySelectorAll("p"));
        const match = nodes.find(n => n.textContent?.trim() === item.nome && !!n.closest("div.relative.overflow-hidden.rounded-xl.border"));
        const row = match?.closest("div.relative.overflow-hidden.rounded-xl.border") as HTMLElement | null;
        if (!row) continue;
        let host = row.querySelector<HTMLElement>(`[data-battle-support-host="${CSS.escape(item.id)}"]`);
        if (!host) { host = document.createElement("div"); host.dataset.battleSupportHost = item.id; row.appendChild(host); }
        next.push({ el: host, item });
      }
      setTargets(prev => {
        const same = prev.length === next.length && prev.every((p, i) => p.el === next[i]?.el && p.item.id === next[i]?.item.id && p.item.texto_apoio_html === next[i]?.item.texto_apoio_html && p.item.youtube_url === next[i]?.item.youtube_url);
        return same ? prev : next;
      });
    };
    scan();
    const observer = new MutationObserver(() => { window.clearTimeout(timer); timer = window.setTimeout(scan, 80); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [items]);

  return <>{targets.map(({ el, item }) => createPortal(<SupportActions key={item.id} item={item} />, el))}</>;
}
