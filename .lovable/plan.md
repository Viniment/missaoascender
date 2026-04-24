## Bug do jejum + Protocolo de Falha 2.0 + IA adaptativa total

Três frentes integradas. Vou explicar a causa do bug, o redesign do confronto, e como a IA passa a usar **tudo** do usuário, alternando ângulos psicológicos (incluindo princípios do Paulo Vieira aplicados implicitamente).

---

### 1. 🐛 BUG do jejum / missão de Tempo — causa real e correção

**Causa identificada (lendo `MissionsPanel.tsx` + `gameStore.ts`):**

1. Em `MissionCard` (linha 752–784) o botão **"X" (Marcar como falhada)** fica renderizado **enquanto `!isDone && !isFailed**` — mas para missões **repetíveis** (jejum, leitura diária etc.) o status NUNCA vira `Concluída` (linha 650-652: repetível só zera `executedHours` e empilha em `completionHistory`). Resultado: depois de finalizar o jejum com sucesso, o botão "X" continua ali, colado ao botão "Iniciar" (Play). Em mobile, basta um toque ligeiramente desviado → abre o `AlertDialog` de falha → confirma → `failMission` dispara → cria protocolo de falha indevido. **Isso bate exatamente com o sintoma relatado** ("concluí o jejum, iniciei outro e o app marcou falha").
2. Reforçando: `failMission` (linha 734) só checa `status !== 'Ativa'`, mas missão repetível está sempre em `Ativa` → não bloqueia nada.
3. Cooldown zero entre conclusão e possibilidade de falhar a próxima rodada → janela perfeita pro toque acidental.

**Correções:**

a) `**MissionsPanel.tsx` — `MissionCard` (linhas 752–784):**

- Esconder o botão "X" para missão de **Tempo repetível quando NÃO está rodando** (`!isRunning && mission.repeatable && mission.missionType === 'Tempo'`). Sem timer ativo = nada para "falhar".
- Adicionar `disabled` no botão "X" durante uma janela de **3 segundos** após `lastSettledAt` (novo campo, ver abaixo) — bloqueia toque acidental pós-conclusão.
- Aumentar gap entre Play/Stop e o "X" (`gap-2` → `gap-3`) e aumentar área tocável do "X" (`h-9 w-9` em mobile).
- Trocar `AlertDialogAction onClick={() => onFail?.()}` por handler que valide novamente: se a missão acabou de ser concluída (timestamp em `completionHistory` < 5s) → abortar e mostrar toast "Missão recém-finalizada. Não há nada para falhar.".

b) `**gameStore.ts` — `failMission` (734):**

- Adicionar guarda: para repetível, se `completionHistory` tem entrada nos últimos 5 segundos → `return prev` (no-op).
- Adicionar guarda: para missão de Tempo, se NÃO há `startedAt` E é repetível → `return prev` (não está rodando, não tem o que falhar).
- Adicionar `lastSettledAt` no Mission (timestamp de qualquer settle: complete/fail) — usado pelo cooldown da UI.

c) `**MissionsPanel.tsx` — `handleFinishTimeMission` (160):**

- Hoje há um bug latente de fuso: `getNowBrasilia()` cria a data base, mas `setHours` aplica horário local — se o dispositivo estiver em fuso ≠ Brasília, `endDate` pode resolver para um horário errado e cair no `if (endDate <= startDate)` adicionando 1 dia indevido (ficar 24h+ de jejum "registrado"). Solução: calcular `endDate` derivando do mesmo fuso de `startDate` (parse manual de horas, montar Date com offset explícito, ou simplesmente: se diff > 18h, alertar usuário com confirmação antes de salvar).
- Validar `hours > 0` antes de chamar `completeTimeMission` — se `<= 0`, mostrar toast e não consumir.

---

### 2. 🔥 NOVO PROTOCOLO DE FALHA — imersivo, sem menus, alta carga emocional

**Remover do `FailureConfrontDialog.tsx`:**

