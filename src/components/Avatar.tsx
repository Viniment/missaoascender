import { getItem, AvatarEquipado, SKIN_TONES, APARENCIA_PADRAO, FaceShape, HairStyle, FaceMark, SkinTone } from "@/lib/itens";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
const SIZE_PX: Record<Size, number> = { sm: 56, md: 96, lg: 128, xl: 176 };

// Bust-only pixel avatar. 32x32 viewBox, com formatos e cores parametrizados.
// Head bounding box: x 8–23, y 4–19 (16x16 face grid) — recortado por FACE_ROWS.
// Neck: x 13–18, y 20–22.  Torso: x 3–28, y 23–31.

const OUTLINE   = "#0a0a0f";
const EYE_WHITE = "#f8fafc";
const NEON      = "#c084fc"; // rim-light neon signature

function px(x: number, y: number, w = 1, h = 1, fill = "#000") {
  return <rect key={`${x}-${y}-${w}-${h}-${fill}`} x={x} y={y} width={w} height={h} fill={fill} />;
}

/* ---------- FACE SHAPES ----------
 * Cada rosto = para y=4..19 devolve [xLeft, xRight] inclusivo. Fora disso é ar.
 */
function faceRows(shape: FaceShape): Array<[number, number]> {
  const rows: Array<[number, number]> = [];
  const push = (l: number, r: number) => rows.push([l, r]);
  if (shape === "square") {
    for (let y = 4; y <= 19; y++) push(8, 23);
  } else if (shape === "round") {
    for (let y = 4; y <= 19; y++) {
      if (y === 4 || y === 19) push(10, 21);
      else if (y === 5 || y === 18) push(9, 22);
      else push(8, 23);
    }
  } else if (shape === "oval") {
    for (let y = 4; y <= 19; y++) {
      if (y === 4) push(11, 20);
      else if (y === 5) push(10, 21);
      else if (y === 6 || y === 18) push(9, 22);
      else if (y === 19) push(10, 21);
      else push(8, 23);
    }
  } else if (shape === "angular") {
    for (let y = 4; y <= 19; y++) {
      if (y === 4) push(9, 22);
      else if (y <= 15) push(8, 23);
      else if (y === 16) push(9, 22);
      else if (y === 17) push(9, 22);
      else if (y === 18) push(10, 21);
      else push(11, 20); // chin pontudo
    }
  } else { // diamond
    for (let y = 4; y <= 19; y++) {
      if (y === 4) push(11, 20);
      else if (y === 5) push(10, 21);
      else if (y >= 6 && y <= 13) push(8, 23);
      else if (y === 14) push(9, 22);
      else if (y === 15) push(10, 21);
      else if (y === 16) push(11, 20);
      else if (y === 17) push(12, 19);
      else if (y === 18) push(13, 18);
      else push(14, 17);
    }
  }
  return rows;
}

function renderFace(shape: FaceShape, skin: (typeof SKIN_TONES)[number]) {
  const rows = faceRows(shape);
  const nodes: JSX.Element[] = [];
  // fill + outline
  rows.forEach(([l, r], i) => {
    const y = 4 + i;
    nodes.push(px(l, y, r - l + 1, 1, skin.base));
    // outline left/right
    nodes.push(px(l - 1, y, 1, 1, OUTLINE));
    nodes.push(px(r + 1, y, 1, 1, OUTLINE));
  });
  // top outline
  const [tl, tr] = rows[0];
  nodes.push(px(tl, 3, tr - tl + 1, 1, OUTLINE));
  // bottom outline
  const [bl, br] = rows[rows.length - 1];
  nodes.push(px(bl, 20, br - bl + 1, 1, OUTLINE));
  // shading strip on right (form)
  rows.forEach(([l, r], i) => {
    const y = 4 + i;
    if (y >= 6 && y <= 18) nodes.push(px(r, y, 1, 1, skin.shade));
  });
  // rim light (neon) — signature toque de estilo
  rows.forEach(([l], i) => {
    const y = 4 + i;
    if (y >= 6 && y <= 17) nodes.push(<rect key={`rim-${y}`} x={l} y={y} width={1} height={1} fill={NEON} opacity={0.35} />);
  });
  // cheek highlight
  const cheekRow = rows.find((_, i) => 4 + i === 14);
  if (cheekRow) {
    nodes.push(px(cheekRow[0] + 1, 14, 2, 1, skin.light));
    nodes.push(px(cheekRow[1] - 2, 14, 2, 1, skin.light));
  }
  // jaw shadow (bottom 2 rows)
  for (let i = rows.length - 2; i < rows.length; i++) {
    const [l, r] = rows[i];
    nodes.push(px(l, 4 + i, r - l + 1, 1, skin.shade));
  }
  // deep chin
  const last = rows[rows.length - 1];
  nodes.push(px(last[0], 19, last[1] - last[0] + 1, 1, skin.deep));
  return <g>{nodes}</g>;
}

