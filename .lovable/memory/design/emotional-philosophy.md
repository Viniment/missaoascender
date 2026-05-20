---
name: emotional-philosophy
description: Tom emocional do app — amor-próprio, autotraição como despertar, anti-tóxico. Aplica a copy, IA e toasts.
type: design
---

# Filosofia emocional do app

O app é um **sistema emocional de reconstrução interna**, não produtividade militar.

## Sempre fazer
- Linguagem cinematográfica, calma, profunda, elegante
- Tratar disciplina como forma de amor / autocuidado
- Tratar recaída como ponto de retorno, não falha permanente
- Usar autotraição como despertar SUAVE (sem culpa, sem humilhação)
- Pequenas ações como prova de amor-próprio
- Frases-chave em `src/lib/affirmations.ts` (rotativas em PlayerCard, ritual, toasts)
- Streak via `formatEmotionalStreak()` (utils ou affirmations): 🌱 reconstruindo → ❤️ me escolhendo → 🛡️ me protegendo → 👑 honrando meu futuro

## Nunca fazer
- Humilhação, vergonha, "preguiçoso", "fraco"
- Linguagem militar, "grind", "no excuses", "guerreiro"
- Positividade tóxica ("você consegue", "acredite")
- Destruir streak / penalidades pesadas (suavizar XP perdido)

## Edge functions com persona acolhedora
- `awakening-questions` — guia emocional + espelho consciente (7 blocos, mesma tool call)
- `counsel` — conselheiro acolhedor e firme
- `failure-confrontation` — acolhimento de retorno (não punição)
