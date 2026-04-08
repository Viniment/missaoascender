import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Minus, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, Highlighter, Smile, Type,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

const EMOJI_LIST = ['😊','😢','😡','😰','😌','🔥','💀','🤔','😤','🥱','💪','🧠','⚔️','🎯','✨','💎','🌙','⭐','🏆','❤️','💜','🖤','👑','🗡️','🛡️','📚','✍️','🧘','🌅','💫'];

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [fontSize, setFontSize] = useState('16');
  const emojiRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        blockquote: {},
        horizontalRule: {},
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-neon-blue underline cursor-pointer' } }),
      Placeholder.configure({ placeholder: placeholder || 'Escreva aqui...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
        style: `font-size: ${fontSize}px`,
      },
      handleKeyDown: (_view, event) => {
        // Simple emoji shortcode: type text normally, we handle on blur/save
        return false;
      },
    },
  });

  // Update font size on editor
  useEffect(() => {
    if (editor) {
      const el = editor.view.dom as HTMLElement;
      el.style.fontSize = `${fontSize}px`;
    }
  }, [fontSize, editor]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run();
    setShowEmojis(false);
  }, [editor]);

  const setLink = useCallback(() => {
    const url = prompt('URL do link:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-secondary/30">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-border bg-card/50">
        {/* Text formatting */}
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} icon={<Bold className="w-3.5 h-3.5" />} title="Negrito" />
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} icon={<Italic className="w-3.5 h-3.5" />} title="Itálico" />
        <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={<UnderlineIcon className="w-3.5 h-3.5" />} title="Sublinhado" />
        <ToolBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} icon={<Highlighter className="w-3.5 h-3.5" />} title="Destaque" />

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        {/* Headings */}
        <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={<Heading1 className="w-3.5 h-3.5" />} title="H1" />
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 className="w-3.5 h-3.5" />} title="H2" />
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 className="w-3.5 h-3.5" />} title="H3" />

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        {/* Lists */}
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List className="w-3.5 h-3.5" />} title="Lista" />
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={<ListOrdered className="w-3.5 h-3.5" />} title="Lista numerada" />
        <ToolBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} icon={<CheckSquare className="w-3.5 h-3.5" />} title="Checklist" />

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        {/* Block */}
        <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote className="w-3.5 h-3.5" />} title="Citação" />
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus className="w-3.5 h-3.5" />} title="Divisor" />
        <ToolBtn active={false} onClick={setLink} icon={<LinkIcon className="w-3.5 h-3.5" />} title="Link" />

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        {/* Alignment */}
        <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} icon={<AlignLeft className="w-3.5 h-3.5" />} title="Esquerda" />
        <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} icon={<AlignCenter className="w-3.5 h-3.5" />} title="Centro" />
        <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} icon={<AlignRight className="w-3.5 h-3.5" />} title="Direita" />

        <div className="w-px h-6 bg-border mx-0.5 self-center" />

        {/* Font size */}
        <div className="flex items-center gap-1 px-1">
          <Type className="w-3 h-3 text-muted-foreground" />
          <select
            value={fontSize}
            onChange={e => setFontSize(e.target.value)}
            className="bg-secondary text-foreground text-xs rounded px-1 py-0.5 border border-border"
          >
            {['12', '14', '16', '18', '20', '24', '28'].map(s => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>

        {/* Emojis */}
        <div className="relative" ref={emojiRef}>
          <ToolBtn active={showEmojis} onClick={() => setShowEmojis(!showEmojis)} icon={<Smile className="w-3.5 h-3.5" />} title="Emoji" />
          {showEmojis && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg p-2 shadow-lg glow-purple w-64">
              <div className="grid grid-cols-10 gap-1">
                {EMOJI_LIST.map(e => (
                  <button
                    key={e}
                    onClick={() => insertEmoji(e)}
                    className="w-6 h-6 flex items-center justify-center text-sm hover:bg-secondary rounded transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolBtn({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
    >
      {icon}
    </button>
  );
}