/* ---------- FEATURES (eyes, brows, nose, mouth) ---------- */
function renderFeatures(eyes: string, skin: (typeof SKIN_TONES)[number], hairBase: string) {
  return (
    <g shapeRendering="crispEdges">
      {/* eyebrows */}
      {px(10, 10, 3, 1, hairBase)}
      {px(19, 10, 3, 1, hairBase)}
      {/* eye sockets shadow */}
      {px(10, 11, 3, 1, skin.shade)}
      {px(19, 11, 3, 1, skin.shade)}
      {/* eyes (white + pupil + outline) */}
      {px(10, 12, 3, 2, EYE_WHITE)}
      {px(19, 12, 3, 2, EYE_WHITE)}
      {px(11, 12, 2, 2, eyes)}
      {px(20, 12, 2, 2, eyes)}
      {px(11, 12, 1, 1, OUTLINE)}
      {px(20, 12, 1, 1, OUTLINE)}
      {/* eye shine (unique flair) */}
      {px(12, 12, 1, 1, EYE_WHITE)}
      {px(21, 12, 1, 1, EYE_WHITE)}
      {/* nose */}
      {px(15, 14, 2, 3, skin.shade)}
      {px(15, 16, 2, 1, skin.deep)}
      {px(15, 14, 1, 1, skin.light)}
      {/* mouth */}
      {px(13, 18, 6, 1, skin.deep)}
      {px(14, 18, 4, 1, "#7a2828")}
    </g>
  );
}

