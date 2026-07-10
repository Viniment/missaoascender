// Catálogo de itens compráveis com ouro na loja de recompensas.
// Temas e molduras (frames) do avatar.

import type { ThemeId } from '@/components/ThemeSelector';

export interface ShopTheme {
  id: ThemeId;
  name: string;
  description: string;
  cost: number;         // 0 = grátis / padrão
  preview: [string, string, string];
}

export const SHOP_THEMES: ShopTheme[] = [
  { id: 'neon-purple',   name: 'Neon Púrpura',    description: 'Solo Leveling clássico',    cost: 0,    preview: ['#020617','#7B2FF7','#A855F7'] },
  { id: 'red-black',     name: 'Sangue & Sombra', description: 'Escuro e agressivo',        cost: 400,  preview: ['#080000','#DC2626','#F97316'] },
  { id: 'cyber-blue',    name: 'Cyber Azul',      description: 'Frio e futurista',          cost: 400,  preview: ['#020A18','#0EA5E9','#38BDF8'] },
  { id: 'emerald',       name: 'Esmeralda',       description: 'Natureza e foco',           cost: 400,  preview: ['#011A0D','#22C55E','#4ADE80'] },
  { id: 'solar',         name: 'Solar',           description: 'Quente e poderoso',         cost: 500,  preview: ['#0A0500','#F59E0B','#FBBF24'] },
  { id: 'midnight-rose', name: 'Rosa Noturna',    description: 'Elegante e intenso',        cost: 500,  preview: ['#0A0310','#E11D8E','#F472B6'] },
  { id: 'arctic',        name: 'Ártico',          description: 'Gélido e preciso',          cost: 700,  preview: ['#030A12','#94A3B8','#E2E8F0'] },
];

export interface ShopFrame {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** classes aplicadas ao anel externo (ring) do avatar */
  ringClass: string;
  /** cor principal, para preview */
  color: string;
}

// Molduras animadas — todas usam apenas Tailwind + tokens semânticos + animações do index.css
export const SHOP_FRAMES: ShopFrame[] = [
  {
    id: 'iniciante',
    name: 'Aprendiz',
    description: 'Anel básico. Grátis para começar a jornada.',
    cost: 0,
    ringClass: 'border-2 border-primary/60',
    color: 'hsl(var(--primary))',
  },
  {
    id: 'ember',
    name: 'Ember Pulsante',
    description: 'Pulsa suavemente como brasa viva.',
    cost: 250,
    ringClass: 'border-2 border-primary animate-pulse-glow',
    color: '#F97316',
  },
  {
    id: 'runa',
    name: 'Runa Neon',
    description: 'Contorno duplo com brilho neon.',
    cost: 500,
    ringClass: 'border-[3px] border-primary glow-purple-strong',
    color: 'hsl(var(--primary))',
  },
  {
    id: 'raio',
    name: 'Raio Cibernético',
    description: 'Anel eletrificado com halo azul.',
    cost: 800,
    ringClass: 'border-[3px] border-neon-blue animate-pulse-glow',
    color: 'hsl(var(--neon-blue))',
  },
  {
    id: 'prismatico',
    name: 'Prismático',
    description: 'Rotação constante de gradiente arco-íris.',
    cost: 1500,
    ringClass: 'p-[3px] rounded-full bg-[conic-gradient(from_0deg,#f472b6,#a855f7,#38bdf8,#22c55e,#f59e0b,#f472b6)] animate-spin-slow',
    color: '#A855F7',
  },
  {
    id: 'monarca',
    name: 'Coroa do Monarca',
    description: 'Ouro sólido pulsante — só para quem reinar.',
    cost: 3000,
    ringClass: 'border-[3px] border-gold animate-pulse-glow',
    color: 'hsl(var(--gold))',
  },
];

export function getFrame(id: string | undefined): ShopFrame {
  return SHOP_FRAMES.find(f => f.id === id) || SHOP_FRAMES[0];
}

export function getTheme(id: string | undefined): ShopTheme {
  return SHOP_THEMES.find(t => t.id === id) || SHOP_THEMES[0];
}