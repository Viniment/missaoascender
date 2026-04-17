
Remover os 3 botões de modo (Despertar / Noturna / Fraqueza) e o botão "Modo Fraqueza" fullscreen, substituindo por **um único botão** "Gerar Afirmação IA".

## Mudanças em `src/components/AffirmationsPanel.tsx`

1. **Grid de 3 botões (linhas ~344-374)** → substituir por um único botão grande centralizado:
   - Texto: "Gerar Afirmação IA"
   - Ícone: `Sparkles` (lucide-react) ou manter `Flame`
   - Estilo: `rpg-panel glow-purple`, full width, mesmo padrão visual
   - `onClick={() => generateAffirmation('despertar')}` (mantém modo padrão internamente)

2. **Modo único**: a função `generateAffirmation` continua aceitando o parâmetro, mas o botão sempre passa `'despertar'`. Edge function `affirmations` continua igual — não muda nada no backend.

3. **Remover lógica de "weakness mode"**:
   - `weaknessMode` state e setter
   - `enterWeaknessMode` callback
   - Branch `weaknessMode` no fullscreen (estilo preto/vermelho)
   - Botão "Sair do modo" no fullscreen
   - Badge "Momento de Fraqueza"

4. **Header do current affirmation (linha ~395)**: remover o switch de emoji por modo, deixar fixo "✨ Afirmação" ou similar.

5. **Tipo `AffirmationMode`**: manter por compatibilidade com histórico existente que pode ter entries antigos com type `'noturna'`/`'fraqueza'` salvos em `state.affirmations` (renderizados na lista).

## Resultado
Interface limpa com 1 botão único de geração. Histórico antigo continua exibindo seus ícones originais (🌅🌙⚡✍️) sem quebrar.
