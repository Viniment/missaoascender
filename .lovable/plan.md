## Objetivo

Refinar a lógica de combate e hábitos para que cada hábito vire um ataque com peso real, manter toda a UI/identidade visual, e reverter mudanças recentes nas tarefas de boss (voltar checkbox, tirar tipos de tarefa). Sem novo sistema de bosses, sem mudar visual.

---

## 1. HP do Boss — auto-calculado

Arquivo: `src/lib/gameStore.ts` (`addBoss`, `updateBoss`).

Tabela por dificuldade (HP por dia):
- Fácil = 8, Normal/Médio = 12, Difícil = 16, Brutal/Extremo = 22, Pesadelo = 30.

Fórmula:
```
maxHp = dias × baseHpPorDia(difficulty)
```

- Substitui `b.days * tasks.length`.
- Adicionar suporte a `'Pesadelo'` na união `difficulty` (`BossPanel.tsx` form).
- Em `updateBoss`, recalcular `maxHp` quando `days` ou `difficulty` mudarem e ajustar `hp` proporcionalmente (`hp = round(hp * novoMax/maxAntigo)`).
- Remover qualquer input manual de HP no `BossFormDialog` (já é o caso).

## 2. Hábitos com Poder Base

Arquivo: `src/lib/gameStore.ts` (interface `Habit`) e `src/components/HabitsPanel.tsx` (form).

Novos campos opcionais (default seguros para hábitos antigos):
```ts
impact?: 'baixo' | 'medio' | 'alto' | 'transformador'; // default 'medio'
resistance?: 'nunca' | 'as_vezes' | 'frequentemente' | 'quase_sempre' | 'sempre'; // default 'as_vezes'
priority?: 1 | 2 | 3 | 4 | 5; // default 3
```

Form do hábito: 3 novos seletores (Impacto, Resistência, Prioridade ⭐). UI usa componentes já existentes (Select / botões de estrela), mantém visual atual.

Helper novo em `gameStore.ts`:
```ts
export function habitBasePower(h: Habit): number {
  const I = { baixo:1, medio:2, alto:3, transformador:5 }[h.impact || 'medio'];
  const R = { nunca:1, as_vezes:2, frequentemente:3, quase_sempre:4, sempre:5 }[h.resistance || 'as_vezes'];
  const P = (h.priority ?? 3);
  return I + R + P; // 3..15
}
```

## 3. Dano de hábito → Boss (remover dano fixo de 1)

Hoje o dano de habit em boss vem de `damageFromCombo(combo)` (1..4). Substituir por:

```
danoFinal = round(
  habitBasePower(h)
  × fraquezaMultiplier(boss, habit)   // já existente
  × comboMultiplier(boss.combo)        // novo, derivado do combo atual
  × consistencyMultiplier(streak)      // já existente
)
```

- `comboMultiplier`: 1.0 / 1.25 / 1.5 / 2.0 nos breakpoints 0/5/10/20 (preserva sensação atual mas como multiplicador, não substituto).
- Fraqueza e consistência: reaproveitar funções existentes; se hoje só dão XP, aplicar o mesmo fator ao dano.
- Aplicar em todos os caminhos que hoje chamam `damageFromCombo` para hábitos (não para tarefas de boss — ver item 7).
- XP/ouro do hábito continuam pela régua atual (`XP_PER_HOUR`/`GOLD_PER_HOUR[difficulty]`), só o **dano ao boss** muda.

## 4. Potencial de Ataque do dia

Componente novo: bloco discreto no topo do `BossCard` (sem mudar layout, reaproveita estilo dos chips existentes).

```
Potencial de Ataque Hoje: 68
```

- Soma `danoFinal` de todos os hábitos do boss ainda não concluídos hoje + dano potencial das tarefas do boss não feitas.
- Atualiza ao concluir (cai) e ao expirar hábito (cai sem virar dano).
- Selector novo `getTodayAttackPotential(state, bossId)` em `gameStore.ts`.

## 5. Boss recupera HP em hábito obrigatório expirado

`settleBossesForToday` + handler de expiração de hábito:
- Quando um hábito marcado como obrigatório (priority ≥ 4 OU campo novo `mandatory?: boolean`) passar do `endDate`/dia sem `done`, o boss linkado recupera `floor(danoFinal × 0.5)`.
- Setar `pendingMockery` com `reason: 'self_betrayal'` e flash visual reaproveitando `MockeryOverlay` (já existe). Texto: "O Boss absorveu sua hesitação."

## 6. Tela de Ataque (Strike) — breakdown

