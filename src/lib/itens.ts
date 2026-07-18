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
  hat?: string | null;
  armor?: string | null;
  aura?: string | null;
};