/* ---------- HAIR ---------- */
function renderHair(style: HairStyle, base: string, light: string, shape: FaceShape) {
  if (style === "none") return null;
  const rows = faceRows(shape);
  const topRow = rows[0]; // y=4 bounds
  const els: JSX.Element[] = [];
  const push = (x: number, y: number, w = 1, h = 1, fill = base) => els.push(px(x, y, w, h, fill));

  if (style === "buzz") {
    // fina camada seguindo o topo da cabeça
    for (let i = 0; i < 2; i++) {
      const [l, r] = rows[i];
      push(l, 4 + i, r - l + 1, 1, base);
    }
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "short") {
    for (let i = 0; i < 4; i++) {
      const [l, r] = rows[i];
      push(l, 4 + i, r - l + 1, 1, base);
    }
    // franjinha central
    push(14, 8, 4, 1, base);
    // highlight
    push(topRow[0] + 2, 4, 3, 1, light);
    push(topRow[0] + 7, 4, 3, 1, light);
    // costeletas
    push(rows[4][0], 8, 1, 2, base);
    push(rows[4][1], 8, 1, 2, base);
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "spiky") {
    // base
    for (let i = 0; i < 3; i++) {
      const [l, r] = rows[i];
      push(l, 4 + i, r - l + 1, 1, base);
    }
    // espetos acima do topo
    push(9, 3, 1, 1, base); push(9, 2, 1, 1, base);
    push(12, 3, 1, 1, base); push(12, 1, 1, 2, base);
    push(15, 3, 1, 1, base); push(15, 2, 1, 1, base);
    push(18, 3, 1, 1, base); push(18, 1, 1, 2, base);
    push(21, 3, 1, 1, base); push(21, 2, 1, 1, base);
    // highlight
    push(10, 5, 2, 1, light); push(18, 5, 2, 1, light);
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "mohawk") {
    // faixa central alta
    push(14, 1, 4, 6, base);
    push(15, 0, 2, 1, base);
    // laterais raspadas com tom mais fraco
    for (let i = 0; i < 3; i++) {
      const [l, r] = rows[i];
      push(l, 4 + i, 4, 1, light);
      push(r - 3, 4 + i, 4, 1, light);
    }
    push(15, 2, 2, 1, light);
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "long") {
    for (let i = 0; i < 4; i++) {
      const [l, r] = rows[i];
      push(l, 4 + i, r - l + 1, 1, base);
    }
    // franja frontal
    push(9, 8, 6, 1, base);
    push(18, 8, 5, 1, base);
    // laterais descendo até y=15
    for (let y = 8; y <= 15; y++) {
      const row = rows[y - 4] ?? rows[rows.length - 1];
      push(row[0] - 1, y, 1, 1, base);
      push(row[1] + 1, y, 1, 1, base);
    }
    // highlight
    push(11, 5, 4, 1, light);
    push(17, 5, 4, 1, light);
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "topknot") {
    for (let i = 0; i < 3; i++) {
      const [l, r] = rows[i];
      push(l, 4 + i, r - l + 1, 1, base);
    }
    // coque
    push(14, 1, 4, 2, base);
    push(13, 2, 6, 1, base);
    push(15, 0, 2, 1, base);
    push(14, 1, 2, 1, light);
    // faixa
    push(8, 6, 16, 1, "#0f172a");
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "curly") {
    // volume cacheado ao redor do topo
    for (let i = 0; i < 4; i++) {
      const [l, r] = rows[i];
      push(l - 1, 4 + i, r - l + 3, 1, base);
    }
    // bolinhas de cachos acima
    push(9, 2, 2, 2, base);
    push(12, 1, 2, 2, base);
    push(15, 2, 2, 2, base);
    push(18, 1, 2, 2, base);
    push(21, 2, 2, 2, base);
    push(10, 2, 1, 1, light);
    push(16, 2, 1, 1, light);
    push(19, 1, 1, 1, light);
    return <g shapeRendering="crispEdges">{els}</g>;
  }
  return null;
}

/* ---------- MARKS ---------- */
function renderMark(mark: FaceMark, skin: (typeof SKIN_TONES)[number]) {
  if (mark === "none") return null;
  if (mark === "scar") {
    return (
      <g shapeRendering="crispEdges">
        {px(9, 11, 1, 1, "#b91c1c")}
        {px(9, 12, 1, 1, "#b91c1c")}
        {px(9, 13, 1, 1, "#b91c1c")}
        {px(10, 14, 1, 1, "#b91c1c")}
      </g>
    );
  }
  if (mark === "freckles") {
    return (
      <g shapeRendering="crispEdges">
        {px(10, 15, 1, 1, skin.deep)}
        {px(12, 15, 1, 1, skin.deep)}
        {px(19, 15, 1, 1, skin.deep)}
        {px(21, 15, 1, 1, skin.deep)}
        {px(15, 15, 1, 1, skin.deep)}
      </g>
    );
  }
  if (mark === "tattoo") {
    return (
      <g shapeRendering="crispEdges">
        {px(9, 15, 1, 1, "#7B2FF7")}
        {px(10, 15, 1, 1, "#7B2FF7")}
        {px(10, 16, 1, 1, "#7B2FF7")}
        {px(9, 16, 1, 1, "#c084fc")}
      </g>
    );
  }
  if (mark === "warpaint") {
    return (
      <g shapeRendering="crispEdges">
        {px(9, 14, 4, 1, "#dc2626")}
        {px(9, 15, 4, 1, "#7a1010")}
        {px(19, 14, 4, 1, "#dc2626")}
        {px(19, 15, 4, 1, "#7a1010")}
      </g>
    );
  }
  return null;
}

