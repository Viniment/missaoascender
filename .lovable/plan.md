

# Plano: Heatmap do primeiro registro até 30 dias

## Mudança
No `HeatmapSection` em `src/components/HabitsPanel.tsx`:

1. Encontrar a **primeira data** no `h.history` (menor chave)
2. Gerar dias do primeiro registro até **primeiro registro + 30 dias** (não até hoje)
3. Se não tem history, não mostrar heatmap para esse hábito
4. Ordem: esquerda → direita (dia 1 → dia 30)

## Arquivo alterado
- `src/components/HabitsPanel.tsx` — apenas a função `HeatmapSection`

