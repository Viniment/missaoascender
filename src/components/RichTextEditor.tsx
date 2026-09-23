import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, CheckSquare, Code2, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Underline, Undo2 } from "lucide-react";
import EditorQuickColors from "@/components/EditorQuickColors";
import EditorTemplatesMenu from "@/components/EditorTemplatesMenu";

type Props = { value: string; onChange: (value: string) => void; placeholder?: string; minHeight?: string };
const BLOCKS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"];
const FONTS = ["Arial", "Georgia", "Verdana", "Tahoma", "Courier New", "Trebuchet MS"];
const SIZES = ["2", "3", "4", "5", "6"];
const EMOJI_GROUPS = [
  { label: "Rostos", emojis: ["😀","😎","😂","🤣","😍","🥰","😘","🤩","🥳","😤","😈"] },
  { label: "Energia", emojis: ["🔥","⚡","💥","✨","🌟","💫","🚀","🎯","🏆","🥇","💪"] },
  { label: "Emoção", emojis: ["🧠","❤️","🖤","💜","💙","💚","💛","🧡","🤍","🙏","👏","🙌","🤝"] },
  { label: "Batalha", emojis: ["⚔️","🛡️","👑","💎","💰","📈","🎯","🏆"] },
  { label: "Criação", emojis: ["📚","💡","🎵","🎬","✍️","📌","✅","❌","⚠️","❗","❓","👉","👀","🗿","☀️","🌙","🌱"] },
];

