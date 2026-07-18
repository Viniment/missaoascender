## New LifeUp — reconstrução completa

Vou apagar o app atual e reconstruir seguindo a spec, na ordem que ela pede: primeiro dashboard + hábitos + loop diário, depois expandir.

## Etapa 1 — Limpeza

Apagar do projeto (código + tabelas):
- Componentes: Boss*, AlterEgo, IdentityOnboarding, Awakening, Zazen, Mentor, Counsel, LifeAreas, Rewards antigos, PerfectDay, ProjectPrompt, achievements antigos, e todos os overlays/dialogs relacionados.
- Edge functions: `alter-ego-architect`, `awakening-questions`, `boss-*`, `cbt-immersion`, `counsel`, `failure-confrontation`, `journal-*`, `mentor-chat`, `victory-message`, `attack-reinforcement`.
- Bibliotecas antigas: `gameStore`, `attributes`, `classes`, `dungeon`, `loot`, `perfectDay`, `shopCatalog`, `identityLevels`, `affirmations`, `achievements`, `aiContext`, `tabs`.
- Tabelas antigas: `player_data`, `profiles` serão substituídas.

## Etapa 2 — Novo schema (Supabase)

Migration cria as tabelas exatamente como na spec, todas com RLS `auth.uid() = user_id` e GRANTs para `authenticated` + `service_role`:

- `users` (perfil + progresso: nivel, xp, ouro, vida, streak)
- `onboarding_respostas`
- `inimigo`
- `habitos` (tipo positivo/negativo, peso_dano_cura, peso_xp)
- `habito_logs`
- `mini_vitorias`
- `conquistas`
- `transacoes_ouro`

Trigger `handle_new_user` cria a linha em `users` no signup.

## Etapa 3 — Etapa 3.1 (foco inicial, seções 3 e 4 da spec)

- **Dashboard principal** (`/`): barra HP do inimigo (topo destacada), barra XP/nível/ouro/vida do usuário, lista de hábitos do dia com checkboxes.
- **CRUD de hábitos** em painel lateral/modal (positivo vs negativo, peso configurável).
- **Loop diário**:
  - marcar positivo: `-hp` no inimigo animado, `+xp` no user, chama edge function `mensagem-reforco` (Gemini).
  - marcar negativo: `+hp` no inimigo, `-xp` e `-vida` no user, chama edge function `mensagem-inimigo` que escolhe uma mentira #N do inimigo cadastrado.
  - 100% positivos no dia → dispara `baú do dia` (seção 5).
  - HP inimigo = 0 → tela de vitória e prompt para próximo inimigo.

## Etapa 4 — Onboarding + criação do inimigo (seções 1 e 2)

- 4 perguntas, uma por tela, com barra de progresso.
- Salva em `onboarding_respostas`.
- Edge function `sugerir-inimigo` (Gemini) devolve nome + 3–5 mentiras a partir das desculpas; usuário edita e confirma.
- Escolhe avatar de galeria estática, gatilho (noite/pós-trabalho/fim de semana), HP calculado por quantidade de hábitos.

## Etapa 5 — Restante

- **Baú do dia**: animação de abertura, tabela de chances visível (60/30/10), grava `transacoes_ouro`.
- **Mini-vitórias**: CRUD + concluir dá ouro/xp/vida.
- **Conquistas**: streaks, dano total, mini-vitórias — detectadas no store ao mutar estado.
- **Tela do inimigo**: perfil, mentiras numeradas, histórico de dano.
- **Perfil do usuário**: editar nome, histórico de ouro.
- **Resumo semanal**: edge function `resumo-semanal` conecta progresso ao sonho.

## Detalhes técnicos

- Stack mantida: React + Vite + Tailwind + shadcn + Supabase (Lovable Cloud).
- IA: Lovable AI Gateway com `google/gemini-3-flash-preview` em todas as edge functions. Prompt de sistema em todas reforça a regra de tom (ataca o padrão do inimigo, nunca a identidade do usuário; referencia mentiras por número).
- Estado: hook `useGame` batendo direto no Supabase (sem JSONB gigante — cada entidade em sua tabela), com React Query para cache/otimistic updates nos hábitos.
- Auth: mantém email/senha + Google já configurados.
- Visual: dark RPG (roxo neon atual serve), Orbitron/Rajdhani já disponíveis. Barras animadas com Framer Motion.
- i18n: PT-BR (como o app já é).

## O que fica de fora dessa entrega

- Compra de ouro com dinheiro real (a spec proíbe).
- Geração de avatar por IA em tempo real (spec pede galeria estática).
- Recuperação dos dados atuais dos usuários — como você pediu recomeçar limpo, as tabelas antigas serão dropadas.

Se aprovar, começo pela migration (Etapa 2) e limpeza (Etapa 1) no mesmo turno.