import { Swords, Sparkles, BookOpen, Gift, Trophy, ScrollText, Compass, MessageCircleHeart, Skull, Heart, type LucideIcon } from 'lucide-react';

export type TabId =
  | 'missions' | 'habits' | 'achievements'
  | 'counsel' | 'journal'
  | 'awakening'
  | 'mentor' | 'cbt'
  | 'areas' | 'dungeon' | 'bosses'
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
    id: 'rpg',
    label: 'RPG',
    tabs: [
      { id: 'areas', label: 'Áreas', icon: Heart, description: 'Áreas de vida + atributos que evoluem ao agir' },
      { id: 'bosses', label: 'Bosses', icon: Skull, description: 'Padrões reais para derrotar' },
    ],
  },
  {
    id: 'action',
    label: 'Ação',
    tabs: [
      { id: 'missions', label: 'Mini Vitórias', icon: Swords, description: 'Suas mini vitórias ativas e progresso', core: true },
      { id: 'habits', label: 'Hábitos', icon: Sparkles, description: 'Construa rotinas diárias', core: true },
      { id: 'achievements', label: 'Conquistas', icon: Trophy, description: 'Marcos desbloqueados' },
    ],
  },
  {
    id: 'reflection',
    label: 'Reflexão',
    tabs: [
      { id: 'counsel', label: 'Conselho', icon: Compass, description: 'Coach IA com seus dados reais' },
      { id: 'journal', label: 'Diário', icon: BookOpen, description: 'Registro de pensamentos e emoções' },
      { id: 'mentor', label: 'Mentor', icon: MessageCircleHeart, description: 'Chat com seu mentor interno', core: true },
      { id: 'awakening', label: 'Despertar', icon: ScrollText, description: 'Exercícios de escrita terapêutica' },
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
