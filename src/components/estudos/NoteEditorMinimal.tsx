import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export default function NoteEditorMinimal() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Hello World</p>",
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          console.log('TIPTAP_KEYDOWN: Enter');
          return false; // let it bubble to commands
        }
        return false;
      },
      attributes: {
        class: "prose prose-invert focus:outline-none min-h-[200px] border p-4 tiptap",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      console.log('StarterKit loaded:', !!editor.extensionManager.extensions.find(e => e.name === 'starterKit'));
      console.log('Paragraph loaded:', !!editor.extensionManager.extensions.find(e => e.name === 'paragraph'));
    }
  }, [editor]);

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white">
      <h1 className="mb-4 text-2xl">Minimal Editor Test (v2)</h1>
      <div className="border border-white/20 rounded-lg">
        <EditorContent editor={editor} />
      </div>
      <button 
        onClick={() => {
          console.log('Executing splitBlock...');
          editor?.commands.splitBlock();
        }}
        className="mt-4 px-4 py-2 bg-primary rounded"
      >
        Manual Split Block
      </button>
      <div className="mt-4 p-4 bg-black/40 rounded">
        <p className="text-sm text-gray-400">Instruções:</p>
        <ul className="list-disc ml-5 text-sm">
          <li>Check Console for logs</li>
          <li>Tente o botão "Manual Split Block"</li>
        </ul>
      </div>
    </div>
  );
}

