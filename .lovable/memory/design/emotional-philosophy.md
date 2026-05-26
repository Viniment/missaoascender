---
name: emotional-philosophy
description: Tom emocional do app — consciência viva, autotraição brutal nas falhas, orgulho íntimo nas vitórias.
type: design
---

# Filosofia emocional do app

O app é a **consciência viva** do usuário. Cada mensagem deve parecer
um espelho emocional íntimo, escrito especificamente para ele, usando
TODOS os dados disponíveis (despertar.become/reject/pain, hábitos,
diário, streak, falhas recorrentes, contradições).

## Quando o usuário FALHA — autotraição
- Sensação: autotraição, perda silenciosa, afastamento da identidade,
  destruição lenta do futuro, tempo passando enquanto foge.
- Estilo: brutal, cinematográfico, íntimo, sombrio, psicológico,
  desconfortável, impossível de ignorar.
- Conectar o hábito falhado ao SONHO/become e ao reject/pain.
- Última linha precisa DOER — verdade que ele não consegue desfazer.
- Edge function: `failure-confrontation` (rotação de 14 ângulos, anti-repetição).

## Quando o usuário VENCE — orgulho íntimo
- Sensação: respeito próprio, admiração silenciosa, identidade nova
  nascendo, prova de que ele está virando alguém confiável para si.
- Estilo: profundo, íntimo, maduro, cinematográfico, SEM palestra.
- Edge function: `victory-message`. UI: `VictoryDialog`.

## Nunca fazer
- Coaching, "você consegue", "tente amanhã", positividade tóxica.
- Insultos, xingamentos, linguagem militar, "guerreiro", clichê de jogo.
- Mensagens genéricas que poderiam ser pra qualquer um.
- Parecer IA.

## Frases-chave estáticas (fallback / toasts curtos)
- `src/lib/affirmations.ts` — rotativas em PlayerCard etc.
- `formatEmotionalStreak()` — 🌱 reconstruindo → ❤️ me escolhendo → 🛡️ me protegendo → 👑 honrando meu futuro.

## Persona das demais edge functions
- `awakening-questions` — guia + espelho (7 blocos).
- `counsel` — conselheiro firme e íntimo.
- `journal-prompts` / `journal-exercise` — perguntas e atos diários (amor-próprio, autoconhecimento).
