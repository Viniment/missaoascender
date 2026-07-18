## Visão

Transformar Ascensão numa experiência que **parece um jogo AAA de RPG mobile**, mantendo a identidade Solo Neon Roxo. Foco em três eixos: (1) expandir massivamente a loja com 4 novas categorias visíveis no avatar, (2) redesenhar HUD/Home/Combate/Loja com camadas de FX (partículas, glow, hit numbers, shakes), (3) padronizar animações de recompensa em todo o app.

---

## 1) Sistema de Design intensificado

- **Paleta locked:** `#020617` (bg deep) · `#0F172A` (surface) · `#7B2FF7` (primary neon) · `#c084fc` (accent glow). Adicionar tokens de raridade brilhantes: `--rarity-comum` cinza, `--raro` azul, `--epico` roxo, `--lendario` dourado pulsante, `--mitico` gradient arco-íris (nova raridade).
- **Novos tokens/utilities em `index.css`:** `.holo-border` (borda com conic-gradient girando), `.rarity-pulse-lendario`, `.floating-numbers`, `.hit-shake`, `.crit-flash`, `.scanline-overlay`, gradientes `--grad-legendary`, `--grad-mythic`.
- **Motion global:** instalar `framer-motion` (já pode estar). Adicionar `<PageTransition>` (fade+slide) em cada rota e `<RewardBurst>` component reutilizável (moedas voando + XP flutuante + partículas).
- **Sons visuais:** ícones que "batem" (scale bounce) quando ganhos aumentam. Contadores animados (tween de números).

## 2) Expansão da Loja — 4 novas categorias

Adicionar em `src/lib/itens.ts` novo tipo `ItemCategoria` = existentes + `"weapon" | "wings" | "mask" | "pet" | "frame" | "consumable"`. Meta: **~40 itens novos** distribuídos.

| Categoria | Slot no avatar | Itens (exemplos) |
|---|---|---|
| **Armas** | mão direita, sobre o torso | Espada de Ferro, Katana Neon, Cajado Rúnico, Machado do Berserker, Foice Sombria, Arco Élfico, Lança de Vênus, Martelo do Trovão (lendário) |
| **Asas/Capas** | atrás do busto | Capa de Viajante, Manto do Rei, Asas de Corvo, Asas Angelicais (lendário), Asas Demoníacas (lendário), Cauda de Fênix animada (mítico) |
| **Máscaras** | rosto (sobre olhos/boca) | Visor Cyber, Máscara de Oni, Bandana de Ninja, Máscara Anbu, Half-Skull, Coroa da Cegueira (lendário) |
| **Pets** | flutuando ao lado do avatar | Slime Roxo, Lobo Sombra, Coruja Mística, Filhote de Dragão (épico), Orb do Sistema (lendário — segue com bounce), Fênix Bebê (mítico) |
| **Molduras** | borda ao redor do card do herói | Bronze, Prata, Ouro, Rúnica (animada), Arco-Íris Mítica |
| **Consumíveis** | inventário, uso ativo | Poção XP x2 (24h), Escudo Anti-Falha (1 dia), Token de Streak (recupera 1 dia perdido), Cofre da Sorte (loot random) |

Todos com preview no `<Avatar>` (novos layers `WeaponLayer`, `WingsLayer`, `MaskLayer`, `PetLayer`, `FrameLayer`).

**Loja redesenhada:**
- Aba superior com 8 categorias em pílulas neon animadas (indicador deslizante).
- Grid 2x com cards de raridade: borda conic-gradient girando nos lendários, partículas nos míticos.
- Ao passar/tocar: card faz `scale-105` + brilho lateral.
- Botão comprar: efeito ripple + burst de moedas voando pro contador ao confirmar.
- Contador de ouro no topo com número animado (CountUp) + ícone que pulsa quando muda.
- Novo modal de **Preview** ao tocar no item: avatar full-size girando levemente + descrição + histórico ("adquirido por 3% dos heróis").

## 3) Home / Dashboard game-like

- **HUD superior fixo:** avatar circular com moldura equipada, barra de HP (vermelho→verde), barra de XP (roxa neon com shimmer), rank/nível grande em Orbitron, moedas com ícone que balança.
- **Card Herói central:** avatar renderizado em tamanho `xl` com aura + pet flutuando ao lado (animação idle bobbing).
- **Painéis de Ação em bento-grid:** Inimigo do Dia (card grande com HP bar), Mini Vitórias (3 slots), Streak (chama animada), Loja (badge com "+3 novos").
- **Widget de conquistas recentes:** carousel horizontal com brilho.
- **Background:** partículas roxas subindo lentamente (canvas leve, ~30 partículas).

