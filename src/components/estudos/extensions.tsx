import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { ChevronRight, Info, AlertTriangle, CheckCircle2, Flame, Pin, Brain, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Callout ---------------- */

const EMOJI_MAP: Record<string, any> = {
  "💡": Info,
  "⚠️": AlertTriangle,
  "✅": CheckCircle2,
  "🔥": Flame,
  "📌": Pin,
  "🧠": Brain,
  "❌": XCircle,
};

function CalloutView({ node, updateAttributes }: any) {
  const emoji = node.attrs.emoji || "💡";
  const Icon = EMOJI_MAP[emoji] || Info;

  return (
    <NodeViewWrapper className="not-prose my-6 flex gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 group relative shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          contentEditable={false}
          onClick={() => {
            const lista = ["💡", "⚠️", "✅", "🔥", "📌", "🧠", "❌"];
            const i = lista.indexOf(emoji);
            updateAttributes({ emoji: lista[(i + 1) % lista.length] });
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-inner"
          title="Trocar ícone"
        >
          <span className="text-xl leading-none select-none">{emoji}</span>
        </button>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <NodeViewContent className="text-sm leading-relaxed text-foreground/90 outline-none" />
      </div>
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
    <NodeViewWrapper className="not-prose my-4 rounded-2xl border border-border/40 bg-card/30 group relative overflow-hidden transition-all hover:border-border/60">
      <div className={cn("flex items-center gap-3 px-4 py-3 border-b border-border/10 bg-background/40 transition-colors", open && "bg-background/60")}>
        <button
          type="button"
          contentEditable={false}
          onClick={() => updateAttributes({ open: !open })}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/15 hover:text-primary transition-all flex-shrink-0 shadow-sm"
          title={open ? "Recolher" : "Expandir"}
        >
          <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", open ? "rotate-90" : "")} />
        </button>
        <div className="flex-1 text-base font-bold text-foreground tracking-tight">
          <NodeViewContent className="inline" />
        </div>
      </div>
      {open && (
        <div className="py-4 px-4 pl-12 text-sm leading-relaxed text-foreground/80 outline-none border-t border-border/5">
          {/* O conteúdo do ToggleBlock é injetado pelo NodeViewContent acima no título por enquanto para manter a simplicidade estrutural */}
          <p className="text-xs text-muted-foreground italic opacity-30">Bloco de texto interativo</p>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const ToggleBlock = Node.create({
  name: "toggleBlock",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes() {
    return { 
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
          commands.setNode(this.name),
    } as any;
  },
});
