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

// ============================================================
// TÍTULOS — texto exibido abaixo do nome no PlayerCard
// ============================================================
export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario';

export interface ShopTitle {
  id: string;
  name: string;      // texto do título ("O Imparável")
  description: string;
  cost: number;
  rarity: Rarity;
  /** classes tailwind aplicadas ao texto do título */
  className: string;
}

export const SHOP_TITLES: ShopTitle[] = [
  { id: 'aprendiz',    name: 'O Aprendiz',      description: 'Todo mestre começou aqui.',           cost: 0,    rarity: 'comum',    className: 'text-muted-foreground' },
  { id: 'disciplinado',name: 'O Disciplinado',  description: 'Consistência é sua arma.',            cost: 300,  rarity: 'comum',    className: 'text-primary' },
  { id: 'imparavel',   name: 'O Imparável',     description: 'Ninguém te para. Nem você mesmo.',    cost: 800,  rarity: 'raro',     className: 'text-neon-blue glow-text-blue' },
  { id: 'cacador',     name: 'Caçador de Monstros', description: 'Vive para a caçada.',             cost: 1200, rarity: 'raro',     className: 'text-success' },
  { id: 'sombra',      name: 'A Sombra',        description: 'Age no silêncio, colhe no ruído.',    cost: 2000, rarity: 'epico',    className: 'text-primary glow-text-purple' },
  { id: 'ascendente',  name: 'O Ascendente',    description: 'Sobe onde outros desistem.',          cost: 3000, rarity: 'epico',    className: 'text-gold glow-text-gold' },
  { id: 'monarca',     name: 'Monarca da Ascensão', description: 'O topo. E ainda em movimento.',   cost: 5000, rarity: 'lendario', className: 'text-gold glow-text-gold font-display uppercase tracking-widest' },
];

// ============================================================
// PETS — pequeno companheiro visual (emoji + aura)
// ============================================================
export interface ShopPet {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: Rarity;
  emoji: string;         // representação simples
  auraClass: string;     // ring/glow class ao redor do pet
}

export const SHOP_PETS: ShopPet[] = [
  { id: 'lobinho',   name: 'Lobinho da Alvorada',  description: 'Uiva quando você acorda cedo.',        cost: 500,  rarity: 'comum',    emoji: '🐺', auraClass: 'border-primary/60' },
  { id: 'coruja',    name: 'Coruja Estrategista',  description: 'Vê no escuro. Planeja no claro.',      cost: 800,  rarity: 'raro',     emoji: '🦉', auraClass: 'border-neon-blue glow-blue' },
  { id: 'fenix',     name: 'Fênix Renascida',      description: 'Renasce toda vez que você recomeça.',  cost: 1500, rarity: 'raro',     emoji: '🔥', auraClass: 'border-primary glow-purple' },
  { id: 'dragao',    name: 'Dragãozinho Sombrio',  description: 'Cospe fogo em cada tarefa concluída.', cost: 2500, rarity: 'epico',    emoji: '🐉', auraClass: 'border-primary glow-purple-strong animate-pulse-glow' },
  { id: 'unicornio', name: 'Unicórnio Prismático', description: 'Raro. Impossível de replicar.',        cost: 4000, rarity: 'lendario', emoji: '🦄', auraClass: 'border-gold glow-gold animate-pulse-glow' },
];

// ============================================================
// BAÚS — loot boxes com cooldown que sortem itens não-possuídos
// ============================================================
export interface ShopChest {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: Rarity;
  cooldownHours: number;
  /** faixa de ouro sorteada [min, max] */
  goldRange: [number, number];
  /** chance (0-1) de dropar um item cosmético não-possuído */
  itemChance: number;
  /** raridades permitidas ao sortear item */
  itemRarities: Rarity[];
  icon: string;
  color: string;
}

export const SHOP_CHESTS: ShopChest[] = [
  { id: 'bronze',   name: 'Baú de Bronze',   description: 'Ouro modesto e chance de item comum.',     cost: 200,  rarity: 'comum',    cooldownHours: 4,  goldRange: [50, 200],    itemChance: 0.25, itemRarities: ['comum'],                                icon: '📦', color: '#B08D57' },
  { id: 'prata',    name: 'Baú de Prata',    description: 'Ouro sólido + chance de item raro.',       cost: 600,  rarity: 'raro',     cooldownHours: 12, goldRange: [200, 700],   itemChance: 0.45, itemRarities: ['comum', 'raro'],                        icon: '🎁', color: '#C0C0C0' },
  { id: 'ouro',     name: 'Baú Dourado',     description: 'Grande recompensa + chance de item épico.',cost: 1500, rarity: 'epico',    cooldownHours: 24, goldRange: [700, 2000],  itemChance: 0.65, itemRarities: ['raro', 'epico'],                        icon: '🏆', color: '#F5C518' },
  { id: 'mitico',   name: 'Baú Mítico',      description: 'Chance real de item lendário.',            cost: 4000, rarity: 'lendario', cooldownHours: 72, goldRange: [1500, 5000], itemChance: 0.85, itemRarities: ['epico', 'lendario'],                    icon: '💠', color: '#A855F7' },
];

export const RARITY_LABEL: Record<Rarity, string> = {
  comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário',
};

export const RARITY_CLASS: Record<Rarity, string> = {
  comum:    'text-muted-foreground border-border',
  raro:     'text-neon-blue border-neon-blue/50',
  epico:    'text-primary border-primary/60 glow-purple',
  lendario: 'text-gold border-gold/70 glow-gold',
};

export function getTitle(id: string | undefined): ShopTitle | undefined {
  return SHOP_TITLES.find(t => t.id === id);
}
export function getPet(id: string | undefined): ShopPet | undefined {
  return SHOP_PETS.find(p => p.id === id);
}
export function getChest(id: string): ShopChest | undefined {
  return SHOP_CHESTS.find(c => c.id === id);
}