function sanitizeHtml(html: string) {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form,svg,math").forEach(n => n.remove());
  doc.querySelectorAll("*").forEach(el => [...el.attributes].forEach(attr => {
    const name = attr.name.toLowerCase(); const v = attr.value.trim();
    if (name.startsWith("on") || (name === "href" && !/^(https?:|mailto:|tel:|#)/i.test(v)) || (name === "src" && !/^(https?:|data:image\/)/i.test(v))) el.removeAttribute(attr.name);
  }));
  return doc.body.innerHTML;
}
function exec(command: string, value?: string) { document.execCommand(command, false, value); }
function normalizeColor(value: string, fallback: string) {
  const raw = value.trim().replace(/[\"']/g, "");
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  const m = raw.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
  return m ? `#${[m[1],m[2],m[3]].map(v => Number(v).toString(16).padStart(2,"0")).join("")}` : fallback;
}
function ToolButton({ title, onClick, children, active = false }: { title: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode; active?: boolean }) {
  return <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={onClick} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${active ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_14px_rgba(217,70,239,.22)]" : "border-white/5 text-white/45 hover:border-fuchsia-300/20 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"}`}>{children}</button>;
}

export default function RichTextEditor({ value, onChange, placeholder = "Escreva suas anotações...", minHeight = "280px" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const [showTopEmojis, setShowTopEmojis] = useState(false);
  const [showInlineEmojis, setShowInlineEmojis] = useState(false);
  const [emojiPosition, setEmojiPosition] = useState({ left: 0, top: 0, centered: false });
  const [inlineToolbar, setInlineToolbar] = useState({ visible: false, x: 0, y: 0 });
  const [active, setActive] = useState({ bold:false, italic:false, underline:false, strikeThrough:false, justifyLeft:false, justifyCenter:false, justifyRight:false, unorderedList:false, orderedList:false });
  const [currentBlock, setCurrentBlock] = useState("p");
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState("3");
  const [currentTextColor, setCurrentTextColor] = useState("#ffffff");
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState("transparent");

  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = sanitizeHtml(value); }, [value]);
  useEffect(() => {
    const rememberCaret = () => { const sel = window.getSelection(); if (sel?.rangeCount && ref.current?.contains(sel.anchorNode)) savedSelection.current = sel.getRangeAt(0).cloneRange(); };
    document.addEventListener("selectionchange", rememberCaret);
    return () => document.removeEventListener("selectionchange", rememberCaret);
  }, []);

  const syncActive = () => {
    if (!ref.current) return;
    setActive({ bold:document.queryCommandState("bold"), italic:document.queryCommandState("italic"), underline:document.queryCommandState("underline"), strikeThrough:document.queryCommandState("strikeThrough"), justifyLeft:document.queryCommandState("justifyLeft"), justifyCenter:document.queryCommandState("justifyCenter"), justifyRight:document.queryCommandState("justifyRight"), unorderedList:document.queryCommandState("insertUnorderedList"), orderedList:document.queryCommandState("insertOrderedList") });
    const block = String(document.queryCommandValue("formatBlock") || "p").replace(/[<>]/g, "").toLowerCase();
    setCurrentBlock(BLOCKS.includes(block) ? block : "p");
    const font = String(document.queryCommandValue("fontName") || "Arial").replace(/[\"']/g, "").trim();
    setCurrentFont(FONTS.find(f => f.toLowerCase() === font.toLowerCase()) || "Arial");
    const size = String(document.queryCommandValue("fontSize") || "3");
    setCurrentSize(SIZES.includes(size) ? size : "3");
    setCurrentTextColor(normalizeColor(String(document.queryCommandValue("foreColor") || ""), "#ffffff"));
    const bg = String(document.queryCommandValue("hiliteColor") || document.queryCommandValue("backColor") || "");
    setCurrentBackgroundColor(bg && bg !== "transparent" ? normalizeColor(bg, "transparent") : "transparent");
  };
  const emit = () => { if (ref.current) onChange(sanitizeHtml(ref.current.innerHTML)); };
  const rememberSelection = () => {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !ref.current?.contains(sel.anchorNode)) { setInlineToolbar(v=>({...v,visible:false})); setShowInlineEmojis(false); return; }
    savedSelection.current = sel.getRangeAt(0).cloneRange(); syncActive();
    if (sel.isCollapsed) { setInlineToolbar(v=>({...v,visible:false})); return; }
    const rect=sel.getRangeAt(0).getBoundingClientRect(), er=ref.current.getBoundingClientRect();
    setInlineToolbar({visible:true,x:Math.max(8,Math.min(er.width-300,rect.left-er.left+rect.width/2-150)),y:Math.max(8,rect.bottom-er.top+8)});
  };
  const restoreSelection = () => { if (!savedSelection.current || !ref.current) return; const sel=window.getSelection(); sel?.removeAllRanges(); sel?.addRange(savedSelection.current); syncActive(); };
  const command = (name:string,arg?:string) => { restoreSelection(); exec(name,arg); ref.current?.focus(); emit(); syncActive(); window.setTimeout(rememberSelection,0); };

  // Every block type owns a fixed preset. Changing type resets size/weight/style from the previous block.
  const applyBlock = (type:string) => {
    restoreSelection();
    const sel = window.getSelection();
    const anchor = sel?.anchorNode;
    const block = anchor instanceof Element ? anchor.closest("p,h1,h2,h3,h4,h5,h6,blockquote,pre") : anchor?.parentElement?.closest("p,h1,h2,h3,h4,h5,h6,blockquote,pre");
    if (block) {
      block.querySelectorAll("font").forEach(font => {
        font.removeAttribute("size");
        (font as HTMLElement).style.removeProperty("font-size");
        (font as HTMLElement).style.removeProperty("font-weight");
      });
      block.querySelectorAll("[style]").forEach(el => {
        const node = el as HTMLElement;
        node.style.removeProperty("font-size");
        node.style.removeProperty("font-weight");
        if (!node.getAttribute("style")?.trim()) node.removeAttribute("style");
      });
    }
    exec("formatBlock",`<${type}>`);
    ref.current?.focus();
    emit();
    syncActive();
    window.setTimeout(rememberSelection,0);
  };
  // Manual size/font is still the most recent direct formatting action and converts headings to normal text.
  const applySize = (size:string) => { restoreSelection(); const block=String(document.queryCommandValue("formatBlock")||"p").replace(/[<>]/g,"").toLowerCase(); if(/^h[1-6]$/.test(block)) exec("formatBlock","<p>"); exec("fontSize",size); ref.current?.focus(); emit(); syncActive(); window.setTimeout(rememberSelection,0); };
  const applyFont = (font:string) => { restoreSelection(); const block=String(document.queryCommandValue("formatBlock")||"p").replace(/[<>]/g,"").toLowerCase(); if(/^h[1-6]$/.test(block)) exec("formatBlock","<p>"); exec("fontName",font); ref.current?.focus(); emit(); syncActive(); window.setTimeout(rememberSelection,0); };
  const link=()=>{restoreSelection();const url=window.prompt("URL do link:","https://");if(url)exec("createLink",url);ref.current?.focus();emit();syncActive();};
  const insertEmoji=(emoji:string)=>{restoreSelection();exec("insertText",emoji);ref.current?.focus();emit();setShowTopEmojis(false);setShowInlineEmojis(false);window.setTimeout(rememberSelection,0);};
  const applyTemplate=(html:string)=>{if(ref.current){ref.current.innerHTML=sanitizeHtml(html);emit();ref.current.focus();}setShowTopEmojis(false);setShowInlineEmojis(false);setInlineToolbar(v=>({...v,visible:false}));window.setTimeout(rememberSelection,0);};
  const toggleEmoji=(inline:boolean,el:HTMLElement)=>{const r=el.getBoundingClientRect();setEmojiPosition({left:inline?r.left+r.width/2:Math.min(r.left,window.innerWidth-370),top:r.bottom+8,centered:inline});if(inline){setShowInlineEmojis(v=>!v);setShowTopEmojis(false);}else{setShowTopEmojis(v=>!v);setShowInlineEmojis(false);}};
  const emojiPanel=()=> <div style={{left:emojiPosition.left,top:emojiPosition.top,transform:emojiPosition.centered?"translateX(-50%)":undefined}} className="fixed z-[2147483647] w-[min(380px,calc(100vw-20px))] overflow-hidden rounded-2xl border border-white/10 bg-[#08080d]/[.98] shadow-[0_20px_70px_rgba(0,0,0,.9)] backdrop-blur-xl"><div className="border-b border-white/10 bg-white/[.035] px-3 py-2.5"><div className="text-[10px] font-black uppercase tracking-[.18em] text-white/70">Emojis</div><div className="mt-0.5 text-[8px] text-white/25">Insira no ponto atual do texto</div></div><div className="emoji-picker-scroll max-h-[70vh] space-y-3 overflow-y-auto p-3">{EMOJI_GROUPS.map(g=><div key={g.label}><div className="px-1 pb-1.5 text-[7px] font-black uppercase tracking-[.16em] text-fuchsia-200/45">{g.label}</div><div className="grid grid-cols-8 gap-1">{g.emojis.map((emoji,i)=><button key={`${g.label}-${emoji}-${i}`} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>insertEmoji(emoji)} className="grid h-9 w-full place-items-center rounded-lg border border-transparent text-lg transition hover:border-fuchsia-300/15 hover:bg-fuchsia-500/10 hover:scale-105">{emoji}</button>)}</div></div>)}</div></div>;
  const blockOptions=[["p","Texto"],["h1","Título 1"],["h2","Título 2"],["h3","Título 3"],["h4","Título 4"],["h5","Título 5"],["h6","Título 6"],["blockquote","Citação"],["pre","Código"]];

  return <div className="overflow-visible rounded-2xl border border-white/10 bg-[#090910] shadow-inner shadow-black/30">
    <style>{`.emoji-picker-scroll::-webkit-scrollbar{width:7px}.emoji-picker-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.035);border-radius:999px}.emoji-picker-scroll::-webkit-scrollbar-thumb{background:rgba(156,163,175,.55);border-radius:999px}.emoji-picker-scroll{scrollbar-color:rgba(156,163,175,.6) rgba(255,255,255,.035);scrollbar-width:thin}.rich-notes-editor ul{list-style-type:disc!important;padding-left:1.5rem!important}.rich-notes-editor ol{list-style-type:decimal!important;padding-left:1.5rem!important}.rich-notes-editor li{padding-left:.25rem!important;display:list-item!important}.rich-notes-editor h1{font-size:2rem!important}.rich-notes-editor h2{font-size:1.65rem!important}.rich-notes-editor h3{font-size:1.4rem!important}.rich-notes-editor h4{font-size:1.2rem!important}.rich-notes-editor h5{font-size:1.05rem!important}.rich-notes-editor h6{font-size:.95rem!important}.rich-notes-editor h1,.rich-notes-editor h2,.rich-notes-editor h3,.rich-notes-editor h4,.rich-notes-editor h5,.rich-notes-editor h6{font-weight:800!important;line-height:1.25!important;color:#fff!important;margin:.7em 0 .35em}.rich-notes-editor blockquote{border-left:4px solid rgba(217,70,239,.7)!important;border-radius:0 12px 12px 0!important;background:linear-gradient(90deg,rgba(217,70,239,.12),rgba(217,70,239,.025))!important;padding:1rem 1.25rem!important;font-style:italic!important}.rich-notes-editor pre{border:1px solid rgba(167,139,250,.22)!important;border-radius:14px!important;background:#11111a!important;padding:1rem!important;overflow-x:auto!important;font-family:"Courier New",monospace!important}.rich-notes-editor p{font-size:1rem;line-height:1.75}.rich-notes-editor font[size="2"]{font-size:.9rem!important}`}</style>
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[.025] p-2">
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Desfazer" onClick={()=>command("undo")}><Undo2 className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Refazer" onClick={()=>command("redo")}><Redo2 className="h-3.5 w-3.5"/></ToolButton></div>
      <select value={currentBlock} onChange={e=>applyBlock(e.target.value)} className="h-8 rounded-lg border border-white/10 bg-black px-2 text-[9px] font-bold text-white outline-none hover:border-fuchsia-400/30">{blockOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      <select value={currentFont} onChange={e=>applyFont(e.target.value)} className="h-8 max-w-28 rounded-lg border border-white/10 bg-black px-2 text-[9px] font-bold text-white outline-none hover:border-fuchsia-400/30">{FONTS.map(f=><option key={f}>{f}</option>)}</select>
      <select value={currentSize} onChange={e=>applySize(e.target.value)} className="h-8 rounded-lg border border-white/10 bg-black px-2 text-[9px] font-bold text-white outline-none hover:border-fuchsia-400/30"><option value="2">Pequeno</option><option value="3">Normal</option><option value="4">Grande</option><option value="5">Muito grande</option><option value="6">Enorme</option></select>
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Negrito" active={active.bold} onClick={()=>command("bold")}><Bold className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Itálico" active={active.italic} onClick={()=>command("italic")}><Italic className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Sublinhado" active={active.underline} onClick={()=>command("underline")}><Underline className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Tachado" active={active.strikeThrough} onClick={()=>command("strikeThrough")}><Strikethrough className="h-3.5 w-3.5"/></ToolButton></div>
      <EditorQuickColors currentText={currentTextColor} currentBackground={currentBackgroundColor} onText={c=>command("foreColor",c)} onBackground={c=>command("hiliteColor",c==="transparent"?"transparent":c)}/>
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Alinhar à esquerda" active={active.justifyLeft} onClick={()=>command("justifyLeft")}><AlignLeft className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Centralizar" active={active.justifyCenter} onClick={()=>command("justifyCenter")}><AlignCenter className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Alinhar à direita" active={active.justifyRight} onClick={()=>command("justifyRight")}><AlignRight className="h-3.5 w-3.5"/></ToolButton></div>
      <div className="flex items-center gap-1 border-r border-white/10 pr-1"><ToolButton title="Lista com marcadores" active={active.unorderedList} onClick={()=>command("insertUnorderedList")}><List className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Lista numerada" active={active.orderedList} onClick={()=>command("insertOrderedList")}><ListOrdered className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Checklist" active={active.unorderedList} onClick={()=>command("insertUnorderedList")}><CheckSquare className="h-3.5 w-3.5"/></ToolButton></div>
      <ToolButton title="Citação" active={currentBlock==="blockquote"} onClick={()=>applyBlock("blockquote")}><Quote className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Código" active={currentBlock==="pre"} onClick={()=>applyBlock("pre")}><Code2 className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Inserir link" onClick={link}><Link2 className="h-3.5 w-3.5"/></ToolButton>
      <div className="relative"><ToolButton title="Inserir emoji" onClick={e=>toggleEmoji(false,e.currentTarget)}>😀</ToolButton>{showTopEmojis&&emojiPanel()}</div><EditorTemplatesMenu value={value} onApply={applyTemplate}/><ToolButton title="Linha separadora" onClick={()=>command("insertHorizontalRule")}><Minus className="h-3.5 w-3.5"/></ToolButton>
    </div>
    <div className="relative">
      {inlineToolbar.visible&&<div style={{left:inlineToolbar.x,top:inlineToolbar.y}} className="absolute z-40 flex items-center gap-1 rounded-xl border border-white/10 bg-[#050507]/[.98] p-1.5 shadow-[0_16px_50px_rgba(0,0,0,.8)] backdrop-blur-xl" onMouseDown={e=>e.preventDefault()}><ToolButton title="Negrito" active={active.bold} onClick={()=>command("bold")}><Bold className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Itálico" active={active.italic} onClick={()=>command("italic")}><Italic className="h-3.5 w-3.5"/></ToolButton><ToolButton title="Sublinhado" active={active.underline} onClick={()=>command("underline")}><Underline className="h-3.5 w-3.5"/></ToolButton><EditorQuickColors currentText={currentTextColor} currentBackground={currentBackgroundColor} onText={c=>command("foreColor",c)} onBackground={c=>command("hiliteColor",c==="transparent"?"transparent":c)}/><ToolButton title="Inserir link" onClick={link}><Link2 className="h-3.5 w-3.5"/></ToolButton><div className="relative"><ToolButton title="Emoji" onClick={e=>toggleEmoji(true,e.currentTarget)}>😀</ToolButton>{showInlineEmojis&&emojiPanel()}</div></div>}
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={emit} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onSelect={rememberSelection} onFocus={rememberSelection} onBlur={()=>{emit();rememberSelection();}} data-placeholder={placeholder} className="rich-notes-editor w-full overflow-y-auto px-4 py-4 text-[14px] leading-7 text-white/85 outline-none sm:px-5 sm:py-5" style={{minHeight}}/>
    </div>
    <div className="flex items-center justify-between border-t border-white/5 bg-white/[.015] px-3 py-2 text-[7px] font-bold uppercase tracking-[.16em] text-white/20"><span>Editor rico</span><span>Formatação e templates salvos com a anotação</span></div>
  </div>;
}
