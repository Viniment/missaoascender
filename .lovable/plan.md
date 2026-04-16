

## Contexto
A edge function `awakening-questions` já recebe `awakening` (become/reject/pain) e `journal`. O usuário quer que **as reflexões anteriores salvas no Despertar** (`state.reflections`) também sejam usadas como contexto, criando uma evolução progressiva de autoconhecimento.

## Mudanças

**1. `src/components/AwakeningPage.tsx`**
- No `handleSuggest`, incluir as últimas 3-5 reflexões do `state.reflections` no payload enviado à edge function:
  ```ts
  reflections: (state.reflections || []).slice(0, 5).map(r => ({
    question: r.question,
    answerHtml: r.answerHtml,
    date: r.date,
  }))
  ```

**2. `supabase/functions/awakening-questions/index.ts`**
- Aceitar novo campo `reflections` no body
- Adicionar bloco no `userPrompt`:
  ```
  === REFLEXÕES ANTERIORES DO DESPERTAR ===
  [1] Pergunta: ...
      Resposta: ... (HTML stripado, primeiros 500 chars)
  ```
- Atualizar o **system prompt** para instruir a IA a:
  - Identificar **padrões evolutivos** entre as reflexões antigas e o estado atual
  - Detectar **temas recorrentes** (medos, desculpas, vitórias) que aparecem repetidamente
  - Gerar perguntas que **avancem o autoconhecimento** — não repetir o que já foi explorado, mas aprofundar ou confrontar contradições
  - Se notar evolução, reconhecer e provocar o próximo passo; se notar estagnação, confrontar
- Stripar HTML das respostas (`replace(/<[^>]+>/g, ' ')`) antes de enviar pra IA pra economizar tokens

## Resultado
A IA passa a ter memória das reflexões anteriores e gera perguntas que constroem em cima do que já foi descoberto, evitando perguntas redundantes e forçando progresso real no autoconhecimento.

