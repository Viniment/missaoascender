# Atualização do Mentor Interno

Mudanças concentradas em `src/components/MentorChatPanel.tsx`, `src/lib/gameStore.ts` e `supabase/functions/mentor-chat/index.ts`. Sem mudanças de banco, tema ou auth.

## 1. Botão de histórico sempre visível

- Mover o botão "Histórico" do header para um botão flutuante fixo no canto superior esquerdo da área do chat (mobile) — sempre clicável, independente do scroll.
- No desktop a sidebar permanece visível (260px) como hoje.
- No mobile, abrir a sidebar como um Sheet/drawer lateral em vez de substituir o chat, mantendo o contexto.

## 2. Scroll inteligente (estilo Telegram)

Substituir o `useEffect` atual que sempre força `scrollTop = scrollHeight` por:

- Acompanhar a posição com listener `onScroll`. Considerar "perto do fim" quando `scrollHeight - scrollTop - clientHeight < 120px`.
- Auto-scroll só acontece quando o usuário está perto do fim, ou quando ele mesmo acabou de enviar uma mensagem.
- Quando uma nova mensagem da IA chega e o usuário está lendo mensagens antigas:
  - NÃO move o scroll.
  - Mostra um pill flutuante "↓ Nova mensagem" acima do composer.
  - Ao clicar, faz scroll suave até o final e oculta o pill.
- Trocar de conversa faz scroll instantâneo para o fim (comportamento esperado ao abrir um chat).

## 3. Histórico completo com scroll

O histórico já é renderizado por inteiro; manter assim. Garantir que o container do chat tenha altura estável (`h-[calc(100dvh-...)]` com `min-h`) e `overflow-y-auto` funcionando em telas pequenas (corrigir caso o pai esteja limitando). Sem virtualização (volume típico baixo).

## 4. Exclusão de mensagens

- Adicionar `deleteMentorMessage(conversationId, messageId)` em `gameStore.ts`.
- Em cada `MessageBubble`, mostrar um botão lixeira ao passar o mouse / tocar (visível sempre em mobile, opacidade reduzida).
- Confirmação via `AlertDialog` do shadcn ("Excluir esta mensagem? Esta ação não pode ser desfeita.").
- Remoção atualiza state imediatamente, sem deixar gap (lista re-renderiza).
- Conversa restante mantém a ordem; se ficar vazia, mostra o estado vazio normal.

## 5. Criação real de hábitos pela IA

Hoje a IA apenas sugere e o usuário "aceita" mas nada acontece. Implementar criação confiável via tool calling:

### Edge function `mentor-chat`
- Adicionar `tools` na chamada ao gateway com função `create_habit({ name, intention?, difficulty?: "Fácil"|"Médio"|"Difícil", frequency? })`.
- Atualizar o system prompt: a IA pode chamar `create_habit` **apenas quando o usuário confirmar explicitamente** ("sim, cria", "pode adicionar", etc.). Antes disso, apenas sugere e pergunta.
- Retornar do endpoint:
  ```json
  { "reply": "...", "actions": [{ "type": "create_habit", "habit": { ... } }] }
  ```
  Se o modelo chamar a tool, fazer uma segunda rodada para gerar o texto final de confirmação. Se não chamar, `actions: []`.

### Frontend
- Após `invoke('mentor-chat')`, processar `actions`:
  - Para cada `create_habit`, chamar `addHabit(...)` do `gameStore` (já existente) com os campos sugeridos preenchendo padrões seguros.
  - Mostrar `toast.success("Hábito criado: <nome>")`.
  - Anexar uma nota inline no bubble da IA: badge "✓ Hábito criado" abaixo da resposta.
- Atualizar prompt para a IA **nunca afirmar** que criou algo a menos que tenha chamado a tool. Se a tool falhar/não estiver disponível, ela apenas sugere.

### Fallback de segurança
Se `addHabit` der erro, mostrar toast de erro e a IA recebe a mensagem normalmente sem badge — sem alegação falsa de criação.

## Arquivos afetados

- `src/components/MentorChatPanel.tsx` — UI: botão histórico fixo (Sheet no mobile), scroll inteligente + pill de nova mensagem, botão excluir mensagem com AlertDialog, processamento de `actions`.
- `src/lib/gameStore.ts` — `deleteMentorMessage(convId, msgId)`.
- `supabase/functions/mentor-chat/index.ts` — tool calling `create_habit`, ajuste do system prompt, retorno com `actions`.

## Fora de escopo

- Persistência server-side de mensagens (continua no localStorage via `gameStore`).
- Virtualização de listas.
- Edição de mensagens (apenas exclusão foi pedida).
