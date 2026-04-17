

## Objetivo
No Histórico, toda missão **falhada** (repetível ou não) deve renderizar com o **mesmo card compacto** mostrado no print: ícone `Repeat` vermelho, nome riscado, data/hora, badges `⚡ -X XP` e `💀 FALHADA`. As **concluídas** continuam com `MissionCard` normal.

## Mudança em `src/components/MissionsPanel.tsx` (loop do histórico, ~linhas 439-479)

1. **Detectar falha em qualquer item**: tratar `item.kind === 'mission'` com `mission.status === 'Falhada'` igual ao bloco atual de `kind === 'history'` com `isFail = true`.

2. **Extrair JSX do card de falha em um helper inline** (ou bloco compartilhado) que recebe: `name`, `date`, `xp` (negativo), e renderiza exatamente o layout da imagem:
   - `rpg-panel p-3 space-y-2 opacity-60 border-destructive/30`
   - `Repeat` vermelho + nome com `line-through text-destructive`
   - data/hora `pt-BR`
   - badges `⚡ {xp} XP` e `💀 FALHADA` (vermelhos)

3. **Branching novo no `items.map`**:
   - Se `kind === 'mission'` e `mission.status === 'Concluída'` → `<MissionCard />` (igual hoje)
   - Se `kind === 'mission'` e `mission.status === 'Falhada'` → renderizar o **mesmo card compacto vermelho** usando `mission.name`, `mission.completedAt`, `mission.xp` (multiplicado por -1 ou usar a penalidade real se houver no objeto)
   - Se `kind === 'history'` → continua exatamente igual

4. **XP da falha não-repetível**: usar `-mission.xp` (mesma convenção do histórico repetível, que armazena `h.xp` já negativo). Verificar rapidamente em `gameStore.ts > failMission` qual valor é descontado pra mostrar o número correto.

## Resultado
Histórico 100% visualmente consistente para falhas: o card vermelho compacto da imagem vira o **único estilo** de missão falhada, eliminando a diferença visual entre repetível e não-repetível. Concluídas mantêm o card cheio atual.

