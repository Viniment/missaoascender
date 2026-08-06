import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor, BubbleMenu, FloatingMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Youtube } from "@tiptap/extension-youtube";
import { Typography } from "@tiptap/extension-typography";
import { Focus } from "@tiptap/extension-focus";
import { Dropcursor } from "@tiptap/extension-dropcursor";

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Code2, Highlighter, Palette,
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Minus, Table as TableIcon,
  Link2, Image as ImageIcon, Paperclip, Smile, AtSign, CalendarDays, ChevronsUpDown, Lightbulb,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, Eraser,
  Plus, Trash2, Copy, ArrowUp, ArrowDown, GripVertical, Video, Type,
  List as ListIcon, SquareCheck, Info, ChevronDown
} from "lucide-react";
import { Callout, ToggleBlock } from "./extensions";
import { EMOJIS_EDITOR, uploadArquivo } from "@/lib/estudos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

/** Popover mínimo. */
function Pop({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-primary/15 hover:text-primary transition",
          open && "bg-primary/20 text-primary",
        )}
      >
        {icon}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute left-0 top-9 z-50 rounded-xl border border-border bg-popover p-2 shadow-2xl min-w-[120px]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CORES_TEXTO = ["#ffffff", "#c084fc", "#7b2ff7", "#38bdf8", "#4ade80", "#facc15", "#fb7185", "#94a3b8"];
const CORES_FUNDO = ["#7b2ff7", "#0ea5e9", "#16a34a", "#eab308", "#dc2626", "#db2777", "#334155"];

function Btn({
  onClick, active, title, children, disabled, className
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "h-8 w-8 grid place-items-center rounded-md text-muted-foreground transition shrink-0",
        "hover:bg-primary/15 hover:text-primary disabled:opacity-40",
        active && "bg-primary/20 text-primary",
        className
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-0.5 h-5 w-px bg-border shrink-0" />;

function Toolbar({ editor, userId }: { editor: Editor; userId: string }) {
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const subirImagem = async (file: File) => {
    try {
      const { url } = await uploadArquivo(userId, file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      toast.error("Não consegui enviar a imagem.");
    }
  };

  const subirArquivo = async (file: File) => {
    try {
      const { url, nome } = await uploadArquivo(userId, file);
      editor.chain().focus().insertContent(`<p><a href="${url}" target="_blank">📎 ${nome}</a></p>`).run();
    } catch {
      toast.error("Não consegui enviar o arquivo.");
    }
  };

  return (
    <div className="sticky top-14 z-30 -mx-1 mb-6 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl px-2 py-1.5 shadow-lg ring-1 ring-white/5">
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0.5 pr-1 border-r border-border/50">
          <Btn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></Btn>
          <Btn title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></Btn>
        </div>
        
        <div className="flex items-center gap-0.5 px-1">
          <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
          <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
          <Btn title="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
          <Btn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Btn>
          <Btn title="Código inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></Btn>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5 px-1">
          <Pop title="Cor da fonte" icon={<Palette className="w-4 h-4" />}>
              <div className="grid grid-cols-4 gap-1.5 p-1">
                {CORES_TEXTO.map((c) => (
                  <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()}
                    className="h-6 w-6 rounded-full border border-border hover:scale-110 transition shadow-sm" style={{ background: c }} aria-label={`Cor ${c}`} />
                ))}
              </div>
              <button type="button" onClick={() => editor.chain().focus().unsetColor().run()}
                className="mt-2 w-full text-[11px] font-medium text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10 transition">Remover cor</button>
          </Pop>
          <Pop title="Cor de fundo" icon={<Highlighter className="w-4 h-4" />}>
              <div className="grid grid-cols-4 gap-1.5 p-1">
                {CORES_FUNDO.map((c) => (
                  <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                    className="h-6 w-6 rounded-md border border-border hover:scale-110 transition shadow-sm" style={{ background: c }} aria-label={`Fundo ${c}`} />
                ))}
              </div>
              <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()}
                className="mt-2 w-full text-[11px] font-medium text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10 transition">Remover destaque</button>
          </Pop>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5 px-1">
          <Btn title="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
          <Btn title="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
          <Btn title="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5 px-1">
          <Btn title="Lista com marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
          <Btn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
          <Btn title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></Btn>
          <Btn title="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
          <Btn title="Bloco recolhível" onClick={() => (editor.chain().focus() as any).setToggleBlock().run()}><ChevronsUpDown className="w-4 h-4" /></Btn>
          <Btn title="Callout" onClick={() => (editor.chain().focus() as any).setCallout().run()}><Lightbulb className="w-4 h-4" /></Btn>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5 px-1">
          <Btn title="Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
          <Btn title="Link" active={editor.isActive("link")} onClick={() => {
            const anterior = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Endereço do link", anterior ?? "https://");
            if (url === null) return;
            if (url === "") { editor.chain().focus().unsetLink().run(); return; }
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}><Link2 className="w-4 h-4" /></Btn>
          <Btn title="Imagem / GIF" onClick={() => imgInput.current?.click()}><ImageIcon className="w-4 h-4" /></Btn>
          <Btn title="Vídeo do YouTube" onClick={() => {
            const url = window.prompt("URL do YouTube");
            if (url) (editor.chain().focus() as any).setYoutubeVideo({ src: url }).run();
          }}><Video className="w-4 h-4" /></Btn>
          <Pop title="Emoji" icon={<Smile className="w-4 h-4" />}>
              <div className="grid w-56 grid-cols-8 gap-1 p-1">
                {EMOJIS_EDITOR.map((e) => (
                  <button key={e} type="button" className="h-7 w-7 grid place-items-center rounded-md hover:bg-primary/20 transition-all text-base"
                    onClick={() => editor.chain().focus().insertContent(e).run()}>{e}</button>
                ))}
              </div>
          </Pop>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5 pl-1">
          <Btn title="Alinhar à esquerda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="w-4 h-4" /></Btn>
          <Btn title="Centralizar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="w-4 h-4" /></Btn>
          <Btn title="Alinhar à direita" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="w-4 h-4" /></Btn>
          <Btn title="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="w-4 h-4" /></Btn>
        </div>
      </div>
      <input ref={imgInput} type="file" accept="image/*,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagem(f); e.target.value = ""; }} />
      <input ref={fileInput} type="file" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subirArquivo(f); e.target.value = ""; }} />
    </div>
  );
}

