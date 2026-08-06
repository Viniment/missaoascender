import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ChevronRight } from "lucide-react";

/* ---------------- Callout ---------------- */

function CalloutView({ node, updateAttributes }: any) {
  return (
    <NodeViewWrapper className="not-prose my-3 flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <button
        type="button"
        contentEditable={false}
        onClick={() => {
          const lista = ["💡", "⚠️", "✅", "🔥", "📌", "🧠", "❌"];
          const i = lista.indexOf(node.attrs.emoji);
          updateAttributes({ emoji: lista[(i + 1) % lista.length] });
        }}
        className="text-lg leading-none select-none"
        title="Trocar ícone"
      >
        {node.attrs.emoji}
      </button>
      <NodeViewContent className="flex-1 min-w-0 text-sm" />
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
    <NodeViewWrapper className="not-prose my-3 rounded-xl border border-border/70 bg-card/40">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          contentEditable={false}
          onClick={() => updateAttributes({ open: !open })}
          className="text-muted-foreground hover:text-primary transition"
          title={open ? "Recolher" : "Expandir"}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        <input
          contentEditable={false}
          value={node.attrs.titulo}
          onChange={(e) => updateAttributes({ titulo: e.target.value })}
          placeholder="Título do bloco"
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
        />
      </div>
      <NodeViewContent className={`px-3 pb-3 pl-9 text-sm ${open ? "" : "hidden"}`} />
    </NodeViewWrapper>
  );
}

export const ToggleBlock = Node.create({
  name: "toggleBlock",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { titulo: { default: "Bloco recolhível" }, open: { default: true } };
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