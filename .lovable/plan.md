

# Plano: Remover punições "Controle" dos dados persistidos

## Problema
As punições da categoria "Controle" foram removidas do código (`DEFAULT_PUNISHMENTS`) e da interface, mas usuários que já usaram o app ainda têm essas punições salvas no localStorage. Elas continuam existindo nos dados e podem ser sorteadas pelo sistema.

## Solução
Adicionar um filtro na função `loadState()` em `src/lib/gameStore.ts` que remove qualquer punição com categoria não pertencente às 5 válidas (`Restrição`, `Financeira`, `Física`, `Esforço`, `Mental`) ao carregar o estado do localStorage.

## Arquivo alterado
- `src/lib/gameStore.ts` — na função `loadState`, após o merge `{ ...defaultState, ...parsed }`, filtrar `punishments` para manter apenas categorias válidas.

