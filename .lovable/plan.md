

# Plano: Animação progressiva da bola de respiração + textos cinza → branco

## 1. Bola de respiração progressiva

Atualmente a bola pula entre tamanhos fixos (40px↔80px). O pedido é que ela cresça/diminua **progressivamente** junto com a contagem de cada fase.

**Lógica nova:**
- **Inspire (4s):** bola começa em tamanho mínimo (20px) e cresce linearmente com `breathingProgress` até tamanho máximo (80px)
- **Segure (4s):** bola fica parada no tamanho que estava (80px após inspire, 20px após expire)  
- **Expire (6s):** bola começa no máximo (80px) e diminui linearmente até mínimo (20px)
- **Segure (2s):** bola fica parada em 20px

A opacidade da bola também acompanha: mais visível quando maior, quase invisível quando menor. Algo como `opacity: 0.3 + 0.7 * (size - minSize) / (maxSize - minSize)`.

A transição do `motion.div` será ajustada para `duration: 0.1` (quase instantâneo) para que o estado reativo do `breathingProgress` controle suavemente o tamanho frame a frame, sem "easing" extra.

## 2. Textos cinza → branco (sem negrito)

Trocar todas as ocorrências de `text-muted-foreground` no `UrgeSurfingPanel.tsx` por `text-foreground` (branco), **exceto** nos casos onde o cinza faz sentido funcional (botões não-selecionados que já têm hover). Labels como "TIPO DE IMPULSO", "DURAÇÃO", "Superados", "Sequência", "Sessões", e o texto da tela de abandono serão brancos.

## Arquivo
- `src/components/UrgeSurfingPanel.tsx`

