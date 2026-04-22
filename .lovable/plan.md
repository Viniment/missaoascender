

## Remoção definitiva de painéis + IA Comportamental global

### 1. Remover de vez: Afirmações, Estoicismo, Identidade, Desafios, Urge Surfing

Não vão mais ser ocultadas por flag — vão ser **removidas do código**.

**`src/lib/tabs.ts`** — remover dos `TAB_GROUPS` os tabs: `challenges`, `stoic`, `affirmations`, `identity`, `urge-surfing`. Atualizar o tipo `TabId`.

**`src/pages/Index.tsx`** — remover imports e `case`s no `renderContent` para: `ChallengesPanel`, `StoicPanel`, `AffirmationsPanel`, `IdentityPanel`, `UrgeSurfingPanel`.

**`src/pages/Settings.tsx`** — remover a seção `identity` da lista `sections` e seu `case` no `renderContent`. Também remove o ícone `Fingerprint` do import.

**Arquivos a deletar** (não usados em nenhum outro lugar):
- `src/components/AffirmationsPanel.tsx`
- `src/components/StoicPanel.tsx`
- `src/components/IdentityPanel.tsx`
- `src/components/IdentityRitualDialog.tsx`
- `src/components/ChallengesPanel.tsx`
- `src/components/UrgeSurfingPanel.tsx`
- `supabase/functions/affirmations/`
- `supabase/functions/stoic-questions/`
- `supabase/functions/stoic-insight/`

**`src/lib/gameStore.ts`** — limpar `disabledTabs` default (não precisa mais ocultar). Manter `identity`, `stoicEntries`, `challenges` no `PlayerState` para não quebrar o save de usuários antigos (apenas ficam órfãos, sem UI).

### 2. IA Comportamental global — intensidade + frequência afetam TODA IA

Hoje `aiSettings` está em `gameStore` mas **nenhuma edge function lê**. Vou propagar.

**Em todos os componentes que invocam edge functions de IA**, passar `aiSettings` no body:
- `AwakeningPage.tsx` → `awakening-questions`
- `CounselPanel.tsx` → `counsel`
- `FailureConfrontDialog.tsx` → `failure-confrontation`

**Edge functions a atualizar** (`awakening-questions`, `counsel`, `failure-confrontation`):

Aceitar `aiSettings: { intensity, interventionFrequency }` no body e injetar no system prompt um bloco de calibração:

```
INTENSIDADE DO USUÁRIO: {intensity}
- leve     → tom firme mas contido, sem agressividade, foco em clareza
- moderado → direto, confronta padrões, sem amaciar (padrão)
- agressivo → brutal, cada frase corta, zero conforto, expõe a autotraição

FREQUÊNCIA: {interventionFrequency}
- baixa → 2 perguntas/insights, só o essencial
- media → 3-4 perguntas/insights (padrão)
- alta  → 5 perguntas/insights, máximo confronto
```

Para `awakening-questions`: `interventionFrequency` substitui o `quantity` quando estiver em `auto`.
Para `counsel`/`failure-confrontation`: `intensity` substitui/calibra o tom já existente.

### 3. Frequência também controla *quando* a IA aparece

**`FailureProtocolAlert.tsx` / `FailureConfrontDialog.tsx`** — ler `state.aiSettings.interventionFrequency`:
- `baixa` → confrontar só após 2+ falhas no mesmo item ou protocolo expirado
- `media` → toda falha relevante (atual)
- `alta` → toda e qualquer falha, inclusive saídas de pomodoro abortadas

(Implementação: gate simples no `useEffect` que dispara o confronto.)

### 4. Settings — IA Comportamental fica como única seção de IA

Remove a seção "Identidade" do `sections`. A seção "IA Comportamental" continua com **Intensidade** + **Frequência** + toggle do **Monstro**, e ganha um texto explicativo:

> "Estas configurações afetam todas as IAs do app: Despertar, Conselho, Confronto de Falhas e o Monstro da Procrastinação."

### Arquivos
- **Editar:** `src/lib/tabs.ts`, `src/pages/Index.tsx`, `src/pages/Settings.tsx`, `src/lib/gameStore.ts`, `src/components/AwakeningPage.tsx`, `src/components/CounselPanel.tsx`, `src/components/FailureConfrontDialog.tsx`, `src/components/FailureProtocolAlert.tsx`, `supabase/functions/awakening-questions/index.ts`, `supabase/functions/counsel/index.ts`, `supabase/functions/failure-confrontation/index.ts`
- **Deletar:** 6 componentes + 3 edge functions listadas acima

### Resultado
- Sidebar/menu/Settings limpos: sem Afirmações, Estoicismo, Identidade, Desafios, Urge Surfing (não dá mais nem para reativar — sumiram do código).
- Configuração de **IA Comportamental** agora é o cérebro central: intensidade muda o tom de toda IA, frequência muda quantas perguntas/insights e quando elas disparam.

