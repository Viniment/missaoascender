
# Plano: Correções de legibilidade + Conquistas de Hábitos + Aba "Afirmações Inteligentes"

## Resumo
4 frentes: (1) corrigir legibilidade no modal de edição do Diário e ícones, (2) adicionar conquistas para dias concluídos em hábitos, (3) criar a aba "Afirmações Inteligentes" com IA.

---

## 1. Corrigir legibilidade no Diário

**Problema:** O título "Editar Entrada" no Dialog/Drawer está quase invisível. Os ícones de editar/excluir/expandir não têm contraste suficiente.

**Solução:**
- `src/components/ui/dialog.tsx` — adicionar `text-foreground` na classe do `DialogTitle` (linha 70)
- `src/components/ui/drawer.tsx` — mesmo ajuste no `DrawerTitle`
- `src/components/JournalPanel.tsx`:
  - Adicionar botão "Fechar" visível no topo do EditContent (um `<Button variant="ghost" size="icon">` com ícone X)
  - Ícones de Editar: trocar de `variant="ghost"` para classe com `text-foreground/70 hover:text-primary` (mais visível)
  - Ícone de Excluir: manter `text-destructive` mas com opacidade maior
  - Chevron: trocar `text-foreground/50` para `text-foreground/70`

## 2. Conquistas de dias concluídos em Hábitos

**Problema:** Não existem conquistas que parabenizem o usuário por completar 5, 10, 15, 20, 25, 30+ dias em hábitos.

**Solução:**
- `src/lib/achievements.ts` — Já existem conquistas de `habit-done-10`, `habit-done-30`, `habit-done-60`, `habit-done-100`, `habit-done-200`. Faltam os marcos 5, 15, 20, 25. Adicionar:
  - `habit-done-5` (5 dias, Rank E)
  - `habit-done-15` (15 dias, Rank D)
  - `habit-done-20` (20 dias, Rank C)
  - `habit-done-25` (25 dias, Rank C)
- Usar a mesma função `maxHabitDone` que já existe

## 3. Aba "Afirmações Inteligentes"

Nova aba completa usando Lovable AI (via edge function) para gerar afirmações personalizadas.

### Edge Function: `supabase/functions/affirmations/index.ts`
- Recebe: dados do Despertar, última entrada do Diário, emoção, hábitos recentes, modo (despertar/noturna/fraqueza)
- Usa Lovable AI (`google/gemini-3-flash-preview`) com system prompt especializado que:
  - Analisa estado emocional
  - Detecta padrões de autossabotagem
  - Gera afirmações diretas, não genéricas
  - Adapta tom: acolhimento (início), equilíbrio (meio), confronto (avançado)
- Retorna: afirmação + tipo (despertar/noturna/fraqueza)

### Componente: `src/components/AffirmationsPanel.tsx`
- **Seções:**
  - Afirmação do Despertar (matinal, baseada no awakening)
  - Afirmação Noturna (reflexiva, baseada no diário do dia)
  - Botão "Momento de Fraqueza" — modo especial com UI focada, sem distrações, fundo escuro, afirmação em destaque
- **Imersão:**
  - Modo tela cheia (botão para expandir)
  - Texto aparecendo palavra por palavra com animação (framer-motion)
- **Memória:**
  - Afirmações favoritas (salvas no state do jogador)
  - Histórico de afirmações geradas
- **"Momento de Fraqueza":**
  - Interface muda: fundo mais escuro, tipografia maior, sem navegação
  - Afirmação de confronto direto
  - Ativado manualmente ou detectado por emoção intensa no diário

### State: `src/lib/gameStore.ts`
- Adicionar ao `PlayerState`:
  - `affirmations: { id, text, type, date, favorited }[]`
  - `affirmationHistory: string[]` (para evitar repetições)
- Adicionar actions: `addAffirmation`, `toggleFavoriteAffirmation`

### Integração: `src/pages/Index.tsx`
- Adicionar tab `{ id: 'affirmations', label: 'Afirmações', icon: Flame }` (ou similar)
- Importar e renderizar `AffirmationsPanel`

### Arquivos envolvidos
- `src/components/ui/dialog.tsx` — text-foreground no título
- `src/components/ui/drawer.tsx` — text-foreground no título
- `src/components/JournalPanel.tsx` — botão fechar + contraste ícones
- `src/lib/achievements.ts` — 4 novas conquistas de hábito
- `supabase/functions/affirmations/index.ts` — nova edge function
- `src/components/AffirmationsPanel.tsx` — novo componente
- `src/lib/gameStore.ts` — novo state + actions para afirmações
- `src/pages/Index.tsx` — nova aba

### Detalhes técnicos
- A edge function usa `LOVABLE_API_KEY` (já configurado) para chamar o Lovable AI Gateway
- O prompt do sistema será em português, com instruções para nunca gerar afirmações genéricas
- O componente envia contexto do usuário (awakening, última entrada do diário, emoção, streak) para a edge function
- Sem streaming neste caso — resposta curta (1-2 frases), invoke simples
- Animação palavra-por-palavra usa framer-motion com stagger
