

## Objetivo
1. Adicionar **Urge Surfing** ao toggle de abas em Configurações → Interface, **desativada por padrão**.
2. Reorganizar e expandir a página **Ajuda** (`src/pages/Help.tsx`) com seções novas: Afirmações, Geração de Perguntas IA no Despertar, Urge Surfing, Configurações/Personalização, e melhor organização (agrupamento por categorias).

---

## Mudanças

### 1. Tornar Urge Surfing uma aba opcional (desativada por padrão)

**`src/lib/gameStore.ts`** (linha 259)
- Adicionar `'urge-surfing'` ao `disabledTabs` padrão:
  ```ts
  disabledTabs: ['visualizar', 'affirmations', 'urge-surfing'],
  ```

**`src/pages/Settings.tsx`** (linha ~182, lista de toggles em "Interface")
- Adicionar `{ id: 'urge-surfing', label: 'Urge Surfing' }` à lista de abas configuráveis.

> A lógica de esconder a aba quando está em `disabledTabs` já existe em `Index.tsx` — não precisa mexer lá.

### 2. Reorganizar e expandir `src/pages/Help.tsx`

Refatorar para agrupar seções por **categoria** (em vez de lista plana), adicionando texto introdutório em cada grupo:

**Estrutura nova:**
```
🎯 FUNDAMENTOS
  - Visão Geral
  - Sistema de Progressão (XP, Níveis, Ranks)
  - Registrar Dia (Check-in Diário)
  - Streak

⚔️ AÇÃO E DISCIPLINA
  - Missões
  - Hábitos
  - Desafios
  - Timer Pomodoro
  - Protocolo de Falha

🧠 MENTE E AUTOCONHECIMENTO
  - Diário
  - Despertar (com nova subseção: ✨ Geração de Perguntas IA)
  - Afirmações  ← NOVA
  - Urge Surfing  ← NOVA
  - Visualizar (Vision Board)

🏆 RECOMPENSAS E REGISTROS
  - Conquistas
  - Loja de Recompensas
  - Log de Histórico

⚙️ PERSONALIZAÇÃO  ← NOVA
  - Configurações de Interface (abas visíveis, incluindo Urge Surfing)
  - Temas (Aparência)
  - Dificuldade de Progressão
```

**Cada seção mantém o formato atual:** `content`, `benefits`, `tips`, mas com:
- Conteúdo das **3 seções novas** (Afirmações, Urge Surfing, Personalização) escrito do zero
- **Atualização da seção Despertar** com subseção sobre o botão "✨ Sugerir perguntas (IA)" — explicando que a IA usa diário + reflexões anteriores para gerar perguntas evolutivas
- **Dica sobre ativar/desativar abas** na seção de Personalização, mencionando que Urge Surfing vem desativado e como ativá-lo

**UI:** manter `<motion.details>` por seção, mas envolver cada grupo num cabeçalho com título + ícone do grupo (ex: `<h2 className="font-display text-sm text-primary mt-8 mb-3">⚔️ AÇÃO E DISCIPLINA</h2>`).

---

### Resultado
- Urge Surfing não aparece para novos usuários até ser ativado em Configurações → Interface.
- Ajuda fica organizada por temas, mais fácil de navegar, e cobre 100% das funcionalidades atuais incluindo IA do Despertar, Afirmações e Urge Surfing.

