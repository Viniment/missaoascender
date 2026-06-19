## Mudança Conceitual: De "Guerra Interna" para "Liderança Compassiva"

Reposicionar todo o app abandonando a metáfora de combate (Inimigo Interno, monstro, sabotador, confronto, derrota) e adotando uma dualidade compassiva: **Eu Atual** (acolhido, não julgado) ⇄ **Alter Ego** (potencial real a ser manifestado).

---

### 1. Renomeação conceitual no modelo de dados (`src/lib/gameStore.ts`)

- Manter a estrutura `innerEnemy` no storage por compatibilidade, mas expor via tipo/alias **`currentSelf` (Eu Atual)** em toda a UI e prompts.
- Adicionar migração leve: ao carregar dados antigos, mapear campos do `innerEnemy` (nome, traços) para `currentSelf` sem perder o que o usuário já escreveu. Rótulos antigos como "fraquezas", "gatilhos de sabotagem" passam a ser "padrões atuais", "momentos de dificuldade".
- `defaultInnerEnemy` reescrito com linguagem neutra/acolhedora (sem "inimigo", "monstro", "sabotador").

### 2. Componentes a remover ou reescrever

Remover (metáfora de combate não recuperável):
- `src/components/MonsterIndicator.tsx`
- `src/components/SabotageConfrontDialog.tsx`
- `src/components/FailureConfrontDialog.tsx`
- `src/components/FailureProtocolAlert.tsx`
- `src/components/FailureProtocolSettings.tsx`
- `supabase/functions/failure-confrontation/index.ts`
- Referências/imports/rotas correspondentes em `Index.tsx`, `Settings.tsx`, `HabitsPanel.tsx`, `MissionsPanel.tsx`, `achievements.ts`, `identityLevels.ts`, `aiContext.ts`.

Reescrever (mantém a função, troca o enquadramento):
- `IdentityBalance.tsx` → "Quem está liderando agora?" mostrando equilíbrio entre **Eu Atual** e **Alter Ego** (sem barra de vida de monstro, sem linguagem de batalha).
- `IdentityOnboarding.tsx` → passos: "Como você está hoje (Eu Atual)" e "Quem você está se tornando (Alter Ego)", com perguntas compassivas.
- `MirrorPanel.tsx` e `CounselPanel.tsx` → tom de mentor, não de confronto.
- `AwakeningPage.tsx` → ver seção 4.

### 3. Edge functions — tom e prompts

- `awakening-questions/index.ts`: reescrever o system prompt para mentor compassivo. Banir verbos/substantivos: derrotar, lutar, combater, sabotador, inimigo, fraqueza, falha como identidade. Manter o nome do Alter Ego personalizado. O "Eu Atual" é descrito com empatia. Distribuição: 70% Alter Ego (identidade, próximos passos, visão), 30% Eu Atual (consciência amorosa, padrões observados sem julgamento). Sem "dissociação" — usar "reconhecimento" e "reenquadramento".
- `victory-message/index.ts`: remover linguagem de "vitória sobre o inimigo"; celebrar prova de identidade.
- `counsel/index.ts`, `journal-prompts/index.ts`, `journal-exercise/index.ts`: revisão de tom (mentor, autocompaixão, responsabilidade sem culpa).
- Excluir `failure-confrontation` (função e chamadas).

### 4. Nova guia Despertar (sessão diária)

Estrutura por sessão, gerada pela IA com base em perfil, valores, sonhos, missão, Alter Ego, hábitos e desafios atuais:
1. **Check-in acolhedor** — como o Eu Atual está hoje (1–2 perguntas).
2. **Reflexão guiada** — 3–5 perguntas personalizadas que estimulam autoconhecimento, gratidão e clareza.
3. **Diálogo interno** — bloco com fala do Eu Atual e resposta compassiva do Alter Ego (usando o nome real do Alter Ego do usuário).
4. **Reenquadramento** — uma crença/padrão atual transformado em uma perspectiva do Alter Ego.
5. **Prova de identidade** — uma micro-ação concreta nas próximas 24h alinhada aos valores.
6. **Âncora final** — frase curta no formato "Hoje eu escolho ser…" derivada do Alter Ego.

Sem pontuação punitiva, sem "ataque do inimigo". Layout/render atualizados em `AwakeningPage.tsx` para refletir as novas seções.

### 5. Exercício diário de Diálogo Interno (novo)

Pequeno componente reaproveitando o slot do antigo `FailureProtocolAlert`: apresenta um pensamento do Eu Atual (gerado a partir dos padrões/dificuldades do usuário) e pede que o usuário escreva (ou aceite uma sugestão da IA) a resposta do Alter Ego. Salvo no journal para reforçar repetição.

### 6. Linguagem global e copy

- Varredura de strings PT-BR removendo: "inimigo", "monstro", "sabotador", "derrotar", "combate", "batalha", "guerra", "falhou", "fraqueza".
- Substituir por: "Eu Atual", "padrão atual", "ponto de atenção", "próximo passo", "prova de identidade", "reencontro", "reenquadramento".
- Mensagem central do app (Help, onboarding, header de Despertar):
  > "Você não precisa lutar contra si mesmo. Você precisa aprender a liderar a si mesmo com amor, responsabilidade e constância."

### 7. Conquistas, níveis e missões

- `achievements.ts` e `identityLevels.ts`: renomear conquistas com tema de combate para tema de identidade (ex.: "Derrotou o sabotador 5x" → "5 provas de identidade consecutivas").
- `MissionsPanel.tsx` e `HabitsPanel.tsx`: ajustar textos auxiliares; lógica intocada.

### 8. Memória do projeto

Atualizar `mem://index.md` para refletir a nova filosofia (Eu Atual + Alter Ego, sem inimigo) e criar `mem://design/emotional-philosophy.md` com as regras de tom (proibido humilhação/vergonha/guerra; obrigatório acolhimento + responsabilidade).

---

### Fora deste plano

- Não alterar tema visual, fontes ou cores.
- Não tocar em autenticação, RLS ou schema do banco.
- Manter `IdentityBalance` no lugar atual (substituindo `MonsterIndicator`).

### Detalhes técnicos

- Tipos: adicionar `export type CurrentSelf = InnerEnemy` em `gameStore.ts` e novo helper `updateCurrentSelf` (wrapper de `updateInnerEnemy`) para migração gradual.
- Remoções acompanhadas de limpeza de imports/rotas; rodar busca por cada nome de arquivo removido.
- Edge functions reescritas mantêm contrato JSON existente quando possível para evitar quebrar UI durante a transição; campos novos (ex.: `internalDialogue`, `identityProof`, `reframe`) são adicionados.
- Após edição, validar com `supabase--curl_edge_functions` chamando `awakening-questions` com um payload de teste e inspecionar logs.
