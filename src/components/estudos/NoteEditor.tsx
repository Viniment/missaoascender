import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react";
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
import Typography from "@tiptap/extension-typography";
import Focus from "@tiptap/extension-focus";
import Dropcursor from "@tiptap/extension-dropcursor";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Code2, Highlighter, Palette,
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Minus, Table as TableIcon,
  Link2, Image as ImageIcon, Paperclip, Smile, AtSign, CalendarDays, ChevronsUpDown, Lightbulb,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, Eraser, Plus, Type,
} from "lucide-react";
import { Callout, ToggleBlock } from "./extensions";
import { EMOJIS_EDITOR, uploadArquivo } from "@/lib/estudos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import "./editor.css";

/** Popover mínimo */
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
        <div className="absolute left-0 top-9 z-[60] rounded-xl border border-border bg-popover p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {children}
        </div>
      )}
    </div>
  );
}

const CORES_TEXTO = ["#ffffff", "#c084fc", "#7b2ff7", "#38bdf8", "#4ade80", "#facc15", "#fb7185", "#94a3b8"];
const CORES_FUNDO = ["#7b2ff7", "#0ea5e9", "#16a34a", "#eab308", "#dc2626", "#db2777", "#334155"];

function Btn({
  onClick, active, title, children, disabled,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) {
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
    <div className="sticky top-14 z-20 -mx-1 mb-3 rounded-xl border border-border/70 bg-background/95 backdrop-blur px-1.5 py-1.5 shadow-sm">
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
        <Btn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></Btn>
        <Btn title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></Btn>
        <Sep />
        <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
        <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
        <Btn title="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
        <Btn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Btn>
        <Btn title="Código inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></Btn>
        <Btn title="Bloco de código" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="w-4 h-4" /></Btn>
        <Sep />
        <Pop title="Cor da fonte" icon={<Palette className="w-4 h-4" />}>
            <div className="grid grid-cols-4 gap-1.5">
              {CORES_TEXTO.map((c) => (
                <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()}
                  className="h-6 w-6 rounded-md border border-border" style={{ background: c }} aria-label={`Cor ${c}`} />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetColor().run()}
              className="mt-2 w-full text-[11px] text-muted-foreground hover:text-primary">Remover cor</button>
        </Pop>
        <Pop title="Cor de fundo" icon={<Highlighter className="w-4 h-4" />}>
            <div className="grid grid-cols-4 gap-1.5">
              {CORES_FUNDO.map((c) => (
                <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                  className="h-6 w-6 rounded-md border border-border" style={{ background: c }} aria-label={`Fundo ${c}`} />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="mt-2 w-full text-[11px] text-muted-foreground hover:text-primary">Remover destaque</button>
        </Pop>
        <Sep />
        <Btn title="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
        <Btn title="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
        <Btn title="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
        <Sep />
        <Btn title="Lista com marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
        <Btn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
        <Btn title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></Btn>
        <Btn title="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
        <Btn title="Linha divisória" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></Btn>
        <Btn title="Callout" onClick={() => (editor.chain().focus() as any).setCallout().run()}><Lightbulb className="w-4 h-4" /></Btn>
        <Btn title="Bloco recolhível" onClick={() => (editor.chain().focus() as any).setToggleBlock().run()}><ChevronsUpDown className="w-4 h-4" /></Btn>
        <Sep />
        <Btn title="Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
        <Btn title="Link" active={editor.isActive("link")} onClick={() => {
          const anterior = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Endereço do link", anterior ?? "https://");
          if (url === null) return;
          if (url === "") { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}><Link2 className="w-4 h-4" /></Btn>
        <Btn title="Imagem / GIF" onClick={() => imgInput.current?.click()}><ImageIcon className="w-4 h-4" /></Btn>
        <Btn title="Anexar arquivo" onClick={() => fileInput.current?.click()}><Paperclip className="w-4 h-4" /></Btn>
        <Pop title="Emoji" icon={<Smile className="w-4 h-4" />}>
            <div className="grid w-56 grid-cols-8 gap-1">
              {EMOJIS_EDITOR.map((e) => (
                <button key={e} type="button" className="h-6 w-6 rounded hover:bg-primary/15"
                  onClick={() => editor.chain().focus().insertContent(e).run()}>{e}</button>
              ))}
            </div>
        </Pop>
        <Btn title="Menção" onClick={() => {
          const nome = window.prompt("Mencionar quem/o quê?");
          if (nome) editor.chain().focus().insertContent(`<strong>@${nome}</strong> `).run();
        }}><AtSign className="w-4 h-4" /></Btn>
        <Btn title="Inserir data" onClick={() => editor.chain().focus().insertContent(new Date().toLocaleDateString("pt-BR")).run()}><CalendarDays className="w-4 h-4" /></Btn>
        <Sep />
        <Btn title="Alinhar à esquerda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="w-4 h-4" /></Btn>
        <Btn title="Centralizar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="w-4 h-4" /></Btn>
        <Btn title="Alinhar à direita" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="w-4 h-4" /></Btn>
        <Btn title="Justificar" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify className="w-4 h-4" /></Btn>
        <Sep />
        <Btn title="Limpar formatação" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser className="w-4 h-4" /></Btn>
      </div>
      <input ref={imgInput} type="file" accept="image/*,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagem(f); e.target.value = ""; }} />
      <input ref={fileInput} type="file" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) subirArquivo(f); e.target.value = ""; }} />
    </div>
  );
}

function FloatingMenuContent({ editor }: { editor: Editor }) {
  const items = [
    { label: "Texto", icon: <Type className="w-4 h-4" />, command: () => editor.chain().focus().setParagraph().run() },
    { label: "Título 1", icon: <Heading1 className="w-4 h-4" />, command: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "Título 2", icon: <Heading2 className="w-4 h-4" />, command: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Checklist", icon: <ListChecks className="w-4 h-4" />, command: () => editor.chain().focus().toggleTaskList().run() },
    { label: "Lista", icon: <List className="w-4 h-4" />, command: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Tabela", icon: <TableIcon className="w-4 h-4" />, command: () => editor.chain().focus().insertTable({ rows: 2, cols: 2 }).run() },
    { label: "Callout", icon: <Lightbulb className="w-4 h-4" />, command: () => (editor.chain().focus() as any).setCallout().run() },
  ];

  return (
    <div className="floating-menu-wrapper">
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Comandos Rápidos</div>
      {items.map((it, i) => (
        <button
          key={i}
          onClick={it.command}
          className="flex items-center gap-3 px-3 py-1.5 text-sm rounded-md hover:bg-primary/10 transition text-left"
        >
          <div className="h-7 w-7 rounded bg-primary/5 flex items-center justify-center text-primary">
            {it.icon}
          </div>
          <span>{it.label}</span>
        </button>
      ))}
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
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { target: "_blank", rel: "noopener" } }),
      Placeholder.configure({ 
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return `Título ${node.attrs.level}...`;
          return "Escreva algo ou '/' para comandos...";
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem,
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Dropcursor.configure({ color: '#7b2ff7', width: 2 }),
      Callout,
      ToggleBlock,
    ],
    content: conteudo ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[50vh] prose-headings:font-display prose-headings:tracking-wide prose-a:text-primary notion-editor",
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
    <div className="notion-editor-container">
      <Toolbar editor={editor} userId={userId} />
      
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="bubble-menu-wrapper">
          <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
          <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
          <Btn title="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
          <Sep />
          <Btn title="Link" active={editor.isActive("link")} onClick={() => {
            const anterior = editor.getAttributes("link").href;
            const url = window.prompt("URL", anterior);
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}><Link2 className="w-4 h-4" /></Btn>
        </div>
      </BubbleMenu>

      <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <FloatingMenuContent editor={editor} />
      </FloatingMenu>

      <EditorContent editor={editor} className="notion-editor" />
    </div>
  );
}



