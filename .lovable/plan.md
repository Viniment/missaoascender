

# Plano: Aumentar XP por nível (x10) e estilizar recompensas nos cards

## 1. Multiplicar XP necessário por 10

**Arquivo:** `src/lib/gameStore.ts`

Alterar `BASE_XP` de `[100, 200, 350, 550, 800]` para `[1000, 2000, 3500, 5500, 8000]`.

Também atualizar `defaultState.xpToNext` de `100` para `1000`.

## 2. Estilizar recompensas nos cards de missões

**Arquivo:** `src/components/MissionsPanel.tsx`

Trocar os `<span className="text-muted-foreground">` das recompensas (linhas 426, 429, 432) por badges coloridos com fundo, tipo:

```text
┌──────────────────────────────────────────┐
│ 🏋️ Treino Pesado         [Difícil]      │
│ ⏱️ Tempo | Fitness                       │
│ ┌─────────────────────────────────┐      │
│ │ ⚡ 8 XP  💰 3 Gold  [ Por Hora ]│      │
│ └─────────────────────────────────┘      │
└──────────────────────────────────────────┘
```

Usar badges com `bg-primary/15 text-primary` para XP e `bg-warning/15 text-warning` para Gold, com `font-display` e bordas arredondadas.

## 3. Estilizar recompensas nos cards de hábitos

**Arquivo:** `src/components/HabitsPanel.tsx`

Linha 158: trocar `<div className="text-xs text-muted-foreground">+{xp} XP / -{xp * 2} XP</div>` por badges coloridos similares, com XP em verde/primary e penalidade em vermelho.

## Arquivos alterados
- `src/lib/gameStore.ts` — BASE_XP x10, defaultState.xpToNext
- `src/components/MissionsPanel.tsx` — estilizar rewardInfo e liveRewards
- `src/components/HabitsPanel.tsx` — estilizar linha de XP nos habit cards

