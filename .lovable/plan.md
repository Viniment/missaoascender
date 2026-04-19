
## Auto-cancelar Protocolo de Falha ao corrigir hábito para concluído

### Problema
Quando o usuário marca "falhou" sem querer, um Protocolo de Falha é criado. Ao corrigir para "concluído", o XP volta — mas o protocolo continua pendente, exigindo ação.

### Solução
Em `markHabit` (`src/lib/gameStore.ts`), quando a transição for `failed → done`, remover (ou marcar como Concluído) automaticamente o protocolo pendente cuja `reason === "Hábito falhado: <nome do hábito>"`.

### Mudança
No bloco já existente (~linha 784) que monta `newProtocols`, adicionar caso simétrico:

```ts
// Auto-cancelar protocolo se usuário corrigiu failed → done
if (previous === 'failed' && status === 'done') {
  const reasonTag = `Hábito falhado: ${habit.name}`;
  newProtocols = newProtocols.filter(
    fp => !(fp.status === 'Pendente' && fp.reason === reasonTag)
  );
}
```

Detalhes:
- Usa `filter` (remove) em vez de marcar Concluído, para não poluir histórico com protocolo "fantasma" que nunca foi executado de verdade. Esses protocolos foram criados por erro do usuário.
- Funciona para `targetDate === today` (caso do bug relatado) e também para correções retroativas (defensivo).
- Adicionar log informativo: "Protocolo de falha cancelado: <nome>" quando isso ocorrer, para o usuário entender.

### Escopo
Só hábitos por enquanto (é onde o bug ocorre). Missões usam outro fluxo de protocolo e não foram pedidas.

### Arquivo
- `src/lib/gameStore.ts` — função `markHabit`, adicionar cancelamento automático do protocolo + log.

### Resultado
Marcou "falhou" por engano → corrige para "concluído" → protocolo de falha desaparece automaticamente, XP/ouro recalculados, log mostra a correção e o cancelamento.
