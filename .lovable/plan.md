
## Permitir marcar/recorrigir tarefas até 2 dias atrás

### Pedido
- Usuário quer poder atualizar status (concluído/falhado) de itens **até 2 dias atrás**, não só do dia atual.
- Caso de uso: marcou "falhar" sem querer numa tarefa que concluiu — precisa corrigir.

### Escopo: o que conta como "tarefa"
Pelo código, há 2 tipos com status diário:
1. **Hábitos** (`HabitsPanel`) — `history[date] = 'done' | 'failed'`. Marcação só do dia atual.
2. **Missões** (`MissionsPanel`) — preciso conferir se têm histórico diário ou status único. Vou inspecionar.

Foco principal: **hábitos**, pois é onde o erro descrito acontece (botões Check/X por dia).

### Mudanças

**1. `src/lib/gameStore.ts` — ajustar `markHabit`**
- Hoje provavelmente recebe `(id, status)` e usa `today` interno.
- Mudar assinatura para aceitar **data opcional** (`date?: string`), default = hoje.
- Validar que a data está dentro da janela: `today`, `today-1`, `today-2`. Rejeitar fora disso.
- Recompensas/penalidades XP: aplicar normalmente quando muda de "vazio → done/failed". Ao **corrigir** (ex: `failed → done`), reverter a penalidade anterior e aplicar a recompensa nova (ou vice-versa). Isso evita XP duplicado/perdido.

**2. `src/lib/GameContext.tsx`** — propagar nova assinatura de `markHabit(id, status, date?)`.

**3. `src/components/HabitsPanel.tsx` — UI de histórico recente**
No `HabitCard`, hoje mostra só botões para o dia atual. Adicionar uma **mini timeline de 3 dias** (hoje, ontem, anteontem):

```
[Hoje ✓] [Ontem ✗ ⟲] [Anteontem — ✓✗]
```

- Cada dia tem rótulo curto ("Hoje", "Ontem", "2d") + status atual + botões pra alterar.
- Se já marcado: mostra ícone do status + botão pequeno pra **reverter/alterar** (ex: ícone de undo ou os 2 botões check/x menores).
- Se vazio: 2 botões check/x.
- Confirmação antes de **alterar** um status já marcado (evita novo clique acidental): `AlertDialog` simples — "Alterar status de Ontem para Concluído?".

**4. `MissionsPanel`** — vou olhar primeiro. Se missão tem só status único (Ativa/Concluída/Falhada), não há "data" pra editar; basta permitir alternar status livremente (sem janela de 2 dias). Se tiver histórico diário, aplicar mesma lógica dos hábitos.

### Detalhes técnicos
- Reaproveitar `XP_MAP` / `GOLD_MAP` para reverter recompensas: ao trocar `done → failed`, fazer `-xp -gold` e aplicar `-xp*2`. Ao trocar `failed → done`, somar `+xp*2` (reverter penalidade) e dar `+xp +gold`.
- Não disparar `RewardPopup` em correções (só em primeira marcação) para não confundir.
- Não permitir marcar dias futuros nem além de 2 dias atrás.

### Arquivos
- `src/lib/gameStore.ts` — `markHabit(id, status, date?)` com janela e reversão de XP.
- `src/lib/GameContext.tsx` — repassar parâmetro.
- `src/components/HabitsPanel.tsx` — UI de 3 dias com confirmação de alteração.
- `src/components/MissionsPanel.tsx` — investigar e ajustar se aplicável.

### Resultado
Usuário pode corrigir um "X" acidental de hoje, ontem ou anteontem em 2 cliques (com confirmação), e o XP/ouro é recalculado corretamente.
