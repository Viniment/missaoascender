
## Diagnóstico

Hoje o HP do monstro **não é calculado a partir do histórico** — ele é um contador acumulado que sobe/desce a cada evento. Problemas:

1. **Começa em 50 fixo** mesmo sem você ter feito nada — sensação de injustiça.
2. **Não reflete a proporção real** entre acertos e falhas. Se você fez 20 hábitos e falhou 1 (95% de sucesso), o HP pode estar alto só porque uma falha recente bateu +8 e os 20 acertos antigos já foram "absorvidos".
3. **Sem decay temporal** — uma falha de 30 dias atrás pesa igual a uma de hoje.

## Proposta: HP derivado de proporção real (com peso temporal)

Trocar o HP acumulado por um **cálculo derivado** dos últimos 30 dias:

```
sucessos = hábitos feitos + missões concluídas (últimos 30d)
falhas   = hábitos falhados + missões falhadas (últimos 30d)

taxaFalha = falhas / (sucessos + falhas)
hp = round(taxaFalha * 100)
```

**Peso temporal:** eventos dos últimos 7 dias contam **2×**, 8–30 dias contam **1×**. Isso faz o monstro reagir rápido a mudanças recentes sem ignorar o histórico.

**Sem dados (usuário novo):** HP = 0 (monstro adormecido, não nasce em 50).

### Exemplo com seus números
- 20 hábitos feitos + 3 missões feitas = 23 sucessos
- 1 hábito falhado + 1 missão falhada = 2 falhas
- taxaFalha = 2 / 25 = 8% → **HP ≈ 8** (AGONIZANTE) ✅

Hoje você provavelmente está em ~50 só por causa do valor inicial.

## Mudanças

**`src/lib/gameStore.ts`**
- Criar função `computeMonsterHp(state)` que percorre `habits[].history` e `missions[].completionHistory` + status final.
- Remover os ajustes manuais de `monster.hp` espalhados (não somar mais +12/-3 etc).
- Recalcular HP em todo evento que modifica hábito/missão (ou no seletor, on-the-fly).
- Manter `lastReason` (texto do último evento) só para o tooltip.
- `defaultState.monster.hp` passa a ser `0`.

**`src/components/MonsterIndicator.tsx`**
- Sem mudança estrutural — só passa a ler o HP calculado.
- Ajustar texto quando HP = 0 e não há histórico: "Adormecido. Aja para acordá-lo... ou enterre-o de vez."

**`src/components/MirrorPanel.tsx`**
- Nada muda (já lê `state.monster.hp`).

## Migração de dados existentes
Na primeira renderização após o update, o HP é recalculado do histórico — usuários atuais verão o número se ajustar imediatamente para refletir a realidade. Sem migração de banco necessária (HP fica em `game_state` jsonb).

## Pergunta rápida
Prefere:
- **(A)** Janela fixa de 30 dias com peso 2× nos últimos 7d (recomendado, equilibrado)
- **(B)** Janela curta só dos últimos 7 dias (mais reativo, esquece rápido)
- **(C)** Histórico completo sem decay (mais "justo", mas lento pra reagir)
