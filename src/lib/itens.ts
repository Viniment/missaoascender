export type ItemCategoria =
  | "hat" | "armor" | "aura"
  | "mask" | "pet" | "frame"
  | "card_bg" | "app_bg";
export type ItemRaridade = "comum" | "raro" | "epico" | "lendario" | "mitico";

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
  mitico: "hsl(320 95% 65%)",
};

export const RARIDADE_LABEL: Record<ItemRaridade, string> = {
  comum: "COMUM",
  raro: "RARO",
  epico: "ÉPICO",
  lendario: "LENDÁRIO",
  mitico: "MÍTICO",
};

export const RARIDADE_BG: Record<ItemRaridade, string> = {
  comum: "linear-gradient(135deg, hsl(220 15% 25% / 0.6), hsl(220 20% 12% / 0.7))",
  raro:  "linear-gradient(135deg, hsl(210 90% 35% / 0.55), hsl(220 40% 10% / 0.75))",
  epico: "linear-gradient(135deg, hsl(280 90% 40% / 0.55), hsl(260 40% 8% / 0.8))",
  lendario: "linear-gradient(135deg, hsl(45 95% 45% / 0.55), hsl(30 60% 8% / 0.85))",
  mitico: "linear-gradient(135deg, hsl(320 95% 55% / 0.55), hsl(260 90% 45% / 0.55), hsl(190 95% 45% / 0.55))",
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
  { id: "arm_cristal",  categoria: "armor", nome: "Armadura de Cristal", emoji: "💎", raridade: "raro",    preco: 320, cor: "#67e8f9", descricao: "Placas geladas que refletem a luz do sistema." },
  { id: "arm_lich",     categoria: "armor", nome: "Placas do Lich",     emoji: "☠️", raridade: "epico",   preco: 720, cor: "#6d28d9", descricao: "Runas necróticas gravadas em ébano." },
  { id: "arm_dragao",   categoria: "armor", nome: "Escamas do Dragão",  emoji: "🐲", raridade: "lendario", preco: 1600, cor: "#b91c1c", descricao: "Cada escama forjada em fúria disciplinada." },
  { id: "arm_divina",   categoria: "armor", nome: "Vestes Divinas",     emoji: "🕊️", raridade: "mitico",  preco: 3800, cor: "#fde68a", descricao: "Tecidas de pura vontade — irradiam ascensão." },
  { id: "arm_ferro",    categoria: "armor", nome: "Placas de Ferro",    emoji: "⚙️", raridade: "raro",    preco: 280, cor: "#94a3b8", descricao: "Aço rebitado — o padrão dos veteranos." },
  { id: "arm_ninja",    categoria: "armor", nome: "Traje Shinobi",      emoji: "🥷", raridade: "raro",    preco: 340, cor: "#1e293b", descricao: "Tecido leve com faixas cruzadas — silêncio absoluto." },
  { id: "arm_arcano",   categoria: "armor", nome: "Manto Arcano",       emoji: "🔯", raridade: "epico",   preco: 820, cor: "#3b82f6", descricao: "Tecido bordado com sigilos que reagem à intenção." },
  { id: "arm_infernal", categoria: "armor", nome: "Armadura Infernal",  emoji: "😈", raridade: "lendario", preco: 1800, cor: "#ef4444", descricao: "Forjada em brasas — pulsa como coração de vulcão." },
  { id: "arm_estelar",  categoria: "armor", nome: "Placas Estelares",   emoji: "🌟", raridade: "mitico",  preco: 4200, cor: "#a78bfa", descricao: "Metal caído de estrelas — carrega o próprio cosmos." },

  // ---------- AURA ----------
  { id: "aura_sombra",  categoria: "aura", nome: "Aura das Sombras",   emoji: "🌑", raridade: "comum",    preco: 60,  cor: "#7B2FF7", descricao: "Halo roxo neon." },
  { id: "aura_gelo",    categoria: "aura", nome: "Aura de Gelo",       emoji: "❄️", raridade: "raro",    preco: 220, cor: "#22d3ee", descricao: "Frieza mental, foco absoluto." },
  { id: "aura_chama",   categoria: "aura", nome: "Aura de Chamas",     emoji: "🔥", raridade: "epico",    preco: 500, cor: "#f97316", descricao: "Fúria acesa contra o inimigo." },
  { id: "aura_divina",  categoria: "aura", nome: "Aura Divina",        emoji: "✨", raridade: "lendario", preco: null, unlock: "streak_7", descricao: "Desbloqueada ao manter 7 dias de streak." },
  { id: "aura_vitoria", categoria: "aura", nome: "Aura da Vitória",    emoji: "🏆", raridade: "lendario", preco: null, unlock: "inimigo_derrotado", descricao: "Ao derrotar seu primeiro Inimigo." },

  // ---------- MÁSCARAS ----------
  { id: "mk_bandana",    categoria: "mask", nome: "Bandana Ninja",       emoji: "🥷", raridade: "comum",   preco: 70,  cor: "#0f172a", descricao: "Silêncio antes do golpe." },
  { id: "mk_visor",      categoria: "mask", nome: "Visor Cyber",         emoji: "🕶️", raridade: "raro",    preco: 300, cor: "#22d3ee", descricao: "HUD tático permanente." },
  { id: "mk_oni",        categoria: "mask", nome: "Máscara de Oni",      emoji: "👹", raridade: "epico",   preco: 720, cor: "#dc2626", descricao: "O demônio que você domou." },
  { id: "mk_anbu",       categoria: "mask", nome: "Máscara Anbu",        emoji: "🎭", raridade: "epico",   preco: 780, cor: "#e5e7eb", descricao: "Anônimo, letal, sem hesitação." },
  { id: "mk_skull",      categoria: "mask", nome: "Half-Skull",          emoji: "💀", raridade: "lendario", preco: 1400, cor: "#f8fafc", descricao: "Metade morto para o Inimigo. Todo vivo para o sonho." },

  // ---------- PETS / FAMILIARES ----------
  { id: "pet_slime",     categoria: "pet", nome: "Slime Roxo",           emoji: "🟣", raridade: "comum",    preco: 100, cor: "#7B2FF7", descricao: "Grudento e leal. ✦ Habilidade: Faro de Ouro — +10% de ouro em cada ação positiva." },
  { id: "pet_lobo",      categoria: "pet", nome: "Lobo Sombra",          emoji: "🐺", raridade: "raro",    preco: 380, cor: "#334155", descricao: "Instinto e alerta constantes. ✦ Habilidade: Uivo de Foco — +10% de XP em cada ação positiva." },
  { id: "pet_coruja",    categoria: "pet", nome: "Coruja Mística",       emoji: "🦉", raridade: "raro",    preco: 420, cor: "#a78bfa", descricao: "Vê no escuro o que você ainda evita. ✦ Habilidade: Visão Noturna — reduz em 25% a vida perdida ao registrar hábitos negativos." },
  { id: "pet_dragao",    categoria: "pet", nome: "Filhote de Dragão",    emoji: "🐉", raridade: "epico",   preco: 900, cor: "#16a34a", descricao: "Pequeno, mas cospe fogo em seus limites. ✦ Habilidade: Sopro de Brasa — +20% de ouro em ações positivas e no baú diário." },
  { id: "pet_orb",       categoria: "pet", nome: "Orb do Sistema",       emoji: "🔮", raridade: "lendario", preco: 1800, cor: "#c084fc", descricao: "Uma IA orbital te acompanhando. ✦ Habilidade: Análise do Sistema — +15% de XP em todas as ações positivas." },
  { id: "pet_fenix",     categoria: "pet", nome: "Fênix Bebê",           emoji: "🐣", raridade: "mitico",  preco: 3400, cor: "#f97316", descricao: "Renasce toda vez que você recomeça. ✦ Habilidade: Chama Restauradora — cura +2 de vida a cada ação positiva concluída." },

  // ---------- MOLDURAS ----------
  { id: "fr_bronze",     categoria: "frame", nome: "Moldura de Bronze",  emoji: "🟫", raridade: "comum",   preco: 150, cor: "#b45309", descricao: "Primeira placa do herói." },
  { id: "fr_prata",      categoria: "frame", nome: "Moldura de Prata",   emoji: "⬜", raridade: "raro",    preco: 400, cor: "#cbd5e1", descricao: "Reflexo do próprio esforço." },
  { id: "fr_ouro",       categoria: "frame", nome: "Moldura de Ouro",    emoji: "🟨", raridade: "epico",   preco: 900, cor: "#eab308", descricao: "Ostentação merecida." },
  { id: "fr_runica",     categoria: "frame", nome: "Moldura Rúnica",     emoji: "🔷", raridade: "lendario", preco: 1900, cor: "#a855f7", descricao: "Runas giram ao redor do seu retrato." },
  { id: "fr_mitica",     categoria: "frame", nome: "Moldura Mítica",     emoji: "🌈", raridade: "mitico",  preco: 4000, cor: "#f472b6", descricao: "Halo iridescente. Só para lendas." },
  { id: "fr_plasma",     categoria: "frame", nome: "Moldura de Plasma",  emoji: "⚡", raridade: "raro",    preco: 520, cor: "#22d3ee", descricao: "Anel de plasma girando em pulso ciano." },
  { id: "fr_flama",      categoria: "frame", nome: "Moldura Flamejante", emoji: "🔥", raridade: "epico",   preco: 1100, cor: "#f97316", descricao: "Chamas orbitam seu retrato sem cessar." },
  { id: "fr_etereo",     categoria: "frame", nome: "Moldura Etérea",     emoji: "🌀", raridade: "epico",   preco: 1300, cor: "#c084fc", descricao: "Fantasmas violeta orbitando o herói." },
  { id: "fr_dragao",     categoria: "frame", nome: "Coroa do Dragão",    emoji: "🐉", raridade: "lendario", preco: 2400, cor: "#dc2626", descricao: "Duplo anel escamado em rotação contrária." },

  // ---------- FUNDO DO PLAYER CARD ----------
  { id: "cbg_void",     categoria: "card_bg", nome: "Vazio Neon",        emoji: "🌌", raridade: "comum",   preco: 120, cor: "#7B2FF7", descricao: "Grade neon roxa sobre o vazio." },
  { id: "cbg_cyber",    categoria: "card_bg", nome: "Grid Cyber",         emoji: "🟦", raridade: "raro",    preco: 320, cor: "#22d3ee", descricao: "Linhas ciano em perspectiva infinita." },
  { id: "cbg_ember",    categoria: "card_bg", nome: "Brasa Viva",         emoji: "🔥", raridade: "raro",    preco: 380, cor: "#f97316", descricao: "Brasas quentes pulsando ao fundo." },
  { id: "cbg_nebula",   categoria: "card_bg", nome: "Nebulosa",          emoji: "🪐", raridade: "epico",   preco: 720, cor: "#a855f7", descricao: "Nuvens cósmicas se movendo lentamente." },
  { id: "cbg_matrix",   categoria: "card_bg", nome: "Código Matrix",     emoji: "🟩", raridade: "epico",   preco: 780, cor: "#22c55e", descricao: "Chuva verde do sistema." },
  { id: "cbg_holo",     categoria: "card_bg", nome: "Holograma",         emoji: "💠", raridade: "lendario", preco: 1600, cor: "#c084fc", descricao: "Reflexos iridescentes em varredura." },
  { id: "cbg_prisma",   categoria: "card_bg", nome: "Prisma Mítico",     emoji: "🌈", raridade: "mitico",  preco: 3200, cor: "#f472b6", descricao: "Arco prismático em rotação eterna." },

  // ---------- FUNDO DO APP (animado) ----------
  { id: "abg_particles", categoria: "app_bg", nome: "Partículas Neon",   emoji: "✨", raridade: "comum",   preco: 0,   cor: "#7B2FF7", descricao: "O fundo padrão do sistema — partículas roxas flutuantes.", unlock: "nivel_1" },
  { id: "abg_stars",     categoria: "app_bg", nome: "Céu Estrelado",     emoji: "⭐", raridade: "raro",    preco: 400, cor: "#e0e7ff", descricao: "Milhares de estrelas cintilando na noite." },
  { id: "abg_aurora",    categoria: "app_bg", nome: "Aurora Boreal",     emoji: "🌠", raridade: "epico",   preco: 900, cor: "#22d3ee", descricao: "Cortinas de luz ondulando no céu." },
  { id: "abg_embers",    categoria: "app_bg", nome: "Chuva de Brasas",   emoji: "🔥", raridade: "epico",   preco: 950, cor: "#f97316", descricao: "Brasas quentes subindo pelo ambiente." },
  { id: "abg_rain",      categoria: "app_bg", nome: "Chuva Digital",     emoji: "💚", raridade: "lendario", preco: 1800, cor: "#22c55e", descricao: "Código verde despencando do topo." },
  { id: "abg_void",      categoria: "app_bg", nome: "Vórtice Sombrio",   emoji: "🌀", raridade: "mitico",  preco: 3600, cor: "#a855f7", descricao: "Portal roxo pulsando com energia mítica." },
];

