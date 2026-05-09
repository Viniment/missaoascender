## Visão geral

Transformar Ascensão em um sistema de condicionamento emocional baseado em "Desperte Seu Gigante Interior", **sem** mexer no visual (purple neon RPG mantido). Foco em três frentes:

1. **Tom visceral** nas camadas-chave (copy + IA)
2. **Ritual Diário de Ativação** opcional na aba Despertar
3. **Três novos sistemas de gamificação emocional**: Níveis de Identidade, Sequência de Disciplina, Combate à Autossabotagem

---

## 1. Tom visceral nas camadas-chave

Reescrever copy/prompts (sem alterar lógica) com voz de mentor-espelho: emocional, cinematográfico, confrontador. Proibido: clichês, tom corporativo, "você consegue", coach genérico.

**Frontend**
- `PlayerCard.tsx`: substituir labels neutras ("Streak", "Conquistas") por linguagem de honra ("Disciplina", "Vitórias"). Adicionar selo de **Identidade Atual** (vindo do novo sistema, item 3).
- `JournalPanel.tsx`: títulos, placeholders e toasts reescritos ("Coloque a verdade no papel", "O que você está fugindo de sentir hoje?").
- `MissionsPanel.tsx` / `HabitsPanel.tsx`: toasts de conclusão com prazer da ação ("+ honra. Você se tornou um pouco mais quem disse que ia ser.") e de falha com dor da inação ("Mais uma promessa quebrada. Sua palavra vale o quê pra você?").
- `AppSidebar.tsx`: tagline curta no topo ("Aja. Ou apodreça.").

**Edge functions**
- `counsel/index.ts`: novo `SYSTEM_PROMPT` no espírito Robbins — espelho psicológico, dor↔prazer, identidade. Mantém estrutura `### Diagnóstico / Por que pensei isso / Conselho / Ação imediata`. Mantém `tone` e dados.
- `failure-confrontation/index.ts`: ajustar prompt para evocar dor da inação concreta (custo composto, identidade traída) sem virar punição vazia.
- `awakening-questions/index.ts`: já está no tom novo — apenas absorver as variáveis do novo Ritual (item 2) e do nível de identidade atual (item 3) no contexto.

---

## 2. Ritual Diário de Ativação (leve, opcional)

Card destacado no topo de `AwakeningPage.tsx` chamado **"Ritual de Hoje"**. Não bloqueia nada. Se já feito hoje, mostra estado "✅ Ritual cumprido — voltar para refazer".

Fluxo em **4 passos** (componente novo `DailyRitualDialog.tsx`):

1. **Quebra de padrão** — frase forte gerada/sorteada + 1 pergunta confrontadora ("O que você está fingindo não ver hoje?"). Texto curto.
2. **Dor da inação** — IA gera 2 perguntas baseadas em hábitos quebrados/missões falhadas dos últimos 7 dias (reusa `buildAiContext`). Usuário responde em campos de texto.
3. **Identidade do dia** — chip de escolha: qual versão você ativa hoje? (puxa de `state.identity.dominantTraits` ou opções padrão: Disciplinado, Focado, Honrado, Implacável, Presente).
4. **Compromisso de ação** — usuário escreve UMA ação concreta para as próximas horas. Vira uma reflexão salva + opcional "Adicionar como missão rápida".

**Estado e regras**
- Novo campo em `PlayerState`: `dailyRitual?: { lastCompletedDate: string; identityChosen: string; commitment: string; streak: number }`.
- Recompensa: +25 XP, +5 Honra (item 3), +1 dia na Sequência de Disciplina.
- Reusa edge function existente (`awakening-questions` com novo `mode: 'ritual'`) para gerar perguntas do passo 2.

---

## 3. Novos sistemas de gamificação emocional

### 3.1 Níveis de Identidade

Progressão paralela ao Rank, baseada em **consistência comportamental** (não em XP). Usa o `IdentityState` que já existe (`stabilityLevel`, `alignedActions`, `patternRelapses`).

Níveis (com base em `stabilityLevel` 0–100 + dias de atividade):
- **O que Foge** (0–24)
- **O Desperto** (25–49)
- **O Disciplinado** (50–74)
- **O Soberano** (75–100)

UI:
- Badge no `PlayerCard` ao lado do Rank.
- Painel em `MirrorPanel.tsx` (já existe, `IdentityState` vive lá) ganha barra de progressão visual e descrição do próximo nível.
- Notificação cinematográfica quando sobe/desce de nível (reusa `AchievementUnlockOverlay` com variante).

Gatilhos:
- Sobe: ritual diário cumprido, missões/hábitos completos, alinhamento com `codeOfConduct`.
- Desce: 3+ falhas seguidas, Sequência de Disciplina quebrada, ritual ignorado por 5+ dias.

