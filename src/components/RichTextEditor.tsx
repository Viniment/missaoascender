import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, CheckSquare, Code2, Highlighter, Italic, Link2, List, ListOrdered, Minus, Palette, Quote, Redo2, Strikethrough, Underline, Undo2 } from "lucide-react";

type Props = { value: string; onChange: (value: string) => void; placeholder?: string; minHeight?: string };

const COLORS = ["#ffffff", "#f0abfc", "#e879f9", "#c084fc", "#60a5fa", "#34d399", "#facc15", "#fb923c", "#f87171"];
const HIGHLIGHTS = ["#3b0764", "#701a75", "#1e3a8a", "#14532d", "#713f12", "#7f1d1d"];
const EMOJIS = [
  "😀", "😎", "😂", "🤣", "🥹", "😍", "🥰", "😘", "🤩", "🥳", "😤", "😈",
  "🔥", "⚡", "💥", "✨", "🌟", "💫", "🚀", "🎯", "🏆", "🥇", "💪", "🧠",
  "❤️", "🖤", "💜", "💙", "💚", "💛", "🧡", "🤍", "🙏", "👏", "🙌", "🤝",
  "⚔️", "🛡️", "👑", "💎", "💰", "📈", "📚", "💡", "🎵", "🎬", "✍️", "📌",
  "✅", "❌", "⚠️", "❗", "❓", "👉", "👀", "🫡", "🗿", "☀️", "🌙", "🌱"
];