/* ---------- NECK + TORSO base ---------- */
function renderNeckTorso(skin: (typeof SKIN_TONES)[number]) {
  return (
    <g shapeRendering="crispEdges">
      {/* neck */}
      {px(13, 21, 6, 2, skin.shade)}
      {px(13, 21, 6, 1, skin.deep)}
      {/* torso base (tunic) with rounded shoulders */}
      {px(5, 23, 22, 1, OUTLINE)}
      {px(4, 24, 24, 1, "#3f4756")}
      {px(3, 25, 26, 7, "#3f4756")}
      {px(4, 24, 24, 1, OUTLINE)}
      {px(3, 25, 1, 7, OUTLINE)}
      {px(28, 25, 1, 7, OUTLINE)}
      {/* subtle collar */}
      {px(13, 23, 6, 2, "#2b3140")}
      {px(14, 23, 4, 1, OUTLINE)}
    </g>
  );
}

/* ---------- HAT LAYER (sits on head y 0–8) ---------- */
function HatLayer({ id }: { id: string }) {
  switch (id) {
    case "hat_bandana":
      return (
        <g shapeRendering="crispEdges">
          {px(7, 8, 18, 3, "#dc2626")}
          {px(7, 7, 18, 1, OUTLINE)}
          {px(7, 11, 18, 1, OUTLINE)}
          {px(8, 9, 16, 1, "#b91c1c")}
          {px(25, 9, 3, 4, "#dc2626")}
          {px(25, 13, 1, 1, OUTLINE)}
        </g>
      );
    case "hat_bone":
      return (
        <g shapeRendering="crispEdges">
          {/* crown */}
          {px(8, 2, 16, 5, "#1d4ed8")}
          {px(8, 1, 16, 1, OUTLINE)}
          {px(7, 2, 1, 5, OUTLINE)}
          {px(24, 2, 1, 5, OUTLINE)}
          {/* highlight */}
          {px(10, 3, 4, 1, "#3b82f6")}
          {/* brim */}
          {px(22, 7, 8, 2, "#1d4ed8")}
          {px(22, 9, 8, 1, OUTLINE)}
          {px(30, 7, 1, 2, OUTLINE)}
          {px(8, 7, 16, 1, OUTLINE)}
        </g>
      );
    case "hat_capuz":
      return (
        <g shapeRendering="crispEdges">
          {/* wide brim */}
          {px(4, 8, 24, 2, "#111827")}
          {px(4, 10, 24, 1, OUTLINE)}
          {px(4, 8, 1, 2, OUTLINE)}
          {px(27, 8, 1, 2, OUTLINE)}
          {/* crown */}
          {px(9, 1, 14, 7, "#111827")}
          {px(9, 0, 14, 1, OUTLINE)}
          {px(8, 1, 1, 7, OUTLINE)}
          {px(23, 1, 1, 7, OUTLINE)}
          {/* band */}
          {px(9, 6, 14, 1, "#4c1d95")}
        </g>
      );
    case "hat_elmo":
      return (
        <g shapeRendering="crispEdges">
          {/* dome */}
          {px(8, 3, 16, 7, "#9ca3af")}
          {px(8, 2, 16, 1, OUTLINE)}
          {px(7, 3, 1, 7, OUTLINE)}
          {px(24, 3, 1, 7, OUTLINE)}
          {/* highlight */}
          {px(10, 4, 5, 1, "#e5e7eb")}
          {/* rim */}
          {px(8, 10, 16, 1, "#4b5563")}
          {/* nose guard */}
          {px(15, 11, 2, 7, "#9ca3af")}
          {px(14, 11, 1, 7, OUTLINE)}
          {px(17, 11, 1, 7, OUTLINE)}
          {/* horns */}
          {px(4, 1, 3, 4, "#e5e7eb")}
          {px(25, 1, 3, 4, "#e5e7eb")}
          {px(4, 0, 3, 1, OUTLINE)}
          {px(25, 0, 3, 1, OUTLINE)}
        </g>
      );
    case "hat_coroa":
      return (
        <g shapeRendering="crispEdges">
          {/* band */}
          {px(8, 6, 16, 3, "#eab308")}
          {px(8, 5, 16, 1, OUTLINE)}
          {px(8, 9, 16, 1, OUTLINE)}
          {px(8, 8, 16, 1, "#a16207")}
          {/* spikes */}
          {px(8, 2, 2, 4, "#eab308")}
          {px(15, 1, 2, 5, "#facc15")}
          {px(22, 2, 2, 4, "#eab308")}
          {px(11, 3, 2, 3, "#eab308")}
          {px(19, 3, 2, 3, "#eab308")}
          {/* gems */}
          {px(15, 7, 2, 1, "#ef4444")}
          {px(9, 7, 1, 1, "#22d3ee")}
          {px(22, 7, 1, 1, "#22d3ee")}
        </g>
      );
    case "hat_aureola":
      return (
        <g shapeRendering="crispEdges">
          <ellipse cx="16" cy="2" rx="10" ry="1.6" fill="none" stroke="#fde047" strokeWidth="1" />
          <ellipse cx="16" cy="2" rx="10" ry="1.6" fill="none" stroke="#fff8a3" strokeOpacity="0.6" strokeWidth="2.5" />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- ARMOR LAYER (torso y 23–32) ---------- */
function ArmorLayer({ id, cor }: { id: string; cor?: string }) {
  const c = cor ?? "#64748b";
  switch (id) {
    case "arm_tunica":
    case "arm_iniciante":
      return (
        <g shapeRendering="crispEdges">
          {px(4, 23, 24, 1, c)}
          {px(3, 24, 26, 8, c)}
          {px(4, 23, 24, 1, OUTLINE)}
          {px(3, 24, 1, 8, OUTLINE)}
          {px(28, 24, 1, 8, OUTLINE)}
          {/* V-neck */}
          {px(13, 23, 6, 3, "#f1f5f9")}
          {px(14, 23, 4, 1, OUTLINE)}
          {/* seam highlight */}
          {px(4, 24, 24, 1, "#94a3b8")}
        </g>
      );
    case "arm_couro":
      return (
        <g shapeRendering="crispEdges">
          {px(4, 23, 24, 1, c)}
          {px(3, 24, 26, 8, c)}
          {px(4, 23, 24, 1, OUTLINE)}
          {px(3, 24, 1, 8, OUTLINE)}
          {px(28, 24, 1, 8, OUTLINE)}
          {/* pauldrons (rounded top) */}
          {px(4, 23, 4, 1, "#78350f")}
          {px(3, 24, 5, 3, "#78350f")}
          {px(24, 23, 4, 1, "#78350f")}
          {px(24, 24, 5, 3, "#78350f")}
          {px(3, 26, 5, 1, OUTLINE)}
          {px(24, 26, 5, 1, OUTLINE)}
          {/* strap */}
          {px(3, 28, 26, 1, "#3f2410")}
          {/* buckle */}
          {px(15, 27, 2, 3, "#eab308")}
          {px(15, 27, 2, 1, OUTLINE)}
        </g>
      );
    case "arm_manto":
      return (
        <g shapeRendering="crispEdges">
          {/* cape behind shoulders (rounded top) */}
          {px(2, 22, 28, 1, "#2e1065")}
          {px(1, 23, 30, 9, "#2e1065")}
          {px(1, 23, 1, 9, OUTLINE)}
          {px(30, 23, 1, 9, OUTLINE)}
          {/* body */}
          {px(4, 23, 24, 1, c)}
          {px(3, 24, 26, 8, c)}
          {px(4, 23, 24, 1, OUTLINE)}
          {px(3, 24, 1, 8, OUTLINE)}
          {px(28, 24, 1, 8, OUTLINE)}
          {/* front panel */}
          {px(13, 23, 6, 9, "#1e1b4b")}
          {px(14, 23, 4, 1, OUTLINE)}
          {/* rune */}
          {px(15, 27, 2, 2, "#a855f7")}
        </g>
      );
    case "arm_dourada":
      return (
        <g shapeRendering="crispEdges">
          {/* base plate (rounded top) */}
          {px(4, 23, 24, 1, c)}
          {px(3, 24, 26, 8, c)}
          {px(4, 23, 24, 1, OUTLINE)}
          {px(3, 24, 1, 8, "#854d0e")}
          {px(28, 24, 1, 8, "#854d0e")}
          {/* pauldrons (rounded top) */}
          {px(3, 22, 4, 1, "#facc15")}
          {px(2, 23, 6, 4, "#facc15")}
          {px(25, 22, 4, 1, "#facc15")}
          {px(24, 23, 6, 4, "#facc15")}
          {px(3, 22, 4, 1, OUTLINE)}
          {px(25, 22, 4, 1, OUTLINE)}
          {px(2, 27, 6, 1, OUTLINE)}
          {px(24, 27, 6, 1, OUTLINE)}
          {/* highlight */}
          {px(3, 23, 4, 1, "#fef08a")}
          {px(25, 23, 4, 1, "#fef08a")}
          {/* chest emblem */}
          {px(14, 26, 4, 4, "#dc2626")}
          {px(15, 27, 2, 2, "#fef2f2")}
          {/* seams */}
          {px(3, 28, 26, 1, "#854d0e")}
        </g>
      );
    default:
      return null;
  }
}

/* ---------- AURA LAYER (behind bust) ---------- */
function AuraLayer({ cor }: { cor: string }) {
  return (
    <g>
      <circle cx="16" cy="16" r="15" fill={cor} opacity="0.18" />
      <circle cx="16" cy="14" r="11" fill={cor} opacity="0.22" />
      <circle cx="16" cy="14" r="13" fill="none" stroke={cor} strokeOpacity="0.55" strokeWidth="0.4">
        <animate attributeName="r" values="12;14;12" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.35;0.85;0.35" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export default function Avatar({
  equipado,
  size = "md",
  glow = true,
  className,
}: {
  equipado?: AvatarEquipado | null;
  size?: Size;
  glow?: boolean;
  className?: string;
}) {
  const s = SIZE_PX[size];
  const hat = getItem(equipado?.hat);
  const armor = getItem(equipado?.armor);
  const aura = getItem(equipado?.aura);
  const auraColor = aura?.cor ?? "#7B2FF7";
  const face  = (equipado?.face ?? APARENCIA_PADRAO.face) as FaceShape;
  const skinId = (equipado?.skin ?? APARENCIA_PADRAO.skin) as SkinTone;
  const skin = SKIN_TONES.find(s => s.id === skinId) ?? SKIN_TONES[1];
  const hair = (equipado?.hair ?? APARENCIA_PADRAO.hair) as HairStyle;
  const hairBase = equipado?.hairColor ?? APARENCIA_PADRAO.hairColor;
  // derivar highlight ~20% mais claro (fallback simples)
  const hairLight = lighten(hairBase, 0.25);
  const eyes = equipado?.eyes ?? APARENCIA_PADRAO.eyes;
  const mark = (equipado?.mark ?? APARENCIA_PADRAO.mark) as FaceMark;

  return (
    <div
      className={cn("relative shrink-0 pixel-avatar", className)}
      style={{ width: s, height: s }}
    >
      {glow && !aura && (
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.28) 0%, transparent 65%)" }}
        />
      )}
      <svg viewBox="0 0 32 32" width={s} height={s} className="relative block" style={{ imageRendering: "pixelated" }}>
        {aura && <AuraLayer cor={auraColor} />}
        {renderFace(face, skin)}
        {renderFeatures(eyes, skin, hairBase)}
        {renderMark(mark, skin)}
        {renderHair(hair, hairBase, hairLight, face)}
        {renderNeckTorso(skin)}
        {armor && <ArmorLayer id={armor.id} cor={armor.cor} />}
        {hat && <HatLayer id={hat.id} />}
      </svg>
    </div>
  );
}

/* ---------- utils ---------- */
function lighten(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  const r = Math.min(255, Math.round(((bigint >> 16) & 255) + 255 * amt));
  const g = Math.min(255, Math.round(((bigint >> 8) & 255) + 255 * amt));
  const b = Math.min(255, Math.round((bigint & 255) + 255 * amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}