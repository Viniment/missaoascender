import { getItem, AvatarEquipado } from "@/lib/itens";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
const SIZE_PX: Record<Size, number> = { sm: 56, md: 96, lg: 128, xl: 176 };

// 64x64 grid. Coordinates use px inside the viewBox — every rect is one "pixel".
// Anatomy anchors (Habbo-ish):
//   Head: y 14–28  (center x 32)
//   Torso: y 30–44
//   Legs: y 44–56
//   Feet: y 56–60

const SKIN = "#f4c9a0";
const SKIN_SHADE = "#d99a70";
const HAIR = "#3b2418";
const OUTLINE = "#0a0a0f";

function px(x: number, y: number, w = 1, h = 1, fill = "#000") {
  return <rect key={`${x}-${y}-${w}-${h}-${fill}`} x={x} y={y} width={w} height={h} fill={fill} />;
}

/* ---------- BASE BODY ---------- */
function BaseBody() {
  return (
    <g shapeRendering="crispEdges">
      {/* outline shadow behind head */}
      {px(24, 13, 16, 1, OUTLINE)}
      {px(23, 14, 1, 14, OUTLINE)}
      {px(40, 14, 1, 14, OUTLINE)}
      {px(24, 28, 16, 1, OUTLINE)}
      {/* head */}
      {px(24, 14, 16, 14, SKIN)}
      {/* hair (default short) */}
      {px(24, 14, 16, 3, HAIR)}
      {px(23, 15, 1, 2, HAIR)}
      {px(40, 15, 1, 2, HAIR)}
      {/* eyes */}
      {px(28, 21, 2, 2, OUTLINE)}
      {px(34, 21, 2, 2, OUTLINE)}
      {/* mouth */}
      {px(30, 26, 4, 1, "#8b3a3a")}
      {/* neck */}
      {px(29, 29, 6, 2, SKIN_SHADE)}
      {/* torso base tunic */}
      {px(22, 31, 20, 14, "#4b5563")}
      {px(22, 31, 20, 1, OUTLINE)}
      {px(21, 32, 1, 13, OUTLINE)}
      {px(42, 32, 1, 13, OUTLINE)}
      {/* arms */}
      {px(19, 32, 2, 12, "#4b5563")}
      {px(43, 32, 2, 12, "#4b5563")}
      {/* hands */}
      {px(19, 44, 3, 3, SKIN)}
      {px(42, 44, 3, 3, SKIN)}
      {/* legs */}
      {px(24, 45, 7, 11, "#1e293b")}
      {px(33, 45, 7, 11, "#1e293b")}
      {/* feet */}
      {px(23, 56, 9, 3, OUTLINE)}
      {px(32, 56, 9, 3, OUTLINE)}
    </g>
  );
}

