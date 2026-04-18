

## Duas entregas em uma só

### 1) +20 Conquistas novas (em `src/lib/achievements.ts`)

Adicionar ao array `ACHIEVEMENTS` 20+ novas definições para dar mais marcos de progressão. Distribuídas pelos sistemas existentes + nova guia Estoicismo.

**Hábitos / Disciplina**
- `habits-10` — 10 hábitos ativos (Rank B)
- `habit-perfect-week` — 7 dias seguidos com TODOS os hábitos do dia feitos (Rank C)
- `habit-perfect-month` — 30 dias com todos os hábitos diários (Rank A)

**Missões**
- `mission-200` — 200 missões concluídas (Rank Monarca)
- `mission-day-5` — 5 missões concluídas em um único dia (Rank C)
- `mission-day-10` — 10 missões em um único dia (Rank B)
- `mission-category-master` — Concluir missão em todas as 10 categorias (Rank A)

**Diário**
- `journal-deep-10` — 10 entradas em modo profundo (Rank C)
- `journal-week-streak` — Escrever no diário 7 dias seguidos (Rank D)
- `journal-month-streak` — Escrever 30 dias seguidos (Rank A)

**Despertar / Reflexões**
- `reflections-10` — 10 reflexões respondidas no Despertar (Rank D)
- `reflections-50` — 50 reflexões (Rank A)

**Loja / Gold**
- `gold-10000` — 10000 Gold (Rank Monarca)
- `reward-20` — 20 recompensas resgatadas (Rank B)

**Desafios**
- `challenge-complete-1` — Completar todos os passos de 1 desafio (Rank D)
- `challenge-complete-5` — 5 desafios completos (Rank A)

**Disciplina (Protocolos / Falhas)**
- `protocol-30` — 30 protocolos concluídos (Rank S)
- `comeback` — Voltar ao streak ≥7 após ter ≥3 dias perdidos (Rank C) — "Renascido"

**Especiais / Estoicismo (nova categoria)**
- `stoic-1` — Primeira reflexão estoica (Rank E)
- `stoic-7` — 7 reflexões estoicas (Rank D)
- `stoic-30` — 30 reflexões estoicas (Rank B)
- `stoic-100` — 100 reflexões estoicas — "Filósofo Estoico" (Rank S)
- `stoic-streak-7` — 7 dias seguidos respondendo o diário estoico (Rank C)

Cada conquista segue o padrão atual: `{ id, type, label, value, rank, icon, description, requirements, check, progress }`. Tipo `'stoic'` adicionado ao union `AchievementType`.

---

### 2) Nova guia "Estoicismo" — Diário Estoico com IA

**Objetivo:** A IA gera diariamente perguntas estoicas personalizadas usando TODO o contexto do usuário (diário, despertar, hábitos do dia, missões ativas/falhadas, streak, rank). O usuário responde por escrito → vira reflexão salva → padrões viram autoconhecimento ao longo do tempo.

**Inspiração filosófica:** Marco Aurélio (Meditações), Epicteto (dicotomia do controle), Sêneca (brevidade do tempo). Foco em padrões de pensamento que alimentam procrastinação e autossabotagem.

#### Arquivos novos / mudanças

**A. Tipos em `src/lib/gameStore.ts`**
```ts
export interface StoicEntry {
  id: string;
  date: string;           // YYYY-MM-DD
  questions: string[];    // 3 perguntas geradas pela IA
  answers: string[];      // resposta do usuário a cada uma
  theme?: string;         // tema estoico do dia (ex: "Dicotomia do Controle")
  insight?: string;       // insight final da IA após responder (opcional)
  createdAt: string;
}
```
Adicionar `stoicEntries: StoicEntry[]` ao `PlayerState` + `defaultState`.

**B. Edge function nova: `supabase/functions/stoic-questions/index.ts`**
- Recebe: `{ journal, awakening, habits, missions, rank, streak, missedDays, previousStoicEntries }`
- System prompt: mentor estoico (Marco Aurélio + Epicteto) em PT-BR. Regras:
  - Gerar exatamente **3 perguntas** estoicas profundas, específicas ao contexto.
  - Definir **tema do dia** (ex: "Dicotomia do Controle", "Memento Mori", "Amor Fati", "Premeditatio Malorum", "View From Above").
  - Confrontar padrões de procrastinação/autossabotagem detectados nas últimas entradas.
  - Não repetir temas das últimas 5 reflexões; evoluir em cima das respostas anteriores.
- Tool calling para output estruturado: `{ theme, questions: [3] }`.
- Modelo: `google/gemini-3-flash-preview`. Tratar 429/402.

**C. Edge function nova: `supabase/functions/stoic-insight/index.ts`** (opcional, leve)
- Após o usuário responder as 3 perguntas, gera **1 insight estoico curto** (2-3 frases) confrontando padrão observado e propondo ação concreta.
- Recebe: `{ theme, questions, answers, awakening }`.

**D. Componente novo: `src/components/StoicPanel.tsx`**
- Layout `rpg-panel` no padrão dos outros panels (Affirmations, Journal).
- Estado:
  - Se `stoicEntries` já tem entrada de hoje → mostrar perguntas + textareas de resposta (ou já respondida = read-only com insight).
  - Se não → botão grande **"⟐ Gerar Reflexão Estoica do Dia"** (estilo `glow-purple`) → chama `stoic-questions`.
- Após gerar: card com tema do dia (badge) + 3 perguntas, cada uma com `<Textarea>` para resposta.
- Botão "Salvar Reflexão" → salva em `state.stoicEntries`, opcionalmente chama `stoic-insight` para fechar com insight.
- Histórico colapsável abaixo: últimas 10 reflexões (data, tema, expandível).
- Recompensa ao salvar: +15 XP / +5 Gold (via `addXp` / `addGold` do GameContext).

**E. Integração de navegação (`src/pages/Index.tsx`)**
- Adicionar tab `{ id: 'stoic', label: 'Estoicismo', icon: ScrollText }` (ícone lucide).
- Adicionar case no `renderContent`.

**F. Conquistas estoicas**: as 5 novas (`stoic-*`) checam `state.stoicEntries.length` e streak de dias consecutivos respondendo.

#### Fluxo do usuário
1. Abre guia "Estoicismo" → vê tema do dia (ex: "Hoje: Dicotomia do Controle") ou botão para gerar.
2. Lê 3 perguntas personalizadas (referenciando seus hábitos/missões/diário recentes).
3. Responde por escrito.
4. Salva → recebe insight curto da IA + XP/Gold + possível conquista desbloqueada.
5. Histórico cresce → IA usa para evoluir perguntas e detectar padrões recorrentes.

---

### Resultado
- **Progressão:** +23 novas conquistas distribuídas em todos os sistemas, dando marcos a cada nível de uso.
- **Estoicismo:** Nova guia com diário estoico diário gerado por IA, totalmente integrado ao contexto do usuário, recompensando reflexão e criando consciência sobre padrões que alimentam procrastinação/autossabotagem.

