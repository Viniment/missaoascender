

# Plano: Configuração Avançada — Dificuldade de Progressão

## O que muda
Adicionar uma seção "Avançado" nas configurações onde o jogador pode ajustar o **multiplicador de dificuldade**. Isso divide a XP necessária para subir de nível.

Exemplo: nível 1 rank E precisa de 1000 XP normalmente. Com dificuldade "Fácil" (÷2), passa a precisar de 500 XP.

## Opções de dificuldade
| Opção | Divisor | Descrição |
|-------|---------|-----------|
| Normal | 1x | Padrão atual |
| Fácil | ÷2 | Metade do XP necessário |
| Muito Fácil | ÷4 | Um quarto do XP necessário |

## Arquivos alterados

### 1. `src/lib/gameStore.ts`
- Adicionar `difficultyDivisor: number` ao `PlayerState` (default: `1`)
- Alterar `getXpToNext` para aceitar o divisor e aplicar: `Math.floor(BASE_XP[level-1] * multiplier / divisor)`
- Alterar `processLevelUp` para receber o divisor
- Todas as chamadas a `processLevelUp` passam `prev.difficultyDivisor || 1`
- Atualizar `defaultState` com `difficultyDivisor: 1`

### 2. `src/pages/Settings.tsx`
- Adicionar nova seção "Avançado" (ícone `Settings2`) no array `sections`
- Renderizar um seletor com as 3 opções (Normal, Fácil, Muito Fácil)
- Ao trocar, atualiza `difficultyDivisor` no state e recalcula `xpToNext` atual

### 3. `src/components/PlayerCard.tsx`
- Nenhuma mudança — já usa `state.xpToNext` que será recalculado automaticamente

