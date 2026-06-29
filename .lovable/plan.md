## O que vai mudar

### 1. Tarefas do Boss — vídeo + descrição (igual Mini Vitórias)

Cada tarefa do boss vai poder ter, opcionalmente:

- **Vídeo** (URL YouTube/Vimeo) — abre no `VideoDialog` existente.
- **Descrição rich-text** — usa o `RichEditor` já usado nas Mini Vitórias (emoji, alinhamento, listas, etc.) e abre no `DescriptionDialog`.

Na linha da tarefa aparece um botão "+" discreto que **expande** um pequeno painel embaixo com os campos. Se a tarefa já tem vídeo/descrição, ícones 🎥 e 📝 aparecem do lado para abrir os dialogs.

### 2. Tarefas do Boss — tipos selecionáveis

Hoje toda tarefa é "checar uma vez por dia". Vou adicionar um seletor de **tipo** ao criar/editar uma tarefa:

- **Simples** (atual) — botão único "Concluir hoje". Sem checkbox visual de antes — só botão. Concluiu → 1 hit no boss.
- **Contagem** — "X vezes por dia" (ex.: 3×). Cada toque no botão = +1. Ao chegar em X, conta como dia 100% concluído da tarefa. Cada toque já dá uma parte do dano/recompensa (dano e XP/ouro divididos por X), o último toque solta o bônus de "tarefa completa".
- **Temporal** — "A cada X tempo" (ex.: a cada 1h). Mostra botões **Iniciar / Parar** ao lado, igual à mini-vitória de tempo:
  - Ao iniciar, abre dialog para escolher **dia + hora de início** (default = agora).
  - Ao parar, abre dialog para escolher **dia + hora de fim**.
  - Calcula `ciclos = floor(horas / X)`. Cada ciclo dá `dano × 1` no boss e `2× XP/ouro` da régua normal da dificuldade (conforme exemplo do usuário: "a cada 1h ganho vitória, 2h passadas = 2 hits, 2× recompensa").
  - Sessões temporais ficam registradas no histórico da tarefa (`sessions: { startedAt, endedAt, cycles }[]`), persistido em `player_data` no banco.

Em todos os tipos, a conclusão **não usa checkbox** — apenas botão de ação (Concluir / +1 / Iniciar+Parar), como pedido.

### 3. Renomear "Missão" → "Mini Vitória" na UI

Trocar textos do `MissionsPanel` (título "MISSÕES" → "MINI VITÓRIAS", botões "Adicionar Missão" → "Adicionar Mini Vitória", "Iniciar Missão", toasts "Missão adicionada/editada!", "MISSÃO CONCLUÍDA", "DIÁRIA CONCLUÍDA", "Nome da missão", "Descreva a missão...", "Missão repetível…"). Tipos internos (`Mission`, `missionType`, etc.) **continuam iguais** — só texto visível muda.

### 4. Boss menos punitivo (núcleo do pedido)

Hoje o boss só morre se o usuário fizer 100% todo dia, porque dias parciais regeneram muito HP e zeram o combo. Mudanças em `settleBossesForToday` e `regenFromPct`:

- **Progresso conta sempre**: se o usuário fez ≥ 1 tarefa no dia, **não** há regen do boss naquele dia. Só dias 100% vazios (0 tarefas, 0 ciclos temporais, 0 contagens) geram regen.
- **Regen reduzido e com teto**: regen por dia vazio cai de "proporcional ao % faltante" para um valor pequeno fixo (ex.: 5% do `maxHp`, máx. 3 HP). Nunca pode regenerar mais do que o boss perdeu no último ciclo de 7 dias (teto anti-frustração: o jogador não perde tudo de uma vez).
- **Combo decai, não zera**: dia parcial (>0 e <100%) → combo `-1` (mínimo 0). Dia vazio → combo `÷ 2` (não 0). Dia 100% → combo `+1`. Assim perder um dia não apaga uma semana boa.
- **Janela de graça**: o primeiro dia vazio após um streak ≥ 3 não causa regen nenhum ("dia de descanso").
- **Mensagem do inimigo (`mockery`)** só dispara em dias realmente vazios e não em dias parciais.

