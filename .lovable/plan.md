

## Problema
No mobile, as badges (⚡ XP, 💰 Moedas, ✅ CONCLUÍDA, data) das missões concluídas/falhadas estão muito coladas — provavelmente em uma única linha sem `flex-wrap` ou com `gap` insuficiente.

## Investigação rápida necessária
Ler `src/components/MissionsPanel.tsx` para confirmar a estrutura atual das badges nos 3 pontos:
1. Card de missão concluída
2. Card de missão falhada
3. Histórico de missões repetíveis

## Mudanças planejadas em `src/components/MissionsPanel.tsx`

Aplicar nos containers das badges:
- `flex flex-wrap gap-1.5` (em vez de `gap-1` ou sem wrap) para garantir quebra de linha no mobile
- Separar a **data/hora** em uma linha própria abaixo das badges no mobile (ou usar `w-full` no item de data dentro de um flex-wrap)
- Adicionar `mt-1.5` entre a linha do nome da missão e a linha de badges para respiro vertical
- Garantir que badges tenham `whitespace-nowrap` para não quebrarem internamente
- Ajustar o layout do histórico repetível (linhas ~408-426) para empilhar verticalmente em telas pequenas: nome + badges em coluna no mobile, lado-a-lado no desktop (`flex-col sm:flex-row sm:items-center`)

## Resultado esperado
No mobile (753px e menores), as badges quebram em múltiplas linhas com espaçamento confortável; no desktop continuam alinhadas em linha única quando couberem.

