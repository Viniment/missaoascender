import { getItem, AvatarEquipado, SKIN_TONES, APARENCIA_PADRAO, FaceShape, HairStyle, FaceMark, SkinTone, BeardStyle } from "@/lib/itens";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
// Sempre múltiplos de 32 (viewBox) para evitar anti-aliasing entre pixels da pele.
const SIZE_PX: Record<Size, number> = { sm: 64, md: 96, lg: 128, xl: 192 };

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
  // pele limpa — sem sombreamentos que virem linhas. Apenas um leve toque
  // de brilho na bochecha esquerda para dar vida, sem cruzar o rosto.
  const cheekRow = rows.find((_, i) => 4 + i === 14);
  if (cheekRow) {
    nodes.push(<rect key="cheek-l" x={cheekRow[0] + 1} y={14} width={1} height={1} fill={skin.light} opacity={0.55} />);
    nodes.push(<rect key="cheek-r" x={cheekRow[1] - 1} y={14} width={1} height={1} fill={skin.light} opacity={0.55} />);
  }
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

/* ---------- BEARD ----------
 * Usa a cor do cabelo. Fica sobre a região da boca/queixo (y 17–20).
 */
function renderBeard(style: BeardStyle, base: string, light: string, shape: FaceShape) {
  if (style === "none") return null;
  const rows = faceRows(shape);
  const rowAt = (y: number) => rows[y - 4] ?? rows[rows.length - 1];
  const els: JSX.Element[] = [];
  const push = (x: number, y: number, w = 1, h = 1, fill = base) => els.push(px(x, y, w, h, fill));

  if (style === "stubble") {
    // sombra difusa ao longo do maxilar e área do bigode — sem pontos aleatórios.
    // Duas camadas de opacidade baixa criam a sensação de barba por fazer.
    const shade: JSX.Element[] = [];
    const pushShade = (x: number, y: number, w = 1, h = 1, op = 0.35) => {
      const [l, r] = rowAt(y);
      const nx = Math.max(l, x);
      const nw = Math.min(r, x + w - 1) - nx + 1;
      if (nw > 0) shade.push(<rect key={`sb-${x}-${y}-${w}`} x={nx} y={y} width={nw} height={h} fill={base} opacity={op} />);
    };
    // bigode leve (acima da boca)
    pushShade(11, 17, 10, 1, 0.30);
    // laterais do queixo
    pushShade(9, 18, 4, 1, 0.30);
    pushShade(19, 18, 4, 1, 0.30);
    // queixo (abaixo da boca)
    pushShade(9, 19, 14, 1, 0.35);
    // segunda camada mais escura no centro do queixo p/ profundidade
    pushShade(12, 19, 8, 1, 0.25);
    return <g shapeRendering="crispEdges">{shade}</g>;
  }

  if (style === "mustache") {
    // Bigode denso em 2 linhas, com asas descendo pelas laterais da boca.
    // Layout (relativo ao rosto):
    //   y=17  ..XXXXXXXX..    (corpo cheio, 8px, base 12..19)
    //   y=18  X..........X    (pontas descendo, x=11 e x=20 — fora da boca)
    // A boca (x 13..18 em y=18) fica intacta entre as pontas.
    const drawIf = (x: number, y: number, w = 1, h = 1, fill = base) => {
      const [l, r] = rowAt(y);
      const nx = Math.max(l, x);
      const nw = Math.min(r, x + w - 1) - nx + 1;
      if (nw > 0) push(nx, y, nw, h, fill);
    };
    // corpo
    drawIf(12, 17, 8, 1, base);
    // outline inferior sutil no corpo p/ separar da pele
    drawIf(12, 17, 8, 1, base); // reforço
    // pontas laterais descendo ao lado da boca
    drawIf(11, 18, 1, 1, base);
    drawIf(20, 18, 1, 1, base);
    drawIf(12, 18, 1, 1, base);
    drawIf(19, 18, 1, 1, base);
    // brilho nas asas superiores
    drawIf(13, 17, 2, 1, light);
    drawIf(17, 17, 2, 1, light);
    // sombra fina embaixo do corpo, nas extremidades (dá profundidade)
    drawIf(12, 17, 1, 1, OUTLINE);
    drawIf(19, 17, 1, 1, OUTLINE);
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "goatee") {
    // pequeno tufo no queixo + bigode fino
    push(12, 17, 8, 1, base);
    push(14, 19, 4, 1, base);
    push(15, 20, 2, 1, base);
    push(13, 20, 1, 1, base);
    push(18, 20, 1, 1, base);
    push(15, 19, 2, 1, light);
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "full") {
    // barba cheia cobrindo queixo e laterais até y=20
    for (let y = 17; y <= 20; y++) {
      const [l, r] = rowAt(y);
      push(l, y, r - l + 1, 1, base);
    }
    // recorta boca
    push(14, 18, 4, 1, "#7a2828");
    // highlight superior
    push(11, 17, 2, 1, light);
    push(19, 17, 2, 1, light);
    return <g shapeRendering="crispEdges">{els}</g>;
  }

  if (style === "viking") {
    // barba cheia + comprida descendo pelo pescoço
    for (let y = 16; y <= 20; y++) {
      const [l, r] = rowAt(y);
      push(l, y, r - l + 1, 1, base);
    }
    // recorta boca
    push(14, 18, 4, 1, "#7a2828");
    // trança/queixo pontudo descendo
    push(13, 21, 6, 1, base);
    push(14, 22, 4, 1, base);
    push(15, 23, 2, 1, base);
    // tranças laterais
    push(11, 21, 1, 2, base);
    push(20, 21, 1, 2, base);
    // highlight
    push(12, 17, 2, 1, light);
    push(18, 17, 2, 1, light);
    return <g shapeRendering="crispEdges">{els}</g>;
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
  // base torso comum (rounded top)
  const base = (fill: string, outline = OUTLINE) => [
    px(5, 23, 22, 1, fill),
    px(4, 24, 24, 1, fill),
    px(3, 25, 26, 7, fill),
    px(5, 22, 22, 1, outline),
    px(4, 23, 1, 1, outline),
    px(27, 23, 1, 1, outline),
    px(3, 24, 1, 1, outline),
    px(28, 24, 1, 1, outline),
    px(3, 25, 1, 7, outline),
    px(28, 25, 1, 7, outline),
  ];
  switch (id) {
    case "arm_iniciante": {
      // 👕 camiseta simples
      const shirt = "#64748b";
      return (
        <g shapeRendering="crispEdges">
          {base(shirt)}
          {/* mangas curtas */}
          {px(3, 25, 4, 3, "#475569")}
          {px(25, 25, 4, 3, "#475569")}
          {/* gola redonda */}
          {px(14, 23, 4, 2, "#334155")}
          {px(15, 23, 2, 1, OUTLINE)}
          {/* leve highlight */}
          {px(6, 25, 2, 1, "#94a3b8")}
          {px(24, 25, 2, 1, "#94a3b8")}
        </g>
      );
    }
    case "arm_tunica": {
      // 🥋 gi de treino: creme + faixa preta cruzada
      const gi = "#e5e7eb";
      return (
        <g shapeRendering="crispEdges">
          {base(gi)}
          {/* sombras laterais */}
          {px(4, 26, 1, 5, "#94a3b8")}
          {px(27, 26, 1, 5, "#94a3b8")}
          {/* colarinho cruzado */}
          {px(13, 23, 3, 4, "#f8fafc")}
          {px(16, 23, 3, 4, "#f8fafc")}
          {px(15, 23, 2, 6, "#cbd5e1")}
          {px(13, 23, 1, 4, OUTLINE)}
          {px(18, 23, 1, 4, OUTLINE)}
          {/* faixa preta */}
          {px(3, 29, 26, 2, "#0f172a")}
          {px(3, 29, 26, 1, OUTLINE)}
          {/* nó da faixa */}
          {px(14, 28, 4, 3, "#0f172a")}
          {px(15, 30, 2, 2, "#1e293b")}
        </g>
      );
    }
    case "arm_couro": {
      // 🦺 colete de couro: marrom + costuras + fivela
      const leather = "#a16207";
      return (
        <g shapeRendering="crispEdges">
          {base(leather)}
          {/* highlight superior */}
          {px(5, 24, 22, 1, "#ca8a04")}
          {/* abertura frontal (undershirt) */}
          {px(14, 23, 4, 9, "#1c1917")}
          {px(14, 23, 4, 1, OUTLINE)}
          {/* costuras laterais (tracejado) */}
          {px(6, 26, 1, 1, "#78350f")}{px(6, 28, 1, 1, "#78350f")}{px(6, 30, 1, 1, "#78350f")}
          {px(25, 26, 1, 1, "#78350f")}{px(25, 28, 1, 1, "#78350f")}{px(25, 30, 1, 1, "#78350f")}
          {/* cinto */}
          {px(3, 29, 26, 1, "#3f2410")}
          {/* fivela dourada */}
          {px(15, 28, 2, 3, "#eab308")}
          {px(15, 28, 2, 1, OUTLINE)}
          {px(15, 30, 2, 1, "#a16207")}
        </g>
      );
    }
    case "arm_manto": {
      // 🧥 sobretudo com gola alta e botões
      const coat = c;
      return (
        <g shapeRendering="crispEdges">
          {/* capa por trás */}
          {px(2, 24, 28, 1, "#1e1b4b")}
          {px(1, 25, 30, 7, "#1e1b4b")}
          {px(1, 25, 1, 7, OUTLINE)}
          {px(30, 25, 1, 7, OUTLINE)}
          {/* corpo */}
          {base(coat)}
          {/* gola alta levantada */}
          {px(11, 22, 3, 4, coat)}
          {px(18, 22, 3, 4, coat)}
          {px(11, 21, 3, 1, OUTLINE)}
          {px(18, 21, 3, 1, OUTLINE)}
          {px(10, 22, 1, 4, OUTLINE)}
          {px(21, 22, 1, 4, OUTLINE)}
          {px(11, 22, 3, 1, "#a78bfa")}
          {px(18, 22, 3, 1, "#a78bfa")}
          {/* abertura central */}
          {px(15, 23, 2, 9, "#1e1b4b")}
          {/* botões dourados */}
          {px(15, 26, 2, 1, "#eab308")}
          {px(15, 29, 2, 1, "#eab308")}
          {/* runa */}
          {px(15, 31, 2, 1, "#a855f7")}
        </g>
      );
    }
    case "arm_dourada": {
      // 🛡️ armadura de placas dourada com emblema de escudo
      const gold = "#eab308";
      return (
        <g shapeRendering="crispEdges">
          {base(gold, "#854d0e")}
          {/* highlight superior */}
          {px(5, 24, 22, 1, "#fde047")}
          {/* pauldrons (rounded top) */}
          {px(3, 22, 4, 1, "#facc15")}
          {px(2, 23, 6, 4, "#facc15")}
          {px(25, 22, 4, 1, "#facc15")}
          {px(24, 23, 6, 4, "#facc15")}
          {px(3, 22, 4, 1, OUTLINE)}
          {px(25, 22, 4, 1, OUTLINE)}
          {px(2, 27, 6, 1, OUTLINE)}
          {px(24, 27, 6, 1, OUTLINE)}
          {px(3, 23, 3, 1, "#fef08a")}
          {px(25, 23, 3, 1, "#fef08a")}
          {/* emblema em forma de escudo */}
          {px(13, 25, 6, 1, "#7f1d1d")}
          {px(12, 26, 8, 3, "#dc2626")}
          {px(13, 29, 6, 1, "#dc2626")}
          {px(14, 30, 4, 1, "#dc2626")}
          {px(15, 31, 2, 1, "#dc2626")}
          {px(12, 26, 1, 3, OUTLINE)}
          {px(19, 26, 1, 3, OUTLINE)}
          {px(13, 25, 6, 1, OUTLINE)}
          {/* cruz branca no escudo */}
          {px(15, 26, 2, 4, "#fef2f2")}
          {px(13, 27, 6, 1, "#fef2f2")}
          {/* linha de placas */}
          {px(3, 28, 26, 1, "#854d0e")}
        </g>
      );
    }
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
  const beard = (equipado?.beard ?? APARENCIA_PADRAO.beard) as BeardStyle;

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
      <svg viewBox="0 0 32 32" width={s} height={s} shapeRendering="crispEdges" className="relative block" style={{ imageRendering: "pixelated" }}>
        {aura && <AuraLayer cor={auraColor} />}
        {renderFace(face, skin)}
        {renderFeatures(eyes, skin, hairBase)}
        {renderMark(mark, skin)}
        {renderBeard(beard, hairBase, hairLight, face)}
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