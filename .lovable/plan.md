

# Plano: Heatmap esquerda→direita + Layout de missões igual hábitos

## 1. Heatmap — Garantir ordem esquerda→direita
**Arquivo:** `src/components/HabitsPanel.tsx` (HeatmapSection, linha 334)

Adicionar `flex-row` explícito no container do heatmap para garantir que os dias mais antigos fiquem à esquerda e o dia atual à direita:
```
<div className="flex flex-row gap-0.5 flex-wrap">
```

## 2. Missões — Reestruturar layout igual hábitos
**Arquivo:** `src/components/MissionsPanel.tsx` (MissionCard, linhas 552-643)

**Atual:** Tudo numa única `div flex gap-3` — nome, tipo, categoria, badges de XP/moedas, ícones de vídeo/descrição e botões de ação, tudo inline.

**Novo layout (igual ao HabitCard):**
```
<div className="rpg-panel space-y-2">
  {/* Linha 1: nome + dificuldade + botões de ação */}
  <div className="flex items-center gap-2">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        nome | dificuldade | ícones descrição/vídeo
      </div>
    </div>
    <botões ação (play/stop/check/+1/fail/edit/delete) />
  </div>
  {/* Linha 2: tipo, categoria, badges de XP/moedas, status */}
  <div className="flex items-center gap-1.5 flex-wrap">
    tipo | categoria | badges XP/moedas | contagem | status
  </div>
</div>
```

Isso separa as informações secundárias (tipo, XP, moedas) numa segunda linha, evitando acúmulo horizontal no mobile — exatamente como está nos hábitos.

## Arquivos alterados
- `src/components/HabitsPanel.tsx` — fix heatmap direction
- `src/components/MissionsPanel.tsx` — reestruturar MissionCard em 2 linhas

