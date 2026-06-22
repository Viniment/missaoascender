## Objetivo
Corrigir a aba Mentor Interno para que (1) o painel lateral de histórico fique realmente fixo, (2) o scroll do chat se comporte como o Telegram (não pula para o fim quando o usuário está lendo mensagens antigas) e (3) apareça um indicador lateral de mensagem não lida em vez de empurrar o usuário para baixo.

## Mudanças

### 1. Layout — painel lateral fixo (`src/components/MentorChatPanel.tsx`)
- Trocar a altura do container principal de `h-[calc(100vh-220px)]` para uma altura baseada em `100dvh` menos a barra de navegação fixa do app, e transformar a raiz do componente em `flex flex-col` com `min-h-0`, para que:
  - O cabeçalho "Mentor Interno" não role junto com o chat.
  - A área `grid md:grid-cols-[260px_1fr]` ocupe a altura restante com `min-h-0` (evita o "transbordamento" que hoje empurra a sidebar para baixo conforme novas mensagens são adicionadas).
- Na coluna da sidebar desktop:
  - Aplicar `h-full min-h-0 overflow-hidden` no wrapper e manter o bloco interno como `flex flex-col` com cabeçalho (botão "Nova conversa") fixo no topo (`shrink-0`) e a lista de conversas em `flex-1 min-h-0` dentro do `ScrollArea` — garantindo que o botão **Nova conversa** permaneça sempre visível, sem descer com o conteúdo do chat.
- Mesma correção na sidebar mobile (Sheet): cabeçalho fixo + lista rolável.

### 2. Scroll inteligente estilo Telegram
- Manter o `isNearBottomRef`/`handleScroll` que já existe, mas endurecer o comportamento:
  - Remover qualquer `scrollToBottom` automático quando uma nova mensagem do **assistente** chega e o usuário **não** está no fim. Hoje isso já existe, mas vamos remover também o `scroll-smooth` no container (que pode causar saltos visuais durante streaming) e usar `behavior: 'auto'` somente quando o próprio usuário envia.
  - Ao trocar de conversa: ir para o fim **uma vez** (sem animação).
  - Ao enviar mensagem do usuário: forçar `isNearBottomRef = true` e rolar para o fim. (já existe — manter.)
  - Ao chegar resposta do assistente: rolar somente se `isNearBottomRef.current === true`. Caso contrário, **não mexer no scroll** e incrementar contador de não-lidas.
- Garantir que o `ScrollArea` interno do chat use sempre `overflow-y-auto` com altura limitada (`flex-1 min-h-0`) para que o scroll funcione mesmo em conversas muito longas.

### 3. Indicador lateral de mensagens não lidas
- Substituir a pílula central "Nova mensagem" por um **badge flutuante no canto inferior direito** do painel de chat (acima do composer):
  - Mostra `ArrowDown` + contador (`+N`) das mensagens do assistente recebidas enquanto o usuário estava fora do fim.
  - Clique: rola suavemente até o fim e zera o contador.
  - O contador zera automaticamente quando o `handleScroll` detectar que o usuário voltou ao fim (`distance < 120`).
- Estado novo: `const [unreadCount, setUnreadCount] = useState(0)`. Incrementado no `useEffect` que detecta `messages.length` aumentando enquanto `!isNearBottomRef.current`. Zerado em `scrollToBottom` e quando `handleScroll` voltar a ficar perto do fim.

### 4. Comportamento durante "Pensando…"
- O indicador "Pensando…" continua aparecendo no fim do stream de mensagens, mas seu surgimento **não** força scroll se o usuário estiver lendo o histórico.

## Fora de escopo
- Persistência server-side, edição de mensagens, virtualização, mudanças no edge function `mentor-chat`, qualquer mudança visual de tema/cores.

## Arquivos afetados
- `src/components/MentorChatPanel.tsx` (único)
