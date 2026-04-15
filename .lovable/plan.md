

# Plano: Missões Repetíveis (tipo diária recorrente)

## O que muda
Novo campo opcional `repeatable` nas missões. Quando ativado, a missão não desaparece ao ser concluída — ela volta ao estado "Ativa" para ser feita novamente, como uma tarefa recorrente.

## Implementação

### 1. `src/lib/gameStore.ts` — Interface e lógica

**Interface Mission:** Adicionar `repeatable?: boolean`

**completeTimeMission:** Se `mission.repeatable`, em vez de setar status `Concluída`, manter como `Ativa` e resetar `startedAt`, `executedHours`. Ainda registra XP/gold e log normalmente.

**completeDailyMission:** Se `mission.repeatable`, após dar XP/gold, resetar `lastCompletedDate` para permitir recompletar (já funciona parcialmente pois usa `lastCompletedDate === today`). Não precisa de grande mudança aqui — missões Diárias já são naturalmente "repetíveis por dia".

**incrementCountMission:** Se `mission.repeatable` e `isComplete`, resetar `currentCount` para 0 em vez de setar status `Concluída`.

### 2. `src/components/MissionsPanel.tsx` — UI

**Formulário de criação:** Adicionar checkbox "🔁 Missão repetível" antes do botão de criar. Estado `repeatable` passado ao `addMission`.

**Dialog de edição:** Adicionar o mesmo checkbox, salvar via `editMission`.

**Card de missão ativa:** Mostrar ícone 🔁 pequeno ao lado do tipo para indicar que é repetível.

**Seção Concluídas:** Missões repetíveis não aparecem aqui (ficam sempre em Ativas).

## Arquivos envolvidos
- `src/lib/gameStore.ts` — campo `repeatable` + lógica de reset ao concluir
- `src/components/MissionsPanel.tsx` — checkbox no form/edit + ícone visual