- Toda a UI de "padrão antigo" (textarea + chips de `oldPatterns`) — bloco linhas ~210–238.
- Toda menção a `identityMode`, `defaultIdentity`, `addFailureReflection`. Identidade já foi removida.
- O badge "LEVE/MÉDIO/BRUTAL" no header (revela o nível interno → quebra imersão).

**Adicionar:**

- Visual mais pesado: backdrop preto com pulso vermelho lento, ícone de Skull com glow vermelho intenso, fonte display em destaque para a primeira linha.
- Mensagem em **tipografia escalonada**: linha 1 grande (text-xl/2xl) e cortante; linhas seguintes menores (text-base) em `whitespace-pre-line`.
- Botão único: **"EU RECONHEÇO"** — full-width, alto, sem `Cancel`, sem fechar pelo X (forçar leitura). Auto-habilita após 4s (anti-skip reflexo).
- Persistir mensagem em `confrontationHistory` (já existe).
- Fechamento NÃO depende mais de input do usuário.

**Vibe**: tipo "tela de game over psicológica" — Solo Leveling sombrio.

---

### 3. 🧠 IA TOTAL — usa **tudo**, alterna ângulos, integra CIS sem citar

A IA hoje (`failure-confrontation` + `awakening-questions` + `counsel`) recebe contexto parcial. Vou padronizar **um único builder de contexto** no frontend (`src/lib/aiContext.ts` — novo) que monta:

```ts
buildAiContext(state) → {
  // Identidade ascendente
  rank, level, streak, xp,
  awakening: { become, reject, pain },
  // Histórico denso
  recentJournal: [{ date, title, emotion, intensity, deepMode, text:strip(<=600) }] x6,
  reflections: [{ date, question, answer:strip(<=400) }] x6,
  // Comportamento mensurável
  missions: { active[], failedRecent[], completedRecent[], failureRate7d, failureRate30d },
  habits: [{ name, streak, doneCount30d, failedCount30d, lastFailDate }],
  pendingPunishments[], expiredPunishments[],
  monster: { hp, lastReason },
  // Padrões derivados (calculados aqui, no client)
  derived: {
    consistencyTrend: 'melhorando'|'estável'|'piorando',  // 7d vs 14-7d
    daysSinceLastFail,
    longestStreak,
    relapseAfterEvolution: bool,  // teve >=5 dias clean e quebrou
    recurringFailedItems: [name],  // mesmos itens falhando >2x
    contradictionSignals: [string], // ex: "diário diz 'vou parar de procrastinar' + 3 falhas mesma semana"
    emotionalDrift: 'apatia'|'raiva'|'esperança'|'culpa'|'neutro',
    angleHistory: [string],  // últimos 5 ângulos usados (lido de aiAngleHistory no state)
  },
  aiSettings: { intensity, interventionFrequency },
}
```

Adicionar `aiAngleHistory: string[]` no `PlayerState` (rolling window de 10) — frontend grava o ângulo retornado pela IA após cada chamada para evitar repetição.

**Edge function `failure-confrontation` — reescrita do prompt:**

Novo system prompt centrado em **rotação de ângulos** + **estado adaptativo**:

