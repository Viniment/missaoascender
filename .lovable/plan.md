

# Plano: Restaurar sombras nos painéis e cards

## Problema
Os painéis principais (PlayerCard, MissionsPanel, SystemPanel, etc.) perderam as sombras/glow que tinham. As classes CSS `.glow-purple`, `.neon-glow`, `.glow-purple-strong` existem no CSS, mas não estão sendo aplicadas nos componentes.

Além disso, a barra de XP no PlayerCard usa a classe `xp-bar` mas o CSS define `.xp-bar-fill`, então a barra não tem o gradiente/glow correto.

## Solução

### 1. `src/components/PlayerCard.tsx`
- Adicionar `neon-glow` na div principal do card (junto com `rpg-panel`)
- Corrigir classe `xp-bar` para `xp-bar-fill` na barra de XP

### 2. `src/components/SystemPanel.tsx`
- Adicionar `neon-glow` na div principal

### 3. `src/components/MissionsPanel.tsx`
- Adicionar `glow-purple` nos cards de missão ativa
- Adicionar sombras nos botões e seções principais

### 4. `src/components/HabitsPanel.tsx`
- Adicionar `glow-purple` nos cards de hábitos

### 5. `src/components/ChallengesPanel.tsx`
- Adicionar `glow-purple` nos cards de desafios

### 6. `src/components/PomodoroTimer.tsx`
- Adicionar `neon-glow` no painel principal (já usa `rpg-panel`)

### 7. `src/components/JournalPanel.tsx`
- Adicionar sombras nos cards de entrada do diário

Em resumo: aplicar as classes de glow/shadow que já existem no CSS (`neon-glow`, `glow-purple`, `glow-purple-strong`) nos componentes principais para restaurar a profundidade visual.

## Arquivos envolvidos
- `src/components/PlayerCard.tsx` — neon-glow + fix xp-bar-fill
- `src/components/SystemPanel.tsx` — neon-glow
- `src/components/MissionsPanel.tsx` — glow nos cards
- `src/components/HabitsPanel.tsx` — glow nos cards
- `src/components/ChallengesPanel.tsx` — glow nos cards
- `src/components/PomodoroTimer.tsx` — neon-glow
- `src/components/JournalPanel.tsx` — glow nos cards

