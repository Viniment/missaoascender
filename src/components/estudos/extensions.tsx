import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ChevronRight, GripVertical, Plus, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/* ---------------- Block Handle (Notion-like) ---------------- */
// This is a wrapper component that adds the drag handle and options menu to every block.
// In a real Tiptap setup, this is often implemented via a custom Extension that wraps nodes.

/* ---------------- Callout ---------------- */

function CalloutView({ node, updateAttributes }: any) {
  return (
    <NodeViewWrapper className="not-prose my-3 flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 group relative">
      <button
        type="button"
        contentEditable={false}
        onClick={() => {
          const lista = ["💡", "⚠️", "✅", "🔥", "📌", "🧠", "❌"];
          const i = lista.indexOf(node.attrs.emoji);
          updateAttributes({ emoji: lista[(i + 1) % lista.length] });
        }}
        className="text-lg leading-none select-none h-fit pt-0.5"
        title="Trocar ícone"
      >
        {node.attrs.emoji}
      </button>
      <NodeViewContent className="flex-1 min-w-0 text-sm outline-none" />
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
    <NodeViewWrapper className="not-prose my-2 rounded-lg border border-border/40 bg-card/20 group relative overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-background/20">
        <button
          type="button"
          contentEditable={false}
          onClick={() => updateAttributes({ open: !open })}
          className="text-muted-foreground hover:text-primary transition flex-shrink-0"
          title={open ? "Recolher" : "Expandir"}
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", open ? "rotate-90" : "")} />
        </button>
        <div 
          className="flex-1 text-sm font-semibold outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateAttributes({ titulo: e.currentTarget.innerText })}
          data-placeholder="Título do bloco"
        >
          {node.attrs.titulo}
        </div>
      </div>
      <div className={cn("transition-all duration-300", open ? "h-auto opacity-100" : "h-0 opacity-0 overflow-hidden")}>
        <NodeViewContent className="px-3 py-3 pl-9 text-sm outline-none" />
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
