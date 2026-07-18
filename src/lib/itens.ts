export type ItemCategoria = "hat" | "armor" | "aura";
export type ItemRaridade = "comum" | "raro" | "epico" | "lendario";

export type Item = {
  id: string;
  categoria: ItemCategoria;
  nome: string;
  emoji: string;          // display glyph
  raridade: ItemRaridade;
  preco: number | null;   // null => somente por conquista
  unlock?: string;        // conquista tipo que desbloqueia
  cor?: string;           // hex accent (aura color / armor tint)
  descricao: string;
};

export const RARIDADE_COR: Record<ItemRaridade, string> = {
  comum: "hsl(220 15% 60%)",
  raro: "hsl(210 90% 60%)",
  epico: "hsl(280 90% 65%)",
  lendario: "hsl(45 95% 55%)",
};

export const ITENS: Item[] = [
  // ---------- CHAPÉUS ----------
  { id: "hat_bandana",  categoria: "hat", nome: "Bandana",         emoji: "🩹", raridade: "comum",    preco: 40,  descricao: "Primeiro passo do aventureiro." },
  { id: "hat_bone",     categoria: "hat", nome: "Boné do Iniciado", emoji: "🧢", raridade: "comum",    preco: 80,  descricao: "Discreto, mas leal." },
  { id: "hat_capuz",    categoria: "hat", nome: "Capuz das Sombras", emoji: "🎩", raridade: "raro",    preco: 180, descricao: "Some entre as sombras do Sabotador." },
  { id: "hat_elmo",     categoria: "hat", nome: "Elmo de Aço",       emoji: "⛑️", raridade: "raro",    preco: 250, descricao: "Resistência forjada em constância." },
  { id: "hat_coroa",    categoria: "hat", nome: "Coroa do Vitorioso", emoji: "👑", raridade: "epico",   preco: 600, descricao: "Somente para quem persiste." },
  { id: "hat_aureola",  categoria: "hat", nome: "Auréola do Despertar", emoji: "😇", raridade: "lendario", preco: null, unlock: "nivel_10", descricao: "Concedida ao herói de nível 10." },

  // ---------- ARMADURA ----------
  { id: "arm_tunica",   categoria: "armor", nome: "Túnica de Pano",    emoji: "🥋", raridade: "comum",    preco: 50,  cor: "#64748b", descricao: "Roupas simples de treinador." },
  { id: "arm_couro",    categoria: "armor", nome: "Armadura de Couro", emoji: "🦺", raridade: "raro",    preco: 200, cor: "#a16207", descricao: "Proteção sólida contra recaídas." },
  { id: "arm_manto",    categoria: "armor", nome: "Manto Sombrio",     emoji: "🧥", raridade: "epico",    preco: 400, cor: "#4c1d95", descricao: "Manto do caçador de demônios internos." },
  { id: "arm_dourada",  categoria: "armor", nome: "Armadura Dourada",  emoji: "🛡️", raridade: "lendario", preco: 1000, cor: "#eab308", descricao: "Reservada aos disciplinados." },
  { id: "arm_iniciante", categoria: "armor", nome: "Traje do Iniciante", emoji: "👕", raridade: "comum", preco: null, unlock: "nivel_1", descricao: "Concedido no início da jornada." },

  // ---------- AURA ----------
  { id: "aura_sombra",  categoria: "aura", nome: "Aura das Sombras",   emoji: "🌑", raridade: "comum",    preco: 60,  cor: "#7B2FF7", descricao: "Halo roxo neon." },
  { id: "aura_gelo",    categoria: "aura", nome: "Aura de Gelo",       emoji: "❄️", raridade: "raro",    preco: 220, cor: "#22d3ee", descricao: "Frieza mental, foco absoluto." },
  { id: "aura_chama",   categoria: "aura", nome: "Aura de Chamas",     emoji: "🔥", raridade: "epico",    preco: 500, cor: "#f97316", descricao: "Fúria acesa contra o inimigo." },
  { id: "aura_divina",  categoria: "aura", nome: "Aura Divina",        emoji: "✨", raridade: "lendario", preco: null, unlock: "streak_7", descricao: "Desbloqueada ao manter 7 dias de streak." },
  { id: "aura_vitoria", categoria: "aura", nome: "Aura da Vitória",    emoji: "🏆", raridade: "lendario", preco: null, unlock: "inimigo_derrotado", descricao: "Ao derrotar seu primeiro Inimigo." },
];

export const ITENS_INICIAIS = ["arm_iniciante"];

export function getItem(id?: string | null) {
  if (!id) return null;
  return ITENS.find(i => i.id === id) ?? null;
}

export type AvatarEquipado = {
  base?: string;
  face?: FaceShape;
  skin?: SkinTone;
  hair?: HairStyle;
  hairColor?: string;
  eyes?: string;
  mark?: FaceMark;
  hat?: string | null;
  armor?: string | null;
  aura?: string | null;
};

