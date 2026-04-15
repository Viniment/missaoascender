

# Plano: Corrigir compensação para não afetar contas novas

## Problema
A flag `_penaltyCompensated` começa como `undefined` no estado padrão. Qualquer novo usuário recebe +30 XP no primeiro check-in, o que não é correto — a compensação era só para quem foi penalizado pela regra antiga.

## Solução
No `defaultPlayerState` em `src/lib/gameStore.ts`, setar `_penaltyCompensated: true` como valor padrão. Assim, contas novas já nascem com a flag marcada e não recebem a compensação. Só quem já existia (e tem `_penaltyCompensated` ausente no estado salvo) vai receber.

## Arquivo
- `src/lib/gameStore.ts` — adicionar `_penaltyCompensated: true` no objeto `defaultPlayerState`

