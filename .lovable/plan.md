

# Plano: Corrigir missões concluídas sem data + Confirmar compensação

## Problemas identificados

### 1. Missões antigas sem `completedAt`
As missões concluídas antes da atualização não têm o campo `completedAt`, então o filtro de "7 dias" as ignora (linha 203: `if (!m.completedAt) return false`).

**Solução:** No `normalizePlayerStateForToday` (que roda ao carregar o estado), adicionar lógica para preencher `completedAt` nas missões concluídas que não têm esse campo. Vou setar como "ontem" (`new Date(Date.now() - 86400000).toISOString()`) para que apareçam no filtro de 7 dias.

### 2. Compensação de +30 XP — é por usuário?
**Sim, já está correto.** O flag `_penaltyCompensated` é salvo no estado individual de cada jogador. Cada usuário recebe a compensação apenas uma vez, no primeiro check-in após a atualização. Não precisa de mudança aqui.

## Arquivo envolvido
- `src/lib/gameStore.ts` — adicionar backfill de `completedAt` na função `normalizePlayerStateForToday`

## Mudança específica
```typescript
// Em normalizePlayerStateForToday, após as checagens existentes:
if (state.missions) {
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  state.missions = state.missions.map(m =>
    m.status === 'Concluída' && !m.completedAt
      ? { ...m, completedAt: yesterday }
      : m
  );
}
```

