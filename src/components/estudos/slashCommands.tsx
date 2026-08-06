import { ReactRenderer } from "@tiptap/react";
import { Suggestion } from "@tiptap/suggestion";
import tippy from "tippy.js";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Table, Image, Code, Quote, Lightbulb,
  ChevronsUpDown, Minus, Smile
} from "lucide-react";

export const getSlashCommands = (editor: any, userId: string, imgInput: any) => ({
  suggestion: {
    items: ({ query }: any) => [
      { title: "Heading 1", cmd: () => editor.chain().focus().setHeading({ level: 1 }).run(), icon: Heading1 },
      { title: "Heading 2", cmd: () => editor.chain().focus().setHeading({ level: 2 }).run(), icon: Heading2 },
      { title: "Heading 3", cmd: () => editor.chain().focus().setHeading({ level: 3 }).run(), icon: Heading3 },
      { title: "To-do List", cmd: () => editor.chain().focus().toggleTaskList().run(), icon: ListChecks },
      { title: "Bullet List", cmd: () => editor.chain().focus().toggleBulletList().run(), icon: List },
      { title: "Numbered List", cmd: () => editor.chain().focus().toggleOrderedList().run(), icon: ListOrdered },
      { title: "Table", cmd: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), icon: Table },
      { title: "Image", cmd: () => imgInput.current?.click(), icon: Image },
      { title: "Code Block", cmd: () => editor.chain().focus().toggleCodeBlock().run(), icon: Code },
      { title: "Quote", cmd: () => editor.chain().focus().toggleBlockquote().run(), icon: Quote },
      { title: "Divider", cmd: () => editor.chain().focus().setHorizontalRule().run(), icon: Minus },
      { title: "Callout", cmd: () => (editor.chain().focus() as any).setCallout().run(), icon: Lightbulb },
      { title: "Toggle List", cmd: () => (editor.chain().focus() as any).setToggleBlock().run(), icon: ChevronsUpDown },
    ].filter(item => item.title.toLowerCase().includes(query.toLowerCase())),

    render: () => {
      let component: any;
      let popup: any;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(SlashList, { props, editor: props.editor });
          popup = tippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },
        onUpdate: (props: any) => {
          component.updateProps(props);
          popup[0].setProps({ getReferenceClientRect: props.clientRect });
        },
        onKeyDown: (props: any) => {
          if (props.event.key === "Escape") { popup[0].hide(); return true; }
          return component.ref?.onKeyDown(props);
        },
        onExit: () => { popup[0].destroy(); component.destroy(); },
      };
    },
  },
});

function SlashList({ items, command }: any) {
  return (
    <div className="slash-menu shadow-2xl border border-primary/20 bg-background/95 backdrop-blur">
      {items.map((item: any, i: number) => (
        <button
          key={i}
          className={`slash-menu-item ${i === 0 ? "is-selected" : ""}`}
          onClick={() => command(item)}
        >
          <item.icon className="w-4 h-4" />
          {item.title}
        </button>
      ))}
    </div>
  );
}
