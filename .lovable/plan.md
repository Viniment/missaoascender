

# Plano: Corrigir missão de tempo com múltiplos dias

## Problema
Linha 142-143: o `endDate` é criado a partir do `startDate` e só recebe as horas do input. Se `endDate <= startDate`, adiciona apenas 1 dia. Mas se a missão durou 3 dias (ex: começou segunda 22:00, terminou quinta 07:00), o cálculo fica errado — conta só ~9h em vez de ~57h.

## Solução
**Arquivo:** `src/components/MissionsPanel.tsx` (linhas 136-148)

Em vez de construir o `endDate` a partir do `startDate`, usar a **data atual** (`getNowBrasilia()`) como base e só aplicar as horas/minutos do input nela:

```typescript
const handleFinishTimeMission = () => {
  if (!finishDialog) return;

  const startDate = new Date(finishStartedAt);
  const [endH, endM] = finishTime.split(':').map(Number);

  // Usar a data de HOJE (não do startDate) como base
  const endDate = getNowBrasilia();
  endDate.setHours(endH, endM, 0, 0);

  // Se o horário informado já passou hoje, não faz sentido — pode ser que o usuário quis dizer "agora"
  // Se endDate ainda ficou antes de startDate (impossível), usar now direto
  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const hours = (endDate.getTime() - startDate.getTime()) / 3600000;
  // ... resto igual
};
```

Isso garante que se a missão começou há 3 dias, o cálculo usa a data de hoje como referência, não a data de início.

## Arquivo alterado
- `src/components/MissionsPanel.tsx` — ~3 linhas modificadas