export const ITENS_INICIAIS = ["arm_iniciante"];

/* -------- Fundos (Player Card + App) ----------
 * Renderizados por classes CSS animadas em index.css (.bg-<id>).
 */
export type FundoDef = { className: string; label: string };

export const CARD_BACKGROUNDS: Record<string, FundoDef> = {
  cbg_void:   { className: "cbg-void",   label: "Vazio Neon" },
  cbg_cyber:  { className: "cbg-cyber",  label: "Grid Cyber" },
  cbg_ember:  { className: "cbg-ember",  label: "Brasa Viva" },
  cbg_nebula: { className: "cbg-nebula", label: "Nebulosa" },
  cbg_matrix: { className: "cbg-matrix", label: "Código Matrix" },
  cbg_holo:   { className: "cbg-holo",   label: "Holograma" },
  cbg_prisma: { className: "cbg-prisma", label: "Prisma Mítico" },
};

export const APP_BACKGROUNDS: Record<string, FundoDef> = {
  abg_particles: { className: "abg-particles", label: "Partículas Neon" },
  abg_stars:     { className: "abg-stars",     label: "Céu Estrelado" },
  abg_aurora:    { className: "abg-aurora",    label: "Aurora Boreal" },
  abg_embers:    { className: "abg-embers",    label: "Chuva de Brasas" },
  abg_rain:      { className: "abg-rain",      label: "Chuva Digital" },
  abg_void:      { className: "abg-void",      label: "Vórtice Sombrio" },
};

