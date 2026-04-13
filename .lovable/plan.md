

# Plano: Ajustes de Balanceamento e UI nas Missões

## Mudanças

### 1. Trocar 🪙 por 💰 em todo o painel de missões e hábitos
Substituir todas as ocorrências de `🪙` por `💰` nos componentes `MissionsPanel.tsx`, `HabitsPanel.tsx` e `RewardPopup.tsx`.

### 2. Reduzir recompensas por hora (balanceamento)
Valores atuais vs novos:

```text
              XP/h atual → novo    Gold/h atual → novo
Fácil:           5 → 3                20 → 1
Normal:         10 → 5                20 → 2
Difícil:        20 → 8                20 → 3
```

Isso significa que 20h no Difícil = 160 XP + 60 gold (em vez de 400 XP + 400 gold). Também ajustar o `GOLD_PER_HOUR` para ser um mapa por dificuldade ao invés de constante fixa.

### 3. Remover input de hora ao CRIAR missão de tempo
Remover o campo "Hora de início" do formulário de criação. A hora só será pedida ao **iniciar o timer** (botão Play).

### 4. Pedir hora ao iniciar o timer (botão Play)
Ao clicar em Play, abrir um mini dialog perguntando a hora que iniciou (padrão = hora atual). Usar essa hora como `startedAt`.

### 5. Novo formato de exibição na listagem de missões de tempo
De: `20 XP/h | 20 🪙/h`
Para: `8 XP / 3 💰 [ Por Hora ]` (quando parada)
E quando rodando: `8 XP / 3 💰 [ Por Hora ] - [ 2h 35min ]`

## Arquivos alterados
- `src/components/MissionsPanel.tsx` — UI, dialog de início, formato de exibição, emoji
- `src/lib/gameStore.ts` — constantes de XP e gold, `GOLD_PER_HOUR` → mapa por dificuldade
- `src/components/HabitsPanel.tsx` — emoji 🪙→💰
- `src/components/RewardPopup.tsx` — emoji 🪙→💰

