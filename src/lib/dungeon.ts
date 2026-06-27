// Life RPG — Geração local de Dungeon do Dia (sem IA, determinística por data)
import type { AttributeId } from './attributes';

export interface DungeonTemplate {
  title: string;
  desc: string;
  minutes: number;
  attribute: AttributeId;
  xp: number;
}

export const TEMPLATE_BANK: DungeonTemplate[] = [
  { title: '10 min de caminhada consciente', desc: 'Saia, respire, observe. Sem celular.', minutes: 10, attribute: 'forca', xp: 25 },
  { title: '20 polichinelos', desc: 'Movimento curto pra acordar o corpo.', minutes: 3, attribute: 'forca', xp: 15 },
  { title: '5 min de alongamento', desc: 'Pescoço, ombros, lombar.', minutes: 5, attribute: 'vitalidade', xp: 20 },
  { title: 'Beba 2 copos de água', desc: 'Pequeno gesto de cuidado.', minutes: 1, attribute: 'vitalidade', xp: 10 },
  { title: '15 min de leitura', desc: 'Um capítulo. Sem distração.', minutes: 15, attribute: 'mente', xp: 30 },
  { title: 'Estude 25 min com foco total', desc: 'Um bloco inteiro num assunto só.', minutes: 25, attribute: 'mente', xp: 40 },
  { title: '5 min de respiração 4-7-8', desc: 'Inspira 4, segura 7, expira 8. Repete.', minutes: 5, attribute: 'espirito', xp: 25 },
  { title: 'Escreva 3 gratidões', desc: 'No diário ou no papel. Específicas.', minutes: 5, attribute: 'espirito', xp: 20 },
  { title: 'Mande mensagem pra alguém que ama', desc: 'Sem motivo. Só presença.', minutes: 3, attribute: 'social', xp: 25 },
  { title: 'Arrume seu espaço de trabalho', desc: 'Ordem externa, ordem interna.', minutes: 10, attribute: 'disciplina', xp: 20 },
  { title: 'Plano do próximo dia em 1 página', desc: '3 prioridades. Não mais.', minutes: 10, attribute: 'disciplina', xp: 25 },
];

export interface GeneratedChallenge extends DungeonTemplate { id: string }

export function rollDungeonChallenges(seed: string): GeneratedChallenge[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const rng = () => {
    h = (h * 9301 + 49297) % 233280;
    return Math.abs(h) / 233280;
  };
  const pool = [...TEMPLATE_BANK];
  const picked: DungeonTemplate[] = [];
  while (picked.length < 3 && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.map((t, i) => ({ id: `${seed}-${i}-${Math.floor(Math.random() * 9999)}`, ...t }));
}
