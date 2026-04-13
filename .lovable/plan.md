

# Plano: Corrigir layout do HabitCard no mobile

## Problema
No mobile, todos os elementos do card de hábito estão numa única linha horizontal (`flex items-center gap-3`), causando sobreposição do nome, badges de XP/moedas, botões de ação, editar e deletar.

## Solução
Reestruturar o `HabitCard` para empilhar verticalmente no mobile:

### `src/components/HabitsPanel.tsx` — função `HabitCard` (linhas 244-295)

**Layout atual:** Uma única `div flex` com tudo inline.

**Novo layout:**
1. **Linha 1:** Ícone + nome + dificuldade + ícones de descrição/vídeo + botões de ação (check/fail ou status) + editar + deletar
   - Usar `flex-wrap` para permitir quebra
   - Reduzir `gap` para `gap-2`
2. **Linha 2:** Badges de XP, moedas e penalidade em linha separada abaixo
   - Mover os badges (`+XP`, `+Moedas`, `-XP`) para fora do `flex-1` e colocá-los como uma segunda linha do card

**Estrutura proposta:**
```
<div className="rpg-panel space-y-2">
  {/* Linha 1: ícone, nome, dificuldade, ícones, botões */}
  <div className="flex items-center gap-2">
    <span>icon</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span>nome</span> <span>dificuldade</span> <icons/>
      </div>
    </div>
    <buttons check/fail/edit/delete />
  </div>
  {/* Linha 2: badges de recompensa */}
  <div className="flex items-center gap-1.5 flex-wrap">
    <badge XP/> <badge Moedas/> <badge Penalidade/>
  </div>
</div>
```

Isso separa as informações de recompensa numa linha própria, evitando o acúmulo horizontal no mobile.

