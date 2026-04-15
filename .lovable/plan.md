

# Plano: Filtro por período nas Missões Concluídas

## O que muda
A seção "Concluídas" vai mostrar apenas os últimos 7 dias por padrão, com um seletor para trocar entre: **7 dias**, **15 dias**, **30 dias** e **Tudo**.

## Implementação

### 1. `src/lib/gameStore.ts`
- Adicionar `completedAt?: string` à interface `Mission`
- Nas funções `completeTimeMission`, `completeDailyMission` (quando marca como Concluída), e `incrementCountMission` (quando completa): salvar `completedAt: new Date().toISOString()` junto com o status `'Concluída'`

### 2. `src/components/MissionsPanel.tsx`
- Adicionar estado `completedFilter` com valores `'7d' | '15d' | '30d' | 'all'` (default: `'7d'`)
- Filtrar `completed` por `completedAt` baseado no período selecionado (missões sem `completedAt` aparecem em "Tudo")
- Renderizar um seletor pequeno ao lado do título "Concluídas" com as opções
- Remover o `.slice(0, 5)` atual, já que o filtro de data controla a quantidade

## Arquivos envolvidos
- `src/lib/gameStore.ts` — adicionar campo e salvar data de conclusão
- `src/components/MissionsPanel.tsx` — filtro visual e lógica de filtragem