### 3.2 Sequência de Disciplina

Streak global e visível separado do `streak` atual (que é login). Conta dias consecutivos em que o usuário cumpriu **todos os hábitos críticos do dia OU o ritual diário**.

- Novo campo: `disciplineStreak: { current: number; best: number; lastValidDate: string }`.
- Quebra ao falhar hábito crítico ou pular dia inteiro sem ritual + sem missão completa.
- Quebra dispara **alerta visceral**: tela cheia com dor da inação ("31 dias destruídos em 1 noite. Quanto você acha que confia em si depois disso?") + botão "Recomeçar agora".
- Mostrado no `PlayerCard` substituindo/complementando o "Streak" atual.

### 3.3 Combate à Autossabotagem

Detector que roda em background a cada save de hábito/missão.

Lógica (em `gameStore.ts`, função `detectSabotagePatterns`):
- Se mesmo hábito falha 3x em 7 dias → padrão "Fuga recorrente".
- Se 4+ missões falhadas em 7 dias na mesma categoria → padrão "Evitação de área".
- Se `disciplineStreak` quebra após streak ≥7 → padrão "Autossabotagem pós-pico".

Quando detecta:
- Cria entrada em `state.sabotagePatterns: { id; pattern; detectedAt; itemRef; resolved }`.
- Dispara modal `SabotageConfrontDialog.tsx` com IA gerando confronto específico (nova edge function `sabotage-confront` ou tool no `awakening-questions`).
- Usuário escolhe: "Vou agir agora" (reseta padrão, +honra) ou "Quero refletir" (vira reflexão guiada).
- Mostra contador no Despertar: "🩸 3 padrões de fuga detectados esta semana".

---

## Detalhes técnicos

**Novos campos em `PlayerState` (`gameStore.ts`)**
```ts
dailyRitual?: { lastCompletedDate: string; identityChosen: string; commitment: string; streak: number };
disciplineStreak?: { current: number; best: number; lastValidDate: string };
sabotagePatterns?: Array<{ id: string; pattern: string; detectedAt: string; itemRef: string; resolved: boolean }>;
honor?: number; // pontuação 0-1000, sobe/desce com promessas
```

**Novas ações em `useGameStore`**
- `completeDailyRitual(payload)`
- `bumpDisciplineStreak()` / `breakDisciplineStreak(reason)`
- `addSabotagePattern(p)` / `resolveSabotagePattern(id, mode)`
- `addHonor(delta, reason)`
- `getIdentityLevel()` (derivado, não armazenado)

**Arquivos a editar**
- `src/lib/gameStore.ts` — novos campos, ações, detector de sabotagem
- `src/lib/aiContext.ts` — expor `dailyRitual`, `disciplineStreak`, `sabotagePatterns`, `honor`, `identityLevel`
- `src/components/AwakeningPage.tsx` — card "Ritual de Hoje" + contador de padrões
- `src/components/PlayerCard.tsx` — badge de identidade + Sequência de Disciplina + Honra
- `src/components/JournalPanel.tsx` — copy
- `src/components/MissionsPanel.tsx`, `HabitsPanel.tsx` — toasts viscerais
- `src/components/MirrorPanel.tsx` — barra de Níveis de Identidade
- `src/components/AppSidebar.tsx` — tagline
- `supabase/functions/counsel/index.ts` — novo SYSTEM_PROMPT
- `supabase/functions/failure-confrontation/index.ts` — prompt revisado
- `supabase/functions/awakening-questions/index.ts` — aceitar `mode: 'ritual' | 'sabotage' | 'awakening'` e gerar respostas adequadas

**Arquivos novos**
- `src/components/DailyRitualDialog.tsx`
- `src/components/SabotageConfrontDialog.tsx`
- `src/components/IdentityBadge.tsx`
- `src/lib/identityLevels.ts` — helpers de nível/threshold

**Não tocar**
- Tema/cores/fontes (purple neon mantido)
- Schema do banco (tudo cabe em `game_state` JSONB existente)
- Sistemas de XP/Rank/Ouro (continuam paralelos)

---

## Resultado

- Despertar abre com **Ritual de Hoje** → fluxo cinematográfico em 4 passos.
- PlayerCard mostra **Rank + Nível de Identidade + Honra + Sequência de Disciplina** lado a lado.
- Quebrar promessa dispara **dor real**, não só -XP.
- IA do Conselho fala como mentor-espelho, não coach.
- Padrões de fuga são **detectados e confrontados** automaticamente.
- Toda interação reforça: agir = orgulho, fugir = desconforto interno.