Resultado: o boss continua morrendo via dano acumulado das tarefas. Perder um dia atrasa, mas não desfaz o progresso.

### 5. Persistência

Todos os novos campos (tipo de tarefa, contagem atual, vídeo, descrição, histórico de sessões temporais) ficam dentro de `state.bosses[].tasks[]`, que já é serializado em `player_data.game_state` no Lovable Cloud — **zero localStorage**.

---

## Detalhes técnicos

### `src/lib/gameStore.ts`

Estender `BossTask`:

```ts
export type BossTaskType = 'simple' | 'count' | 'temporal';
export interface BossTaskSession { startedAt: string; endedAt: string; cycles: number; }
export interface BossTask {
  id: string;
  title: string;
  doneDates: string[];
  type?: BossTaskType;              // default 'simple'
  videoUrl?: string;
  description?: string;             // HTML do RichEditor
  // count
  targetCount?: number;             // X vezes/dia
  countByDate?: Record<string, number>;
  // temporal
  intervalHours?: number;           // X horas por ciclo
  activeStartedAt?: string | null;  // ISO quando iniciou
  sessionsByDate?: Record<string, BossTaskSession[]>;
}
```

Novas ações no hook:

- `incrementBossTaskCount(bossId, taskId)` — +1 na contagem do dia; se atingir `targetCount`, marca `doneDates` e roda a recompensa via `computeBossTaskReward(..., allDoneAfter)`. Toques intermediários dão `dmg=1, xp/gold = base/target` (arredondado).
- `startBossTaskTimer(bossId, taskId, isoStart)` — seta `activeStartedAt`.
- `stopBossTaskTimer(bossId, taskId, isoEnd)` — calcula `cycles = floor((end-start)/intervalHours)`, aplica `cycles × dano` ao boss e `cycles × 2 × (xp/gold da dificuldade)` ao jogador, salva sessão.
- `updateBossTask(bossId, taskId, patch)` — para editar título, vídeo, descrição, tipo e parâmetros.

Rebalancear `settleBossesForToday`:

```ts
const doneCount = b.tasks.reduce((s,t) => s
  + (t.doneDates.includes(d) ? 1 : 0)
  + Object.keys(t.sessionsByDate?.[d] || {}).length
  + ((t.countByDate?.[d] || 0) > 0 ? 1 : 0), 0);
if (doneCount === 0) {
  if (graceAvailable) { graceUsed = true; /* sem regen */ }
  else {
    const gain = Math.min(3, Math.floor(b.maxHp * 0.05));
    hp = Math.min(b.maxHp, hp + gain);
    combo = Math.floor(combo / 2);
    regained += gain;
  }
} else if (allDone) {
  combo += 1;
} else {
  combo = Math.max(0, combo - 1);
}
```

### `src/components/BossPanel.tsx` / `BossCard`

- Adicionar UI dos botões por tipo na linha de tarefa (`Play/Square` para temporal, `+N/X` para contagem, "Concluir" para simples).
- Botão "+" ao lado de cada tarefa que expande um sub-painel inline com: vídeo (Input), descrição (RichEditor), tipo (Select), parâmetros do tipo.
- Reusar `VideoDialog` e `DescriptionDialog` de `ContentViewerDialog` para abrir o conteúdo na lista.
- Reusar o fluxo de dialogs de Iniciar/Parar de `MissionsPanel` (data + hora editáveis).

### `src/components/MissionsPanel.tsx`

- Apenas substituir strings PT visíveis ao usuário ("Missão" → "Mini Vitória", "MISSÕES" → "MINI VITÓRIAS"). Sem mudança de tipos/comportamento.  
  
Se o Alter Ego For Preenchido, Pare de Aparecer a "Forja de Identidade"  
Altere as Conquistas... todas.. dando a ideia de liferpg.. RPG DA VIDA REAL... Tornando o App Imersivo.. e Totalmente Gamificado.. Gamificando a Vida Do Usuario.. Motivando..

---

## Fora do escopo

- Não muda esquema do banco (tudo cabe em `game_state` jsonb).
- Não mexe nas Mini Vitórias em si — elas já têm vídeo, descrição e rich-text.
- Não muda visual de outros painéis.