## Atualização do Sistema de Combate e Progressão

Toda lógica de HP, dano, combo, XP e progresso existente será **preservada**. Esta é uma camada de personalização + apresentação + IA.

---

### 1. Áreas de Vida (Life Areas) — nova entidade

Nova estrutura no `gameStore.ts`:

```ts
interface LifeArea {
  id: string;
  name: string;        // "Saúde", "Foco" — editável
  icon: string;        // emoji
  color: string;
  level: number;       // começa em 1
  xp: number;          // XP acumulado para a área
  xpToNext: number;    // cresce por nível
}
```

- Seed default: Saúde, Mentalidade, Financeiro, Estudos, Disciplina, Sono, Espiritualidade, Relacionamentos, Trabalho, Foco, Autoestima, Liderança.
- CRUD completo (criar/editar/excluir/ícone/cor).
- Quando boss é derrotado → distribui XP entre as áreas ligadas a ele e dispara level-up das áreas (toast).

Painel novo: **`src/components/LifeAreasPanel.tsx`** — grid com card por área (ícone, nível, barra de XP). Integrado na aba "Atributos" ou nova aba "Áreas".

---

### 2. Monstro: campos novos (personalização total)

Adicionar ao `BossBattle`:

```ts
imageUrl?: string;
story?: string;                  // história/lore
affectedAreaIds: string[];       // áreas que ele afeta
howItAffectsMe?: string;         // "Como este monstro influencia minha vida"
whyDefeat?: string;              // "Por que quero derrotá-lo"
customPhrases?: string[];        // frases que ele diz
difficulty?: 'Fácil' | 'Normal' | 'Difícil' | 'Brutal';
mainColor?: string;
hpBarColor?: string;
```

- `BossPanel.tsx`: formulário de criação/edição expandido com todos esses campos + upload/URL de imagem + multi-seleção de áreas afetadas + dois textareas (`howItAffectsMe`, `whyDefeat`) sem limite.
- `CurrentBossCard.tsx`: mostra imagem (se tiver), título, áreas afetadas como chips.

---

### 3. XP do Monstro (fórmula automática)

`maxHp` / XP recompensa derivado de:

```
maxXp = (totalHabits + totalTasks) * days
```

Mostrar prévia no formulário ao escolher dias/tasks. Manter cálculo de dano atual (não mexer).

---

### 4. Sequência de ataque (animação)

Quando o usuário marca task do boss como feita:

- Botão pulse + glow
- Partículas (CSS) saindo do botão
- HP bar drena suave (já existe, melhorar transição)
- Número de dano flutuante subindo
- Shake leve no card do boss
- Som opcional (skip se não houver asset)

Tudo CSS/framer-motion em `BossPanel.tsx`. Novo subcomponente `BossAttackEffects.tsx` (overlay de partículas + dano flutuante).

---

### 5. Mensagem emocional pós-ataque (IA única)

Nova edge function: **`supabase/functions/attack-reinforcement/index.ts`**

- Input: snapshot completo (alter ego, boss, áreas afetadas, streak, level, hábitos do dia, histórico recente, último ângulo usado).
- Modelo: `google/gemini-2.5-flash`.
- System prompt focado em: orgulho, identidade, anti-culpa, anti-genérico, variação de tom (épico, acolhedor, filosófico, etc), evolução do discurso conforme `level`/`streak`.
- Anti-repetição: persistir últimos 10 tons/ângulos em `aiAngleHistory`.
- Resposta curta (1–3 frases), markdown leve.

UI: toast/modal flutuante após cada ataque com a mensagem; também salvar em `boss.reinforcementHistory` para o usuário rever.

`supabase/config.toml`: adicionar `[functions.attack-reinforcement] verify_jwt = false`.

---

### 6. Detalhes técnicos

- Tipos novos em `gameStore.ts` + reducers: `addLifeArea`, `updateLifeArea`, `removeLifeArea`, `awardAreaXp(boss)`.
- `defeatBoss()` já existente: chamar `awardAreaXp` com `affectedAreaIds`.
- Migração: se `state.lifeAreas` não existir, seed com 12 default na inicialização.
- Persistência via localStorage (padrão atual do app).

---

### Arquivos afetados

- `src/lib/gameStore.ts` (+ tipos + actions)
- `src/components/BossPanel.tsx` (formulário expandido + animações)
- `src/components/CurrentBossCard.tsx` (mostrar imagem/áreas)
- `src/components/LifeAreasPanel.tsx` **novo**
- `src/components/BossAttackEffects.tsx` **novo**
- `src/lib/tabs.ts` (+ aba "Áreas" opcional)
- `src/pages/Index.tsx` (mount nova aba)
- `supabase/functions/attack-reinforcement/index.ts` **novo**
- `supabase/config.toml` (+ verify_jwt false)

---

### Fora de escopo (manter como está)

- Cálculo de dano, HP, combo, regen
- XP/ouro do jogador
- Boss Coach Chat (já existe e fica)
- Mentor Chat, TCC, Trataka, Despertar

Posso seguir e implementar tudo de uma vez?