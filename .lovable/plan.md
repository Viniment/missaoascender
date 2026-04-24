## Despertar adaptativo de verdade — peso nos dados recentes + rotação de ângulo

### Diagnóstico
A edge `awakening-questions` hoje:
1. **Ignora o `context` rico** que o cliente já envia (`consistencyTrend`, `daysSinceLastFail`, `relapseAfterEvolution`, `recurringFailedItems`, `contradictionSignals`, `emotionalDrift`, `angleHistory`).
2. Conta hábitos no **histórico inteiro** (sem janela temporal) — então 1 hábito quebrado há 2 meses ainda dispara MODO ESPELHO.
3. Pega só os últimos 3 do diário e não diferencia recente vs antigo.
4. **Trava num único ângulo** (autotraição) — o system prompt inteiro é monotemático, sem rotação nem reconhecimento de evolução.
5. Não atualiza `aiAngleHistory` no cliente após o Despertar.

Resultado: mesmo usuário que evoluiu apanha do mesmo ângulo "autoabandono" toda vez.

---

### 1. Edge `supabase/functions/awakening-questions/index.ts` — reescrita do payload + prompt

**Aceitar e priorizar `context`:**
- Ler `context` do body (o `AiContext` montado em `src/lib/aiContext.ts`).
- Manter compatibilidade com campos antigos como fallback se `context` faltar.
- Usar `context.derived` como fonte primária de decisão (não recontar do zero).

**Janelas temporais explícitas no `userPrompt`:**
```
═══ JANELA RECENTE (últimos 7 dias) — PESO MÁXIMO ═══
Falhas 7d: {failureCount7d} | Taxa: {failureRate7d*100}%
Tendência: {consistencyTrend}  ← melhorando|estável|piorando
Dias sem falhar: {daysSinceLastFail}
Maior streak recente: {longestStreak} dias
Recaída pós-evolução: {relapseAfterEvolution ? 'SIM' : 'não'}
Drift emocional: {emotionalDrift}

═══ JANELA MÉDIA (8–30 dias) — peso médio ═══
Falhas 30d: {failureCount30d}
Itens recorrentes: {recurringFailedItems}
Contradições detectadas: {contradictionSignals}

═══ DIÁRIO — ordem cronológica reversa, foco nos 3 mais recentes ═══
[hoje] título · emoção · trecho 600c
[ontem] ...
[mais antigos resumidos em 1 linha]
```

**Lógica de modo (não mais "tem qualquer falha → MODO ESPELHO"):**
- `evolutionMode` se `consistencyTrend === 'melhorando'` **ou** `daysSinceLastFail >= 5` **e** sem `relapseAfterEvolution`.
- `mirrorMode` SÓ se `failureCount7d >= 1` **ou** `expiredPunishmentsCount > 0` **ou** `relapseAfterEvolution`.
- `expansionMode` se `failureCount30d === 0` **e** `longestStreak >= 14`.
- Se `evolutionMode` e nada novo de queda → reconhecer progresso, foco em **identidade/expansão**, NÃO em autotraição.

**Recurrence level recalibrado** com base em `failureCount7d` (não no total acumulado):
- 0 falhas 7d + tendência boa → nível 1 (consciência leve, reforço)
- 1–2 falhas 7d → 2–3
- 3+ ou recaída pós-evolução → 4–5

**Rotação de ângulo (ANTI-REPETIÇÃO):**
- Pool de 14 ângulos: `autotraicao, identidade, consequencia_futura, orgulho_honra, disciplina_vs_desejo, carater, vergonha_vs_orgulho, potencial_nao_usado, tempo_desperdicado, distancia_do_ideal, regra_10_90, autorresponsabilidade, comum_vs_normal, momentos_vs_existencia`.
- Receber `context.angleHistory` (últimos 10 usados).
- **Filtrar fora** os 5 últimos usados → escolher 1 ângulo dominante novo, alinhado ao modo:
  - mirror → `autotraicao | autorresponsabilidade | momentos_vs_existencia`
  - evolution → `identidade | orgulho_honra | carater | potencial_nao_usado`
  - expansion → `distancia_do_ideal | potencial_nao_usado | comum_vs_normal`
  - default → qualquer não-usado
- Tool call retorna `angle: string` junto de `detectedState` e `exercises`.

**System prompt reescrito (não mais monotemático):**
- Bloco "MODO" dinâmico: a IA recebe o modo escolhido e o ângulo dominante e calibra o tom.
- Modo evolução: reconhece o esforço explicitamente, cita evidência ("você cumpriu X dias seguidos"), e empurra para o próximo nível — sem cair em "você está se traindo" se não houve queda.
- Modo expansão: foco em potencial, não em culpa.
- Modo espelho: mantém confronto, mas ancorado em evidência **da semana**, não eterna.
- Princípios CIS implícitos (10/90, autorresponsabilidade, comum vs normal, momentos vs existência, crenças limitantes) — usados naturalmente conforme o ângulo, **sem citar nomes**.
- Regra dura: "Se `consistencyTrend === melhorando` e `failureCount7d === 0`, é PROIBIDO usar tom de autoabandono. Reconheça e expanda."

**Tool call atualizada:**
```ts
parameters: {
  detectedState: string,        // agora reflete o estado real (ex: "Em evolução constante", "Recaída após 7 dias limpos")
  angle: string,                // 1 dos 14 ângulos
  mode: 'mirror'|'evolution'|'expansion'|'default',
  exercises: [...]              // 3-5
}
```

### 2. Cliente `src/components/AwakeningPage.tsx`
- Continuar enviando `context: ctx` (já faz).
- Após resposta, chamar `appendAiAngle(data.angle)` (já existe no GameContext) — hoje só é chamado se `data.angle` vier, e a edge nunca retorna. Vai passar a funcionar.
- Pequeno ajuste de UX: se `mode === 'evolution'`, mostrar toast "✨ Reconhecendo sua evolução" em vez do genérico.

### 3. `src/lib/aiContext.ts` — pequeno reforço
- Já calcula tudo necessário. Adicionar 2 sinais derivados:
  - `recentJournalSummary`: 1 linha resumindo emoção dominante das últimas 3 entradas + mudança vs entradas 4–6 (detecta evolução no diário mesmo sem o usuário escrever "estou melhor").
  - `behavioralEvolution`: `'progredindo' | 'estavel' | 'regredindo'` — combina `consistencyTrend` + `recentJournalSummary`.
- Esses dois entram no payload e são lidos pela edge no bloco "JANELA RECENTE".

### 4. `src/lib/gameStore.ts` — nada estrutural
- `aiAngleHistory` já existe e `appendAiAngle` já trunca em 20. OK.

---

### Arquivos
- **Editar:** `supabase/functions/awakening-questions/index.ts`, `src/lib/aiContext.ts`, `src/components/AwakeningPage.tsx`
- **Não tocar:** gameStore (já tem o necessário), Settings, Counsel, FailureConfront

### Resultado esperado
- Despertar lê primeiro o que aconteceu **esta semana** e o que mudou **no diário recente**.
- Se o usuário evoluiu (consistência subindo, dias sem falhar, diário mais leve) → IA reconhece e muda de ângulo para identidade/expansão. Não força narrativa de autotraição.
- Se o usuário recaiu depois de evoluir → IA explora justamente essa quebra de expectativa (ângulo específico, mais cortante).
- A cada Despertar, o ângulo dominante muda (rotação de 14 opções, evita os 5 últimos) — fim do loop "autotraição infinita".
- Diário antigo entra como contexto resumido, não compete com o que o usuário escreveu hoje.