# Reorientação do núcleo emocional: do confronto brutal ao Pai Interior

Hoje o app tem duas vozes coexistindo: a **brutal/autotraição** (failure-confrontation, FailureConfrontDialog, SabotageConfrontDialog, emotional-philosophy.md) e a **amor-próprio** (conquistas, affirmations, victory-message). O usuário quer que **toda** a voz do app passe a refletir o "Pai Interior" — corrigir sem humilhar, acolher sem consolar em excesso, responsabilizar sem cobrar.

Este plano reescreve os prompts e textos para essa única voz. Não muda lógica de jogo, XP, banco, nem UI estrutural.

## 1. Memória de filosofia (fonte da verdade)

Reescrever `.lovable/memory/design/emotional-philosophy.md` com o novo núcleo:
- Identidade: guia de desenvolvimento pessoal, voz do Pai Interior.
- Missão: amor-próprio, autoestima, autoconfiança, diálogo interno, coragem, responsabilidade pessoal.
- Conceitos-chave: Pai Interior, Zona de Conforto (cobra preço silencioso), Jardim Interior (pensamentos = sementes), Diálogo Interno ("você falaria isso a alguém que ama?").
- Falha → "teve uma dificuldade hoje, o que aprendemos?" — nunca "você falhou".
- Autocrítica → reformular, não reforçar.
- Tom: caloroso, humano, profundo, sábio, gentil, encorajador. Sem sarcasmo, humilhação, positividade tóxica, militarização, ou "autotraição brutal".
- Frase guia: *"Estou aqui para ajudá-lo a construir uma relação tão saudável consigo mesmo que você se torne uma das pessoas que mais admira."*

Atualizar também `.lovable/memory/index.md` Core para refletir o novo tom (remover "autotraição como despertar suave" duro, trocar por "Pai Interior, jardim interior, coragem em pequenos passos").

## 2. Edge functions — reescrever prompts

Sem mudar inputs/outputs, só o SYSTEM_PROMPT e as instruções de tom:

### `supabase/functions/failure-confrontation/index.ts`
- Atual: 14 ângulos de "autotraição brutal", "última linha que dói", cinematográfico sombrio.
- Novo: voz do Pai Interior. Reconhece a dificuldade, nomeia o que foi adiado **sem humilhar**, conecta ao sonho/become com ternura firme, termina com um convite a um próximo gesto pequeno de coragem. Mantém os ângulos como *lentes* (zona de conforto, jardim, diálogo interno, sonho adiado, identidade, etc.) — mas todos falados como pai sábio. Anti-repetição preservada.
- Removidas: palavras "autotraição", "traição", "morrendo", "destruição", frases que doem por doer.

### `supabase/functions/victory-message/index.ts`
- Manter celebração íntima, mas explicitar: orgulho construído por ação repetida, autoestima nascendo de cumprir promessa consigo, evidência de quem ele está se tornando.

### `supabase/functions/counsel/index.ts`
- Reescrever SYSTEM_PROMPT e os modos de intensidade (`leve/moderado/agressivo`):
  - `leve` → pai acolhedor.
  - `moderado` → pai firme e claro (padrão).
  - `agressivo` → pai honesto, sem rodeios, **nunca** cruel ou humilhante.
- Trocar "MODO RECONDICIONAMENTO DE IDENTIDADE" — manter objetivo (separar eu antigo / eu escolhido) mas sem "corte a justificativa", trocar por linguagem de responsabilidade e identidade.
- Estrutura markdown mantida (O que vejo / Por que / Reflexão / Pequeno gesto de hoje).

### `supabase/functions/awakening-questions/index.ts` e `journal-prompts/index.ts` e `journal-exercise/index.ts`
- Pequena revisão de tom: garantir voz consistente (Pai Interior, jardim, diálogo interno, coragem em pequenos passos). Sem mudar estrutura nem número de blocos.

## 3. Frases estáticas (frontend)

### `src/lib/affirmations.ts`
- Revisar lista de afirmações curtas para refletir: confiar em si, cumprir promessas consigo, coragem pequena, jardim interior, diálogo interno gentil. Manter API (`getRandomAffirmation`, `formatEmotionalStreak`) intacta.

### `src/components/FailureConfrontDialog.tsx`
- Trocar labels: `MISSÃO QUEBRADA / ACORDO ROMPIDO / PROTOCOLO ABANDONADO` → algo como `UMA DIFICULDADE HOJE / UMA PROMESSA ADIADA / UM CICLO INTERROMPIDO`.
- Botão "Eu reconheço. Eu escolhi isso." → "Eu vejo. E volto pra mim."
- Header: trocar Skull (caveira) por ícone mais sóbrio (`HeartCrack` ou `Sunrise` da lucide). Pulso vermelho → âmbar/roxo suave (usar `--primary` ou tom morno) — mantém peso emocional sem agressão visual.
- Texto "Reconstruindo o que você fez…" → "Olhando pra isso com você…"
- Mantém o read-lock de 4s (responsabilidade pessoal).

### `src/components/SabotageConfrontDialog.tsx`
- Mesmo passe de tom (sem ler arquivo agora; revisar na build).

### `src/components/VictoryDialog.tsx`
- Garantir copy alinhado.

### Conquistas (`src/lib/achievements.ts`)
- Já foram reescritas em amor-próprio na passada anterior. Apenas pequena revisão para garantir que nenhuma description ainda tenha resíduo de "guerreiro / dominação / autotraição".

## 4. O que NÃO muda

- Nenhuma alteração em banco, RLS, edge function inputs/outputs, gameStore, XP, ouro, ranks, hábitos, missões, diário, recompensas, conquistas (IDs/lógica).
- Nenhuma alteração de roteamento, autenticação ou estrutura de UI.
- Read-lock e dialogs travados permanecem (responsabilidade pessoal).

## Resultado

Todo texto que o app gera ou exibe — falhas, vitórias, conselhos, despertar, diário, frases curtas — passa a falar com **uma única voz**: o Pai Interior sábio, caloroso, firme, gentil. A força emocional do confronto vira **clareza com ternura**, não dor por dor. O app continua exigindo verdade do usuário, mas pelo caminho do amor-próprio.
