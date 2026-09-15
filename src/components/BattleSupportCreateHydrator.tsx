import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, FileText, Link2, Play } from "lucide-react";
import { toast } from "sonner";
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

export default function BattleSupportCreateHydrator({ userId }: { userId: string }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [youtube, setYoutube] = useState("");
  const previousIds = useRef<Set<string>>(new Set());
  const pending = useRef<{ nome: string; texto: string; youtube: string } | null>(null);

  useEffect(() => {
    const findForm = () => {
      const panels = Array.from(document.querySelectorAll(".rpg-panel.scanlines"));
      const form = panels.find(el => el.textContent?.includes("Nova ação de batalha")) as HTMLElement | undefined;
      if (!form) { setHost(null); return; }
      let support = form.querySelector("[data-battle-create-support]") as HTMLElement | null;
      if (!support) {
        support = document.createElement("div");
        support.dataset.battleCreateSupport = "1";
        const button = Array.from(form.querySelectorAll("button")).find(b => b.textContent?.includes("Forjar ação"));
        if (button) form.insertBefore(support, button);
        else form.appendChild(support);
      }
      setHost(support);
    };
    findForm();
    const observer = new MutationObserver(findForm);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!host) { setAberto(false); setTexto(""); setYoutube(""); return; }
    const button = Array.from(host.parentElement?.querySelectorAll("button") ?? []).find(b => b.textContent?.includes("Forjar ação"));
    if (!button) return;
    const capture = async () => {
      const nameInput = host.parentElement?.querySelector('input[placeholder="Nomeie sua ação"]') as HTMLInputElement | null;
      if (!nameInput || (!texto.trim() && !youtube.trim())) return;
      try {
        const { data, error } = await supabase.from("habitos").select("id").eq("user_id", userId).eq("ativo", true);
        if (!error) previousIds.current = new Set((data ?? []).map(x => x.id));
      } catch {}
      pending.current = { nome: nameInput.value.trim(), texto, youtube };
      window.setTimeout(async () => {
        const p = pending.current;
        if (!p) return;
        try {
          const normalized = normalizeYoutubeUrl(p.youtube);
          for (let attempt = 0; attempt < 6; attempt++) {
            const { data, error } = await supabase.from("habitos").select("id,nome").eq("user_id", userId).eq("ativo", true);
            if (error) throw error;
            const created = (data ?? []).find(h => !previousIds.current.has(h.id) && h.nome === p.nome);
            if (created) {
              const { error: updateError } = await supabase.from("habitos").update({ texto_apoio_html: p.texto.trim() || null, youtube_url: normalized || null }).eq("id", created.id);
              if (updateError) throw updateError;
              pending.current = null;
              toast.success("Material de apoio adicionado à ação.");
              return;
            }
            await new Promise(resolve => window.setTimeout(resolve, 500));
          }
          throw new Error("Não encontrei a nova ação para vincular o material de apoio.");
        } catch (e: any) {
          pending.current = null;
          toast.error(e.message ?? "Não foi possível salvar o material de apoio.");
        }
      }, 700);
    };
    button.addEventListener("click", capture, true);
    return () => button.removeEventListener("click", capture, true);
  }, [host, userId, texto, youtube]);

  if (!host) return null;
  return createPortal(
    <div className="mt-3">
      <div className={`rounded-xl border transition-all ${aberto ? "border-primary/25 bg-gradient-to-br from-primary/[0.055] to-background/20" : "border-border/60 bg-secondary/15"}`}>
        <button type="button" onClick={() => setAberto(v => !v)} className="w-full p-3 flex items-center gap-3 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><FileText className="w-4 h-4" /></span>
          <span className="flex-1 min-w-0"><span className="block text-[9px] uppercase tracking-[0.25em] text-primary">Material de apoio <span className="text-muted-foreground normal-case tracking-normal">(opcional)</span></span><span className="block text-[10px] text-muted-foreground mt-1">{aberto ? "Configure texto e/ou vídeo para consultar durante a batalha." : "Toque para adicionar descrição ou vídeo."}</span></span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${aberto ? "rotate-180 text-primary" : ""}`} />
        </button>
        {aberto && <div className="px-3 pb-3 space-y-3">
          <div className="rounded-xl border border-primary/15 bg-background/25 p-3 space-y-3">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><div><p className="text-[9px] uppercase tracking-[0.22em] text-primary">Descrição / texto rico</p><p className="text-[10px] text-muted-foreground">Opcional. Use o mesmo editor rico do Gerenciador de Projetos.</p></div></div>
            <RichTextEditor value={texto} onChange={setTexto} placeholder="Escreva o passo a passo, lembrete, técnica, oração, estratégia..." minHeight="240px" />
          </div>
          <div className="rounded-xl border border-red-400/15 bg-red-500/[0.025] p-3 space-y-3">
            <div className="flex items-center gap-2"><Play className="w-4 h-4 text-red-300 fill-current" /><div><p className="text-[9px] uppercase tracking-[0.22em] text-red-300">Vídeo do YouTube</p><p className="text-[10px] text-muted-foreground">Opcional. O player aparecerá dentro da ação.</p></div></div>
            <div className="relative"><Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="URL do vídeo do YouTube" className="w-full bg-background/65 border border-border/70 rounded-xl pl-9 pr-3.5 py-3 text-sm outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/10 transition-colors" placeholder="https://www.youtube.com/watch?v=..." value={youtube} onChange={e => setYoutube(e.target.value)} /></div>
          </div>
        </div>}
      </div>
    </div>, host
  );
}
