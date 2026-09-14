import { Palette, Type } from "lucide-react";
import { useState } from "react";

const TEXT_COLORS = ["#ffffff", "#f0abfc", "#e879f9", "#c084fc", "#60a5fa", "#34d399", "#facc15", "#fb923c", "#f87171", "#94a3b8"];
const BG_COLORS = ["transparent", "#3b0764", "#701a75", "#1e3a8a", "#14532d", "#713f12", "#7f1d1d", "#334155", "#0f172a"];

type Props = { currentText: string; currentBackground: string; onText: (color: string) => void; onBackground: (color: string) => void };

function Dot({ color, active, onClick, title, background = false }: { color: string; active: boolean; onClick: () => void; title: string; background?: boolean }) {
  return <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={onClick} className={`grid h-7 w-7 place-items-center rounded-lg border transition ${active ? "border-fuchsia-300 bg-fuchsia-500/15 shadow-[0_0_12px_rgba(217,70,239,.25)]" : "border-white/10 hover:border-fuchsia-300/30 hover:bg-white/5"}`}>
    <span className="h-4 w-4 rounded-md border border-white/20" style={{ background: color === "transparent" ? "repeating-linear-gradient(45deg,#111 0,#111 3px,#555 3px,#555 6px)" : color }} />
  </button>;
}

export default function EditorQuickColors({ currentText, currentBackground, onText, onBackground }: Props) {
  const [open, setOpen] = useState<"text" | "background" | null>(null);
  return <div className="relative flex items-center gap-1 border-r border-white/10 pr-1">
    <button type="button" title={`Cor do texto: ${currentText}`} onMouseDown={e => e.preventDefault()} onClick={() => setOpen(v => v === "text" ? null : "text")} className="grid h-8 w-8 place-items-center rounded-lg border border-white/5 text-white/45 hover:border-fuchsia-300/20 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"><span className="relative"><Type className="h-3.5 w-3.5" /><span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ background: currentText }} /></span></button>
    <button type="button" title="Cor de fundo" onMouseDown={e => e.preventDefault()} onClick={() => setOpen(v => v === "background" ? null : "background")} className="grid h-8 w-8 place-items-center rounded-lg border border-white/5 text-white/45 hover:border-fuchsia-300/20 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"><span className="relative"><Palette className="h-3.5 w-3.5" /><span className="absolute -bottom-1 left-0 right-0 h-1 rounded-sm" style={{ background: currentBackground === "transparent" ? "#333" : currentBackground }} /></span></button>
    {open && <div className="absolute left-0 top-10 z-[2147483647] w-56 rounded-xl border border-white/10 bg-[#11111a] p-2.5 shadow-2xl">
      <div className="mb-2 text-[8px] font-black uppercase tracking-[.16em] text-white/45">{open === "text" ? "Cor do texto" : "Cor de fundo"}</div>
      <div className="grid grid-cols-5 gap-1.5">
        {(open === "text" ? TEXT_COLORS : BG_COLORS).map(color => <Dot key={color} color={color} active={(open === "text" ? currentText : currentBackground).toLowerCase() === color.toLowerCase()} onClick={() => { open === "text" ? onText(color) : onBackground(color); setOpen(null); }} title={color} background={open === "background"} />)}
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-white/5 pt-2">
        <input type="color" value={open === "text" ? (currentText.startsWith("#") ? currentText : "#ffffff") : (currentBackground.startsWith("#") ? currentBackground : "#000000")} onChange={e => open === "text" ? onText(e.target.value) : onBackground(e.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent" />
        <span className="text-[8px] text-white/25">Escolher outra cor</span>
      </div>
    </div>}
  </div>;
}
