import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ChevronRight, Lightbulb } from "lucide-react";

/* ---------------- Callout ---------------- */

function CalloutView({ node, updateAttributes }: any) {
  return (
    <NodeViewWrapper className="not-prose my-4 flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 group transition-all hover:bg-primary/10">
      <div className="flex flex-col items-center">
        <button
          type="button"
          contentEditable={false}
          onClick={() => {
            const lista = ["💡", "⚠️", "✅", "🔥", "📌", "🧠", "❌", "🚀", "✨", "🎯"];
            const i = lista.indexOf(node.attrs.emoji);
            updateAttributes({ emoji: lista[(i + 1) % lista.length] });
          }}
          className="text-2xl leading-none select-none hover:scale-110 transition active:scale-95"
          title="Trocar ícone"
        >
          {node.attrs.emoji}
        </button>
      </div>
      <NodeViewContent className="flex-1 min-w-0 text-sm md:text-base leading-relaxed text-foreground/90" />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { emoji: { default: "💡" } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "callout" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }: any) =>
          commands.wrapIn(this.name),
    } as any;
  },
});

/* ---------------- Bloco recolhível (Toggle) ---------------- */

function ToggleView({ node, updateAttributes }: any) {
  const open = node.attrs.open;
  return (
    <NodeViewWrapper className="not-prose my-3 rounded-xl border border-border/50 bg-card/20 overflow-hidden transition-all hover:border-primary/30">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5">
        <button
          type="button"
          contentEditable={false}
          onClick={() => updateAttributes({ open: !open })}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition"
          title={open ? "Recolher" : "Expandir"}
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        </button>
        <div className="flex-1">
          <input
            contentEditable={false}
            value={node.attrs.titulo}
            onChange={(e) => updateAttributes({ titulo: e.target.value })}
            placeholder="Título do bloco..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/50 border-none focus:ring-0"
          />
        </div>
      </div>
      <div className={`transition-all duration-300 ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <NodeViewContent className="px-3 py-4 pl-10 text-sm md:text-base leading-relaxed border-t border-border/30" />
      </div>
    </NodeViewWrapper>
  );
}

export const ToggleBlock = Node.create({
  name: "toggleBlock",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { 
      titulo: { default: "Bloco recolhível" }, 
      open: { default: true } 
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="toggle-block"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "toggle-block" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },
  addCommands() {
    return {
      setToggleBlock:
        () =>
        ({ commands }: any) =>
          commands.wrapIn(this.name),
    } as any;
  },
});
