
## Ativar Protocolo de Falha ao corrigir tarefa para "falhada"

### Problema
Hoje, quando o usuário corrige um hábito de `done` → `failed` (retroativo ou hoje), o XP/ouro são debitados, mas **não é criado Protocolo de Falha**. A criação do protocolo só acontece no fluxo "primeira marcação como falhada" (quando `previous` é `undefined`).

### Causa
Em `src/lib/gameStore.ts`, dentro de `markHabit`, o bloco que cria `failureProtocols` provavelmente está condicionado a `!previous` (primeira marcação) em vez de "qualquer transição que resulte em `failed`".

### Solução
Ajustar a condição em `markHabit` para criar protocolo sempre que **o status final for `failed` e o anterior não era `failed`** (ou seja: `undefined → failed` E `done → failed`).

```ts
const becameFailed = status === 'failed' && previous !== 'failed';
if (becameFailed) {
  const punishment = pickPunishment(prev);
  if (punishment) {
    newProtocols = [...newProtocols, { ...protocolData, punishment }];
    // log: "Protocolo de falha ativado: <nome>"
  }
}
```

### Simetria com a regra existente
- `failed → done` (corrigir acerto): remove protocolo pendente ✅ (já existe)
- `done → failed` (corrigir erro): **cria protocolo** ✅ (novo, este plano)
- `undefined → failed`: cria protocolo ✅ (já existe)
- `undefined → done`: nada ✅
- Sem punição habilitada: nunca cria ✅ (regra anterior mantida)

### Arquivo
- `src/lib/gameStore.ts` — função `markHabit`: trocar condição de criação do protocolo de "primeira marcação" para "transição para failed", mantendo o gate de `pickPunishment`.

### Resultado
Marcou "concluído" sem querer → corrige para "falhado" → protocolo de falha é ativado normalmente (se houver punição habilitada), com log informativo.
