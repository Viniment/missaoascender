## Mudanças no PlayerCard e novo eixo de conquistas

### 1. PlayerCard — remover ruído de "identidade"

Arquivo: `src/components/PlayerCard.tsx`

- Remover o bloco inteiro "Estou me tornando..." (o painel com `identity.current.label`, barra de progresso e "Caminhando para...").
- Remover a `<IdentityBadge compact />` ao lado do nome/rank/nível.
- Remover imports não usados: `IdentityBadge`, `computeIdentityLevel`.
- Manter o resto do card (avatar, nome, rank, nível, XP, ouro, streak, conquistas, afirmação rotativa).

### 2. Reescrever o texto da streak no PlayerCard

Arquivo: `src/lib/affirmations.ts` — função `formatEmotionalStreak(days)`  
Trocar os rótulos atuais ("🌱 reconstruindo", "❤️ me escolhendo", "🛡️ me protegendo", "👑 honrando meu futuro") por "Streak"

Nada mais precisa mudar: `PlayerCard` já consome via `formatEmotionalStreak`.

### 3. Novas conquistas baseadas em amor-próprio

Arquivo: `src/lib/achievements.ts`

- Adicionar novo `AchievementType`: `'self-love'`.
- Adicionar um bloco "AMOR-PRÓPRIO / ORGULHO" no array `ACHIEVEMENTS`, totalmente derivado de dados que já existem em `PlayerState` (sem nova lógica de negócio):


| id                    | label                                 | gatilho (rank/icon)                          |
| --------------------- | ------------------------------------- | -------------------------------------------- |
| `self-first-act`      | "Primeiro ato de amor por mim"        | 1º hábito concluído (E, ❤️)                  |
| `self-promise-7`      | "Cumpri minha palavra comigo 7 vezes" | 7 hábitos concluídos no total (D, 🤍)        |
| `self-promise-30`     | "30 promessas cumpridas comigo"       | 30 hábitos concluídos (C, 💗)                |
| `self-promise-100`    | "100 vezes que escolhi a mim"         | 100 hábitos concluídos (B, 💖)               |
| `self-pride-week`     | "Uma semana de orgulho silencioso"    | streak ≥ 7 (D, ✨)                            |
| `self-pride-month`    | "Um mês me honrando"                  | streak ≥ 30 (B, 👑)                          |
| `self-journal-first`  | "Primeira escuta de mim"              | 1ª entrada de diário (E, 📓)                 |
| `self-journal-10`     | "10 conversas honestas comigo"        | 10 entradas de diário (C, 🪞)                |
| `self-journal-30`     | "30 dias me escutando"                | 30 entradas de diário (B, 💜)                |
| `self-back-from-fail` | "Voltei pra mim depois da queda"      | ≥1 protocolo de falha concluído (C, 🕊️)     |
| `self-love-identity`  | "Aprendi a me amar"                   | streak ≥ 60 + ≥30 hábitos concluídos (S, 💖) |


- Para "hábitos concluídos no total" usar um helper inline somando `Object.values(h.history).filter(v => v === 'done').length` em `s.habits`.
- Para "entradas de diário" usar `s.journal.length` (campo já existente).
- Mantém o mesmo formato dos outros itens (`check`, `progress`, `requirements`, `description`).

### 4. O que NÃO muda

- `identityLevels.ts`, `IdentityBadge.tsx` e o `IdentityState` interno continuam existindo (são usados por outras telas/lógicas) — apenas deixam de aparecer no PlayerCard.
- Nenhuma mudança em edge functions, banco, hábitos, diário, missões ou despertar.
- `AchievementsPanel` lê de `ACHIEVEMENTS` automaticamente — as novas conquistas aparecem sem mudança de UI.

### Resultado visual

PlayerCard fica mais limpo: avatar + nome + rank/nível + frase do dia + XP + (Ouro / Streak com novo rótulo de amor-próprio / Conquistas). Sem tag "me ouvindo", sem painel "Estou me tornando". Aba de conquistas ganha uma nova trilha emocional de amor-próprio.