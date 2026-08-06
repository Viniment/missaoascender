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
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Code2, Highlighter, Palette,
  Heading1, Heading2, Heading3, Heading4, List, ListOrdered, ListChecks, Quote, Minus, Table as TableIcon,
  Link2, Image as ImageIcon, Paperclip, Smile, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Undo2, Redo2, Eraser, Type, Subscript as SubIcon, Superscript as SuperIcon, Plus, 
  ChevronsUpDown, Lightbulb, MoreHorizontal, Trash2
} from "lucide-react";

import { Callout, ToggleBlock } from "./extensions";
import { EMOJIS_EDITOR, uploadArquivo } from "@/lib/estudos";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSlashCommands } from "./slashCommands";

const CORES_TEXTO = ["#ffffff", "#c084fc", "#7b2ff7", "#38bdf8", "#4ade80", "#facc15", "#fb7185", "#94a3b8"];
const CORES_FUNDO = ["#7b2ff7", "#0ea5e9", "#16a34a", "#eab308", "#dc2626", "#db2777", "#334155"];

/** Slash Command Extension */
const SlashExtension = Extension.create({
  name: 'slashCommand',
  addOptions() { return { suggestion: {} } },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })]
  },
});

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

const Sep = () => <span className="mx-0.5 h-5 w-px bg-white/10 shrink-0" />;

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
        <div className="absolute left-0 top-9 z-[100] min-w-[120px] rounded-xl border border-white/10 bg-popover p-2 shadow-2xl animate-in fade-in zoom-in duration-200 backdrop-blur-xl">
          {children}
        </div>
      )}
    </div>
  );
}

function FloatingEditorMenu({ editor, userId }: { editor: Editor; userId: string }) {
  const imgInput = useRef<HTMLInputElement>(null);
  const subirImagem = async (file: File) => {
    try {
      const { url } = await uploadArquivo(userId, file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch { toast.error("Falha ao subir imagem"); }
  };

  return (
    <FloatingMenu editor={editor} updateDelay={100} shouldShow={({ state }) => {
      const { selection } = state;
      const { $from, empty } = selection;
      return empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0;
    }}>
      <div className="flex items-center gap-1 rounded-full border border-primary/30 bg-background/95 backdrop-blur-md p-1 shadow-2xl ring-1 ring-primary/10">
        <Btn title="H1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
        <Btn title="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></Btn>
        <Btn title="Callout" onClick={() => (editor.chain().focus() as any).setCallout().run()}><Lightbulb className="w-4 h-4" /></Btn>
        <Btn title="Imagem" onClick={() => imgInput.current?.click()}><ImageIcon className="w-4 h-4" /></Btn>
        <Btn title="Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
        <input ref={imgInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagem(f); e.target.value = ""; }} />
      </div>
    </FloatingMenu>
  );
}

function TextBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu editor={editor} updateDelay={100}>
      <div className="flex items-center gap-0.5 rounded-full border border-primary/40 bg-background/95 backdrop-blur-md px-1.5 py-1 shadow-2xl ring-1 ring-primary/20">
        <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
        <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
        <Btn title="Link" active={editor.isActive("link")} onClick={() => {
          const prev = editor.getAttributes("link").href;
          const url = window.prompt("URL:", prev ?? "https://");
          if (url === null) return;
          if (url === "") { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}><Link2 className="w-4 h-4" /></Btn>
        <Sep />
        <Pop title="Cor do Texto" icon={<Palette className="w-4 h-4" />}>
          <div className="grid grid-cols-4 gap-1.5 p-1">
            {CORES_TEXTO.map((c) => (
              <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()}
                className="h-6 w-6 rounded-md border border-white/10 hover:scale-110 transition" style={{ background: c }} />
            ))}
            <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className="col-span-4 h-6 rounded-md border border-white/10 hover:bg-white/5 transition text-[10px] uppercase font-bold">Remover Cor</button>
          </div>
        </Pop>
        <Pop title="Marca-texto" icon={<Highlighter className="w-4 h-4" />}>
          <div className="grid grid-cols-4 gap-1.5 p-1">
            {CORES_FUNDO.map((c) => (
              <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                className="h-6 w-6 rounded-md border border-white/10 hover:scale-110 transition" style={{ background: c }} />
            ))}
            <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="col-span-4 h-6 rounded-md border border-white/10 hover:bg-white/5 transition text-[10px] uppercase font-bold">Remover Marca-texto</button>
          </div>
        </Pop>
      </div>
    </BubbleMenu>
  );
}

