
## Não criar Protocolo de Falha quando não há punição habilitada

### Problema
Hoje, ao falhar um hábito/missão, o protocolo é criado mesmo quando `pickPunishment()` retorna `undefined` (nenhuma punição ativa). Resultado: protocolo "vazio" sem consequência real (ou nem aparece visualmente, conforme o usuário relatou).

### Regra desejada
Protocolo de Falha **só é criado se houver pelo menos uma punição habilitada**. Sem punição ativa → nada de protocolo (XP/ouro/monstro continuam sendo aplicados normalmente).

### Mudança em `src/lib/gameStore.ts`

**1. `markHabit` (~linha 794-815)** — só adicionar ao `newProtocols` se `punishment` existir:
```ts
const punishment = pickPunishment(prev);
if (punishment) {
  newProtocols = [...prev.failureProtocols, { ...,  punishment, ... }];
}
```

**2. `failMission` (~linha 676-702)** — mesma lógica: se `pickPunishment` retornar `undefined`, não incluir no `failureProtocols` (mantém o resto do retorno igual, só remove a entrada do array).

### Observações
- Toast/log de "❌ Hábito/Missão falhada" continuam normalmente.
- Penalidade de XP/ouro/monstro continua sendo aplicada (não depende de punição).
- Se o usuário ativar uma punição depois, próximas falhas voltam a gerar protocolo.

### Arquivo
- `src/lib/gameStore.ts` — `markHabit` e `failMission`: condicionar criação do protocolo a `punishment !== undefined`.
