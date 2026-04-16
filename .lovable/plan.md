

## Objetivo
A lista "Concluídas" das missões hoje aparece simples (texto e ícones pequenos). O usuário quer que cada item de missão concluída fique **colorido e com badges visuais** no estilo das badges de hábitos (`⚡ +XP / 💰 +Moedas / 💀 -XP`) que ele selecionou.

## Mudanças em `src/components/MissionsPanel.tsx`

### 1. Cards de missões concluídas (`MissionCard` quando `status === 'Concluída'`)
Atualmente o card concluído só mostra nome riscado + dificuldade. Vou adicionar uma **linha de badges coloridas** com o que foi ganho:

- ⚡ **+XP ganho** (badge roxa, `bg-primary/15 text-primary`)
- 💰 **+Moedas ganhas** (badge âmbar, `bg-warning/15 text-warning`)
- ✅ **CONCLUÍDA** (badge verde, `bg-success/15 text-success`)
- Data de conclusão (`completedAt` formatada)

Cálculo do XP/Gold ganho com base no tipo:
- **Tempo**: `floor(executedHours * XP_PER_HOUR[diff])` e `floor(executedHours * GOLD_PER_HOUR[diff])`
- **Diária**: `dailyXp` e `dailyGold` salvos
- **Contagem**: XP acumulado das marcações

### 2. Cards de missões falhadas
Adicionar badge:
- 💀 **-XP** (badge vermelha, `bg-destructive/15 text-destructive`)
- ❌ **FALHADA** (badge vermelha)

### 3. Itens do histórico repetível (linhas 408-426)
Reformatar para usar o **mesmo estilo de badges coloridas** em vez do texto plano atual `+X XP` `+X 💰`. Mantém o ícone de Repeat, mas troca os spans de texto por badges com fundo colorido como nos hábitos.

### 4. Visual final (exemplo)
```
[Repeat] Treino de força (1.5h)            [⚡ +7 XP] [💰 +3 Moedas] [✅ CONCLUÍDA]
         15/04/2026 às 14:32
```

Sem mudanças em outros arquivos, sem migrações.

