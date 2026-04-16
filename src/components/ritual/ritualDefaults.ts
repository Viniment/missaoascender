import type { RitualStep, RitualStepType, Ritual } from '@/lib/gameStore';

export const STEP_LABELS: Record<RitualStepType, string> = {
  preparacao: 'Preparação',
  visualizacao: 'Visualização do Desejo',
  barreira: 'Aparecimento da Barreira',
  confronto: 'Confronto',
  acao: 'Ação',
  retorno: 'Retorno ao Desejo',
  loop: 'Loop / Repetição',
  encerramento: 'Encerramento',
};

const DEFAULT_TEXTS: Record<RitualStepType, string> = {
  preparacao: 'Respire fundo. Sinta o peso do seu corpo. Você está aqui, agora.',
  visualizacao: 'Veja claramente o que você deseja. Sinta-o como real, vivo, presente.',
  barreira: 'Algo se ergue entre você e seu desejo. Observe-o com atenção.',
  confronto: 'Encare. Não recue. Reconheça seu poder diante disso.',
  acao: 'Atravesse. Quebre. Destrua. O caminho é seu.',
  retorno: 'O desejo está mais perto agora. Sinta a vitória aproximando-se.',
  loop: 'Repita. Cada ciclo te fortalece e te aproxima.',
  encerramento: 'Volte ao presente. Você é mais forte agora.',
};

const ORDER: RitualStepType[] = [
  'preparacao',
  'visualizacao',
  'barreira',
  'confronto',
  'acao',
  'retorno',
  'loop',
  'encerramento',
];

export function makeDefaultSteps(): RitualStep[] {
  return ORDER.map((type, idx) => ({
    id: crypto.randomUUID(),
    type,
    enabled: true,
    order: idx,
    durationSec: 30,
    intensity: 'medio',
    text: DEFAULT_TEXTS[type],
    actionType: type === 'acao' ? 'atravessar' : undefined,
  }));
}

export function makeDefaultRitual(): Omit<Ritual, 'id' | 'createdAt'> {
  return {
    name: 'Novo Ritual',
    objective: '',
    steps: makeDefaultSteps(),
    narrationStyle: 'calmo',
    useTTS: false,
    displayMode: 'texto',
    loopCount: 1,
    loopIncreaseIntensity: false,
    loopGapSec: 3,
  };
}