function Toolbar({ editor, userId }: { editor: Editor; userId: string }) {
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  
  const subirImagem = async (file: File) => {
    try {
      const { url } = await uploadArquivo(userId, file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch { toast.error("Erro ao subir imagem"); }
  };

  return (
    <div className="sticky top-14 z-50 -mx-1 mb-6 flex flex-wrap items-center gap-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-3 py-2 shadow-xl ring-1 ring-white/5">
      <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></Btn>
      <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
      <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
      <Btn title="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></Btn>
      <Btn title="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
      <Btn title="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
      <Btn title="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></Btn>
      <Btn title="H4" active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}><Heading4 className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="Marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
      <Btn title="Numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
      <Btn title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></Btn>
      <Btn title="Toggle" active={editor.isActive("toggleBlock")} onClick={() => (editor.chain().focus() as any).setToggleBlock().run()}><ChevronsUpDown className="w-4 h-4" /></Btn>
      <Sep />
      <Btn title="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></Btn>
      <Btn title="Linha" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></Btn>
      <Btn title="Toggle List" active={editor.isActive("toggleBlock")} onClick={() => (editor.chain().focus() as any).setToggleBlock().run()}><ChevronsUpDown className="w-4 h-4" /></Btn>
      <Sep />
      <div className="flex items-center gap-0.5">
        <Btn title="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="w-4 h-4" /></Btn>
        <Btn title="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="w-4 h-4" /></Btn>
        <Btn title="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="w-4 h-4" /></Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify className="w-4 h-4" /></Btn>
      </div>
      <Sep />
      <Btn title="Callout" onClick={() => (editor.chain().focus() as any).setCallout().run()}><Lightbulb className="w-4 h-4 text-yellow-400" /></Btn>
      <Btn title="Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
      <Btn title="Image" onClick={() => imgInput.current?.click()}><ImageIcon className="w-4 h-4" /></Btn>
      <Pop title="Emoji" icon={<Smile className="w-4 h-4" />}>
        <div className="grid w-64 grid-cols-8 gap-1 p-1 max-h-60 overflow-y-auto custom-scrollbar">
          {EMOJIS_EDITOR.map(e => <button key={e} onClick={() => editor.chain().focus().insertContent(e).run()} className="h-8 w-8 text-lg hover:bg-primary/20 rounded transition">{e}</button>)}
        </div>
      </Pop>
      
      <input ref={imgInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagem(f); e.target.value = ""; }} />
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
  const imgInput = useRef<HTMLInputElement>(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { HTMLAttributes: { class: 'list-disc ml-6 space-y-1' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal ml-6 space-y-1' } },
        codeBlock: { HTMLAttributes: { class: 'rounded-xl bg-muted/50 p-4 border border-white/5 font-mono text-sm my-4' } }
      }),
      Underline, TextStyle, Color, Typography, Subscript, Superscript,
      Highlight.configure({ multicolor: true }),
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors cursor-pointer',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: "Digite '/' para comandos ou comece a escrever..." }),
      TaskList.configure({ HTMLAttributes: { class: 'notion-task-list my-2' } }),
      TaskItem.configure({ nested: true, HTMLAttributes: { class: 'flex items-start gap-2 my-1' } }),
      Image.configure({ HTMLAttributes: { class: "rounded-2xl max-w-full shadow-2xl my-6 mx-auto border border-white/10" } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'notion-table my-4' } }),
      TableRow, TableCell, TableHeader,
      Callout, ToggleBlock,
      CharacterCount,
      SlashExtension.configure({ suggestion: getSlashCommands(null, userId, imgInput).suggestion }),
    ],
    content: conteudo || "",
    editorProps: {
      handleKeyDown: (view, event) => {
        const { state } = view;
        const { selection } = state;
        const { $from, empty } = selection;

        // DEPURAÇÃO AGRESSIVA
        console.log("DEBUG_ENTER_EVENT", {
          key: event.key,
          code: event.code,
          shift: event.shiftKey,
          target: event.target,
          type: event.type,
          isComposing: event.isComposing,
          defaultPrevented: event.defaultPrevented
        });

        if (event.key === 'Enter') {
          // Tentar forçar a execução do comando splitBlock se o Enter estiver morrendo
          if (!event.shiftKey) {
            console.log("DEBUG_ENTER: Executando splitBlock manualmente");
            const success = view.dispatch(state.tr.split($from.pos));
            if (success) {
               console.log("DEBUG_ENTER: splitBlock manual funcionou");
               event.preventDefault();
               return true;
            }
          }
        }
        
        return false;
      },
      attributes: {
        class: "prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none notion-content-area"
      }
    },
    onUpdate: ({ editor: ed }) => {
      onChange({ json: ed.getJSON(), html: ed.getHTML(), texto: ed.getText() });
    },
  });

  // Re-configure suggestion with the actual editor instance once available
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        extensions: editor.options.extensions.map(ext => {
          if (ext.name === 'slashCommand') {
            return ext.configure({ suggestion: getSlashCommands(editor, userId, imgInput).suggestion });
          }
          return ext;
        })
      });
    }
  }, [editor, userId]);

  const lastContent = useRef("");
  useEffect(() => {
    if (!editor || !conteudo) return;
    const current = JSON.stringify(conteudo);
    if (current !== lastContent.current && !editor.isFocused) {
      lastContent.current = current;
      editor.commands.setContent(conteudo, { emitUpdate: false });
    }
  }, [conteudo, editor]);

  if (!editor) return null;

  const stats = editor.storage.characterCount;

  return (
    <div className="relative w-full">
      <Toolbar editor={editor} userId={userId} />
      <FloatingEditorMenu editor={editor} userId={userId} />
      <TextBubbleMenu editor={editor} />
      
      <div className="min-h-[70vh] px-1">
        <EditorContent editor={editor} />
      </div>

      <div className="mt-12 mb-20 p-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] font-medium">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary/40" />{stats.characters()} Caracteres</span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary/40" />{stats.words()} Palavras</span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary/40" />{editor.state.doc.childCount} Blocos</span>
          <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-cyan-400/40" />{Math.ceil(stats.words() / 200)} min de leitura</span>
        </div>
        <div className="flex items-center gap-2 text-primary/60">
          <div className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(123,47,247,0.8)]" />
          Sincronização em tempo real ativa
        </div>
      </div>
      
      <input ref={imgInput} type="file" accept="image/*" className="hidden" />
    </div>
  );
}
