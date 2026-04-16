

# Plano: Remover referências à respiração das mensagens-guia

## Problema
As mensagens-guia mencionam "Inspire por 4 segundos", "Segure por 7 segundos", "Expire por 8 segundos" — mas elas aparecem em momentos aleatórios que não sincronizam com a animação da bola. Isso confunde mais do que ajuda.

## Solução

Reescrever `GUIDE_MESSAGES` focando apenas em **mindfulness, observação do impulso e psicoeducação** — sem mencionar respiração (a bola + texto "Inspire/Segure/Expire" já cuida disso visualmente).

**start (0-33%):**
- "Feche os olhos. Sinta onde o impulso aparece no seu corpo: peito, estômago, garganta…"
- "Não tente lutar contra a vontade. Apenas observe ela como se fosse uma onda no mar."
- "O impulso é como uma onda: ele sobe, atinge um pico e depois desce sozinho."
- "Dê um nome ao que você sente agora. Nomear a emoção já reduz sua intensidade."

**mid (33-66%):**
- "Você está surfando a onda. Cada segundo que passa, o impulso perde força."
- "Note: a vontade muda de intensidade. Ela não é constante — vai e volta."
- "Nenhum impulso dura para sempre. A maioria passa em 15 a 20 minutos."
- "Observe seus pensamentos sem julgamento. Eles são apenas pensamentos, não ordens."
- "Seu corpo está pedindo algo, mas você não precisa obedecer. Só observe."

**end (66-100%):**
- "O pico já passou. O impulso está perdendo força agora."
- "Você escolheu não reagir — e isso reconecta seu cérebro a cada vez."
- "Cada sessão que você completa torna a próxima mais fácil. Isso é neuroplasticidade."
- "Você está provando que consegue sentir sem precisar agir."

## Arquivo
- `src/components/UrgeSurfingPanel.tsx` — substituir `GUIDE_MESSAGES`

