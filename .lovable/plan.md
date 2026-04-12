

# Plano: Filtrar punições "Controle" no carregamento do banco de dados

## Problema raiz
O filtro de categorias válidas foi adicionado apenas no `loadState()` (localStorage). Mas os dados são carregados do **banco de dados** pelo `usePlayerData.tsx` na linha 31:
```
setState(() => ({ ...defaultState, ...saved } as PlayerState));
```
Esse merge NÃO filtra as punições. Os dados no banco ainda contêm p24/p25/p26 (categoria "Controle"), e eles são carregados sem filtro.

## Solução
Dois pontos de correção em `src/hooks/usePlayerData.tsx`:

1. **Filtrar punishments ao carregar do banco** — após o merge `{ ...defaultState, ...saved }`, filtrar o array `punishments` para manter apenas categorias válidas, usando `VALID_PUNISHMENT_CATEGORIES` importado de `gameStore.ts`.

2. **Também filtrar `failureProtocols`** — os protocolos de falha antigos que já têm `punishment.category === 'Controle'` embutido continuam aparecendo. Não precisa removê-los (são histórico), mas o sistema de sorteio já está protegido.

## Arquivo alterado
- `src/hooks/usePlayerData.tsx` — importar `VALID_PUNISHMENT_CATEGORIES`, e após a linha 31, filtrar `punishments` do estado carregado para remover categorias inválidas antes de aplicar ao state.

