

# Plano: Reescrever mensagens-guia do Urge Surfing

## Problema
As mensagens atuais são vagas ("Ele está subindo", "A onda está descendo") e não guiam o usuário de forma prática. Quem não conhece a técnica não entende o que fazer.

## Solução

Reescrever `GUIDE_MESSAGES` em `src/components/UrgeSurfingPanel.tsx` com frases específicas que **ensinam** a técnica enquanto guiam:

**start (0-33%)** — Reconhecer o impulso e começar:
- "Feche os olhos. Sinta onde o impulso aparece no seu corpo: peito, estômago, garganta…"
- "Não tente lutar contra a vontade. Apenas observe ela como se fosse uma onda no mar."
- "O impulso é como uma onda: ele sobe, atinge um pico e depois desce sozinho."
- "Acompanhe a respiração 4-7-8. Inspire pelo nariz por 4 segundos."

**mid (33-66%)** — Manter presença e aprofundar:
- "Você está surfando a onda. Cada segundo que passa, o impulso perde força."
- "Note: a vontade muda de intensidade. Ela não é constante — vai e volta."
- "Segure o ar por 7 segundos. Isso desacelera seus batimentos e acalma a mente."
- "Nenhum impulso dura para sempre. A maioria passa em 15 a 20 minutos."
- "Expire lentamente pela boca por 8 segundos. Solte a tensão junto com o ar."

**end (66-100%)** — Reforço e encerramento:
- "O pico já passou. O impulso está perdendo força agora."
- "Você escolheu não reagir — e isso reconecta seu cérebro a cada vez."
- "Cada sessão que você completa torna a próxima mais fácil. Isso é neuroplasticidade."
- "Você está provando que consegue sentir sem precisar agir."

## Arquivo
- `src/components/UrgeSurfingPanel.tsx` — substituir o objeto `GUIDE_MESSAGES`