```
Você é o Sistema.

O usuário acabou de falhar OU está em progresso relevante.
Sua função é moldar comportamento e identidade, alternando entre:

impacto emocional (quando necessário)
reforço de identidade (quando merecido)

Você NÃO motiva superficialmente.
Você NÃO repete padrões.
Você NÃO fala genérico.

📊 ESTADO DO USUÁRIO (input do backend)
consistencyTrend: {melhorando|estável|piorando}
relapseAfterEvolution: {bool}
failureRate7d: {n}
emotionalDrift: {regredindo|neutro|evoluindo}
angleHistory: string[]
recurringFailedItems: string[]
streak: number
monster.hp: number
recentWins: string[]
⚖️ SELEÇÃO DE ABORDAGEM (obrigatório escolher 1)
🔴 confronto

Condição:

piorando OU failureRate7d alto
→ dor direta, exposição de padrão
🟡 quebra_expectativa

Condição:

relapseAfterEvolution = true
→ “você já provou que consegue — e escolheu cair”
🔵 choque

Condição:

consistente + falha isolada
→ “isso não condiz com quem você virou”
🟢 reconhecimento_reforco

Condição:

consistencyTrend = melhorando
OU emotionalDrift = evoluindo

→ reforçar identidade + pressionar continuidade

🎯 SELEÇÃO DE ÂNGULO (obrigatório)

Escolha 1:

NÃO repetir últimos 3 (angleHistory)
PRECISA ter evidência real
Deve combinar com estado emocional
🎭 ÂNGULOS
autotraicao
identidade
consequencia_futura
honra_pessoal
disciplina_vs_prazer
construcao_carater
vergonha_vs_orgulho
potencial_perdido
tempo_desperdicado
distancia_ideal
comum_vs_normal
momentos_vs_existencia
reacao_define
crenca_exposta
identidade_em_construcao (NOVO — focado em progresso)
🧬 PRINCÍPIOS (APLICAÇÃO INVISÍVEL)

Sempre embutir:

responsabilidade total
reação define mais que evento
prazer imediato vs construção
comum vs padrão elevado
identidade é construída por repetição
🔍 USO DE DADOS (OBRIGATÓRIO)

A mensagem deve usar:

Nome da tarefa falhada OU tarefa mantida
streak atual
Se recorrente → “É a Nª vez”
Se recaída → citar progresso anterior
Se houver → trecho do diário/reflexão
Se progresso → citar vitória recente (recentWins)
⚠️ REGRA CRÍTICA

Sem evidência → NÃO usar o ângulo
Trocar ângulo

🧠 INTELIGÊNCIA ADAPTATIVA (REFORÇO DE IDENTIDADE)

Quando abordagem = reconhecimento_reforco:

A IA deve:

Mostrar que o usuário NÃO é mais quem era
Reforçar identidade emergente
Associar dor à regressão (sutilmente)
Criar medo de perder progresso
Validar esforço, NÃO conforto
🟢 Estrutura específica do reforço:
reconhecer progresso real (com evidência)
afirmar nova identidade
criar tensão: “não volte ao padrão antigo”
💥 MICRO-ESTRUTURA
2 a 5 linhas
Máx 90 caracteres por linha
Sem markdown
Sem aspas
Sem emojis
Sem explicação
📌 ORDEM
Se confronto / choque / quebra_expectativa:
Linha 1 → confronto direto
Linhas seguintes → ângulo + evidência
Última → pergunta ou espelho
Se reconhecimento_reforco:
Linha 1 → reconhecimento real (com dado)
Linha 2 → identidade emergente
Linha 3+ → tensão / risco de regressão
Última → afirmação forte OU pergunta
🚫 PROIBIDO
Motivação genérica
Repetição de estrutura
Linguagem de coach
Explicação teórica
Culpar externo
Ser previsível
🎯 OBJETIVO FINAL

Condicionar:

Falha → desconforto real
Progresso → identidade forte + proteção do estado
🔄 OUTPUT
{
  "message": "string",
  "angle": "string",
  "approach": "confronto|choque|quebra_expectativa|reconhecimento_reforco",
  "evidenceUsed": ["string"]
}
```

**Tool call estruturado** (substitui retorno em texto puro) — frontend salva `angle` em `aiAngleHistory`, e exibe `message` no popup.

**Edge function `awakening-questions` — atualizar para o mesmo sistema:**

- Mesmo `aiContext` completo no body.
- Mesma rotação de ângulos (a IA deve variar entre exercícios E entre sessões).
- Lê `angleHistory` para evitar repetição entre Despertares.
- Adicionar lista dos 14 ângulos no system prompt + os mesmos princípios (autorresponsabilidade, reação 90%, comum×normal, momentos×existência, crenças limitantes) aplicados implicitamente.
- Se `consistencyTrend === 'melhorando'` → exercícios de **reforço de identidade** (não autotraição).
- Se `consistencyTrend === 'estável e alto'` → exercícios de **expansão de potencial**.