Arquivo: `src/components/BossPanel.tsx` (`StrikeOverlay`).

Ao concluir hábito, exibir o overlay (já existe) com novas linhas:
- Impacto +X
- Resistência +X
- Prioridade ⭐×N
- Fraqueza explorada ×M (se aplicável)
- Combo ×M
- Consistência ×M
- **Dano Final: −Y**

Reusa o overlay atual; apenas trocar o grid de 3 colunas por uma lista compacta. Identidade visual mantida (mesmos tokens, cores, animação).

## 7. Reverter mudanças recentes nas tarefas de Boss

`src/components/BossPanel.tsx` e `src/lib/gameStore.ts`:
- Remover seletor de tipo (`simple/count/temporal`), botões +1 / Play/Stop, sub-painel de vídeo/descrição/tipo nas tarefas do boss.
- Voltar para **checkbox** por dia, como antes.
- Manter os campos extras (`type`, `targetCount`, `countByDate`, `intervalHours`, `sessionsByDate`, `videoUrl`, `description`) no schema só para não quebrar dados salvos, mas a UI ignora.
- Remover ações `incrementBossTaskCount`, `startBossTaskTimer`, `stopBossTaskTimer`, `updateBossTask` do uso no painel (manter exportadas como no-op opcional ou deletar do contexto se nada mais usa).

## 8. Mensagens de identidade (sem mensagens genéricas)

Pool curto em `src/lib/affirmations.ts` (ou novo helper), sorteado ao concluir hábito:
- "Você reforçou sua disciplina."
- "Você provou que consegue cumprir promessas."
- "Hoje o Boss perdeu influência sobre você."
- etc.

Substituir toasts/headers de "Tarefa concluída" / "Hábito concluído" por uma dessas frases no `HabitsPanel` e no `StrikeOverlay`.

## 9. IA — sugestão de ajuste de dificuldade

Edge function nova `habit-difficulty-advisor` (Lovable AI Gateway):
- Input: últimos 14 dias de `history` do hábito + `difficulty`.
- Regras determinísticas locais antes de chamar IA:
  - taxa ≥ 90% por 7 dias → sugerir subir.
  - taxa ≤ 30% por 7 dias → sugerir baixar.
- IA gera a frase de sugestão (1-2 linhas). Mostrar como banner discreto dentro do card do hábito com botão "Ajustar".

(Implementação mínima: helper local + sugestão textual; chamar edge function só quando o usuário abrir o card.)

## 10. Relatório da Guerra (diário)

Helper `buildWarReport(state, dateISO)` em `src/lib/gameStore.ts`. Renderizado num bloco novo no topo do `BossPanel` quando houver atividade no dia. Conteúdo:
- batalhas vencidas (hábitos done hoje)
- HP perdido pelo boss hoje (somar `damageEvents` do dia — adicionar log em `state.bosses[].damageLog: {date,delta}[]`)
- nº de vezes que a resistência foi alta e o hábito foi feito mesmo assim
- se houve regen por hábito perdido
- frase de fechamento.

## 11. Forja de Identidade — esconder após preenchimento

`src/pages/Index.tsx` já tem `identityFilled`. Garantir que `IdentityOnboarding` não abre sozinho depois de preenchido (atualmente `useState(!identityFilled)` só pega o valor inicial — trocar por `useEffect` que fecha quando `identityFilled` vira true, e nunca reabre se já preenchido).

## 12. Persistência

Tudo cabe em `player_data.game_state` (jsonb). Zero mudança de schema no banco. Hábitos antigos recebem defaults via merge na hidratação.

---

## Detalhes técnicos chave

```ts
// gameStore.ts
const BOSS_HP_PER_DAY = { 'Fácil':8, 'Normal':12, 'Difícil':16, 'Brutal':22, 'Pesadelo':30 } as const;

export function bossMaxHpFor(days: number, diff: BossDifficulty) {
  return Math.max(1, days * (BOSS_HP_PER_DAY[diff] ?? 12));
}

export function computeHabitAttack(habit: Habit, boss: Boss, streak: number) {
  const base = habitBasePower(habit);
  const wMul  = weaknessMultiplier(boss, habit);   // 1.0 ou 1.5
  const cMul  = comboMultiplier(boss.combo);       // 1.0..2.0
  const sMul  = consistencyMultiplier(streak);     // 1.0..1.3
  return Math.max(1, Math.round(base * wMul * cMul * sMul));
}
```

---

## Fora do escopo

- Não cria um novo sistema de bosses.
- Não muda o esquema do banco.
- Não muda identidade visual / tokens / fontes.
- Mini Vitórias permanecem como estão.