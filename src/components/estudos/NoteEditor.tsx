import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
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
import Typography from "@tiptap/extension-typography";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Code2, Highlighter, Palette,
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Minus, Table as TableIcon,
  Link2, Image as ImageIcon, Paperclip, Smile, AtSign, CalendarDays, ChevronsUpDown, Lightbulb,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, Eraser,
  Type, Subscript as SubIcon, Superscript as SuperIcon, Plus, Maximize2, Trash2, X
} from "lucide-react";
import { Callout, ToggleBlock } from "./extensions";
import { EMOJIS_EDITOR, uploadArquivo } from "@/lib/estudos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CORES_TEXTO = ["#ffffff", "#c084fc", "#7b2ff7", "#38bdf8", "#4ade80", "#facc15", "#fb7185", "#94a3b8"];
const CORES_FUNDO = ["#7b2ff7", "#0ea5e9", "#16a34a", "#eab308", "#dc2626", "#db2777", "#334155"];

/** Botão padrão da toolbar */
function Btn({
  onClick, active, title, children, disabled, className,
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

/** Popover mínimo customizado */
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
      {open && (
        <div className="absolute left-0 top-9 z-[60] min-w-[120px] rounded-xl border border-border bg-popover p-2 shadow-2xl animate-in fade-in zoom-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

/** FloatingMenu (Aparece em linhas vazias) */
function FloatingEditorMenu({ editor, userId }: { editor: Editor; userId: string }) {
  const imgInput = useRef<HTMLInputElement>(null);

  const subirImagem = async (file: File) => {
    try {
      const { url } = await uploadArquivo(userId, file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      toast.error("Não consegui enviar a imagem.");
    }
  };

  return (
    <FloatingMenu editor={editor} updateDelay={100} shouldShow={({ state }) => {
      const { selection } = state;
      const { $from, empty } = selection;
      return empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0;
    }}>
      <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/95 backdrop-blur-md p-1 shadow-lg border-primary/20 ring-1 ring-primary/10">
        <Btn title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
        <Btn title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
        <Btn title="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></Btn>
        <Sep />
        <Btn title="Callout" onClick={() => (editor.chain().focus() as any).setCallout().run()}><Lightbulb className="w-4 h-4" /></Btn>
        <Btn title="Bloco recolhível" onClick={() => (editor.chain().focus() as any).setToggleBlock().run()}><ChevronsUpDown className="w-4 h-4" /></Btn>
        <Btn title="Imagem" onClick={() => imgInput.current?.click()}><ImageIcon className="w-4 h-4" /></Btn>
        <Btn title="Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
        
        <input ref={imgInput} type="file" accept="image/*,image/gif" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagem(f); e.target.value = ""; }} />
      </div>
    </FloatingMenu>
  );
}

/** BubbleMenu (Aparece ao selecionar texto) */
function TextBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu editor={editor} updateDelay={100}>
      <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-background/95 backdrop-blur-md px-1.5 py-1 shadow-2xl border-primary/30 ring-1 ring-primary/20">
        <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
        <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
        <Btn title="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
        <Btn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Btn>
        <Sep />
        <Btn title="Código" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></Btn>
        <Btn title="Link" active={editor.isActive("link")} onClick={() => {
          const anterior = editor.getAttributes("link").href;
          const url = window.prompt("Endereço do link", anterior ?? "https://");
          if (url === null) return;
          if (url === "") { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}><Link2 className="w-4 h-4" /></Btn>
        <Sep />
        <Pop title="Cor" icon={<Palette className="w-4 h-4" />}>
          <div className="grid grid-cols-4 gap-1.5 p-1">
            {CORES_TEXTO.map((c) => (
              <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()}
                className="h-6 w-6 rounded-md border border-white/10 hover:scale-110 transition" style={{ background: c }} />
            ))}
          </div>
        </Pop>
        <Pop title="Destaque" icon={<Highlighter className="w-4 h-4" />}>
          <div className="grid grid-cols-4 gap-1.5 p-1">
            {CORES_FUNDO.map((c) => (
              <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                className="h-6 w-6 rounded-md border border-white/10 hover:scale-110 transition" style={{ background: c }} />
            ))}
          </div>
        </Pop>
      </div>
    </BubbleMenu>
  );
}

/** Toolbar Principal Refinada */
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
    <div className="sticky top-14 z-30 -mx-1 mb-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-2 py-2 shadow-lg ring-1 ring-white/5">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-0.5">
          <Btn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></Btn>
          <Btn title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></Btn>
        </div>
        
        <Sep />
        
        <div className="flex items-center gap-0.5">
          <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
          <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
          <Btn title="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
          <Pop title="Mais texto" icon={<Plus className="w-3.5 h-3.5" />}>
             <div className="flex flex-col gap-1 w-32">
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/10 text-xs text-muted-foreground">
                  <Strikethrough className="w-3.5 h-3.5" /> Tachado
                </button>
                <button onClick={() => editor.chain().focus().toggleSubscript().run()} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/10 text-xs text-muted-foreground">
                  <SubIcon className="w-3.5 h-3.5" /> Subscrito
                </button>
                <button onClick={() => editor.chain().focus().toggleSuperscript().run()} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/10 text-xs text-muted-foreground">
                  <SuperIcon className="w-3.5 h-3.5" /> Sobrescrito
                </button>
                <button onClick={() => editor.chain().focus().toggleCode().run()} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/10 text-xs text-muted-foreground">
                  <Code className="w-3.5 h-3.5" /> Código
                </button>
             </div>
          </Pop>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5">
          <Btn title="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
          <Btn title="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
          <Btn title="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5">
          <Btn title="Marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
          <Btn title="Lista Numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
          <Btn title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></Btn>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5">
          <Btn title="Callout" onClick={() => (editor.chain().focus() as any).setCallout().run()}><Lightbulb className="w-4 h-4 text-yellow-400" /></Btn>
          <Btn title="Toggle" onClick={() => (editor.chain().focus() as any).setToggleBlock().run()}><ChevronsUpDown className="w-4 h-4" /></Btn>
          <Btn title="Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5">
          <Btn title="Imagem" onClick={() => imgInput.current?.click()}><ImageIcon className="w-4 h-4" /></Btn>
          <Btn title="Anexo" onClick={() => fileInput.current?.click()}><Paperclip className="w-4 h-4" /></Btn>
          <Pop title="Emoji" icon={<Smile className="w-4 h-4" />}>
              <div className="grid w-64 grid-cols-8 gap-1 p-1 max-h-60 overflow-y-auto custom-scrollbar">
                {EMOJIS_EDITOR.map((e) => (
                  <button key={e} type="button" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/20 text-lg transition-transform active:scale-90"
                    onClick={() => editor.chain().focus().insertContent(e).run()}>{e}</button>
                ))}
              </div>
          </Pop>
        </div>

        <Sep />

        <div className="flex items-center gap-0.5 ml-auto">
          <Btn title="Limpar Tudo" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="w-4 h-4" /></Btn>
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
        history: true,
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'rounded-xl bg-muted/50 p-4 border border-white/5 font-mono text-sm' } }
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { target: "_blank", rel: "noopener", class: "text-primary underline underline-offset-4 decoration-primary/30" } }),
      Placeholder.configure({ 
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return `Título ${node.attrs.level}...`;
          return "Escreva algo ou use '/' para comandos...";
        } 
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      Subscript,
      Superscript,
      TaskList.configure({ HTMLAttributes: { class: 'notion-task-list' } }),
      TaskItem.configure({ nested: true }),
      Image.configure({ HTMLAttributes: { class: "rounded-2xl max-w-full shadow-2xl border border-white/10 my-6" } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'notion-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      ToggleBlock,
    ],
    content: conteudo ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[60vh] prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-img:mx-auto notion-content-area",
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
    <div className="relative group/editor">
      <Toolbar editor={editor} userId={userId} />
      
      <TextBubbleMenu editor={editor} />
      <FloatingEditorMenu editor={editor} userId={userId} />
      
      <div className="relative px-1 py-4">
        <EditorContent editor={editor} />
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">
        <div className="flex items-center gap-4">
          <span>{editor.storage.characterCount?.characters() || 0} CARACTERES</span>
          <span>{editor.storage.characterCount?.words() || 0} PALAVRAS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
          SALVAMENTO AUTOMÁTICO ATIVO
        </div>
      </div>
    </div>
  );
}
