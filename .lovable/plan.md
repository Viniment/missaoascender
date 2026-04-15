

# Plano: Ajustar penalidade de dias perdidos + Proteger XP

## O que aconteceu
Seus pontos caíram de ~231 para 191 porque o check-in do dia 15/04 detectou que o dia 14/04 foi perdido e aplicou penalidade de -50 XP. Isso **não foi um bug** — é o comportamento atual do sistema de penalidades.

## O que vou corrigir/melhorar

### 1. Reduzir a penalidade padrão
- 1 dia perdido: **-20 XP** (era -50)
- 2+ dias perdidos: **-50 XP** (era -100)

### 2. Restaurar seu XP perdido
- Vou ajustar a lógica para que a penalidade antiga excessiva não se repita
- Como a penalidade já foi aplicada no seu estado salvo, vou adicionar uma compensação de +30 XP no seu próximo check-in ou corrigir diretamente

### 3. Mostrar aviso antes de aplicar penalidade
- No SystemPanel, quando há dias perdidos, mostrar a penalidade que será aplicada **antes** do usuário clicar no botão

## Arquivo envolvido
- `src/lib/gameStore.ts` — ajustar valores de penalidade nas linhas 387-389

