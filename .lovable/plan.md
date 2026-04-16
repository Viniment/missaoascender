
Objetivo: corrigir a legibilidade que ficou quebrada após a remoção do tema, restaurar um padrão visual consistente no Diário/Despertar/Configurações e melhorar o fluxo de troca de foto.

1. Restaurar contraste global dos textos e superfícies
- Revisar `src/index.css` para reforçar contraste base de:
  - texto principal
  - texto secundário
  - placeholders
  - conteúdo do editor rico (`.ProseMirror`)
  - conteúdo renderizado (`.prose`, especialmente no Diário e Despertar)
- Ajustar cores que hoje estão fracas demais em dark mode, sem voltar com o tema removido.
- Garantir que títulos, labels, selects, textareas e conteúdos HTML salvos usem cores consistentes com o tema atual.

2. Corrigir leitura do Diário
- Melhorar o bloco de leitura das entradas em `src/components/JournalPanel.tsx`.
- Fazer os títulos terem mais destaque visual e melhor hierarquia.
- Aplicar a interação que você pediu: o item da lista pode expandir para mostrar o conteúdo, num padrão parecido com Despertar, para ler o que foi escrito sem depender só do modal.
- Manter modal/drawer apenas como complemento, se ainda fizer sentido.
- Reforçar contraste do conteúdo salvo do editor, porque hoje a leitura do HTML renderizado está fraca.

3. Padronizar editor rico do Diário e Despertar
- Revisar `src/components/RichEditor.tsx`.
- Melhorar contraste da área de digitação, toolbar, placeholder, selects internos e texto digitado.
- Deixar o editor com aparência mais próxima de “editor legível” no estilo Notion/Word, mas mantendo a identidade visual do app.
- Garantir consistência entre:
  - Diário
  - Despertar
  - formulários de missão/hábito que usam o mesmo editor

4. Corrigir títulos e textos da seleção de temas
- Revisar `src/components/ThemeSelector.tsx` e o sistema em `src/hooks/useTheme.ts`.
- Aumentar contraste dos nomes e descrições dos temas.
- Ajustar tamanho/peso/cor dos textos menores, que hoje estão difíceis de ler.
- Validar que todos os temas restantes preservam legibilidade mínima para textos principais e secundários.

5. Melhorar o fluxo de troca de foto em Configurações
- Revisar `src/pages/Settings.tsx`.
- Adicionar um botão explícito de “Trocar foto” além do clique na imagem.
- Tornar a área mais visual, com estados claros:
  - padrão
  - enviando
  - sucesso
  - erro
- Mostrar feedback visível durante upload e após conclusão.
- Em sucesso: indicar claramente que a foto foi alterada.
- Em erro: exibir alerta claro e manter o usuário orientado.

6. Revisão de legibilidade geral da interface
- Fazer uma passada final nos textos que hoje dependem de `text-muted-foreground` ou variantes pequenas demais.
- Priorizar:
  - cabeçalhos
  - subtítulos
  - labels
  - textos auxiliares em formulários
  - títulos de cards/painéis
- Ajustar onde houver contraste insuficiente sem “lavar” o visual neon do app.

Arquivos que devem ser alterados
- `src/index.css`
- `src/components/JournalPanel.tsx`
- `src/components/RichEditor.tsx`
- `src/components/AwakeningPage.tsx` (se necessário para alinhar leitura/expansão visual)
- `src/components/ThemeSelector.tsx`
- `src/hooks/useTheme.ts`
- `src/pages/Settings.tsx`

Resultado esperado
- Diário volta a ficar confortável de ler
- título e conteúdo ganham destaque novamente
- editor rico fica claro e contrastante
- nomes dos temas ficam legíveis
- troca de foto fica óbvia, visual e com feedback completo
- o app recupera a sensação visual anterior sem reintroduzir o tema removido

Detalhes técnicos
- O problema não parece ser um único bug isolado, e sim uma combinação de contraste fraco + uso excessivo de texto “muted” + renderização de conteúdo rico sem reforço visual suficiente.
- O Diário hoje lista títulos em cards simples e lê o conteúdo em modal/drawer; vou adaptar isso para uma leitura expandível mais direta.
- O `RichEditor` usa Tiptap com classes `prose`/`ProseMirror`; a correção principal passa por CSS e pela casca visual do componente.
