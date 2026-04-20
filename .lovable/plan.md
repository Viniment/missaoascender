
## Sistema de IDENTIDADE — Recondicionamento (não motivação)

Sistema completo para substituição de identidade. A IA do app passa a operar com base na identidade escolhida, reforçando o "eu real" e expondo o "eu antigo" como padrão condicionado. Default desligado — não afeta o app atual até ser ativado.

---

### 0. Estado global (`gameStore.ts`)

Novo bloco `identity` no state:
```ts
identity: {
  enabled: boolean;              // toggle "ATIVAR SISTEMA DE IDENTIDADE"
  newIdentity: string;           // "Quem você está se tornando"
  codeOfConduct: string[];       // 3-5 regras inegociáveis
  dominantTraits: string[];      // disciplinado, consistente, direto...
  oldPatterns: string[];         // procrastinação, fuga, distração...
  oldExcuses: string[];          // desculpas comuns
  stabilityLevel: number;        // 0-100 — Nível de Identidade Estável
  alignedActions: number;
  patternRelapses: number;
  lastRitualAt?: string;
  failureReflections: Array<{ date; action; pattern; response }>;
}
```
Reducers: `UPDATE_IDENTITY`, `TOGGLE_IDENTITY_SYSTEM`, `LOG_ALIGNED_ACTION`, `LOG_PATTERN_RELAPSE`, `ADD_FAILURE_REFLECTION`, `MARK_RITUAL_DONE`.
Cálculo: `stabilityLevel = round(aligned / (aligned + relapses) * 100)`.

---

### 1. Nova aba `identity` em `src/lib/tabs.ts`

Adicionar no grupo "Reflexão": `{ id: 'identity', label: 'Identidade', icon: User, description: 'Recondicionamento de identidade' }`.

---

### 2. `src/components/IdentityPanel.tsx` — 3 modos

**SETUP** (form): nova identidade, código de conduta (3–5 itens editáveis), traços dominantes (chips), padrões antigos, desculpas comuns.

**PAINEL** (default):
- Card "EU REAL" — identidade + código numerado
- Card "EU ANTIGO (padrão condicionado)" — visual dessaturado, aviso: *"Isso não é quem você é. É o padrão que você repetiu."*
- Progress bar **"Nível de Identidade Estável"** + contadores
- Frase fixa: *"Identidade não é o que você sente. É o que você repete."*
- Botões: **ASSUMIR IDENTIDADE** (modo imersivo), **Ritual de Reidentificação**, **Editar**

**IMERSIVO** (Dialog fullscreen): fundo escuro, identidade + código grandes, *"Pare de agir como quem você foi. Aja como quem você decidiu ser."*

---

### 3. `IdentityRitualDialog.tsx`

Tela calma, fade sutil. Texto: *"Fique imóvel. Leia quem você é agora. Ignore quem você foi."* + identidade/código read-only + botão Continuar → `MARK_RITUAL_DONE`.

---

### 4. Configurações (`Settings.tsx`)

Nova seção "Sistema de Identidade":
- Switch **"Ativar Sistema de Identidade"** (toggle global da IA)
- Switch **"Mostrar guia Identidade no menu"** (mesmo padrão das outras abas via `disabledTabs`)

---

### 5. Integração com IA

Editar edge functions: `counsel`, `affirmations`, `stoic-insight`, `failure-confrontation`.

**Client:** quando `identity.enabled`, enviar `{ identity: { newIdentity, codeOfConduct, dominantTraits, oldPatterns, oldExcuses, stabilityLevel } }` no body.

**System prompt adicional (quando identity presente):**
> Você opera em modo RECONDICIONAMENTO DE IDENTIDADE. TOM: direto, sem suavização, sem motivação genérica. NÃO valide emoção como justificativa. Comportamento alinhado → "Isso é consistência. Isso é quem você está se tornando." Padrão antigo → corte justificativa: "Isso é o padrão antigo. Não confunda com quem você é." Sempre enfraqueça ligação com o "eu antigo" e fortaleça o "eu escolhido". Use o código de conduta como referência objetiva.

---

### 6. Intervenção antes da queda (`useIdentityIntervention.ts`)

Quando `identity.enabled`, observar: hábitos pulados consecutivos, missões atrasadas, dias sem hábito core. Disparar toast: *"Você está entrando no padrão antigo agora."*

---

### 7. Popup de Falha + Fix Mobile (`FailureConfrontDialog.tsx`)

**Modo identidade** (quando enabled):
- Mostra ação não feita + padrão identificado (do `oldPatterns`)
- Campo obrigatório: textarea **"Qual padrão apareceu?"** (submit bloqueado se vazio)
- Resposta IA fria: *"Você não decidiu falhar. Você deixou o padrão decidir."*
- Submit → `ADD_FAILURE_REFLECTION` + `LOG_PATTERN_RELAPSE`

**Fix responsivo mobile:**
- `w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto`
- Botões: `flex flex-col sm:flex-row gap-2`
- Textareas com `min-h-[100px]` (sem alturas fixas grandes)

---

### 8. Reforço em ações alinhadas

Em `markHabit('done')` e completar missão, se `identity.enabled`: dispatch `LOG_ALIGNED_ACTION` + toast ocasional *"Isso é consistência. Isso é quem você está se tornando."*

---

### Arquivos

**Criar:** `IdentityPanel.tsx`, `IdentityRitualDialog.tsx`, `IdentityImmersiveMode.tsx`, `useIdentityIntervention.ts`

**Editar:** `gameStore.ts`, `tabs.ts`, `Index.tsx`, `Settings.tsx`, `FailureConfrontDialog.tsx`, 4 edge functions

---

### Garantias

- Default `enabled = false` → app atual intocado
- Toggle em Settings desliga TODA lógica nova (IA neutra, popup normal, sem intervenções)
- Aba escondível como as outras
- Migration: usuários antigos ganham `identity` com defaults vazios
