

# Plano: Corrigir Conquistas de Nível Impossíveis

## Problema
O sistema de níveis funciona de 1 a 5, depois o rank sobe e o nível reseta. As conquistas `level-10`, `level-25`, `level-50` e `level-100` são impossíveis de alcançar.

## Solução
Remover essas 4 conquistas e substituí-las por conquistas baseadas em **nível dentro de cada rank**, que são alcançáveis:

### Novas conquistas de progressão (substitutas):
- **Nível 3 no Rank E** — "Primeiros Passos" (rank E)
- **Nível 5 no Rank E** — "Pronto para Ascender" (rank E)
- **Nível 3 no Rank B** — "Elite em Formação" (rank B)
- **Nível 5 no Rank S** — "Quase Lendário" (rank S)
- **Nível 5 no Rank Monarca** — "Forma Final" (rank Monarca)

### Lógica dos checks:
Cada check verificará tanto o `rank` quanto o `level` do jogador. Ex:
```
check: s => s.rank === 'E' && s.level >= 3
```
Para ranks superiores, verificar se já passou daquele rank também funciona.

## Arquivo alterado
- `src/lib/achievements.ts` — remover 4 conquistas impossíveis, adicionar 5 novas alcançáveis

## Também corrigir
- O erro de runtime `useGame must be used within GameProvider` que está aparecendo no preview.

