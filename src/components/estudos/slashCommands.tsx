import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Table, Image, Code, Quote, Lightbulb,
  ChevronsUpDown, Minus
} from "lucide-react";

export const getSlashCommands = (editor: any, userId: string, imgInput: any) => ({
  suggestion: {
    items: ({ query }: any) => [
      { title: "Título 1", cmd: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), icon: Heading1, desc: "Título grande" },
      { title: "Título 2", cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: Heading2, desc: "Título médio" },
      { title: "Título 3", cmd: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: Heading3, desc: "Título pequeno" },
      { title: "Checklist", cmd: () => editor.chain().focus().toggleTaskList().run(), icon: ListChecks, desc: "Lista de tarefas" },
      { title: "Lista Simples", cmd: () => editor.chain().focus().toggleBulletList().run(), icon: List, desc: "Marcadores básicos" },
      { title: "Lista Numerada", cmd: () => editor.chain().focus().toggleOrderedList().run(), icon: ListOrdered, desc: "Lista sequencial" },
      { title: "Tabela", cmd: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), icon: Table, desc: "Grid de dados" },
      { title: "Imagem", cmd: () => imgInput.current?.click(), icon: Image, desc: "Upload de imagem" },
      { title: "Bloco de Código", cmd: () => editor.chain().focus().toggleCodeBlock().run(), icon: Code, desc: "Código com sintaxe" },
      { title: "Citação", cmd: () => editor.chain().focus().toggleBlockquote().run(), icon: Quote, desc: "Destaque de texto" },
      { title: "Divisor", cmd: () => editor.chain().focus().setHorizontalRule().run(), icon: Minus, desc: "Linha horizontal" },
      { title: "Callout", cmd: () => (editor.chain().focus() as any).setCallout().run(), icon: Lightbulb, desc: "Bloco de aviso" },
      { title: "Recolhível", cmd: () => (editor.chain().focus() as any).setToggleBlock().run(), icon: ChevronsUpDown, desc: "Conteúdo expansível" },
    ].filter(item => item.title.toLowerCase().includes(query.toLowerCase())),

    render: () => {
      let component: any;
      let popup: any;

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(SlashList, { props, editor: props.editor });
          if (!props.clientRect) return;
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
          if (!props.clientRect) return;
          popup[0].setProps({ getReferenceClientRect: props.clientRect });
        },
        onKeyDown: (props: any) => {
          if (props.event.key === "Escape") { popup[0].hide(); return true; }
          return component.ref?.onKeyDown(props);
        },
        onExit: () => { 
          if (popup) popup[0].destroy(); 
          if (component) component.destroy(); 
        },
      };
    },
  },
});

const SlashList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  useEffect(() => setSelectedIndex(0), [props.items]);

  return (
    <div className="slash-menu custom-scrollbar max-h-[400px] overflow-y-auto">
      {props.items.length > 0 ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            className={`slash-menu-item ${index === selectedIndex ? "is-selected" : ""}`}
            onClick={() => selectItem(index)}
          >
            <div className="slash-menu-item-icon">
              <item.icon className="w-4 h-4" />
            </div>
            <div className="slash-menu-item-text">
              <span className="slash-menu-item-label">{item.title}</span>
              <span className="slash-menu-item-desc">{item.desc}</span>
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum comando encontrado</div>
      )}
    </div>
  );
});

SlashList.displayName = "SlashList";
