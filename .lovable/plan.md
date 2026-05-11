## Objetivo

No diálogo "Iniciar Missão" (missões do tipo Tempo), além do campo de hora, adicionar um campo de **data de início** com a data atual (Brasília) como padrão. Útil para registrar tarefas começadas em dia anterior.

## Mudanças

Arquivo único: `src/components/MissionsPanel.tsx`

1. Novo estado `startDateInput` (string `YYYY-MM-DD`), inicializado com `getTodayBrasilia()`.
2. Resetar `startDateInput = getTodayBrasilia()` junto com `startTimeInput` ao abrir o diálogo (no `onStart` do `MissionCard`).
3. No `<DialogContent>` do "Iniciar Missão", adicionar acima do campo de hora um `<Input type="date">` controlado por `startDateInput`, com label "Dia que iniciei a tarefa" e hint "Padrão: hoje. Ajuste se começou em outro dia."
4. No handler do botão "Iniciar", construir o `Date` combinando `startDateInput` + `startTimeInput`:
   ```ts
   const [y, mo, d] = startDateInput.split('-').map(Number);
   const [h, mi] = startTimeInput.split(':').map(Number);
   const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
   startTimeMission(startTimeDialog, dt.toISOString());
   ```
5. Validar: se `dt` ficar no futuro, mostrar `toast.error` e não iniciar.

## Fora do escopo

- Sem mudanças em `gameStore`, lógica de XP/ouro, ou cálculo do `handleFinishTimeMission` (que já lida com missões multi-dia via `startedAt` ISO).
- Sem mudanças visuais além do novo campo.