export function getItem(id?: string | null) {
  if (!id) return null;
  return ITENS.find(i => i.id === id) ?? null;
}

/* -------- Habilidades dos Pets (efeitos sutis) --------
 * Todos os bônus são determinísticos (sem aleatoriedade) para que
 * marcar/desmarcar um hábito seja perfeitamente reversível.
 * Apenas 1 pet pode estar equipado por vez.
 */
export type PetSkill = {
  ouroBonusPct?: number;   // aplicado ao ouro de hábitos positivos e ao baú diário
  xpBonusPct?: number;     // aplicado ao XP de hábitos positivos
  danoReducaoPct?: number; // reduz vida perdida em hábitos negativos
  curaPorHabito?: number;  // cura fixa somada ao completar hábito positivo
};

export const PET_SKILLS: Record<string, PetSkill> = {
  pet_slime:  { ouroBonusPct: 0.10 },
  pet_lobo:   { xpBonusPct:   0.10 },
  pet_coruja: { danoReducaoPct: 0.25 },
  pet_dragao: { ouroBonusPct: 0.20 },
  pet_orb:    { xpBonusPct:   0.15 },
  pet_fenix:  { curaPorHabito: 2 },
};

export function getPetSkill(petId?: string | null): PetSkill {
  if (!petId) return {};
  return PET_SKILLS[petId] ?? {};
}

