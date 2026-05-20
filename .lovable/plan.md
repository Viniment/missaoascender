## Visão Geral

Rework profundo do app "Ascensão" para deixar de ser um sistema de produtividade/disciplina militar e se tornar um **sistema emocional de reconstrução interna**, baseado em amor-próprio, consciência de autotraição e reconexão consigo mesmo.

A mudança é grande mas **não destrutiva**: mantemos toda a estrutura técnica (XP, missões, hábitos, diário, Despertar, recompensas, streak, gameStore, autenticação, Cloud) e fazemos uma **reescrita de linguagem, tom, IA e fluxo emocional** + adições pontuais de UI.

---

## Escopo da mudança

### 1. Filosofia e linguagem (refator de copy global)
Substituir em toda a UI termos militares/produtivistas por linguagem emocional cinematográfica:

| Antes | Depois |
|---|---|
| "Registrar Dia" / "⚔️" | "Hoje eu me escolho" / "❤️" |
| "Missão" (mantém como conceito) | mantém, mas descrições em tom de autocuidado |
| "Penalidade XP" | "Consciência de autotraição" (sem perder XP brutalmente — suaviza texto) |
| "Sequência" / streak numérico cru | "❤️ X dias me escolhendo" / "🛡️ X dias me protegendo" |
| "Complete hábitos" | "Fortaleça sua identidade" |
| "Avisos do Sistema" | "Sussurros internos" |
| "Painel do Sistema" | "Espelho interno" (ou similar) |

Arquivos afetados (apenas copy + ícones, sem mudar lógica):
- `SystemPanel.tsx`, `PlayerCard.tsx`, `MissionsPanel.tsx`, `HabitsPanel.tsx`, `JournalPanel.tsx`, `MirrorPanel.tsx`, `RewardsShop.tsx`, `CounselPanel.tsx`, `FailureProtocolAlert.tsx`, `DailyRitualDialog.tsx`, `SabotageConfrontDialog.tsx`, `FailureConfrontDialog.tsx`, `AppSidebar.tsx`, `tabs.ts`.

### 2. Guia **Despertar** — rework completo (UI + IA)

A guia ganha uma nova estrutura em camadas, mantendo o histórico de reflexões já existente.

**Novo fluxo (substitui a entrada atual):**

```text
┌─────────────────────────────────────────────┐
│ 1. Ritual de Abertura (cinematográfico)     │
│    "Hoje você se escolhe novamente?"        │
│    [❤️ Sim, eu me escolho]                  │
│    [🌧️ Hoje preciso de apoio]              │
│    (animação lenta + respiração 4-7-8)      │
├─────────────────────────────────────────────┤
│ 2. Estado Emocional                          │
│    ansioso · vazio · impulsivo · cansado    │
│    desmotivado · em paz · focado · orgulhoso│
├─────────────────────────────────────────────┤
│ 3. Espelho Interno                           │
│    "Como alguém que se ama agiria hoje?"    │
│    disciplina · calma · respeito · presença │
│    coragem · autocontrole                    │
├─────────────────────────────────────────────┤
│ 4. Reflexão da IA (a atual, reescrita)      │
│    Agora 4 blocos em vez de 7:              │
│    - consciência                             │
│    - ruptura (autotraição, sem humilhar)    │
│    - reconexão (identidade + amor-próprio)  │
│    - micro-ação possível                     │
│    + 3 perguntas suaves e profundas         │
├─────────────────────────────────────────────┤
│ 5. Histórico (mantém, com edição já feita)  │
└─────────────────────────────────────────────┘
```

**Mudanças técnicas no Despertar:**
- `AwakeningPage.tsx`: adicionar steps `ritual → estado → espelho → reflexão`, com transições `framer-motion` suaves (fade + scale, 600ms+).
- `awakening-questions/index.ts`: reescrever `SYSTEM_PROMPT` para a nova persona (guia emocional de reconexão, NÃO psicólogo confrontador). Schema da tool call passa de 7 blocos para 4: `awareness`, `rupture`, `reconnection`, `microAction` + `questions[3]` + `identityAffirmation`. O `userPrompt` passa a receber `emotionalState` e `selfLoveIntent` escolhidos nos passos 2 e 3.

### 3. IA — nova personalidade global

Reescrever os system prompts de:
- `awakening-questions/index.ts` (principal)
- `counsel/index.ts` (mesma persona, tom de conselho do dia)
- `failure-confrontation/index.ts` → renomear conceitualmente para **"acolhimento de recaída"**: sem punição, sem vergonha, sem destruir streak. Texto guia o retorno.

Nova persona em todos: **guia emocional + espelho consciente + reforço de identidade**. Proibido: humilhar, militarizar, positividade tóxica, "preguiçoso", "fraco", agressividade.

### 4. Streak emocional

