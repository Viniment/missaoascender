

# Plano: Corrigir missão de tempo que cruza meia-noite

## Problema
Na linha 142-143, o `endDate` é criado copiando a data do `startDate` e substituindo apenas as horas. Se a missão começou às 22:00 e terminou às 07:00 do dia seguinte, o `endDate` fica no mesmo dia às 07:00 — antes do início — e o sistema rejeita como "horário inválido".

## Solução
**Arquivo:** `src/components/MissionsPanel.tsx` (linhas 142-148)

Se `endDate <= startDate`, adicionar 1 dia ao `endDate` antes de rejeitar:

```typescript
const endDate = new Date(startDate);
endDate.setHours(endH, endM, 0, 0);

// Se o horário final parece anterior, assume que cruzou meia-noite
if (endDate.getTime() <= startDate.getTime()) {
  endDate.setDate(endDate.getDate() + 1);
}
```

Remove-se o `toast.error` de "horário inválido" pois agora sempre será válido (a tarefa simplesmente cruzou meia-noite).

## Arquivo alterado
- `src/components/MissionsPanel.tsx` — ~3 linhas modificadas

