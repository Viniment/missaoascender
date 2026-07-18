import { getItem, AvatarEquipado } from "@/lib/itens";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
const SIZE_PX: Record<Size, number> = { sm: 56, md: 96, lg: 128, xl: 176 };

// Bust-only Minecraft-style avatar. 32x32 viewBox for chunky pixels.
//   Head: x 8–24, y 4–20  (16x16 head, Minecraft-accurate)
//   Neck: x 13–19, y 20–22
//   Shoulders/torso top: x 4–28, y 22–32

const SKIN        = "#f2c39a";
const SKIN_LIGHT  = "#ffd9b3";
const SKIN_SHADE  = "#c48a63";
const SKIN_DEEP   = "#8b5a3c";
const HAIR        = "#2a1a10";
const HAIR_LIGHT  = "#4a2f1e";
const OUTLINE     = "#0a0a0f";
const EYE_WHITE   = "#f8fafc";
const EYE_BLUE    = "#2563eb";

function px(x: number, y: number, w = 1, h = 1, fill = "#000") {
  return <rect key={`${x}-${y}-${w}-${h}-${fill}`} x={x} y={y} width={w} height={h} fill={fill} />;
}

/* ---------- BASE BUST ---------- */
function BaseBody() {
  return (
    <g shapeRendering="crispEdges">
      {/* --- HEAD (16x16 block at 8,4) --- */}
      {/* outline (top square, bottom chamfered/rounded) */}
      {px(7, 4, 18, 1, OUTLINE)}
      {px(8, 20, 16, 1, OUTLINE)}
      {px(7, 4, 1, 16, OUTLINE)}
      {px(24, 4, 1, 16, OUTLINE)}
      {/* skin fill */}
      {px(8, 5, 16, 15, SKIN)}
      {/* clip bottom face corners for round chin */}
      {px(8, 19, 1, 1, SKIN_DEEP)}
      {px(23, 19, 1, 1, SKIN_DEEP)}
      {/* face highlight (cheek) */}
      {px(9, 14, 2, 1, SKIN_LIGHT)}
      {px(21, 14, 2, 1, SKIN_LIGHT)}
      {/* jaw shadow */}
      {px(8, 18, 16, 2, SKIN_SHADE)}
      {px(9, 19, 14, 1, SKIN_DEEP)}
      {/* --- HAIR (top cap + sideburns) --- */}
      {px(8, 5, 16, 3, HAIR)}
      {px(8, 8, 2, 4, HAIR)}
      {px(22, 8, 2, 4, HAIR)}
      {/* fringe strands */}
      {px(10, 8, 2, 1, HAIR)}
      {px(14, 8, 3, 1, HAIR)}
      {px(19, 8, 2, 1, HAIR)}
      {/* hair highlight */}
      {px(10, 5, 4, 1, HAIR_LIGHT)}
      {px(16, 5, 3, 1, HAIR_LIGHT)}
      {/* --- EYEBROWS --- */}
      {px(10, 10, 3, 1, HAIR)}
      {px(19, 10, 3, 1, HAIR)}
      {/* --- EYES (Minecraft-style 2x2 with white + pupil) --- */}
      {px(10, 12, 3, 2, EYE_WHITE)}
      {px(19, 12, 3, 2, EYE_WHITE)}
      {px(11, 12, 2, 2, EYE_BLUE)}
      {px(20, 12, 2, 2, EYE_BLUE)}
      {px(11, 12, 1, 1, OUTLINE)}
      {px(20, 12, 1, 1, OUTLINE)}
      {/* --- NOSE --- */}
      {px(15, 14, 2, 3, SKIN_SHADE)}
      {px(15, 16, 2, 1, SKIN_DEEP)}
      {/* --- MOUTH --- */}
      {px(13, 18, 6, 1, SKIN_DEEP)}
      {px(14, 18, 4, 1, "#7a2828")}
      {/* --- NECK --- */}
      {px(13, 21, 6, 2, SKIN_SHADE)}
      {px(13, 21, 6, 1, SKIN_DEEP)}
      {/* --- SHOULDERS / TORSO TOP (base tunic) --- */}
      {px(4, 23, 24, 1, "#3f4756")}
      {px(3, 24, 26, 8, "#3f4756")}
      {px(4, 23, 24, 1, OUTLINE)}
      {px(3, 24, 1, 8, OUTLINE)}
      {px(28, 24, 1, 8, OUTLINE)}
      {/* collar */}
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
        <BaseBody />
        {armor && <ArmorLayer id={armor.id} cor={armor.cor} />}
        {hat && <HatLayer id={hat.id} />}
      </svg>
    </div>
  );
}