export type AvatarEquipado = {
  base?: string;
  face?: FaceShape;
  skin?: SkinTone;
  hair?: HairStyle;
  hairColor?: string;
  eyes?: string;
  mark?: FaceMark;
  beard?: BeardStyle;
  hat?: string | null;
  armor?: string | null;
  aura?: string | null;
  mask?: string | null;
  pet?: string | null;
  frame?: string | null;
  cardBg?: string | null;
  appBg?: string | null;
};

/* -------- Aparência customizável (grátis, não é item de loja) -------- */
export type FaceShape = "round" | "square" | "oval" | "angular" | "diamond";
export type SkinTone  = "porcelana" | "clara" | "dourada" | "oliva" | "cobre" | "bronze" | "cacau" | "ebano";
export type HairStyle = "none" | "buzz" | "short" | "spiky" | "mohawk" | "long" | "topknot" | "curly" | "slick" | "undercut" | "ponytail" | "afro" | "dreads" | "samurai" | "wavy" | "wildmane";
export type FaceMark  = "none" | "scar" | "freckles" | "tattoo" | "warpaint";
export type BeardStyle = "none" | "stubble" | "mustache" | "goatee" | "full" | "viking" | "chinstrap" | "circle" | "muttonchops" | "boxed" | "anchor" | "handlebar";

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
  { id: "slick",     nome: "Penteado p/ trás" },
  { id: "undercut",  nome: "Undercut" },
  { id: "ponytail",  nome: "Rabo de cavalo" },
  { id: "afro",      nome: "Afro" },
  { id: "dreads",    nome: "Dreads" },
  { id: "samurai",   nome: "Samurai" },
  { id: "wavy",      nome: "Ondulado" },
  { id: "wildmane",  nome: "Juba selvagem" },
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

export const BEARD_STYLES: { id: BeardStyle; nome: string }[] = [
  { id: "none",     nome: "Sem Barba" },
  { id: "stubble",  nome: "Por Fazer" },
  { id: "mustache", nome: "Bigode" },
  { id: "goatee",   nome: "Cavanhaque" },
  { id: "full",     nome: "Cheia" },
  { id: "viking",   nome: "Viking" },
  { id: "chinstrap",  nome: "Chinstrap" },
  { id: "circle",     nome: "Circular" },
  { id: "muttonchops",nome: "Costeletas" },
  { id: "boxed",      nome: "Aparada" },
  { id: "anchor",     nome: "Âncora" },
  { id: "handlebar",  nome: "Guidão" },
];

export const APARENCIA_PADRAO = {
  face: "square" as FaceShape,
  skin: "clara" as SkinTone,
  hair: "short" as HairStyle,
  hairColor: "#2a1a10",
  eyes: "#2563eb",
  mark: "none" as FaceMark,
  beard: "none" as BeardStyle,
};