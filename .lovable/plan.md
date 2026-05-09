## Despertar — Reescrita total para impacto emocional visceral

Substitui o framework TCC/Socrático (7 blocos diagnósticos) por uma experiência cinematográfica, confrontadora e ativadora de ação imediata, com seletores visíveis antes de gerar.

---

### 1. UI — `src/components/AwakeningPage.tsx`

**Novos seletores acima do botão "Gerador":**
- **Tema** (chips): Procrastinação · Disciplina · Academia/Corpo · Dopamina barata · Pornografia · Redes sociais · Vícios · Dinheiro · Produtividade · Foco · Ansiedade · Medo · Autossabotagem · Autoestima · Identidade · Relacionamentos · Futuro · Consistência · Emagrecimento · *Auto (IA decide pelos dados)*
- **Intensidade** (3 botões): 🌱 Leve · ⚡ Médio · 🔥 Brutal
- **Área da vida** (chips opcionais): Corpo · Mente · Carreira · Relacionamentos · Espiritual · Financeiro · *(nenhuma)*
- **Objetivo emocional** (chips opcionais): Urgência · Coragem · Orgulho · Foco · Raiva produtiva · Clareza · *(IA decide)*

Estado local: `theme`, `intensity`, `lifeArea`, `emotionalGoal`. Tudo enviado no body. Defaults: `theme='auto'`, `intensity='medio'`.

**Nova estrutura de renderização** (`buildExercisesHtml`) — substitui os 7 blocos por experiência cinematográfica:
1. 🎬 **Abertura cinematográfica** (`opening`) — 2-4 frases viscerais que prendem a atenção
2. 💀 **Dor da inação** (`painOfInaction`) — espelho cru do que está sendo destruído silenciosamente
3. 🔥 **Confronto direto** (`confrontation`) — destrói desculpas, expõe autossabotagem
4. ✨ **Prazer da ação / Identidade forte** (`pleasureOfAction`) — contraste, quem o usuário se torna se agir
5. ✍️ **Perguntas de impacto** (`questions[]`, 3–5) — profundas, específicas, do tipo dos exemplos do prompt ("Quantas vezes você prometeu mudar...?")
6. ⚡ **Ativação imediata** (`microAction`) — uma ação concreta para fazer AGORA (≤10 min)
7. 🧬 **Âncora de identidade** (`identityAnchor`) — frase curta e poderosa de quem ele é

Remove os blocos antigos: `situationReading`, `patternsAndDistortions`, `repositioning`. Mantém renderização Notion-style com campo de resposta abaixo de cada pergunta.

**Toasts por intensidade:** Brutal → "🔥 Sem anestesia." · Médio → "⚡ Encare." · Leve → "🌱 Respira e olha."

---

### 2. Edge function — `supabase/functions/awakening-questions/index.ts`

**Reescrita total do `SYSTEM_PROMPT`:**
- Remove TCC, questionamento socrático, metamodelo da linguagem, distorções cognitivas, escrita terapêutica.
- Substitui pelo manifesto do prompt do usuário: voz visceral, cinematográfica, confrontadora, humana. Proibido: clichês motivacionais, validação de vitimismo, tom de coach, soar como chatbot.
- Filosofia central: dor da inação ↔ prazer da ação. Autorresponsabilidade. Identidade forte. Urgência. Ativação emocional.
- Regras duras: nunca genérico, nunca superficial, nunca aliviar excessivamente, sempre gerar impacto + desejo de agir.

**Calibração por intensidade:**
- `leve` → reflexivo, consciente, ainda firme mas sem cortar
- `medio` → emocional, confrontador, gera desconforto produtivo
- `brutal` → visceral, sem anestesia, expõe autotraição cruamente, cinematográfico

**Calibração por tema:** o tema escolhido vira o foco do despertar (ex: `pornografia` → ativa vergonha produtiva e identidade forte; `procrastinacao` → tempo perdido e custo composto; `academia` → corpo como espelho da mente). Se `theme='auto'`, IA escolhe com base nos dados recentes.

**Mantém da versão atual:**
- Leitura de `context` rico (janela 7d, tendência, daysSinceLastFail, recurringFailedItems, emotionalDrift, recentJournalSummary)
- Rotação de ângulos via `angleHistory` (anti-repetição)
- Reconhecimento de evolução: se `consistencyTrend='melhorando'` e `failureCount7d=0`, IA não usa narrativa de autoabandono — vira ativação de potencial/expansão (mantém regra)
- Compatibilidade com payload antigo (fallback)

**Nova tool call `generate_awakening`:**
```ts
{
  detectedState: string,         // "Em fuga", "Recaída pós-evolução", "Pronto para próximo nível"
  theme: string,                 // tema final usado
  intensity: 'leve'|'medio'|'brutal',
  angle: string,                 // 1 dos 14 ângulos (rotação)
  opening: string,               // 2-4 frases cinematográficas
  painOfInaction: string,        // espelho cru
  confrontation: string,         // destrói desculpas
  pleasureOfAction: string,      // contraste/identidade
  questions: [                   // 3-5 perguntas de impacto
    { title: string, prompt: string, objective: string }
  ],
  microAction: string,           // ação concreta ≤10 min
  identityAnchor: string         // frase âncora
}
```

Remove campos antigos da tool: `patternsAndDistortions`, `repositioning`, `situationReading`, `exercises[].type`.

---

### 3. Não muda
- `src/lib/aiContext.ts` — já entrega tudo necessário (recentJournalSummary, behavioralEvolution, derived).
- `src/lib/gameStore.ts` — `aiAngleHistory` continua igual.
- Memory de design e timezone — sem impacto.

---

### Arquivos
- **Editar:** `src/components/AwakeningPage.tsx`, `supabase/functions/awakening-questions/index.ts`
- **Não tocar:** `aiContext.ts`, `gameStore.ts`, demais painéis

### Resultado esperado
- Antes de gerar, usuário escolhe **tema + intensidade** (e opcionalmente área/emoção). Se quiser, deixa em "Auto" e a IA decide.
- A resposta vem em formato cinematográfico: abre forte, mostra a dor real, confronta, contrasta com o prazer da ação, faz perguntas que cortam, entrega ação imediata e fecha com âncora de identidade.
- No modo Brutal, a IA não suaviza. No Leve, mantém firmeza sem cortar. Nunca soa coach genérico.
- Dados recentes (7d, diário, hábitos quebrados) continuam sendo a matéria-prima — a IA cita evidência concreta da semana, não filosofia abstrata.
