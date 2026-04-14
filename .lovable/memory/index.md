# Project Memory

## Core
App "Ascensão" — RPG productivity system inspired by Solo Leveling. Dark mode only.
Primary #7B2FF7 (neon purple), bg #020617/#0F172A. Fonts: Orbitron (display), Rajdhani (body).
State stored in localStorage via useGameStore hook + GameContext provider.
Language: Portuguese (BR).
All dates use Brasília timezone (America/Sao_Paulo), never UTC.

## Memories
- [Design system](mem://design/tokens) — Purple neon RPG theme, glow effects, custom CSS utilities
- [Game systems](mem://features/game-systems) — XP, gold, ranks, missions, habits, journal, challenges, rewards
- [Timezone](mem://preferences/timezone) — Always use getTodayBrasilia() for date calculations
