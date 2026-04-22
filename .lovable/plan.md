

## Ajustes no Despertar + remoção de painéis

### 1. Botão de configuração responsivo (mobile fix)
**`src/components/AwakeningPage.tsx`** — o `Button` "Gerador de Exercícios" + ícone Settings estão num `flex` lado a lado e estouram em telas pequenas (Android). Solução:
- Texto interno do botão principal mais compacto: remover ícone `Brain` (manter só `Sparkles`), usar `truncate`, `min-w-0 flex-1`, e quebrar linha se preciso.
- Garantir `shrink-0` no botão de engrenagem (já tem) e que o container tenha `w-full overflow-hidden`.
- Em telas <380px: usar `text-[11px]` no texto do botão.

### 2. Novo fluxo: gerar perguntas direto no campo do Despertar (estilo Word/Notion)
**Mudança de comportamento:** em vez de abrir o modal `AwakeningExerciseDialog`, ao clicar em **"Gerador de Exercícios"** as perguntas geradas pela IA são inseridas diretamente no `RichEditor` da página, formatadas como um documento editável com espaços para responder embaixo de cada pergunta.

**`AwakeningPage.tsx`:**
- `handleGenerate` passa a montar HTML do tipo:
  ```html
  <h3>🌅 Despertar — {detectedState}</h3>
  <p><em>Data</em></p>
  <hr/>
  <h4>1. {título}</h4>
  <blockquote>{prompt}</blockquote>
  <p><em>Sua resposta:</em></p>
  <p></p><p></p>
  <hr/>
  ... (repete por exercício)
  ```
- Insere esse HTML no `RichEditor` (substituindo conteúdo atual, com confirmação se o campo não estiver vazio).
- Auto-preenche o campo `question` com `Despertar — {detectedState}`.
- Remove o uso do `AwakeningExerciseDialog` na página (dialog deletado).
- Foco automático no editor após gerar; toast: "Perguntas inseridas. Responda abaixo de cada uma."

### 3. Novo prompt da IA — Modo Autotraição + Espelho
**`supabase/functions/awakening-questions/index.ts`** — substitui o `SYSTEM_PROMPT` atual pelo prompt completo enviado pelo usuário (IA de intervenção cognitiva adaptativa, foco em autotraição, identidade, modo espelho pós-queda, níveis 1–5).

Lógica adicional:
- Detectar **queda recente** (missão falhada/hábito quebrado/protocolo pendente nos últimos dias) → ativar **MODO ESPELHO** automaticamente e injetar instrução no user prompt.
- Detectar **nível progressivo** (1–5) com base em recorrência: 1ª vez = nível 1–2, recorrências = nível 3–5.
- Tool call `generate_exercises` mantém a estrutura (`detectedState`, `exercises[{title, prompt, type, objective}]`), mas `detectedState` agora descreve o padrão de autotraição (ex.: "Autoabandono por fuga", "Quebra recorrente de acordos").
- Tipos podem ganhar mapeamento implícito ao novo tom (confronto e quebra ficam em destaque).

### 4. Remover painéis Afirmações, Estoicismo, Identidade, Desafios, Urge Surfing
**`src/lib/gameStore.ts`** — atualizar default de `disabledTabs` para incluir todos:
```ts
disabledTabs: ['affirmations', 'stoic', 'identity', 'challenges', 'urge-surfing', 'visualizar']
```
Isso oculta da sidebar e do mobile menu sem deletar código (usuários antigos que já têm `disabledTabs` salvo no Supabase mantêm preferência; novos usuários e quem nunca mexeu vê só o essencial).

**Adicional:** migração leve no carregamento — se o `disabledTabs` salvo NÃO contiver esses IDs, adicionar (uma vez) via flag `tabsCleanupV2` no estado, para aplicar a limpeza também a usuários existentes.

### Arquivos
- **Editar:** `src/components/AwakeningPage.tsx`, `supabase/functions/awakening-questions/index.ts`, `src/lib/gameStore.ts`, `src/lib/GameContext.tsx` (migração)
- **Não usar mais (mas manter arquivo):** `src/components/AwakeningExerciseDialog.tsx` — pode ficar órfão ou ser removido. Recomendo **remover import** e deixar o arquivo (caso queira reverter).

### Resultado
- Botão de configuração não estoura mais em Android.
- Clicar em "Gerador de Exercícios" agora insere as perguntas direto no editor rico, com espaço para escrever abaixo de cada uma — experiência tipo Notion.
- IA gera perguntas no tom de autotraição/espelho, com modo progressivo e ativação automática pós-queda.
- Sidebar/menu mostra apenas: Missões, Hábitos, Conquistas, Espelho, Conselho, Diário, Timer, Despertar, Loja.

