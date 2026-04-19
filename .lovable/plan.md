
## Configurações: gerenciar guias visíveis + melhorar exibição do menu

### Parte 1 — Toggle de guias em Configurações

Já existe `state.disabledTabs: string[]` em `gameStore` e `Index.tsx` já filtra com `visibleTabs`. Falta UI pra controlar isso.

**`src/pages/Settings.tsx`** — nova seção **"Guias visíveis"**:
- Lista todas as 14 guias (`missions`, `habits`, `challenges`, `achievements`, `mirror`, `counsel`, `journal`, `stoic`, `affirmations`, `timer`, `urge-surfing`, `visualizar`, `awakening`, `rewards`).
- Cada uma com `Switch` (ícone + nome + descrição curta de 1 linha).
- Toggle chama action `toggleTab(id)` no gameStore que adiciona/remove de `disabledTabs`.
- Botões rápidos: `Ativar todas` / `Desativar opcionais` (mantém só missions+habits).
- Aviso: "Missões e Hábitos não podem ser desativadas" (núcleo do app — sempre forçadas como visíveis).

**`src/lib/gameStore.ts`** — adicionar action `toggleTab(tabId: string)` que alterna o id no array `disabledTabs`.

### Parte 2 — Melhorar exibição do menu (header de `Index.tsx`)

**Problema atual:** 14 guias no header desktop estouram horizontal. No mobile é grid 4×N que fica apertado. Viewport atual do user é 753px (tablet) — está no breakpoint ruim entre desktop nav (md:flex) e mobile menu.

**Solução desktop (≥ md):**
- Header com **scroll horizontal suave** + fade nas bordas (gradient mask) quando overflow.
- Guias agrupadas visualmente com pequeno separator entre grupos:
  - **Ação:** Missões, Hábitos, Desafios, Conquistas
  - **Reflexão:** Espelho, Conselho, Diário, Estoicismo, Afirmações
  - **Ferramentas:** Timer, Urge Surfing, Visualizar, Despertar
  - **Loja:** Loja
- Botão ativo com glow purple mais marcado (border-glow + bg primary/15).
- Hover sutil com scale-[1.02] e transition.

**Solução mobile (< md):**
- Trocar grid 4×N por **bottom sheet** (`Sheet` do shadcn) que abre do bottom com lista vertical de guias agrupadas (mesmos grupos do desktop), cada item com ícone à esquerda + nome + descrição curta.
- Item ativo destacado com bg primary/10 + border-l-2 primary.
- Mais "respirável" que o grid atual e cabe mais conteúdo sem apertar.

**Tablet (md específico, 753px):** o scroll horizontal do desktop já resolve.

### Arquivos
- `src/lib/gameStore.ts` — adicionar `toggleTab` action.
- `src/pages/Settings.tsx` — nova seção "Guias visíveis" com switches + presets.
- `src/pages/Index.tsx` — refatorar header (scroll horizontal desktop + Sheet mobile + grupos).

### Notas técnicas
- `disabledTabs` já persiste via `usePlayerData` (faz parte do `game_state` jsonb). Sem migração de banco.
- Forçar `missions` e `habits` sempre visíveis no `visibleTabs` filter (mesmo se aparecerem em `disabledTabs` por algum motivo).
- Grupos definidos como constante `TAB_GROUPS` em `Index.tsx` pra reutilizar entre desktop e mobile.