/* -------- Aparência customizável (grátis, não é item de loja) -------- */
export type FaceShape = "round" | "square" | "oval" | "angular" | "diamond";
export type SkinTone  = "porcelana" | "clara" | "dourada" | "oliva" | "cobre" | "bronze" | "cacau" | "ebano";
export type HairStyle = "none" | "buzz" | "short" | "spiky" | "mohawk" | "long" | "topknot" | "curly";
export type FaceMark  = "none" | "scar" | "freckles" | "tattoo" | "warpaint";

export const FACE_SHAPES: { id: FaceShape; nome: string }[] = [
  { id: "square",  nome: "Quadrado" },
  { id: "round",   nome: "Arredondado" },
  { id: "oval",    nome: "Oval" },
  { id: "angular", nome: "Angular" },
];

export const SKIN_TONES: { id: SkinTone; nome: string; base: string; light: string; shade: string; deep: string }[] = [
  { id: "porcelana", nome: "Porcelana", base: "#f7d7bd", light: "#ffe8d1", shade: "#d3a684", deep: "#946b4d" },
  { id: "clara",     nome: "Clara",     base: "#f2c39a", light: "#ffd9b3", shade: "#c48a63", deep: "#8b5a3c" },
  { id: "dourada",   nome: "Dourada",   base: "#e8b078", light: "#f7c894", shade: "#b17849", deep: "#7a4a25" },
  { id: "oliva",     nome: "Oliva",     base: "#c99a6b", light: "#dfb488", shade: "#8f6640", deep: "#5c3d20" },
  { id: "cobre",     nome: "Cobre",     base: "#b17753", light: "#c99175", shade: "#7d4a2e", deep: "#4d2a15" },
  { id: "bronze",    nome: "Bronze",    base: "#8d5a3c", light: "#a67252", shade: "#5f3822", deep: "#39200f" },
  { id: "cacau",     nome: "Cacau",     base: "#6e412a", light: "#845540", shade: "#48281a", deep: "#2c160c" },
  { id: "ebano",     nome: "Ébano",     base: "#4a2b1c", light: "#5d3a29", shade: "#2e180d", deep: "#170a05" },
];

export const HAIR_STYLES: { id: HairStyle; nome: string }[] = [
  { id: "none",    nome: "Careca" },
  { id: "buzz",    nome: "Raspado" },
  { id: "short",   nome: "Curto" },
  { id: "spiky",   nome: "Espetado" },
  { id: "mohawk",  nome: "Moicano" },
  { id: "long",    nome: "Longo" },
  { id: "topknot", nome: "Coque" },
  { id: "curly",   nome: "Cacheado" },
];

export const HAIR_COLORS: { id: string; nome: string; base: string; light: string }[] = [
  { id: "onix",     nome: "Ônix",      base: "#141018", light: "#2b2230" },
  { id: "castanho", nome: "Castanho",  base: "#3b220f", light: "#5a3520" },
  { id: "chocolate",nome: "Chocolate", base: "#2a1a10", light: "#4a2f1e" },
  { id: "loiro",    nome: "Loiro",     base: "#c99b4a", light: "#ecc471" },
  { id: "ruivo",    nome: "Ruivo",     base: "#8a2c14", light: "#c04a25" },
  { id: "prata",    nome: "Prata",     base: "#c4c8d0", light: "#eef1f6" },
  { id: "neon",     nome: "Neon",      base: "#7B2FF7", light: "#c084fc" },
  { id: "cyber",    nome: "Cyber",     base: "#0891b2", light: "#22d3ee" },
];

export const EYE_COLORS: { id: string; nome: string; cor: string }[] = [
  { id: "azul",    nome: "Azul",    cor: "#2563eb" },
  { id: "verde",   nome: "Verde",   cor: "#16a34a" },
  { id: "castanho",nome: "Castanho",cor: "#78350f" },
  { id: "ambar",   nome: "Âmbar",   cor: "#d97706" },
  { id: "cinza",   nome: "Cinza",   cor: "#475569" },
  { id: "rubi",    nome: "Rubi",    cor: "#dc2626" },
  { id: "neon",    nome: "Neon",    cor: "#a855f7" },
];

export const FACE_MARKS: { id: FaceMark; nome: string }[] = [
  { id: "none",     nome: "Nenhuma" },
  { id: "scar",     nome: "Cicatriz" },
  { id: "freckles", nome: "Sardas" },
  { id: "tattoo",   nome: "Tatuagem" },
  { id: "warpaint", nome: "Pintura" },
];

export const APARENCIA_PADRAO = {
  face: "square" as FaceShape,
  skin: "clara" as SkinTone,
  hair: "short" as HairStyle,
  hairColor: "#2a1a10",
  eyes: "#2563eb",
  mark: "none" as FaceMark,
};