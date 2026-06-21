import { Swords, Sparkles, BookOpen, Eye, Gift, Timer, Trophy, ScrollText, Compass, MessageCircleHeart, type LucideIcon } from 'lucide-react';

export type TabId =
  | 'missions' | 'habits' | 'achievements'
  | 'mirror' | 'counsel' | 'journal'
  | 'timer' | 'awakening'
  | 'mentor'
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
      { id: 'awakening', label: 'Despertar', icon: ScrollText, description: 'Exercícios de escrita terapêutica' },
    ],
  },
  {
    id: 'tools',
    label: 'Ferramentas',
    tabs: [
      { id: 'timer', label: 'Timer', icon: Timer, description: 'Pomodoro e sessões focadas' },
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
