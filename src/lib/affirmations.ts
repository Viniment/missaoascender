// Frases-chave do app — voz do Pai Interior, amor-próprio e diálogo interno saudável.
// Aparecem em pontos estratégicos: PlayerCard, fim do ritual, toasts.

export const AFFIRMATIONS = [
  'Você merece o cuidado que oferece aos outros.',
  'Pequenos passos de coragem constroem grandes identidades.',
  'Confiança em si nasce de promessas cumpridas com você.',
  'Disciplina é uma forma de amor — não de punição.',
  'Você falaria assim com alguém que ama?',
  'Seu jardim interior responde ao que você planta hoje.',
  'A zona de conforto cobra um preço silencioso.',
  'Você está aprendendo a ser quem você admira.',
  'Coragem não vem antes da ação. Vem depois dela.',
  'Cada gesto de cuidado consigo é um voto pelo seu futuro.',
  'Você não precisa ser perfeito. Só precisa estar em movimento.',
  'Você merece paciência. Inclusive a sua.',
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

/** Micro-frases para quando o usuário conclui um hábito — pequeno gesto de coragem e cuidado. */
export const LOVE_ACT_MESSAGES = [
  'Você cuidou de você agora.',
  'Mais uma promessa cumprida com você mesmo.',
  'Pequeno gesto. Grande reconciliação.',
  'Você apareceu pra você hoje.',
  'É assim que confiança em si se constrói.',
  'Coragem em forma de gesto pequeno.',
  'Seu eu de amanhã sente esse cuidado.',
  'Você se honrou agora.',
] as const;

export function getRandomLoveActMessage(): string {
  return LOVE_ACT_MESSAGES[Math.floor(Math.random() * LOVE_ACT_MESSAGES.length)];
}