`PlayerCard.tsx` / `SystemPanel.tsx`: o número de streak ganha um **rótulo dinâmico** baseado em faixas:
- 1–3 dias → "🌱 dias reconstruindo"
- 4–9 dias → "❤️ dias me escolhendo"
- 10–29 dias → "🛡️ dias me protegendo"
- 30+ dias → "👑 dias honrando meu futuro"

Pura função de display em `src/lib/utils.ts` (`formatEmotionalStreak(n)`), sem mudar gameStore.

### 5. Sistema de recaída (suavização)

`gameStore.ts` — `dailyCheckIn` hoje aplica `-20` / `-50` XP por dias perdidos. Mudança:
- Manter o cálculo, mas **reduzir magnitude** (`-10` / `-25`) e renomear feedback: em vez de "Penalidade", mostrar `"Consciência: X dias de distância de si"`.
- Não zera streak imediatamente em 1 falha (já é o comportamento atual em parte) — confirmamos e suavizamos o texto.
- Toast: "Uma queda não apaga quem você está se tornando."

### 6. Diário — duas perguntas guiadas

`JournalPanel.tsx`: adicionar dois prompts opcionais no topo da criação de entrada:
- **Diário de Orgulho** (manhã/dia): "Qual atitude mostrou hoje que você está aprendendo a se amar?"
- **Reflexão Noturna**: "Hoje você foi aliado de si mesmo, ou se abandonou em alguns momentos?"

Botões que pré-preenchem o título + abrem o editor. Sem mudança de schema.

### 7. Estética cinematográfica (refinamento leve)

`index.css` + componentes-chave:
- Animação de partículas suaves no fundo do Despertar (CSS puro, ~12 partículas com `@keyframes float`).
- Transições mais lentas (300ms → 600ms) nos diálogos principais do Despertar.
- Manter paleta atual (roxo neon `#7B2FF7`, bg `#020617`) — já cinematográfica.
- Tipografia: mantém Orbitron/Rajdhani.

### 8. Frases-chave rotativas

Novo array em `src/lib/affirmations.ts` com as 10 frases-chave do brief ("Disciplina é uma forma de amor.", etc.). Uma frase aleatória aparece:
- Como subtítulo do `PlayerCard`
- No final do ritual do Despertar
- No toast de recaída

---

## Fora do escopo (não muda)

- Schema do banco / migrations
- Sistema de autenticação
- Sistema de XP/níveis/ranks (números e fórmulas)
- Sistema de missões/hábitos/recompensas (estrutura)
- Conquistas
- Avatar / perfil
- Cloud / edge functions além das 3 listadas

---

## Detalhes técnicos

**Arquivos novos:**
- `src/lib/affirmations.ts` — array de frases + helper `getRandomAffirmation()`
- `src/components/awakening/RitualOpening.tsx` — passo 1
- `src/components/awakening/EmotionalState.tsx` — passo 2
- `src/components/awakening/InnerMirror.tsx` — passo 3
- `src/components/awakening/AmbientParticles.tsx` — fundo cinematográfico

**Arquivos editados (lógica + copy):**
- `src/components/AwakeningPage.tsx` — orquestra os novos passos
- `supabase/functions/awakening-questions/index.ts` — novo schema (4 blocos) + nova persona + novos inputs
- `supabase/functions/counsel/index.ts` — nova persona (mesmo tom)
- `supabase/functions/failure-confrontation/index.ts` — vira acolhimento
- `src/lib/gameStore.ts` — suavização de penalidades de check-in
- `src/lib/utils.ts` — `formatEmotionalStreak()`

**Arquivos editados (apenas copy/labels):**
- `PlayerCard.tsx`, `SystemPanel.tsx`, `MissionsPanel.tsx`, `HabitsPanel.tsx`, `JournalPanel.tsx`, `MirrorPanel.tsx`, `RewardsShop.tsx`, `CounselPanel.tsx`, `FailureProtocolAlert.tsx`, `DailyRitualDialog.tsx`, `SabotageConfrontDialog.tsx`, `FailureConfrontDialog.tsx`, `AppSidebar.tsx`, `tabs.ts`

**Memória do projeto:**
- Atualizar `mem://index.md` Core com nova filosofia: "Sistema emocional de reconstrução interna. Tom: cinematográfico, acolhedor, anti-tóxico. Nunca humilhar, militarizar ou usar 'grind'."

---

## Validação

1. Compilar — sem mudanças de schema, sem migrations.
2. Abrir o Despertar e atravessar os 4 passos.
3. Verificar que o histórico antigo de reflexões continua renderizando (campos antigos).
4. Conferir que streak/XP continuam funcionando (apenas suavizados).
5. Conferir tom em todos os toasts e diálogos principais.

---

## Tamanho do trabalho

Grande, mas linear: ~20 arquivos editados, 5 novos componentes, 3 edge functions reescritas no system prompt. Tudo em um único loop.
