

# Plano: Restaurar glows e sombras mais intensos

## Problema
As classes de glow (`.neon-glow`, `.glow-purple`, `.glow-purple-strong`, `.glow-border`, `.glow-text-purple`, `.xp-bar-fill`) estão com opacidades baixas, resultando em sombras quase invisíveis.

## Solução
Aumentar a intensidade de todas as classes de glow em `src/index.css`, dobrando (ou mais) os valores de opacidade e raio das sombras:

| Classe | Antes | Depois |
|--------|-------|--------|
| `.glow-text-purple` | 0.5 / 0.2 | 0.7 / 0.4 |
| `.glow-purple-strong` | 0.3 / 0.1 | 0.5 / 0.25 |
| `.glow-purple` | 0.2 / 0.1 | 0.35 / 0.2 |
| `.glow-border` | 0.3 | 0.5 |
| `.xp-bar-fill` | 0.5 | 0.7 + novo layer |
| `.neon-glow` | 0.3 / 0.15 / 0.05 | 0.5 / 0.3 / 0.15 |

Também adicionar um layer extra de sombra mais ampla no `.neon-glow` para dar aquele efeito de "aura" mais pronunciado.

## Arquivo
- `src/index.css` — seção `@layer components`