export default function NoteEditor({
  userId, conteudo, onChange,
}: {
  userId: string;
  conteudo: any;
  onChange: (payload: { json: any; html: string; texto: string }) => void;
}) {
  const [, setTick] = useState(0);

  const emitir = useCallback(
    (ed: Editor) => onChange({ json: ed.getJSON(), html: ed.getHTML(), texto: ed.getText() }),
    [onChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        link: false, 
        underline: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ 
        openOnClick: false, 
        autolink: true, 
        HTMLAttributes: { target: "_blank", rel: "noopener" } 
      }),
      Placeholder.configure({ 
        placeholder: "Comece a escrever… use o botão '+' ou a barra superior." 
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ HTMLAttributes: { class: "rounded-2xl max-w-full shadow-2xl ring-1 ring-white/10" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      ToggleBlock,
      Subscript,
      Superscript,
      Youtube.configure({
        HTMLAttributes: { class: "rounded-2xl w-full aspect-video shadow-2xl ring-1 ring-white/10" }
      }),
      Typography,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Dropcursor.configure({
        color: '#7b2ff7',
        width: 3,
      }),
    ],
    content: conteudo ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[60vh] prose-headings:font-display prose-headings:tracking-wide prose-a:text-primary notion-block-editor pb-32",
      },
    },
    onUpdate: ({ editor: ed }) => emitir(ed as Editor),
    onSelectionUpdate: () => setTick((t) => t + 1),
    onTransaction: () => setTick((t) => t + 1),
  });

  const notaCarregada = useRef<string>("");
  useEffect(() => {
    if (!editor) return;
    const chave = JSON.stringify(conteudo ?? "");
    if (chave !== notaCarregada.current && !editor.isFocused) {
      notaCarregada.current = chave;
      editor.commands.setContent(conteudo ?? "", { emitUpdate: false });
    }
  }, [conteudo, editor]);

  if (!editor) return null;

  return (
    <div className="relative">
      <Toolbar editor={editor} userId={userId} />
      
      {/* Notion-style Bubble Menu */}
      <BubbleMenu 
        editor={editor} 
        tippyOptions={{ duration: 100 }}
        className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-background/90 backdrop-blur-xl p-1 shadow-2xl ring-1 ring-white/5 overflow-hidden"
      >
        <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Btn>
        <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Btn>
        <Btn title="Destaque" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#7b2ff7" }).run()}><Highlighter className="w-3.5 h-3.5" /></Btn>
        <Btn title="Link" active={editor.isActive("link")} onClick={() => {
          const anterior = editor.getAttributes("link").href;
          const url = window.prompt("Link", anterior);
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}><Link2 className="w-3.5 h-3.5" /></Btn>
        <Btn title="Limpar" onClick={() => editor.chain().focus().unsetAllMarks().run()}><Eraser className="w-3.5 h-3.5" /></Btn>
      </BubbleMenu>

      {/* Notion-style Floating Menu */}
      <FloatingMenu 
        editor={editor} 
        tippyOptions={{ duration: 100, placement: 'left-start' }}
        className="flex flex-col gap-1 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-white/10 min-w-[200px]"
      >
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Conteúdo</div>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-primary/15 rounded-lg transition-colors">
          <Heading1 className="w-4 h-4 text-primary" />
          <span>Título Grande</span>
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-primary/15 rounded-lg transition-colors">
          <Heading2 className="w-4 h-4 text-primary" />
          <span>Título Médio</span>
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-primary/15 rounded-lg transition-colors">
          <ListIcon className="w-4 h-4 text-primary" />
          <span>Lista com Marcadores</span>
        </button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-primary/15 rounded-lg transition-colors">
          <SquareCheck className="w-4 h-4 text-primary" />
          <span>Checklist</span>
        </button>
        <button onClick={() => (editor.chain().focus() as any).setCallout().run()} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-primary/15 rounded-lg transition-colors">
          <Info className="w-4 h-4 text-primary" />
          <span>Bloco de Callout</span>
        </button>
      </FloatingMenu>

      <EditorContent editor={editor} className="notion-editor-wrapper" />

      {/* Indicator for Notion-like interactivity */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-background/80 backdrop-blur-md px-4 py-2 border border-border/50 shadow-xl ring-1 ring-white/5">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Editor Premium Ativado</span>
      </div>
    </div>
  );
}
