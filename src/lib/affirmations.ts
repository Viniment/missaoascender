// Frases-chave do app — reconexão emocional e amor-próprio.
// Aparecem em pontos estratégicos: PlayerCard, fim do ritual, toasts de recaída.

export const AFFIRMATIONS = [
  'Disciplina é uma forma de amor.',
  'Você não precisa continuar se abandonando.',
  'Seu futuro merece proteção.',
  'Autocontrole é autocuidado.',
  'Seu valor não desaparece nas recaídas.',
  'Toda pequena escolha reconstrói confiança interna.',
  'Você está aprendendo a se escolher.',
  'A verdadeira transformação começa quando você para de se trair.',
  'Seu futuro precisa sentir que pode confiar em você.',
  'Você merece orgulho ao olhar para si.',
] as const;

export function getRandomAffirmation(seed?: string): string {
  if (!seed) {
    return AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  }
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AFFIRMATIONS[h % AFFIRMATIONS.length];
}

/** Streak simples — sem rótulos emocionais extras no PlayerCard. */
export function formatEmotionalStreak(_days: number): { emoji: string; label: string } {
  return { emoji: '🔥', label: 'Streak' };
}

/** Micro-frases para quando o usuário conclui um hábito — pequeno ato de amor-próprio. */
export const LOVE_ACT_MESSAGES = [
  'Você acabou de cuidar de si.',
  'Uma pequena prova de amor-próprio.',
  'Você se escolheu agora.',
  'Sua palavra com você valeu hoje.',
  'Mais uma promessa cumprida pra você.',
  'Você não se abandonou agora.',
  'Pequeno ato, grande reconexão.',
  'Seu eu de amanhã agradece esse gesto.',
] as const;

export function getRandomLoveActMessage(): string {
  return LOVE_ACT_MESSAGES[Math.floor(Math.random() * LOVE_ACT_MESSAGES.length)];
}
