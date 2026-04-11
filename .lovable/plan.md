

# Plano: Melhorar Layout do PlayerCard no Mobile

## Problema
5 stats em `grid-cols-5` fica apertado no mobile — textos cortados, cards minúsculos.

## Solução Recomendada: Layout Híbrido

Manter **Nível e Rank inline** junto ao nome do jogador (já estão parcialmente lá) e usar um grid `grid-cols-3` para os 3 stats restantes (Ouro, Streak, Conquistas). No mobile fica limpo e legível.

### Estrutura proposta:

```text
┌─────────────────────────────────┐
│  [Avatar]  Nome        [E] Lv.3│
│            "Título"             │
│            ████████░░ 120/200XP │
├─────────────────────────────────┤
│   🪙 Ouro   │  🔥 Streak │ 🏆 0/49│
│     150     │     3      │ Conquistas│
└─────────────────────────────────┘
```

- **Nível e Rank** ficam ao lado do nome (já tem o rank, adicionar "Lv.X")
- **Grid de 3 colunas** com Ouro, Streak e Conquistas — mais espaçoso e legível
- Remove os stats de Nível e Rank do grid inferior (redundantes)

### Arquivo alterado
- `src/components/PlayerCard.tsx`

### Mudanças:
1. Adicionar "Lv.{level}" junto ao nome/rank na linha superior
2. Mudar grid de `grid-cols-5` para `grid-cols-3` com apenas Ouro, Streak e Conquistas
3. Remover Stat de Nível e Rank do grid inferior