/* ---------- HAT LAYER (worn on head, y 8–17) ---------- */
function HatLayer({ id }: { id: string }) {
  switch (id) {
    case "hat_bandana":
      return (
        <g shapeRendering="crispEdges">
          {px(22, 16, 20, 3, "#dc2626")}
          {px(22, 15, 20, 1, OUTLINE)}
          {px(22, 19, 20, 1, OUTLINE)}
          {px(41, 17, 3, 4, "#dc2626")}
          {px(41, 21, 1, 1, OUTLINE)}
        </g>
      );
    case "hat_bone":
      return (
        <g shapeRendering="crispEdges">
          {px(22, 11, 20, 5, "#1d4ed8")}
          {px(22, 10, 20, 1, OUTLINE)}
          {px(21, 11, 1, 5, OUTLINE)}
          {px(42, 11, 1, 5, OUTLINE)}
          {px(22, 16, 20, 1, OUTLINE)}
          {/* brim */}
          {px(38, 16, 8, 2, "#1d4ed8")}
          {px(38, 18, 8, 1, OUTLINE)}
          {px(46, 16, 1, 2, OUTLINE)}
        </g>
      );
    case "hat_capuz":
      return (
        <g shapeRendering="crispEdges">
          {/* wide brim */}
          {px(16, 15, 32, 2, "#111827")}
          {px(16, 17, 32, 1, OUTLINE)}
          {/* crown */}
          {px(24, 8, 16, 8, "#111827")}
          {px(24, 7, 16, 1, OUTLINE)}
          {px(23, 8, 1, 8, OUTLINE)}
          {px(40, 8, 1, 8, OUTLINE)}
          {px(24, 12, 16, 1, "#374151")}
        </g>
      );
    case "hat_elmo":
      return (
        <g shapeRendering="crispEdges">
          {/* helm dome */}
          {px(22, 11, 20, 8, "#9ca3af")}
          {px(22, 10, 20, 1, OUTLINE)}
          {px(21, 11, 1, 8, OUTLINE)}
          {px(42, 11, 1, 8, OUTLINE)}
          {/* highlight */}
          {px(25, 12, 3, 1, "#e5e7eb")}
          {/* nose guard */}
          {px(31, 19, 2, 5, "#9ca3af")}
          {px(30, 19, 1, 5, OUTLINE)}
          {px(33, 19, 1, 5, OUTLINE)}
          {/* horns */}
          {px(19, 9, 2, 3, "#e5e7eb")}
          {px(43, 9, 2, 3, "#e5e7eb")}
        </g>
      );
    case "hat_coroa":
      return (
        <g shapeRendering="crispEdges">
          {px(22, 13, 20, 3, "#eab308")}
          {px(22, 12, 20, 1, OUTLINE)}
          {px(22, 16, 20, 1, OUTLINE)}
          {/* spikes */}
          {px(23, 9, 2, 4, "#eab308")}
          {px(30, 8, 2, 5, "#eab308")}
          {px(38, 9, 2, 4, "#eab308")}
          {/* gems */}
          {px(30, 14, 2, 1, "#ef4444")}
          {px(23, 14, 1, 1, "#22d3ee")}
          {px(39, 14, 1, 1, "#22d3ee")}
        </g>
      );
    case "hat_aureola":
      return (
        <g shapeRendering="crispEdges">
          <ellipse cx="32" cy="10" rx="12" ry="3" fill="none" stroke="#fde047" strokeWidth="1.2" />
          <ellipse cx="32" cy="10" rx="12" ry="3" fill="none" stroke="#fff8a3" strokeOpacity="0.5" strokeWidth="2.5" />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- ARMOR LAYER (worn on torso y 30–45) ---------- */
function ArmorLayer({ id, cor }: { id: string; cor?: string }) {
  const c = cor ?? "#64748b";
  switch (id) {
    case "arm_tunica":
    case "arm_iniciante":
      return (
        <g shapeRendering="crispEdges">
          {px(22, 31, 20, 14, c)}
          {px(22, 31, 20, 1, OUTLINE)}
          {px(29, 31, 6, 5, "#f1f5f9")} {/* V-neck panel */}
          {px(19, 32, 2, 12, c)}
          {px(43, 32, 2, 12, c)}
          {px(21, 44, 1, 1, OUTLINE)}
          {px(42, 44, 1, 1, OUTLINE)}
        </g>
      );
    case "arm_couro":
      return (
        <g shapeRendering="crispEdges">
          {px(22, 31, 20, 14, c)}
          {px(22, 31, 20, 1, OUTLINE)}
          {px(19, 32, 2, 12, "#78350f")}
          {px(43, 32, 2, 12, "#78350f")}
          {/* straps */}
          {px(22, 36, 20, 1, "#3f2410")}
          {px(22, 41, 20, 1, "#3f2410")}
          {/* buckles */}
          {px(31, 36, 2, 1, "#eab308")}
          {px(31, 41, 2, 1, "#eab308")}
        </g>
      );
    case "arm_manto":
      return (
        <g shapeRendering="crispEdges">
          {/* cape behind */}
          {px(19, 30, 26, 2, "#2e1065")}
          {px(17, 32, 30, 16, "#2e1065")}
          {px(17, 48, 30, 1, OUTLINE)}
          {/* body */}
          {px(22, 31, 20, 14, c)}
          {px(22, 31, 20, 1, OUTLINE)}
          {px(29, 31, 6, 14, "#1e1b4b")}
          {/* purple runes */}
          {px(31, 36, 2, 2, "#a855f7")}
        </g>
      );
    case "arm_dourada":
      return (
        <g shapeRendering="crispEdges">
          {px(22, 31, 20, 14, c)}
          {px(22, 31, 20, 1, OUTLINE)}
          {px(21, 32, 1, 13, "#854d0e")}
          {px(42, 32, 1, 13, "#854d0e")}
          {/* plates */}
          {px(22, 36, 20, 1, "#fde047")}
          {px(22, 40, 20, 1, "#fde047")}
          {/* shoulders */}
          {px(19, 31, 4, 4, "#facc15")}
          {px(41, 31, 4, 4, "#facc15")}
          {px(19, 35, 4, 1, OUTLINE)}
          {px(41, 35, 4, 1, OUTLINE)}
          {/* chest emblem */}
          {px(30, 35, 4, 4, "#dc2626")}
          {px(31, 36, 2, 2, "#fef2f2")}
        </g>
      );
    default:
      return null;
  }
}

/* ---------- AURA LAYER (behind everything) ---------- */
function AuraLayer({ cor }: { cor: string }) {
  return (
    <g>
      <circle cx="32" cy="36" r="30" fill={cor} opacity="0.18" />
      <circle cx="32" cy="36" r="24" fill={cor} opacity="0.22" />
      <circle cx="32" cy="36" r="30" fill="none" stroke={cor} strokeOpacity="0.55" strokeWidth="0.5">
        <animate attributeName="r" values="28;31;28" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.35;0.75;0.35" dur="2.4s" repeatCount="indefinite" />
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
  const px = SIZE_PX[size];
  const hat = getItem(equipado?.hat);
  const armor = getItem(equipado?.armor);
  const aura = getItem(equipado?.aura);
  const auraColor = aura?.cor ?? "#7B2FF7";

  return (
    <div
      className={cn("relative shrink-0 pixel-avatar", className)}
      style={{ width: px, height: px }}
    >
      {glow && !aura && (
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.25) 0%, transparent 65%)" }}
        />
      )}
      <svg viewBox="0 0 64 64" width={px} height={px} className="relative block">
        {aura && <AuraLayer cor={auraColor} />}
        <BaseBody />
        {armor && <ArmorLayer id={armor.id} cor={armor.cor} />}
        {hat && <HatLayer id={hat.id} />}
      </svg>
    </div>
  );
}