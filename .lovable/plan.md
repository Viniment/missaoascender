

# Plano: Histórico de conclusões para missões repetíveis + Remover tema Ouro Imperial

## 1. Missões repetíveis aparecendo em "Concluídas"

**Problema:** Missões repetíveis nunca ficam com status `Concluída`, então não aparecem na seção de concluídas.

**Solução:** Adicionar um array `completionHistory` na interface `Mission` que registra cada conclusão com data. A seção "Concluídas" vai listar também entradas desse histórico.

### `src/lib/gameStore.ts`
- Adicionar `completionHistory?: { date: string; xp: number; gold: number; executedHours?: number }[]` na interface `Mission`
- Em `completeTimeMission` (quando repeatable): adicionar entrada ao `completionHistory` com data, XP, gold e horas
- Em `incrementCountMission` (quando repeatable e isComplete): adicionar entrada ao `completionHistory`

### `src/components/MissionsPanel.tsx`
- Na seção "Concluídas", além das missões com `status === 'Concluída'`, incluir entradas do `completionHistory` de missões repetíveis
- Cada entrada mostra o nome da missão, XP/gold ganhos, data e tempo (se aplicável), com ícone 🔁

## 2. Remover tema Ouro Imperial

### `src/hooks/useTheme.ts`
- Remover a entrada `'neon-spectrum'` do `THEME_VARS`
- Remover a constante `ANIMATED_THEME_CLASS` e a lógica de toggle da classe

### `src/components/ThemeSelector.tsx`
- Remover `'neon-spectrum'` do tipo `ThemeId` e do array `THEMES`

### `src/index.css`
- Remover todos os `@keyframes neon-spectrum-*`
- Remover as regras `.theme-neon-spectrum`
- Remover a media query `prefers-reduced-motion` relacionada

## Arquivos envolvidos
- `src/lib/gameStore.ts` — completionHistory na interface + lógica de registro
- `src/components/MissionsPanel.tsx` — exibir histórico de repetíveis em Concluídas
- `src/hooks/useTheme.ts` — remover tema neon-spectrum
- `src/components/ThemeSelector.tsx` — remover opção do seletor
- `src/index.css` — remover animações do tema

