## Reescrita das conquistas com foco em amor-próprio

Tudo acontece em `src/lib/achievements.ts`. Nenhuma outra UI muda — o painel de conquistas lê deste array.

### 1. Remover trilha estoica
- Remover o bloco "NEW: STOIC" inteiro (5 conquistas: `stoic-1`, `stoic-7`, `stoic-30`, `stoic-100`, `stoic-streak-7`).
- Remover `'stoic'` do union `AchievementType`.

### 2. Renomear conquistas existentes para a linguagem do app
Manter `id`, `check`, `progress` e `rank` (para não invalidar conquistas já desbloqueadas dos usuários). Trocar **label**, **description** e **requirements** para linguagem de amor-próprio, autoestima, lealdade consigo, orgulho silencioso. Sem militarismo, sem "guerreiro", "máquina", "monstro", "soberano da execução", "ricaço", "magnata".

Exemplos do tom novo:
- `streak-3` → "3 dias me escolhendo" — *"Três dias seguidos honrando você. O começo da reconciliação."*
- `streak-7` → "Uma semana inteira por mim"
- `streak-30` → "Um mês me tratando bem"
- `streak-100` → "100 dias de lealdade comigo"
- `streak-365` → "Um ano inteiro do meu lado"
- `mission-first` → "Primeira escolha por mim"
- `mission-100` → "100 vezes que apareci pra mim"
- `mission-hard-10` → "10 vezes que escolhi o difícil por mim"
- `habit-first` → "Comecei a cuidar de mim"
- `habit-done-100` → "100 dias seguidos de um cuidado"
- `habit-done-200` → "O cuidado virou quem eu sou"
- `habit-perfect-week` → "Uma semana inteira sem me abandonar"
- `habit-perfect-month` → "Um mês sem me abandonar"
- `rank-*` → manter os ranks mas redescrever ("Você está virando alguém diferente por dentro", etc.) sem "domínio", "presença dominante"
- `protocol-*` → reescrever sem "indestrutível/inquebrável" → "Voltei pra mim", "Me reencontrei depois da queda"
- `no-fail-*` → "X dias sem me trair"
- `gold-*` → "Recompensas que mereci", "Tesouro do meu próprio cuidado", sem "ricaço/magnata"
- `reward-*` → "Soube me presentear"
- `journal-*` (special) → "X conversas honestas comigo", "Aprendi a me escutar"
- `journal-deep-10` → "10 mergulhos em mim"
- `journal-week-streak` / `month-streak` → "X dias me escutando"
- `reflections-*` → "X vezes que parei pra me ver"
- `mission-day-5/10` → "Um dia inteiro me priorizando" / "Um dia 100% por mim"
- `mission-category-master` → "Cuidei de mim em todas as áreas"
- `challenge-*` → "Mantive uma promessa grande comigo"
- `comeback` → "Voltei pra mim depois de me perder"
- `awakening` → manter — já é amor-próprio
- `habit-3/5/10` → "X cuidados diários ativos"

Vou reescrever todos os `label`, `description` e `requirements` na mesma passada para terem voz consistente.

### 3. Adicionar novas conquistas de amor-próprio
Mais ~12 conquistas, sem nova lógica de estado (só usando o que já existe em `PlayerState`):

| id | label | gatilho |
|---|---|---|
| `self-mirror-day` | "Um dia inteiro me amando" | dia com hábito feito + diário escrito (E, 🌷) |
| `self-mirror-week` | "Uma semana toda comigo" | 7 dias em que (no mesmo dia) houve hábito feito + diário (C, 💐) |
| `self-promise-300` | "300 promessas cumpridas comigo" | 300 hábitos done totais (A, 💞) |
| `self-promise-1000` | "Mil atos de amor-próprio" | 1000 hábitos done totais (Monarca, 💖) |
| `self-deep-reflection` | "Mergulhei fundo em mim" | 1ª entrada em modo profundo (D, 🪞) |
| `self-deep-30` | "30 mergulhos honestos em mim" | 30 entradas em modo profundo (A, 🪞) |
| `self-pride-3months` | "Três meses me honrando" | streak ≥ 90 (S, 👑) |
| `self-pride-year` | "Um ano me amando" | streak ≥ 365 (Monarca, 💖) |
| `self-rebirth` | "Renasci dentro de mim" | streak ≥ 7 após missedDays ≥ 7 (B, 🕊️) |
| `self-gentle-care` | "Aprendi a me tratar com carinho" | 14 entradas + streak ≥ 14 (C, 🤍) |
| `self-soft-power` | "Força que vem de me amar" | streak ≥ 30 + 50 hábitos done + 10 entradas (A, 💪🤍) |
| `self-home` | "Virei um lar pra mim" | streak ≥ 100 + 100 hábitos done + 30 entradas (Monarca, 🏠💜) |

Todas com `type: 'self-love'` (já existente).

### 4. O que NÃO muda
- IDs preservados → conquistas já desbloqueadas continuam válidas no localStorage do usuário.
- Funções `check`/`progress` existentes ficam iguais; só edição de texto onde aplicável.
- Painel `AchievementsPanel`, filtros e UI ficam como estão.
- Sem mudança em edge functions, gameStore, banco ou tabs.

### Resultado
Lista de conquistas inteira fala a mesma língua do app: cuidado consigo, lealdade, escuta interna, orgulho silencioso, se apaixonar pela própria vida. Trilha estoica some. ~12 conquistas novas dão mais marcos emocionais de amor-próprio para o usuário perseguir.