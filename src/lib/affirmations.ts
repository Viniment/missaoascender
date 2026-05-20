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

/** Emotional streak label. Substitui contagem crua por linguagem de autocuidado. */
export function formatEmotionalStreak(days: number): { emoji: string; label: string } {
  if (days <= 0) return { emoji: '🌑', label: 'reconectando' };
  if (days <= 3) return { emoji: '🌱', label: 'reconstruindo' };
  if (days <= 9) return { emoji: '❤️', label: 'me escolhendo' };
  if (days <= 29) return { emoji: '🛡️', label: 'me protegendo' };
  return { emoji: '👑', label: 'honrando meu futuro' };
}