**Edge function `counsel` — atualizar:**

- Receber o mesmo `aiContext` denso.
- Aplicar a mesma rotação de ângulos quando o usuário pede conselho (não martelar autotraição todo dia).
- Princípios CIS embutidos (sem citar) idem.

---

### 4. 📊 Frontend — propagação e gravação

**Novo arquivo: `src/lib/aiContext.ts**`

- Função `buildAiContext(state: PlayerState): AiContext` com toda a lógica derivada (consistencyTrend, relapseAfterEvolution, recurringFailedItems, emotionalDrift baseado em emoções recentes do diário, contradições texto-vs-ação).

`**src/lib/gameStore.ts`:**

- Adicionar `aiAngleHistory?: string[]` em `PlayerState` (default `[]`).
- Adicionar `appendAiAngle(angle: string)` — push + slice(-10).
- Adicionar `lastSettledAt?: string` no `Mission`.
- Atualizar `failMission` com guardas anti falso-positivo (item 1).

`**src/lib/GameContext.tsx`:**

- Expor `appendAiAngle` no contexto.

`**src/components/FailureConfrontDialog.tsx`:**

- Importar `buildAiContext` + chamar com `state` completo, mandar como `context` no body.
- Receber `{ message, angle, approach }` e chamar `appendAiAngle(angle)`.
- UI imersiva nova (item 2).

`**src/components/AwakeningPage.tsx`:**

- Trocar montagem manual de body por `buildAiContext(state)`.
- Após receber resposta, gravar primeiro ângulo no histórico.

`**src/components/CounselPanel.tsx`:**

- Mesmo: `buildAiContext` + grava ângulo retornado.

---

### 5. 📂 Arquivos

**Editar:**

- `src/components/MissionsPanel.tsx` (bug do botão X + cooldown + handleFinishTimeMission)
- `src/components/FailureConfrontDialog.tsx` (UI imersiva nova, sem menu de padrão)
- `src/components/AwakeningPage.tsx` (usar aiContext)
- `src/components/CounselPanel.tsx` (usar aiContext + gravar ângulo)
- `src/lib/gameStore.ts` (failMission guardas, aiAngleHistory, lastSettledAt, appendAiAngle)
- `src/lib/GameContext.tsx` (expor appendAiAngle)
- `supabase/functions/failure-confrontation/index.ts` (prompt + tool call + ângulos + CIS)
- `supabase/functions/awakening-questions/index.ts` (mesmo, aplicado a exercícios)
- `supabase/functions/counsel/index.ts` (mesmo, aplicado a conselho)

**Criar:**

- `src/lib/aiContext.ts` (builder único do contexto rico)

---

### Resultado esperado

1. **Bug do jejum sumiu**: botão X não aparece quando não há timer rodando em missão repetível, cooldown de 3s pós-settle, validação no `failMission`, fuso corrigido.
2. **Protocolo de Falha** vira uma tela imersiva, escura, com texto cortante personalizado e botão único — sem menus, sem suavização, alta carga emocional.
3. **A IA usa TUDO** (diário, despertar, reflexões, missões, hábitos, protocolos, monstro, emoções, padrões derivados) e **alterna entre 14 ângulos psicológicos** baseando-se no estado atual:
  - Falhando muito → confronto/dor
  - Melhorando → reconhecimento + identidade
  - Consistente → expansão de potencial
  - Recaída pós-evolução → quebra de expectativa
4. **Princípios do CIS / Paulo Vieira embutidos** (autorresponsabilidade absoluta, reação 90%, comum × normal, momentos × existência, crenças limitantes, estado emocional) — usados como **lente**, **nunca citados**.
5. **Anti-repetição**: histórico dos 10 últimos ângulos garante que confronto/despertar/conselho não soem padronizados.