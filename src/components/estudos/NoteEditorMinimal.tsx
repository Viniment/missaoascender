import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function NoteEditorMinimal() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Hello World</p>",
    editorProps: {
      attributes: {
        class: "prose prose-invert focus:outline-none min-h-[200px] border p-4 tiptap",
      },
    },
  });

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white">
      <h1 className="mb-4 text-2xl">Minimal Editor Test</h1>
      <div className="border border-white/20 rounded-lg">
        <EditorContent editor={editor} />
      </div>
      <div className="mt-4 p-4 bg-black/40 rounded">
        <p className="text-sm text-gray-400">Instruções:</p>
        <ul className="list-disc ml-5 text-sm">
          <li>Tente digitar "Linha 1"</li>
          <li>Pressione Enter</li>
          <li>Tente digitar "Linha 2"</li>
        </ul>
      </div>
    </div>
  );
}
