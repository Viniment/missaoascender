

## Problema
A seção **Afirmações** está com texto longo embolado num único parágrafo (linha 224–236). Como o renderer usa `whitespace-pre-line` num `<p>` único, fica visualmente denso e difícil de escanear no mobile.

## Solução
Permitir que `content` seja um **array de blocos estruturados** (parágrafos, títulos pequenos, listas com ícone) — sem refatorar todas as seções, mantendo retrocompatibilidade com `string`.

### Mudanças em `src/pages/Help.tsx`

**1. Estender o tipo `Section`:**
```ts
type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'subtitle'; emoji?: string; text: string }
  | { type: 'list'; items: { emoji: string; label: string; desc: string }[] };

content: string | ContentBlock[];
```

**2. No render (linha 447):** detectar se `content` é string (manter `<p>` atual) ou array (renderizar bloco a bloco com espaçamento `space-y-3`, subtítulos em `font-display text-foreground`, listas com ícone destacado + descrição menor).

**3. Reescrever `content` da seção Afirmações** como array bem formatado:

- **Parágrafo de abertura** — texto curto, claro
- **Subtítulo "🎛️ Modos de Geração com IA"** + lista 3 itens (Despertar / Noturna / Fraqueza) com emoji destacado, nome em negrito e descrição
- **Subtítulo "✍️ Criar Manualmente"** + parágrafo curto sobre o botão Criar
- **Subtítulo "▶️ Slideshow"** + parágrafo sobre meditação com favoritas
- **Subtítulo "🎯 Ações em cada Afirmação"** + lista compacta dos botões (favoritar/editar/excluir/expandir/regenerar)
- **Subtítulo "🤖 Como a IA Personaliza"** + parágrafo explicando contexto (Despertar Inicial, diário, emoção, streak, rank, histórico)

**4. Melhorar texto** — frases mais curtas, diretas, tom motivacional do app, sem repetições.

**5. Atualizar `benefits` e `tips`** levemente para ficarem mais punchy (5 itens cada, frases de até 70 chars).

### Resultado
Seção Afirmações fica visualmente respirável: blocos separados, hierarquia clara (subtítulo → conteúdo), fácil de escanear no mobile (753px). Outras seções continuam funcionando sem mudança.

