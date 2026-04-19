import { Swords, Sparkles, BookOpen, Eye, Gift, Shield, Timer, Trophy, Layers, Flame, Waves, ScrollText, Compass, type LucideIcon } from 'lucide-react';

export type TabId =
  | 'missions' | 'habits' | 'challenges' | 'achievements'
  | 'mirror' | 'counsel' | 'journal' | 'stoic' | 'affirmations'
  | 'timer' | 'urge-surfing' | 'visualizar' | 'awakening'
  | 'rewards';

export interface TabDef {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
  core?: boolean; // cannot be disabled
}

export interface TabGroup {
  id: string;
  label: string;
  tabs: TabDef[];
}

export const TAB_GROUPS: TabGroup[] = [
  {
    id: 'action',
    label: 'Ação',
    tabs: [
      { id: 'missions', label: 'Missões', icon: Swords, description: 'Suas missões ativas e progresso', core: true },
      { id: 'habits', label: 'Hábitos', icon: Sparkles, description: 'Construa rotinas diárias', core: true },
      { id: 'challenges', label: 'Desafios', icon: Shield, description: 'Provações de múltiplas etapas' },
      { id: 'achievements', label: 'Conquistas', icon: Trophy, description: 'Marcos desbloqueados' },
    ],
  },
  {
    id: 'reflection',
    label: 'Reflexão',
    tabs: [
      { id: 'mirror', label: 'Espelho', icon: Eye, description: 'Veja sua sombra com clareza' },
      { id: 'counsel', label: 'Conselho', icon: Compass, description: 'Coach IA com seus dados reais' },
      { id: 'journal', label: 'Diário', icon: BookOpen, description: 'Registro de pensamentos e emoções' },
      { id: 'stoic', label: 'Estoicismo', icon: ScrollText, description: 'Reflexões diárias guiadas' },
      { id: 'affirmations', label: 'Afirmações', icon: Flame, description: 'Reprogramação mental diária' },
    ],
  },
  {
    id: 'tools',
    label: 'Ferramentas',
    tabs: [
      { id: 'timer', label: 'Timer', icon: Timer, description: 'Pomodoro e sessões focadas' },
      { id: 'urge-surfing', label: 'Urge Surfing', icon: Waves, description: 'Surfe os impulsos sem ceder' },
      { id: 'visualizar', label: 'Visualizar', icon: Layers, description: 'Quadro de visão e metas' },
      { id: 'awakening', label: 'Despertar', icon: Eye, description: 'Reconecte com seu propósito' },
    ],
  },
  {
    id: 'shop',
    label: 'Loja',
    tabs: [
      { id: 'rewards', label: 'Loja', icon: Gift, description: 'Troque ouro por recompensas' },
    ],
  },
];

export const ALL_TABS: TabDef[] = TAB_GROUPS.flatMap(g => g.tabs);
export const CORE_TAB_IDS: TabId[] = ALL_TABS.filter(t => t.core).map(t => t.id);