## 4) Combate contra o Inimigo — cinemático

- Fundo escurecido com scanlines animadas.
- Sprite do inimigo desenhado em pixel (silhueta roxa/sombra) com HP bar segmentada.
- Ao completar tarefa: **shake da tela** + hit number (`-45 HP`) flutuando + burst de partículas roxas.
- Ao falhar: flash vermelho + mockery overlay já existente permanece.
- Ao derrotar: overlay full-screen com "VITÓRIA" em Orbitron gigante, loot chest aparece, botão "Abrir Baú" mostra recompensas em sequência.

## 5) Personalizar — dressing room

- Avatar grande girando levemente (idle animation).
- Tabs em duas fileiras (Aparência / Equipamento) com ícones.
- Slots visuais estilo Diablo: silhueta do corpo com "hotspots" clicáveis (cabeça, peito, mãos, costas, pet).
- Botão "Randomizar look" + "Salvar preset".

## 6) Feedback tátil em todo lugar

- Toast de recompensa custom: banner com gradient de raridade + ícone + números animados.
- Level up: overlay full-screen com raios neon + Orbitron "NÍVEL {N}".
- Todo botão principal: hover glow + tap scale.

---

## Detalhes técnicos

- **Novos arquivos:**
  - `src/components/fx/RewardBurst.tsx` — partículas + números flutuantes reutilizáveis.
  - `src/components/fx/ParticleBackground.tsx` — canvas leve para o fundo.
  - `src/components/fx/AnimatedCounter.tsx` — tween de números.
  - `src/components/fx/LevelUpOverlay.tsx`.
  - `src/components/fx/VictoryScreen.tsx`.
  - `src/components/PageTransition.tsx`.
  - `src/components/HeroHUD.tsx` — HUD superior fixo.
  - `src/components/avatar/WeaponLayer.tsx`, `WingsLayer.tsx`, `MaskLayer.tsx`, `PetLayer.tsx`, `FrameLayer.tsx` — extrair layers do Avatar e adicionar novos.

- **Alterações:**
  - `src/lib/itens.ts`: novas categorias + ~40 itens + `frame`, `weapon`, `wings`, `mask`, `pet`, `consumable` em `AvatarEquipado`.
  - `src/components/Avatar.tsx`: renderiza novos layers em ordem correta (aura → wings → base → armor → weapon → mask → hat → frame; pet ao lado).
  - `src/pages/Loja.tsx`: 8 categorias, cards com raridade animada, modal preview.
  - `src/pages/Personalizar.tsx`: incluir novas categorias, slots visuais.
  - `src/pages/Dashboard.tsx` (ou `Index.tsx`): HUD + bento-grid + background partículas.
  - `src/components/BossPanel.tsx`: shake + hit numbers + victory screen.
  - `src/index.css`: novos tokens/utilities de raridade e FX.
  - `src/lib/api.ts` / gameStore: suportar `frame`, `weapon`, `wings`, `mask`, `pet`; inventário de consumíveis (`consumiveis: {id: qtd}`) com ações `usarConsumivel`, efeito temporário `boosts_ativos`.

- **Migração DB:** adicionar coluna `consumiveis jsonb default '{}'` e `boosts_ativos jsonb default '[]'` em `heroi` (via `supabase--migration`), grants preservados.

- **Deps:** confirmar `framer-motion`; instalar `canvas-confetti` (para bursts pontuais) e `react-countup`.

## Ordem de execução (para caber em iterações claras)

1. Fundamentos: tokens de raridade + `RewardBurst` + `AnimatedCounter` + `PageTransition` + migração DB.
2. Loja expandida: novos itens em `itens.ts` + novos layers no Avatar + redesign da `Loja.tsx` com modal preview.
3. Personalizar atualizado para as novas categorias.
4. HUD + Dashboard bento redesenhado + partícula de fundo.
5. Combate cinemático + Victory Screen + Level Up overlay.
6. Polimento: transições de página, toasts custom, shake em todo evento.

---

## O que **não** vou fazer (guardrails)

- Não mudar a paleta (Solo Neon Roxo confirmado).
- Não trocar fontes (Orbitron/Rajdhani).
- Não alterar lógica de negócio (regras de XP, ouro, inimigo, tarefas ficam idênticas).
- Não adicionar backend novo além da coluna de consumíveis.
- Não remover funcionalidades existentes.

Posso começar pela etapa 1+2 (fundamentos + loja) que já entrega valor visível imediato, ou você prefere que eu ataque outra ordem?