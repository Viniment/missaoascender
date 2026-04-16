
## Guia de Ritual — Plano de Implementação

Vou criar uma nova aba "Guia de Ritual" totalmente configurável, modular e integrada ao app.

### Arquitetura

**1. Tipos de dados (em `gameStore.ts`)**
Adicionar ao `PlayerState`:
```ts
rituals: Ritual[]
ritualBarriers: Barrier[]  // biblioteca reutilizável
ritualSessions: RitualSession[]  // histórico
```

Tipos:
```ts
type RitualStepType = 'preparacao' | 'visualizacao' | 'barreira' | 'confronto' | 'acao' | 'retorno' | 'loop' | 'encerramento';
type NarrationStyle = 'calmo' | 'motivador' | 'agressivo' | 'neutro';
type Intensity = 'leve' | 'medio' | 'intenso';
type DisplayMode = 'texto' | 'imagens' | 'animacoes';
type ActionType = 'quebrar' | 'atravessar' | 'destruir' | 'ignorar' | 'personalizado';
type BarrierType = 'parede' | 'criatura' | 'sombra' | 'personalizado';

interface RitualStep {
  id: string;
  type: RitualStepType;
  enabled: boolean;
  order: number;
  durationSec: number;
  intensity: Intensity;
  text: string;          // narração editável
  // step-specific:
  barrierId?: string;    // para tipo 'barreira'
  actionType?: ActionType;
  customAction?: string;
}

interface Barrier {
  id: string;
  name: string;
  type: BarrierType;
  customDescription?: string;
}

interface Ritual {
  id: string;
  name: string;
  objective: string;
  steps: RitualStep[];
  narrationStyle: NarrationStyle;
  useTTS: boolean;
  displayMode: DisplayMode;
  loopCount: number;
  loopIncreaseIntensity: boolean;
  loopGapSec: number;
  visionBoardImageIds?: string[];  // integra com VisualizarPanel
  createdAt: string;
}

interface RitualSession {
  id: string;
  ritualId: string;
  ritualName: string;
  completedAt: string;
  durationSec: number;
}
```

Helpers no store:
- `addRitual`, `updateRitual`, `removeRitual`, `duplicateRitual`
- `addBarrier`, `updateBarrier`, `removeBarrier`
- `logRitualSession` (também cria entrada no diário)

**2. Componente principal: `src/components/RitualGuidePanel.tsx`**

Três modos internos (state local):
- **`list`** — lista de rituais salvos + botão "Novo Ritual" + biblioteca de barreiras
- **`edit`** — editor completo do ritual
- **`run`** — execução guiada passo-a-passo

**Modo `list`**:
- Cards com nome, objetivo, nº de etapas ativas, duração total
- Ações: ▶ Iniciar, ✏ Editar, 📋 Duplicar, 🗑 Deletar
- Seção colapsável "Biblioteca de Barreiras" para gerenciar barreiras reutilizáveis

**Modo `edit`** — abas internas (Tabs):
- **Etapas**: lista drag-handle (botões ↑↓ para reordenar — mais simples que dnd-kit), toggle on/off, duração, intensidade, textarea de narração. Cada etapa tem campos extras conforme o tipo (ex: barreira → seletor de Barrier; ação → seletor de ActionType + customAction).
- **Narração**: estilo (4 opções), toggle TTS via edge function `affirmations` (já existe Lovable AI; criar nova edge function `ritual-tts` apenas se necessário — por ora reutilizar Web Speech API nativa do browser com `SpeechSynthesisUtterance` para evitar custos e simplificar).
- **Visualização**: radio (texto / imagens / animações). Se "imagens", multiseletor de imagens do VisualizarPanel.
- **Loop**: número de repetições, toggle aumento de intensidade, gap entre ciclos.
- **Geral**: nome, objetivo.

**Modo `run`**:
- Tela cheia (dentro do panel): mostra UMA etapa por vez
- Texto grande centralizado + timer circular (reuso visual do Pomodoro)
- Auto-avança quando timer zera; também botão "Próxima" e "Pausar"
- TTS opcional: `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))` com voz pt-BR e taxa/tom ajustados pelo `narrationStyle`:
  - calmo → rate 0.85, pitch 0.9
  - motivador → rate 1.05, pitch 1.1
  - agressivo → rate 1.15, pitch 0.85, volume 1
  - neutro → rate 1.0, pitch 1.0
- Background com gradiente que muda de cor conforme intensidade (leve→primary suave, médio→primary, intenso→destructive glow)
- Se displayMode='imagens', faz crossfade entre as imagens selecionadas
- Loop: ao terminar todas as etapas ativas, repete `loopCount` vezes; se `loopIncreaseIntensity`, sobe nível a cada ciclo (visual/áudio mais intenso)
- Ao concluir: salva `RitualSession`, opcionalmente cria entrada no diário com objetivo + duração, mostra tela de "Concluído" com XP/recompensa simbólica.

**3. Integrações**
- **Diário**: ao concluir, opção "Registrar no diário" — cria entrada com template "Ritual '[nome]' concluído. Objetivo: [objetivo]. Duração: Xmin."
- **Vision Board (VisualizarPanel)**: leitura de `state.visualizations` para popular seletor de imagens.
- **Progresso**: cada conclusão dá XP (ex: 30 XP base + 10 por etapa) via `addXP` existente.

**4. Registro da aba em `Index.tsx`**
Adicionar à lista `TABS`:
```ts
{ id: 'ritual', label: 'Ritual', icon: Sparkles /* ou Wand2 */ }
```
E case no `renderContent`. Posicionar entre "Urge Surfing" e "Visualizar".

**5. Arquivos a criar/editar**
- `src/lib/gameStore.ts` — adicionar tipos + estado default + helpers
- `src/lib/GameContext.tsx` — expor novos helpers
- `src/components/RitualGuidePanel.tsx` — novo (componente principal)
- `src/components/ritual/RitualEditor.tsx` — novo (editor)
- `src/components/ritual/RitualRunner.tsx` — novo (executor)
- `src/components/ritual/BarrierLibrary.tsx` — novo (gerenciador de barreiras)
- `src/pages/Index.tsx` — registrar aba

**6. Defaults sensatos**
Ao criar novo ritual, vem com 8 etapas pré-preenchidas (na ordem listada), todas ativas, 30s cada, intensidade média, textos sugeridos em pt-BR ex:
- Preparação: "Respire fundo. Sinta o peso do seu corpo. Você está aqui, agora."
- Visualização: "Veja claramente o que você deseja. Sinta-o como real."
- Barreira: "Algo se ergue entre você e seu desejo. Observe-o."
- Confronto: "Encare. Não recue. Reconheça seu poder."
- Ação: "Atravesse. Quebre. Destrua. O caminho é seu."
- Retorno: "O desejo está mais perto. Sinta a vitória."
- Loop: "Repita. Cada ciclo te fortalece."
- Encerramento: "Volte ao presente. Você é mais forte agora."

### Decisões técnicas
- **TTS**: Web Speech API nativa (sem custo, funciona offline, suporta pt-BR na maioria dos browsers). Sem edge function.
- **Reordenação**: botões ↑↓ (sem lib drag-and-drop, mais leve).
- **Timer**: setInterval com cleanup; reuso do padrão visual do PomodoroTimer.
- **Persistência**: tudo via gameStore → autosave Supabase já existente.
- **Anti-duplicação**: aplicar mesmo padrão `submittingRef` ao criar ritual/barreira (consistente com sessão anterior).

