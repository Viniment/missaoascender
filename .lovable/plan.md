

# Plano: Corrigir conquistas de hábitos para exigir dias CONSECUTIVOS

## Problema
A função `maxHabitDone` conta o total de dias marcados como "done", não dias **seguidos sem falha**. Então se você fez um hábito 10 vezes espalhadas (com falhas no meio), já ganha a conquista de 10 dias.

## Solução
Trocar a função `maxHabitDone` em `src/lib/achievements.ts` (linha 40) por uma que calcula o **maior streak consecutivo** de cada hábito — ou seja, a maior sequência de dias seguidos sem interrupção (sem "failed" e sem dia pulado).

### Lógica da nova função
Para cada hábito:
1. Pegar todas as datas do `history`, ordenar cronologicamente
2. Percorrer dia a dia verificando se o próximo dia é exatamente +1 dia e status `done`
3. Se sim, incrementa streak; se não, reseta
4. Retorna o maior streak encontrado entre todos os hábitos

### Código (resumo)
```typescript
const maxHabitStreak = (s: PlayerState) => {
  return Math.max(0, ...s.habits.map(h => {
    const dates = Object.entries(h.history)
      .filter(([_, v]) => v === 'done')
      .map(([d]) => d)
      .sort();
    if (dates.length === 0) return 0;
    let max = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i-1] + 'T12:00:00');
      const curr = new Date(dates[i] + 'T12:00:00');
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { current++; max = Math.max(max, current); }
      else { current = 1; }
    }
    return max;
  }));
};
```

### Arquivos
- `src/lib/achievements.ts` — substituir `maxHabitDone` por `maxHabitStreak` e atualizar todas as referências (conquistas de 5, 10, 15, 20, 25, 30, 60, 100, 200 dias)
- `src/components/AffirmationsPanel.tsx` — atualizar referência na linha 33 para usar a mesma lógica de streak (ou manter o total lá, já que ali é só contexto para a IA)
- Atualizar `requirements` text de cada conquista para deixar claro: "X dias seguidos"

