## Nova aba "Conselho" — Coach IA personalizado

Aba dedicada onde o usuário descreve sobre o que quer conselho, e a IA responde como **coach/terapeuta realista** usando TODO o contexto do jogador (despertar, hábitos, missões, diário, monstro, progressão).

## UX

1. Nova aba `Conselho` (ícone `Compass`) no menu principal de `Index.tsx`.
2. Painel `CounselPanel.tsx`:
  - Textarea grande: *"Sobre o que você precisa de conselho hoje?"* (ex: "tô travado pra começar a estudar", "briguei com minha mãe", "tô pensando em desistir do projeto X").
  - (Opcional) Select de **tom**: `Direto e duro` | `Analítico` | `Compassivo mas firme` (default: direto).
  - (Opcional) Toggle: *"Incluir meu diário recente nas últimas 2 semanas"* (default: ON).
  - Botão `Pedir conselho` → loading → resposta renderizada em markdown.
  - Histórico dos últimos 10 conselhos salvos em `state.counselHistory[]` (data, pergunta, resposta, tom) — colapsáveis abaixo.

## Backend — edge function `counsel`

Recebe: `{ question, tone, context }` onde `context` é um snapshot enxuto do `PlayerState` montado no client (pra não vazar tudo desnecessariamente):

```
{
  awakening: { become, reject, dailyTheme },
  level, rank, xp, streak,
  monsterHp, monsterStage,
  habits: [{ name, streak, completionRate30d, recentFails }],
  missions: [{ title, status, daysOpen, category }],
  recentJournal: [{ date, mood, snippet }],   // últimas 10 entradas, truncadas
  recentCounsels: [{ question, snippet }],     // pra continuidade
  metrics: { completionRate30d, consistencyScore, recurringFailures }
}
```

Modelo: `google/gemini-2.5-pro` (precisa raciocínio profundo + contexto grande). Sem streaming nesta v1 (resposta única, mais simples). Trata 429/402 com toast.

## System prompt (núcleo)

```
Você é um conselheiro pessoal — mistura coach executivo, terapeuta cognitivo-comportamental e mentor estoico. PT-BR.

REGRAS:
- Você NÃO é amigo. Você é honesto. Não suaviza para agradar.
- Use os DADOS REAIS do usuário fornecidos. Cite padrões específicos ("você falhou X 4 vezes nas últimas 2 semanas", "seu HP do monstro está em 78 — você está perdendo a guerra interna").
- Estrutura da resposta:
  1. **Diagnóstico** (2-3 frases): o que você vê REALMENTE acontecendo, não o que ele disse.
  2. **Por que pensou isso**: cite os dados concretos que sustentam o diagnóstico.
  3. **Conselho** (3-5 frases): direção clara e realista.
  4. **Ação imediata** (1 item): algo que pode fazer nas próximas 24h.
- Sem clichês ("acredite em si"). Sem listas de auto-ajuda genérica.
- Se ele estiver se vitimizando ou mentindo pra si mesmo, aponte. Com firmeza, sem crueldade.
- Se os dados mostrarem que ele tá indo bem e só duvidando, valide com EVIDÊNCIA.
- Tom ajustado pelo parâmetro `tone` recebido.
- Markdown permitido (negrito, headings nível 3 max).
```

## Persistência

- Conselhos salvos em `state.counselHistory` (localStorage + Supabase via `usePlayerData` que já sincroniza tudo de `game_state`). Sem nova tabela.
- Limite: 50 itens (FIFO).

## Arquivos

**Novos:**

- `supabase/functions/counsel/index.ts` — edge function (similar a `stoic-insight`, sem stream).
- `src/components/CounselPanel.tsx` — UI.

**Editados:**

- `src/lib/gameStore.ts` — adicionar tipo `CounselEntry` + campo `counselHistory: CounselEntry[]` no `PlayerState` e `defaultState`. Adicionar action `addCounsel(entry)`.
- `src/pages/Index.tsx` — nova aba `Conselho`.
- `supabase/config.toml` — registrar função `counsel` com `verify_jwt = false`.

## Pergunta rápida

Quer **histórico do conselho persistido** (cada conselho fica salvo e pode ser revisitado) ou **conselhos efêmeros** (só o último, mais leve)?

- **(A)** Histórico (até 50, recomendado — útil pra ver evolução)