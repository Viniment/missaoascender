

# Plano: Corrigir animação da bola de respiração + melhorar cores de texto nos temas

## 1. Bug da bola de respiração

**Problema:** Quando a fase muda (ex: "Segure" → "Inspire"), `breathingProgress` reseta para 0 mas o tamanho anterior era grande (80px). O `transition: 0.1s` faz um salto quase instantâneo de 80px → 20px, causando o "pulo" visual.

**Solução:** Manter um `breathingSize` como `useRef` contínuo que não depende de resets. Em vez de calcular o tamanho a partir de `breathingProgress` (que reseta a cada fase), usar um **valor acumulado contínuo** que transiciona naturalmente:

- Trocar a lógica para que o `breathingSize` seja um state que se atualiza suavemente a cada tick (100ms), movendo-se gradualmente em direção ao tamanho-alvo da fase atual
- Inspire: alvo = MAX_SIZE, incrementa suavemente
- Segure: alvo = tamanho atual (fica parado)
- Expire: alvo = MIN_SIZE, decrementa suavemente
- A velocidade de incremento/decremento é proporcional à duração da fase

Isso elimina qualquer salto porque o valor nunca reseta.

## 2. Cores de texto nos temas

**Problema:** `--foreground` e `--muted-foreground` estão com lightness baixa em alguns temas (45-50% para muted, 80-85% para foreground), resultando em textos pouco legíveis. Botões de menu e labels usam essas variáveis.

**Solução:** Atualizar `useTheme.ts` — aumentar lightness de `--foreground` para ~90-93% e `--muted-foreground` para ~60-65% em todos os temas. Também adicionar `--sidebar-foreground` em cada tema para garantir que a navegação lateral tenha bom contraste:

| Tema | foreground (antes → depois) | muted-foreground (antes → depois) |
|------|---------------------------|----------------------------------|
| neon-purple | 85% → 93% | 50% → 62% |
| red-black | 80% → 90% | 45% → 60% |
| cyber-blue | 88% → 93% | 48% → 62% |
| emerald | 82% → 92% | 45% → 60% |
| solar | 82% → 92% | 45% → 60% |
| midnight-rose | 85% → 93% | 45% → 62% |
| arctic | 88% → 93% | 48% → 62% |

Mesmos ajustes para `--card-foreground` e `--sidebar-foreground`.

## Arquivos
- `src/components/UrgeSurfingPanel.tsx` — lógica da bola de respiração
- `src/hooks/useTheme.ts` — variáveis de cor dos temas

