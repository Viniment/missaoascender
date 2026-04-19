
## Menu desktop intuitivo — abas visíveis sempre

Dropdowns por grupo são "escondidos demais" — usuário precisa clicar e adivinhar o que tem dentro. Vamos tornar tudo visível e óbvio.

### Abordagem: **Sidebar lateral colapsável** (padrão dashboard moderno)

Sidebar fixa à esquerda no desktop (≥ md) com **todas as guias visíveis sempre**, agrupadas por categoria com label visível. Familiar pra qualquer usuário (Notion, Linear, Discord, Gmail).

**Layout:**
```
┌──────────────┬─────────────────────────────────┐
│ ⟐ ASCENSÃO   │  Header (Help, Settings, ☰)    │
│              ├─────────────────────────────────┤
│ AÇÃO         │                                 │
│ ⚔ Missões    │                                 │
│ ✨ Hábitos    │      Conteúdo da guia ativa    │
│ 🛡 Desafios   │                                 │
│ 🏆 Conquistas │                                 │
│              │                                 │
│ REFLEXÃO     │                                 │
│ 👁 Espelho    │                                 │
│ 🧭 Conselho   │                                 │
│ 📖 Diário    │                                 │
│ 📜 Estoicismo │                                 │
│ 🔥 Afirmações │                                 │
│              │                                 │
│ FERRAMENTAS  │                                 │
│ ⏱ Timer      │                                 │
│ 🌊 Urge       │                                 │
│ ◫ Visualizar │                                 │
│ 👁 Despertar  │                                 │
│              │                                 │
│ LOJA         │                                 │
│ 🎁 Loja      │                                 │
└──────────────┴─────────────────────────────────┘
```

**Comportamento:**
- Sidebar fixa à esquerda, ~240px, scroll vertical próprio se passar da altura.
- Cada guia: ícone + label (text-sm), padding generoso, hover bg-secondary, ativa com `bg-primary/15 + border-l-2 primary + text-primary` (glow purple).
- Labels de grupo em `text-[10px] tracking-[0.2em] uppercase text-foreground/40` (sutis).
- **Botão colapsar** (ícone `PanelLeft`) no header — colapsa pra modo "icon-only" (~56px) mostrando só ícones com tooltip ao hover.
- Estado de colapso salvo em localStorage.
- Conteúdo principal ocupa o resto (`flex-1`).

**PlayerCard / SystemPanel / MonsterIndicator**: continuam onde estão (col-span-3 esquerda + col-span-3 direita), mas o **conteúdo principal** agora vive ao lado direito da sidebar, não dentro do grid de 12 cols. Vou reestruturar pra:

```
[Sidebar | Main wrapper (Player | Content | System)]
```

Onde "Main wrapper" mantém o grid 3-6-3 atual.

### Mobile (< md)
**Não muda** — bottom sheet continua perfeito (você gostou).

### Implementação

Usar **shadcn Sidebar** (já existe em `src/components/ui/sidebar.tsx`):
- `SidebarProvider` envolve tudo no `Index.tsx`.
- `AppSidebar` novo componente com `Sidebar collapsible="icon"`, `SidebarGroup` por categoria, `SidebarMenuButton` por guia.
- `SidebarTrigger` no header (sempre visível) pra colapsar/expandir.
- Como o app não usa rotas pra abas (usa `activeTab` state), os items da sidebar serão **botões** que chamam `setActiveTab(id)`, não NavLinks. Active state controlado por comparação `activeTab === tab.id`.

### Arquivos
- **Novo**: `src/components/AppSidebar.tsx` — sidebar com grupos + botões.
- **Editado**: `src/pages/Index.tsx` — envolver com `SidebarProvider`, remover dropdowns desktop, adicionar `<AppSidebar />`, ajustar layout pra `flex` (sidebar + main). Manter mobile sheet intacto.

Sem mudança em store, settings, tabs.ts, ou backend.
