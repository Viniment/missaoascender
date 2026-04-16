

# Plano: Trocar respiração para técnica 4-7-8

## Mudança

No `src/components/UrgeSurfingPanel.tsx`, atualizar as constantes de respiração:

```
BREATHING_PHASES: ['Inspire…', 'Segure…', 'Expire…']  (remover o segundo "Segure")
BREATHING_DURATIONS: [4, 7, 8]  (em vez de [4, 4, 6, 2])
```

A lógica do ciclo já funciona com qualquer número de fases — só precisa ajustar os arrays e garantir que:
- **Inspire (4s):** bola cresce de MIN → MAX
- **Segure (7s):** bola fica parada em MAX
- **Expire (8s):** bola diminui de MAX → MIN

Sem segundo "Segure" — ciclo de 3 fases (19s total) que repete continuamente.

## Arquivo
- `src/components/UrgeSurfingPanel.tsx`

