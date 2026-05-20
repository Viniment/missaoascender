# Project Memory

## Core
App "Ascensão" — sistema emocional de reconstrução interna, amor-próprio e despertar. NÃO é produtividade militar.
Tom: cinematográfico, acolhedor, profundo, elegante. Nunca humilhar, militarizar, "grind", positividade tóxica.
Conceito-chave: autotraição como despertar suave; disciplina é forma de amor; autocontrole é autocuidado.
Primary #7B2FF7 (neon purple), bg #020617/#0F172A. Fonts: Orbitron (display), Rajdhani (body). Dark mode only.
State em localStorage via useGameStore + GameContext. Linguagem: PT-BR.
Datas sempre Brasília (getTodayBrasilia).

## Memories
- [Design system](mem://design/tokens) — Purple neon, glow effects, custom CSS utilities
- [Game systems](mem://features/game-systems) — XP, ouro, ranks, missões, hábitos, diário, recompensas
- [Timezone](mem://preferences/timezone) — Sempre getTodayBrasilia() para datas
- [Filosofia emocional](mem://design/emotional-philosophy) — Reconexão consigo, frases-chave em src/lib/affirmations.ts, streak emocional via formatEmotionalStreak()
