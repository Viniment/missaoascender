import { useRef, useState } from "react";
import { X, Upload, Trash2, Loader2 } from "lucide-react";
import { BANNER_PRESETS, EMOJIS_SUGERIDOS, uploadArquivo, type Categoria } from "@/lib/estudos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BannerFundo({ cat, className }: { cat: Partial<Categoria>; className?: string }) {
  const preset = cat.banner_preset ? BANNER_PRESETS[cat.banner_preset] : null;
  if (cat.banner_url) {
    return (
      <div
        className={cn("bg-no-repeat", className)}
        style={{
          backgroundImage: `url(${cat.banner_url})`,
          backgroundSize: `${cat.banner_zoom ?? 100}% auto`,
          backgroundPosition: `center ${cat.banner_pos ?? 50}%`,
        }}
      />
    );
  }
  return <div className={className} style={{ background: preset?.css ?? BANNER_PRESETS.grafite.css }} />;
}

export default function CategoriaDialog({
  userId, inicial, onClose, onSave,
}: {
  userId: string;
  inicial?: Categoria | null;
  onClose: () => void;
  onSave: (patch: Partial<Categoria>) => Promise<void> | void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [emoji, setEmoji] = useState(inicial?.emoji ?? "📚");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [preset, setPreset] = useState(inicial?.banner_preset ?? "neon");
  const [bannerUrl, setBannerUrl] = useState<string | null>(inicial?.banner_url ?? null);
  const [pos, setPos] = useState<number>(inicial?.banner_pos ?? 50);
  const [zoom, setZoom] = useState<number>(inicial?.banner_zoom ?? 100);
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const salvar = async () => {
    if (!nome.trim()) { toast.error("Dê um nome ao caderno."); return; }
    setSalvando(true);
    try {
      await onSave({
        nome: nome.trim(), emoji, descricao: descricao.trim() || null,
        banner_preset: bannerUrl ? null : preset, banner_url: bannerUrl,
        banner_pos: pos, banner_zoom: zoom,
      });
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="relative h-28">
          <BannerFundo cat={{ banner_preset: preset, banner_url: bannerUrl, banner_pos: pos, banner_zoom: zoom }}
            className="absolute inset-0 rounded-t-2xl" />
          <button onClick={onClose} aria-label="Fechar"
            className="absolute right-2 top-2 h-8 w-8 grid place-items-center rounded-full bg-black/40 text-white hover:bg-black/70">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute -bottom-5 left-5 h-12 w-12 grid place-items-center rounded-xl border border-border bg-card text-2xl">
            {emoji}
          </div>
        </div>

        <div className="p-5 pt-8 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Pentest"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Descrição (opcional)</label>
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Sobre o que é este caderno"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Emoji</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {EMOJIS_SUGERIDOS.map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={cn("h-8 w-8 rounded-lg border text-lg transition",
                    emoji === e ? "border-primary bg-primary/15" : "border-transparent hover:bg-muted")}>{e}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Banner</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {Object.entries(BANNER_PRESETS).map(([id, p]) => (
                <button key={id} type="button" onClick={() => { setPreset(id); setBannerUrl(null); }}
                  className={cn("h-10 rounded-lg border transition", !bannerUrl && preset === id ? "border-primary ring-1 ring-primary" : "border-border")}
                  style={{ background: p.css }} title={p.nome} aria-label={p.nome} />
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={enviando}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary hover:text-primary">
                {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Enviar imagem
              </button>
              {bannerUrl && (
                <button type="button" onClick={() => setBannerUrl(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-destructive hover:border-destructive">
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </button>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = "";
                if (!f) return;
                setEnviando(true);
                try { const { url } = await uploadArquivo(userId, f); setBannerUrl(url); }
                catch { toast.error("Falha ao enviar a imagem."); }
                finally { setEnviando(false); }
              }} />

            {bannerUrl && (
              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Reposicionar</span>
                  <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="w-full accent-primary" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Zoom</span>
                  <input type="range" min={100} max={300} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-xs hover:bg-muted">Cancelar</button>
            <button onClick={salvar} disabled={salvando}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {salvando ? "Salvando..." : inicial ? "Salvar" : "Criar caderno"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}