

## Feature: IA gera perguntas de reflexão no Despertar

### O que vai acontecer
Botão "✨ Sugerir perguntas (IA)" na página Despertar. Ao clicar, a IA analisa as últimas entradas do diário + intenções do despertar do usuário e gera **5 perguntas profundas** personalizadas. As perguntas são inseridas automaticamente no editor com formatação rica (negrito) e espaços para resposta.

### Template gerado no editor
```
**Reflexão guiada — [data]**

**1. [Pergunta gerada pela IA]**
_Responda aqui..._

**2. [Pergunta gerada pela IA]**
_Responda aqui..._

... (até 5)
```
O campo "Sua pergunta" será preenchido com algo como `[IA] 5 perguntas de reflexão`.

### Arquivos a criar/editar

**1. Criar `supabase/functions/awakening-questions/index.ts`** (nova edge function)
- Recebe: últimas 3 entradas do diário, dados do despertar (`become`, `reject`, `pain`), rank do usuário
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com tool calling para retornar JSON estruturado: `{ questions: string[] }` (5 itens)
- System prompt: "Você é um mentor estilo Solo Leveling. Gere 5 perguntas profundas, confrontadoras e específicas baseadas no que o usuário escreveu. Não genéricas. Em PT-BR."
- Trata 429/402 com mensagens claras
- CORS habilitado, sem auth obrigatório (verify_jwt já é false por padrão)

**2. Editar `src/components/AwakeningPage.tsx`**
- Adicionar botão "✨ Sugerir perguntas (IA)" acima do Input de pergunta
- Estado `loadingAI` para feedback visual (spinner + disabled)
- Handler `handleSuggest`:
  - Lê `state.journal` (últimas 3) e `state.awakening` do contexto
  - Chama `supabase.functions.invoke('awakening-questions', { body: {...} })`
  - Monta HTML formatado com `<p><strong>1. ...</strong></p><p><em>Responda aqui...</em></p>` para cada pergunta
  - Seta `setQuestion('[IA] 5 perguntas de reflexão')` e `setAnswer(html)` — o `RichEditor` (Tiptap) renderiza a formatação automaticamente
  - Toast de sucesso/erro
- Proteção anti-duplo-clique já segue o padrão do projeto

### Detalhes técnicos
- O `RichEditor` é Tiptap — aceita HTML e mantém negrito/itálico
- Usa o mesmo padrão da edge function `affirmations` existente (CORS, error handling, modelo)
- Sem migração de DB necessária
- LOVABLE_API_KEY já configurada (Lovable Cloud ativo)

