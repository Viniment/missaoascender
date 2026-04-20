
## GERADOR DE EXERCÍCIOS PARA DESPERTAR — substituir "Sugerir perguntas (IA)"

Transforma o botão atual numa ferramenta adaptativa que analisa o estado do usuário e gera 3–5 exercícios de escrita terapêutica personalizados, com configurações de intensidade, foco, quantidade e modo. Experiência guiada um-exercício-por-vez.

---

### 1. Edge function — `supabase/functions/awakening-questions/index.ts`

**Novo body de input:**
```ts
{
  journal, awakening, rank, reflections,
  missions, habits, challenges, punishments, // contexto completo
  identity,
  config: {
    intensity: 'leve' | 'moderado' | 'intenso',
    focus: 'auto' | 'disciplina' | 'emocao' | 'identidade' | 'clareza' | 'autoconfianca',
    quantity: 'auto' | 3 | 5,
    mode: 'adaptativo' | 'manual',
    manualType?: 'consciencia' | 'confronto' | 'reprogramacao' | 'direcionamento' | 'quebra'
  }
}
```

**Novo system prompt (PT-BR)** instrui a IA a:
1. Analisar tudo (missões falhadas, procrastinação, emoções no diário, reflexões anteriores, desculpas, identidade vs comportamento)
2. Classificar **estado dominante** (medo de fracassar / procrastinação / falta de clareza / autossabotagem / inconsistência / baixa autoimagem / fuga / desmotivação)
3. Escolher **tipos de exercício** (consciência, confronto, reprogramação, direcionamento, quebra de padrão) respeitando `focus` e `mode`
4. Adaptar tom à `intensity`
5. Não repetir exercícios já presentes no histórico
6. Cada exercício: `title`, `prompt` (instrução de escrita), `type`, `objective` (propósito psicológico)

**Tool call estruturado:**
```ts
generate_exercises({
  detectedState: string,
  exercises: [{ title, prompt, type, objective }] // 3 a 5
})
```

Retorna `{ detectedState, exercises }`. Mantém handlers 429/402.

---

### 2. Frontend — `src/components/AwakeningPage.tsx`

a) **Botão renomeado**: "GERADOR DE EXERCÍCIOS PARA DESPERTAR" (Sparkles + Brain)
b) **Engrenagem ao lado** abre `AwakeningConfigSheet` (config persistida)
c) Ao clicar no botão principal: chama edge function com config atual + contexto completo, abre `AwakeningExerciseDialog`
d) Loading: "Analisando seu estado atual..." com spinner
e) Erros: toast claro (rate limit / créditos)

---

### 3. Novo componente `src/components/AwakeningExerciseDialog.tsx`

Modal guiado:
- Header: "Estado detectado: {detectedState}" + progresso "Exercício 2/4"
- Card do exercício: badge do tipo, title, objetivo (muted/itálico), prompt em destaque
- `Textarea` grande para resposta
- Botões: [← Anterior] [Próximo →] / no último [Concluir Despertar]
- Ao concluir: monta HTML formatado com todas perguntas+respostas e chama `addReflection({ question: 'Despertar guiado — {detectedState}', answerHtml, date })`
- Toast: "Despertar concluído. +15 XP"
- X fecha sem salvar (confirma se há respostas)

---

### 4. Novo componente `src/components/AwakeningConfigSheet.tsx`

Sheet com:
- **Intensidade** (RadioGroup: Leve / Moderado / Intenso)
- **Foco** (Select: Auto / Disciplina / Emoção / Identidade / Clareza / Autoconfiança)
- **Quantidade** (RadioGroup: Auto / 3 / 5)
- **Modo** (RadioGroup: Adaptativo / Manual → mostra Select de tipo)

---

### 5. Estado global — `src/lib/gameStore.ts` + `GameContext.tsx`

Adicionar à `PlayerState`:
```ts
awakeningConfig: {
  intensity: 'moderado',
  focus: 'auto',
  quantity: 'auto',
  mode: 'adaptativo',
  manualType?: string
}
```
Expor `setAwakeningConfig(partial)` no contexto.

---

### Arquivos

**Editar:** `supabase/functions/awakening-questions/index.ts`, `src/components/AwakeningPage.tsx`, `src/lib/gameStore.ts`, `src/lib/GameContext.tsx`

**Criar:** `src/components/AwakeningExerciseDialog.tsx`, `src/components/AwakeningConfigSheet.tsx`

---

### Garantias

- Histórico antigo de reflexões continua funcionando
- Usuário pode cancelar (X fecha modal)
- Estética intensa mantida (neon roxo, glow, fontes display)
- Responsivo: mobile usa quase tela cheia, desktop max-w-lg
