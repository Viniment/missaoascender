

# Plano: Organizar conquistas + Configuração de Afirmações + CRUD e Slideshow

## 1. Organizar conquistas no AchievementsPanel

O array `ACHIEVEMENTS` já está organizado por tipo (streak, mission, habit, level, discipline, special), mas o painel mostra tudo misturado num grid. Vou reorganizar a exibição para agrupar por tipo com seções visuais claras:

- Quando filtro = "Todas", mostrar conquistas agrupadas por tipo (cada tipo com header separado: "🔥 Streak", "⚔️ Missões", etc.)
- Dentro de cada grupo: desbloqueadas primeiro, depois por progresso
- Manter o filtro por tipo como está (quando filtra, mostra só aquele tipo sem sub-headers)

**Arquivo:** `src/components/AchievementsPanel.tsx`

## 2. Aba Afirmações desativada por padrão + toggle em Configurações

- Em `src/pages/Index.tsx`: incluir `'affirmations'` na lista de abas desativadas por padrão (quando `state.disabledTabs` é undefined/vazio na primeira vez)
- Em `src/pages/Settings.tsx`: adicionar "Afirmações" na lista de toggles da seção Interface
- Em `src/lib/gameStore.ts`: definir `disabledTabs: ['affirmations']` no estado inicial

**Arquivos:** `src/pages/Settings.tsx`, `src/lib/gameStore.ts`

## 3. Botão para criar afirmação própria (já favoritada)

- Adicionar botão "Criar Afirmação" no AffirmationsPanel
- Abre um input/textarea inline para digitar
- Ao salvar, cria com `type: 'custom'`, `favorited: true`
- Tipo `AffirmationMode` expandido para incluir `'custom'`

**Arquivo:** `src/components/AffirmationsPanel.tsx`

## 4. Editar e excluir qualquer afirmação

- Em cada afirmação (favoritas e histórico), adicionar ícones de editar (Pencil) e excluir (Trash)
- Editar: abre textarea inline com o texto, salva no state
- Excluir: remove do array com confirmação simples

**Arquivo:** `src/components/AffirmationsPanel.tsx`

## 5. Slideshow manual em tela cheia

- Botão "Slideshow" no painel (só aparece se há afirmações favoritadas)
- Abre tela cheia com a primeira afirmação favoritada
- Setas (esquerda/direita) ou botões para navegar entre favoritas
- Visual imersivo: fundo escuro, texto grande centralizado, sem distrações
- Ideal para repetição/reprogramação mental

**Arquivo:** `src/components/AffirmationsPanel.tsx`

## 6. Fix runtime error (useGame fora do GameProvider)

- Verificar e corrigir o erro "useGame must be used within GameProvider" que aparece nos logs

**Arquivos a alterar:**
- `src/components/AchievementsPanel.tsx` — agrupar por tipo
- `src/components/AffirmationsPanel.tsx` — criar afirmação, editar, excluir, slideshow
- `src/pages/Settings.tsx` — toggle de afirmações
- `src/lib/gameStore.ts` — disabledTabs padrão com 'affirmations'

