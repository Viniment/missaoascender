
# Reformulação: Despertar adaptativo + Diário inteligente

## 1. Guia "Despertar" — remover ritual fixo

**Em `src/components/AwakeningPage.tsx`:**

- Remover completamente o bloco "Ritual emocional — 3 passos" (🪞 Ritual de abertura, 💧 Como você chega aqui hoje, 🤍 Como alguém que se ama agiria).
- Remover state e tipos: `ritualChoice`, `emotionalState`, `selfLoveIntent`, `RitualChoice`, `EmotionalState`, `SelfLoveIntent`, `EMOTIONAL_STATES`, `SELF_LOVE_INTENTS`.
- Remover envio desses campos no `supabase.functions.invoke('awakening-questions', ...)`.
- Manter: histórico de reflexões, edição inline, gerador IA, seletor de intensidade/tema (continuam como ajustes opcionais — o usuário pediu fim do "fluxo fixo manual de abertura", não dos controles de personalização). Se preferir mais simplicidade, posso deixar tudo em "Auto" por padrão e ocultar seletores num "Ajustes avançados" expansível.
- O botão "Gerar despertar" passa a ser o único ponto de entrada — IA decide tudo a partir do contexto.

**Em `supabase/functions/awakening-questions/index.ts`:**

- Remover do body e do prompt: `ritualChoice`, `emotionalState`, `selfLoveIntent`.
- Reforçar no SYSTEM_PROMPT que a IA deve **detectar automaticamente** estado emocional, padrão dominante e tom a partir de `context.derived` + `recentJournal` + hábitos/missões/recaídas dos últimos 7d. O `detectedState` agora é 100% inferido.
- Adicionar análise de "amor-próprio vs autotraição" como eixo principal: a IA classifica o usuário em (fidelidade a si / desconexão leve / autotraição ativa) e ajusta tom — orgulho/reforço quando fiel, reconexão/consciência suave quando em autotraição. Nunca humilhar.

## 2. Diário inteligente — perguntas geradas pela IA

**Nova edge function `supabase/functions/journal-prompts/index.ts`:**

- Recebe `context` (mesmo `buildAiContext`) e retorna 3 perguntas personalizadas baseadas nos últimos 7 dias.
- System prompt define dois modos: **modo orgulho** (quando `behavioralEvolution === 'progredindo'` ou streak crescendo) e **modo reconexão** (quando há recaídas/autotraição). Exemplos do prompt do usuário viram few-shots.
- Retorna `{ mode: 'orgulho' | 'reconexao' | 'neutro', detectedSignal: string, questions: [{title, prompt, objective}] }` via tool call.
- Mesmo padrão de CORS / `LOVABLE_API_KEY` das outras functions.

**Nova edge function `supabase/functions/journal-exercise/index.ts`:**

- Gera **1 exercício curto** personalizado (≤5 min): promessa para si, lista de atitudes de autorrespeito, visualização do eu-futuro, mini desafio de lealdade, etc.
- Retorna `{ title, description, steps: string[], purpose: string }`.

**Em `src/components/JournalPanel.tsx`:**

- Acima do formulário de nova entrada, adicionar painel **"✨ Hoje a IA propõe"** com:
  - Botão "Gerar perguntas do dia" → chama `journal-prompts`, mostra 3 perguntas com objetivo curto. Clicar numa pergunta preenche o `title` + insere a pergunta como blockquote inicial no editor.
  - Botão "Exercício de reconexão" → chama `journal-exercise`, mostra card com passos. Botão "Usar este exercício no diário" copia para o editor.
  - Cache leve por dia: armazenar última geração no `localStorage` (chave `journal-prompts-YYYY-MM-DD`) para não regenerar a cada visita, com botão "Atualizar".
- Manter formulário, emoções, intensidade, modo profundo e lista de entradas existentes intactos.

## 3. Contexto IA (sem mudanças estruturais)

`src/lib/aiContext.ts` já entrega os 7 dias com `failureCount7d`, `consistencyTrend`, `emotionalDrift`, `behavioralEvolution`, `recurringFailedItems` e diário recente — suficiente para ambas as functions. Só passar `buildAiContext(state)` no body.

## Detalhes técnicos

- Edge functions: copiar template das existentes (CORS, `LOVABLE_API_KEY`, modelo padrão `google/gemini-2.5-flash`, tool calling para JSON estruturado).
- Tom dos prompts segue `mem://design/emotional-philosophy`: cinematográfico, acolhedor, anti-tóxico, sem humilhação.
- Cache no front: `useState` + `localStorage`, invalidação por data Brasília (`getTodayBrasilia`).
- Sem mudanças de schema, sem mudanças no `gameStore`, sem mudanças de auth.

## Validação

- Build/typecheck limpos.
- Despertar abre direto no gerador (sem ritual visível).
- Diário mostra painel IA, botão "Gerar perguntas" devolve 3 perguntas coerentes com últimos 7 dias, clicar preenche o editor.
- Exercício aparece como card com passos numerados.
- Tom respeita as regras: nada de "você consegue", nada de humilhação.

## Fora de escopo

DB, auth, XP, missões, hábitos, recompensas, design system — nada disso muda.