function sanitizeHtml(html: string) {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form,svg,math").forEach(n => n.remove());
  doc.querySelectorAll("*").forEach(el => [...el.attributes].forEach(attr => {
    const name = attr.name.toLowerCase();
    const value = attr.value.trim();
    if (name.startsWith("on") || (name === "href" && !/^(https?:|mailto:|tel:|#)/i.test(value)) || (name === "src" && !/^(https?:|data:image\/)/i.test(value))) el.removeAttribute(attr.name);
  }));
  return doc.body.innerHTML;
}

function exec(command: string, value?: string) { document.execCommand(command, false, value); }

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={onClick} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/5 text-white/45 transition hover:border-fuchsia-300/20 hover:bg-fuchsia-500/10 hover:text-fuchsia-200">{children}</button>;
}

export default function RichTextEditor({ value, onChange, placeholder = "Escreva suas anotações...", minHeight = "280px" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [inlineToolbar, setInlineToolbar] = useState({ visible: false, x: 0, y: 0 });

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = sanitizeHtml(value);
  }, [value]);

  const emit = () => { if (ref.current) onChange(sanitizeHtml(ref.current.innerHTML)); };

  const rememberSelection = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) {
      setInlineToolbar(v => ({ ...v, visible: false }));
      return;
    }
    savedSelection.current = sel.getRangeAt(0).cloneRange();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const editorRect = ref.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(editorRect.width - 300, rect.left - editorRect.left + rect.width / 2 - 150));
    // A barra fica ABAIXO do texto selecionado, nunca por cima dele.
    const y = Math.max(8, rect.bottom - editorRect.top + 8);
    setInlineToolbar({ visible: true, x, y });
  };

  const restoreSelection = () => {
    if (!savedSelection.current) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedSelection.current);
  };

  const command = (name: string, arg?: string) => {
    restoreSelection();
    exec(name, arg);
    ref.current?.focus();
    emit();
    window.setTimeout(rememberSelection, 0);
  };

  const link = () => {
    restoreSelection();
    const url = window.prompt("URL do link:", "https://");
    if (url) exec("createLink", url);
    ref.current?.focus();
    emit();
  };

  const insertEmoji = (emoji: string) => {
    restoreSelection();
    exec("insertText", emoji);
    ref.current?.focus();
    emit();
    setShowEmojis(false);
    window.setTimeout(rememberSelection, 0);
  };

  const block = (type: string) => command("formatBlock", type);

  const emojiPanel = (inline = false) => (
    <div className={`${inline ? "absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2" : "absolute left-0 top-10"} z-50 w-[min(320px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#08080d] p-3 shadow-[0_20px_70px_rgba(0,0,0,.8)]`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[9px] font-black uppercase tracking-[.18em] text-white/45">Emojis</span>
        <span className="text-[8px] text-white/20">Escolha um</span>
      </div>
      <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
        {EMOJIS.map((emoji, i) => <button key={`${emoji}-${i}`} type="button" onMouseDown={e => e.preventDefault()} onClick={() => insertEmoji(emoji)} className="grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:bg-fuchsia-500/15 hover:scale-110">{emoji}</button>)}
      </div>
    </div>
  );

  return <div className="overflow-visible rounded-2xl border border-white/10 bg-[#090910] shadow-inner shadow-black/30">
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[.025] p-2">
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Desfazer" onClick={() => command("undo")}><Undo2 className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Refazer" onClick={() => command("redo")}><Redo2 className="h-3.5 w-3.5" /></ToolButton></div>
      <select onChange={e => block(e.target.value)} defaultValue="p" className="h-8 rounded-lg border border-white/10 bg-black px-2 text-[9px] font-bold text-white outline-none hover:border-fuchsia-400/30 focus:border-fuchsia-400/50"><option value="p">Texto</option><option value="h1">Título 1</option><option value="h2">Título 2</option><option value="h3">Título 3</option><option value="blockquote">Citação</option><option value="pre">Código</option></select>
      <select onChange={e => command("fontName", e.target.value)} defaultValue="Arial" className="h-8 max-w-28 rounded-lg border border-white/10 bg-black px-2 text-[9px] font-bold text-white outline-none hover:border-fuchsia-400/30 focus:border-fuchsia-400/50"><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option><option>Courier New</option><option>Trebuchet MS</option></select>
      <select onChange={e => command("fontSize", e.target.value)} defaultValue="3" className="h-8 rounded-lg border border-white/10 bg-black px-2 text-[9px] font-bold text-white outline-none hover:border-fuchsia-400/30 focus:border-fuchsia-400/50"><option value="2">Pequeno</option><option value="3">Normal</option><option value="4">Grande</option><option value="5">Muito grande</option><option value="6">Enorme</option></select>
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Negrito" onClick={() => command("bold")}><Bold className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Itálico" onClick={() => command("italic")}><Italic className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Sublinhado" onClick={() => command("underline")}><Underline className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Tachado" onClick={() => command("strikeThrough")}><Strikethrough className="h-3.5 w-3.5" /></ToolButton></div>
      <div className="relative flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Cor do texto" onClick={() => { setShowColors(v => !v); setShowHighlights(false); setShowEmojis(false); }}><Palette className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Marca-texto" onClick={() => { setShowHighlights(v => !v); setShowColors(false); setShowEmojis(false); }}><Highlighter className="h-3.5 w-3.5" /></ToolButton>{showColors && <div className="absolute left-0 top-10 z-50 flex w-48 flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#11111a] p-2 shadow-2xl">{COLORS.map(c => <button key={c} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { command("foreColor", c); setShowColors(false); }} className="h-6 w-6 rounded-full border border-white/20" style={{ background: c }} />)}</div>}{showHighlights && <div className="absolute left-0 top-10 z-50 flex w-44 flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#11111a] p-2 shadow-2xl">{HIGHLIGHTS.map(c => <button key={c} type="button" onMouseDown={e => e.preventDefault()} onClick={() => { command("hiliteColor", c); setShowHighlights(false); }} className="h-6 w-6 rounded-md border border-white/20" style={{ background: c }} />)}</div>}</div>
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Alinhar à esquerda" onClick={() => command("justifyLeft")}><AlignLeft className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Centralizar" onClick={() => command("justifyCenter")}><AlignCenter className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Alinhar à direita" onClick={() => command("justifyRight")}><AlignRight className="h-3.5 w-3.5" /></ToolButton></div>
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Lista com marcadores" onClick={() => command("insertUnorderedList")}><List className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Lista numerada" onClick={() => command("insertOrderedList")}><ListOrdered className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Checklist" onClick={() => command("insertUnorderedList")}><CheckSquare className="h-3.5 w-3.5" /></ToolButton></div>
      <ToolButton title="Citação" onClick={() => block("blockquote")}><Quote className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Código" onClick={() => block("pre")}><Code2 className="h-3.5 w-3.5" /></ToolButton><ToolButton title="Inserir link" onClick={link}><Link2 className="h-3.5 w-3.5" /></ToolButton>
      <div className="relative"><ToolButton title="Inserir emoji" onClick={() => { setShowEmojis(v => !v); setShowColors(false); setShowHighlights(false); }}>😀</ToolButton>{showEmojis && emojiPanel()}</div>
      <ToolButton title="Linha separadora" onClick={() => command("insertHorizontalRule")}><Minus className="h-3.5 w-3.5" /></ToolButton>
    </div>

    <div className="relative">
      {inlineToolbar.visible && <div style={{ left: inlineToolbar.x, top: inlineToolbar.y }} className="absolute z-40 flex items-center gap-1 rounded-xl border border-white/10 bg-[#050507]/[.98] p-1.5 shadow-[0_16px_50px_rgba(0,0,0,.8)] backdrop-blur-xl" onMouseDown={e => e.preventDefault()}>
        <ToolButton title="Negrito" onClick={() => command("bold")}><Bold className="h-3.5 w-3.5" /></ToolButton>
        <ToolButton title="Itálico" onClick={() => command("italic")}><Italic className="h-3.5 w-3.5" /></ToolButton>
        <ToolButton title="Sublinhado" onClick={() => command("underline")}><Underline className="h-3.5 w-3.5" /></ToolButton>
        <ToolButton title="Tachado" onClick={() => command("strikeThrough")}><Strikethrough className="h-3.5 w-3.5" /></ToolButton>
        <ToolButton title="Cor do texto" onClick={() => { setShowColors(v => !v); setShowHighlights(false); setShowEmojis(false); }}><Palette className="h-3.5 w-3.5" /></ToolButton>
        <ToolButton title="Marca-texto" onClick={() => { setShowHighlights(v => !v); setShowColors(false); setShowEmojis(false); }}><Highlighter className="h-3.5 w-3.5" /></ToolButton>
        <ToolButton title="Inserir link" onClick={link}><Link2 className="h-3.5 w-3.5" /></ToolButton>
        <div className="relative"><ToolButton title="Emoji" onClick={() => { setShowEmojis(v => !v); setShowColors(false); setShowHighlights(false); }}>😀</ToolButton>{showEmojis && emojiPanel(true)}</div>
      </div>}
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={emit} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onSelect={rememberSelection} onBlur={() => { emit(); rememberSelection(); }} data-placeholder={placeholder} className="rich-notes-editor w-full overflow-y-auto px-4 py-4 text-[14px] leading-7 text-white/85 outline-none sm:px-5 sm:py-5" style={{ minHeight }} />
    </div>
    <div className="flex items-center justify-between border-t border-white/5 bg-white/[.015] px-3 py-2 text-[7px] font-bold uppercase tracking-[.16em] text-white/20"><span>Editor rico</span><span>Formatação salva com a anotação</span></div>
  </div>;
}
