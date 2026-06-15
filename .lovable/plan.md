# EVOLUX — Plano de Transformação Faseada

Mantém o nome **Ascensão** e toda a engine RPG atual (XP, ouro, ranks, hábitos, missões, conquistas). EVOLUX é a nova **camada de identidade** sobreposta, focada em amor-próprio, batalha mental e transformação comportamental.

Cada fase é aprovada individualmente antes da próxima.

---

## Fase 1 — Identidade (Alter Ego + Inimigo Interno)

**Objetivo:** dar ao usuário uma identidade dupla persistente.

- Onboarding novo (`/onboarding/identidade`) em 2 etapas:
  - **Alter Ego**: nome, idade ideal, valores (chips), missão de vida, frase-identidade ("Sou alguém que…"), estilo de vida, rotina ideal.
  - **Inimigo Interno**: nome, 3 características, 3 frases típicas de sabotagem (com sugestões).
- Persistência: novas colunas em `player_data.game_state` (`alterEgo`, `innerEnemy`) — sem migração de tabela, usa o jsonb existente.
- Editor depois em `Settings`.
- `PlayerCard` mostra o nome do Alter Ego e a frase-identidade.
- Pular = preencher com defaults ("Evolux" / "EndMan").

**Sem IA nessa fase**, só formulário + estado.

---

## Fase 2 — IA de Batalha (Detector + Botão de Emergência)

**Objetivo:** trazer a batalha mental pra dentro de qualquer texto.

- Edge function `sabotage-detector`:
  - Input: pensamento do usuário + contexto (Alter Ego, Inimigo, objetivos).
  - Output JSON: `{ emocao, padrao, origem: "alterEgo"|"inimigo", confianca, respostaAlterEgo }`.
  - Modelo: `google/gemini-3-flash-preview` via Lovable AI.
- Componente `<ThoughtAnalyzer />` plugado no Diário e numa nova entrada rápida no Dashboard.
- Edge function `emergency-intervention`:
  - Botão flutuante "Estou prestes a desistir".
  - Fluxo guiado em 5 passos (emoção → desculpa → consequência → objetivo → ação de 2 minutos).
- Reaproveita o tom "Pai Interior" já estabelecido na voz.

---

## Fase 3 — Diário de Batalha + Amor-Próprio

**Objetivo:** substituir o diário comum por estrutura narrativa.

- Refatorar `JournalPanel`:
  - Novo modo "Batalha": campos **Ataque do Inimigo**, **Resposta do Alter Ego**, **Lição**.
  - Manter modos antigos (livre, profundo) como abas.
- Perguntas diárias rotativas de amor-próprio no Dashboard:
  - "O que você fez hoje para demonstrar respeito por si mesmo?"
  - "Qual atitude hoje fortaleceu sua autoestima?"
  - "O que seu Alter Ego teria orgulho de ver?"
- Edge function `journal-prompts` atualizada pra gerar variações no tom EVOLUX.

---

## Fase 4 — Decisão Consciente + Futuro Duplo

**Objetivo:** consciência antes da ação.

- Antes de marcar um hábito como **falhado/pulado**, dialog: *"Quem está tomando essa decisão?"* — botões Alter Ego / Inimigo. Resposta vai pro diário automaticamente.
- Card **Futuro Duplo** no Dashboard:
  - Lado esquerdo "Caminho Evolux" (gerado por IA com base em hábitos cumpridos).
  - Lado direito "Caminho EndMan" (gerado com base em padrões de sabotagem detectados).
  - Edge function `dual-future` — cacheada por dia.

---

## Fase 5 — Memória Inteligente + Conversa com Eu do Futuro

**Objetivo:** conexão emocional profunda.

- Edge function `evolux-memory`: extrai e armazena promessas, sonhos, valores do diário (jsonb em `player_data.game_state.memories`).
- Quando IA detecta desistência: injeta lembrete ("Há 37 dias você disse…").
- Nova página `/futuro`: chat com o Alter Ego daqui a 10 anos.
  - Streaming via AI SDK + Lovable AI Gateway.
  - System prompt assume identidade criada na Fase 1.
  - Histórico por thread no `player_data.game_state.futureChats` (uma conversa, simples).

---

## Fase 6 — Evolução Visual (decidir depois)

Placeholder. Será discutido quando chegarmos aqui — opções: imagem gerada por IA, estados CSS/aura, ou ilustração estática com camadas.

---

## O que NÃO muda

- Engine RPG: XP, ouro, ranks, conquistas, missões, hábitos, recompensas.
- Tema visual neon roxo, Orbitron/Rajdhani, dark mode.
- Voz "Pai Interior" já estabelecida — EVOLUX é compatível com ela.
- Nome "Ascensão", branding, rotas existentes.
- Schema do banco: tudo cabe em `player_data.game_state` (jsonb).

---

## Detalhes Técnicos

- **Estado**: extensão de `useGameStore` com slices `alterEgo`, `innerEnemy`, `memories`, `futureChats`.
- **IA**: 4 novas edge functions (`sabotage-detector`, `emergency-intervention`, `dual-future`, `evolux-memory`) + 1 streaming (`future-self-chat`). Todas usando `google/gemini-3-flash-preview` via Lovable AI Gateway. JSON estruturado com `Output.object` onde aplicável.
- **Rotas novas**: `/onboarding/identidade`, `/futuro`.
- **Componentes novos**: `ThoughtAnalyzer`, `EmergencyButton`, `DecisionGate`, `DualFutureCard`, `FutureSelfChat`.
- **Sem migrações** de schema na Fase 1–5.

---

**Próximo passo:** se aprovar, começo pela Fase 1 (Identidade).
