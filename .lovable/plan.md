

## Entendimento
Hoje o "Histórico" mostra:
- ✅ Missões não-repetíveis **concluídas** (`status === 'Concluída'`)
- ✅/💀 Entradas do `completionHistory` de missões **repetíveis** (concluídas e falhadas)

Mas missões não-repetíveis com `status === 'Falhada'` aparecem em uma seção separada **"Falhadas"** abaixo, sem ordenação cronológica junto com as outras.

## Mudança em `src/components/MissionsPanel.tsx`

1. **Incluir falhadas não-repetíveis no histórico unificado** (linhas ~402-417): adicionar `...failed.map(...)` ao array `items`, usando `m.failedAt` (ou `m.completedAt` como fallback) para ordenar.

2. **Renderizar `MissionCard` de falhada** dentro do loop como já é feito para concluídas (linha 425) — o `MissionCard` já lida com o estilo de status `Falhada`.

3. **Aplicar o filtro de período** (`completedFilter`) também sobre as falhadas, igual já é feito para `completed`.

4. **Remover a seção separada "Falhadas"** (linhas 467-474) — agora tudo vive no histórico unificado, ordenado por data desc.

5. **Atualizar contador** do header: `Histórico ({items.length})` em vez de `completed.length + filteredHistory.length`.

## Verificação necessária
Confirmar no `gameStore.ts` se missões não-repetíveis falhadas têm um campo de timestamp (`failedAt`, `completedAt` ou similar) — se não houver, usar `completedAt` que é setado em ambos os casos, ou adicionar fallback robusto.

## Resultado
Histórico unificado com missões concluídas e falhadas (repetíveis e não-repetíveis) ordenadas por data desc — falha registrada agora aparece por último (no topo); conclusão posterior aparece acima dela.

