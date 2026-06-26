# Plano: Life RPG — Transformação Completa em Jogo

Vou expandir o sistema atual de XP/níveis para uma experiência completa de RPG da vida, mantendo a filosofia de liderança compassiva já estabelecida. Tudo será integrado aos hábitos e missões existentes — nada será descartado.

---

## 1. Atributos de Vida (6 stats centrais)

Cada hábito/missão passa a dar XP em **um atributo** além do XP geral. Os 6 atributos:

| Atributo | Símbolo | Representa |
|---|---|---|
| **Força** | ⚔️ | Exercício, esforço físico, ação |
| **Mente** | 🧠 | Estudo, leitura, foco, aprendizado |
| **Espírito** | ✨ | Meditação, journaling, Trataka, TCC |
| **Social** | 🤝 | Conexões, conversas, vínculos |
| **Disciplina** | 🛡️ | Hábitos mantidos, promessas cumpridas |
| **Vitalidade** | ❤️‍🔥 | Sono, alimentação, água, autocuidado |

- Cada atributo tem nível próprio (1-100) com curva de XP.
- Ao criar/editar hábito ou missão → escolher atributo principal.
- IA do mentor sugere atributo ao criar hábito via tool-calling.
- Novo painel **Atributos** mostrando barras radiais e progressão.

## 2. Classes e Skill Tree

- Aos **Nível 5** o usuário desbloqueia escolha de classe baseada no atributo dominante:
  - **Guerreiro** (Força) — bônus em quests físicas
  - **Sábio** (Mente) — bônus de XP em estudo
  - **Místico** (Espírito) — bônus em práticas contemplativas
  - **Diplomata** (Social) — bônus em quests sociais
  - **Monge** (Disciplina) — bônus em streaks
  - **Curandeiro** (Vitalidade) — regen passiva
- Skill tree simples por classe (3 ramos × 3 níveis = 9 perks) desbloqueados por XP do atributo.
- Perks são **passivos reais**: multiplicadores de XP, slots extras de missão, custos reduzidos na loja, etc.

## 3. Quests Épicas e Boss Battles

- **Quest Épica**: missão de longo prazo (semanas/meses) com fases. Ex: "Reconstruir meu corpo" → 4 fases × várias sub-missões.
- **Boss Battle**: chefes representam padrões de sabotagem reais (Procrastinação, Comparação, Autocrítica, Cansaço Crônico).
  - Cada boss tem "HP" reduzido por ações específicas durante 7-14 dias.
  - Visual de barra de HP do boss + recompensa épica ao derrotar.
  - IA do mentor pode propor um boss quando detectar padrão recorrente.

## 4. Dungeons Diárias e Eventos

- **Dungeon do Dia**: gerada todo dia pela IA com 3 desafios temáticos (curtos, 5-30min) + timer e loot.
- **Loot system**: ao completar, drop aleatório (raridade comum/raro/épico/lendário) que vira item visual no inventário e bônus temporário (ex: "Poção de Foco: +20% XP por 2h").
- **Eventos sazonais**: semana temática (ex: "Semana da Vitalidade") com multiplicadores e quest exclusiva.

## 5. Quest de Redenção (sistema de falha)

- Sem perda dura. Ao quebrar streak ou falhar missão crítica:
  - IA gera uma **Quest de Redenção** personalizada (1-3 dias) usando contexto do usuário e tom compassivo.
  - Completar → restaura streak parcialmente + insígnia "Voltei".
  - Aparece como dialog acolhedor, não punitivo.

## 6. Intensidade visual (nível 3 — moderado)

- Animação de **Level Up** com partículas + som sutil ao subir nível geral, de atributo ou desbloquear perk.
- Boss com barra de HP pulsante e shake ao receber dano.
- Loot drop com flip card animado.
- Sem áudio invasivo — apenas SFX opt-in nas configurações.

---

## Implementação técnica

### Game store (`src/lib/gameStore.ts`)
Novos campos no `PlayerState`:
- `attributes: Record<AttributeId, { xp: number; level: number }>`
- `class: { id: ClassId; chosenAt: string } | null`
- `perks: PerkId[]`
- `epicQuests: EpicQuest[]` (fases, progresso)
- `bosses: BossBattle[]` (ativos + derrotados)
- `dungeons: { date: string; challenges: DungeonChallenge[]; loot?: LootItem }[]`
- `inventory: LootItem[]`
- `activeBuffs: ActiveBuff[]` (expira por tempo)
- `redemptionQuests: RedemptionQuest[]`

Hábitos e missões ganham campo opcional `attribute: AttributeId`.

### Novos componentes
- `src/components/AttributesPanel.tsx` — visualização das 6 stats com gráfico radial
- `src/components/ClassSelectionDialog.tsx` — escolha de classe no nível 5
- `src/components/SkillTreePanel.tsx` — árvore de perks por classe
- `src/components/EpicQuestsPanel.tsx` — quests longas com fases
- `src/components/BossBattlePanel.tsx` — chefes ativos com barra HP
- `src/components/DungeonOfTheDay.tsx` — desafios diários gerados pela IA
- `src/components/LootDropOverlay.tsx` — animação de drop
- `src/components/InventoryPanel.tsx` — itens coletados + buffs ativos
- `src/components/RedemptionQuestDialog.tsx` — dialog acolhedor pós-falha
- `src/components/LevelUpOverlay.tsx` — animação de level up

### Edge functions novas
- `dungeon-generator` — gera os 3 desafios diários personalizados
- `boss-suggester` — detecta padrões e sugere boss
- `redemption-quest` — cria quest de redenção pós-falha
- `epic-quest-planner` — quebra meta grande em fases

### Lógica central
- Sistema de cálculo de XP de atributo em `src/lib/attributes.ts`
- Sistema de perks/bônus em `src/lib/perks.ts` (multiplicadores aplicados em todo gain de XP/ouro)
- Sistema de loot em `src/lib/loot.ts` (tabela de drops por raridade)
- Hook `useBuffs` para expirar buffs ativos

### Navegação
Novo grupo na sidebar **"RPG"**:
- Atributos
- Classe & Skills
- Quests Épicas
- Bosses
- Dungeon do Dia
- Inventário

### Integração com sistemas atuais
- Mentor IA passa a sugerir atributo ao criar hábito.
- Hábitos completados → XP no atributo + chance de loot.
- Awakening/TCC → XP em Espírito.
- Trataka → XP em Espírito + Mente.

---

## Faseamento da entrega

Para entregar bem, vou implementar em **3 ondas** dentro deste mesmo plano (sem pausa para aprovação):

1. **Onda 1 — Fundação**: Atributos, integração em hábitos/missões, painel de atributos, level up overlay, classes + seleção.
2. **Onda 2 — Conteúdo**: Quests épicas, bosses, dungeon do dia + edge functions, loot, inventário.
3. **Onda 3 — Polish**: Skill tree, quest de redenção, eventos sazonais, animações finais.

O resultado: o app deixa de ser "produtividade com XP" e vira de fato um **Life RPG** onde cada dia é uma sessão de jogo significativa.