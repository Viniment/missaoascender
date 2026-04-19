
## Refazer UI de correção retroativa — modo "voltar no tempo"

### Pedido
Hoje cada hábito mostra timeline de 3 dias (Hoje/Ontem/Anteontem) inline, ocupa muita altura e fica visualmente poluído. Usuário quer:
- Visualização limpa (só "Hoje" por padrão).
- Um botão global tipo **"← Voltar para Ontem"** / **"← Anteontem"** que muda o contexto e mostra **todos os hábitos daquele dia** com seus status, permitindo corrigir em massa.

### Solução

**1. `HabitsPanel.tsx` — seletor de dia global**

Adicionar um controle no topo da lista de hábitos:

```
HÁBITOS                              [+ Novo]

[← Anteontem]  [← Ontem]  [● Hoje]
```

- 3 botões/abas (Hoje, Ontem, Anteontem). Default = Hoje.
- Estado local: `viewDate` (string YYYY-MM-DD).
- Quando muda, o `HabitCard` passa a renderizar baseado em `viewDate` em vez de `today`.

Quando `viewDate !== today`, mostrar uma faixa visual de aviso:
```
🕐 Visualizando: Ontem (18/04) — alterações recalculam XP
```

**2. `HabitCard` — voltar ao layout simples**

Remover a timeline de 3 dias. Voltar para o layout antigo (1 linha de ações Check/X), mas operando sobre `viewDate` recebido por prop:
- Mostra status do `viewDate` (✔️ done, ❌ failed, ou vazio).
- Botões Check/X funcionam para esse dia.
- Se já marcado, clicar no outro botão pede confirmação (`AlertDialog`) — "Alterar status para Concluído?".
- Card fica com altura compacta como antes.

**3. Comportamento de marcação**
- `viewDate === today` (default): comportamento atual — popup de recompensa, etc.
- `viewDate !== today`: chama `markHabit(id, status, viewDate)` e mostra apenas toast simples ("Hábito de ontem atualizado"). Sem RewardPopup nem FailureConfront (já são correções retroativas).
- A lógica de reversão de XP/ouro no `gameStore.markHabit` já está implementada — não muda.

**4. Ordenação**
- Manter sort: hábitos sem status no `viewDate` aparecem primeiro, marcados depois.

### Arquivos
- `src/components/HabitsPanel.tsx` — adicionar seletor de dia (Hoje/Ontem/Anteontem) + faixa de aviso + remover timeline inline do `HabitCard` e voltar ao layout simples baseado em `viewDate`.

### Resultado
- Visual limpo no dia normal (só Hoje).
- 1 clique para "voltar pra ontem" e ver/corrigir tudo daquele dia em lote.
- Sem ocupar espaço extra em cada card.
