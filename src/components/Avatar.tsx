import { getItem, AvatarEquipado } from "@/lib/itens";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE = {
  sm: { box: "w-14 h-14",  base: "text-3xl", hat: "text-xl -top-1",   arm: "text-lg bottom-0",    aura: 40 },
  md: { box: "w-24 h-24",  base: "text-5xl", hat: "text-3xl -top-2",  arm: "text-2xl bottom-0",   aura: 60 },
  lg: { box: "w-32 h-32",  base: "text-7xl", hat: "text-4xl -top-3",  arm: "text-3xl bottom-0",   aura: 80 },
  xl: { box: "w-44 h-44",  base: "text-8xl", hat: "text-5xl -top-4",  arm: "text-4xl bottom-1",   aura: 110 },
};

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
  const s = SIZE[size];
  const hat = getItem(equipado?.hat);
  const armor = getItem(equipado?.armor);
  const aura = getItem(equipado?.aura);
  const auraColor = aura?.cor ?? "hsl(var(--primary))";

  return (
    <div className={cn("relative shrink-0 grid place-items-center pixel-avatar", s.box, className)}>
      {glow && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: aura
              ? `radial-gradient(circle, ${auraColor}55 0%, ${auraColor}22 40%, transparent 70%)`
              : `radial-gradient(circle, hsl(var(--primary)/0.25) 0%, transparent 70%)`,
            filter: `blur(${s.aura / 6}px)`,
          }}
        />
      )}

      {aura && (
        <div
          className="absolute inset-1 rounded-full border-2 animate-pulse pointer-events-none"
          style={{ borderColor: auraColor, boxShadow: `0 0 18px ${auraColor}` }}
        />
      )}

      {/* base body */}
      <div className={cn("relative select-none leading-none", s.base)} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}>
        🧙
      </div>

      {/* armor overlay */}
      {armor && (
        <div
          className={cn("absolute left-1/2 -translate-x-1/2 leading-none", s.arm)}
          style={{ filter: armor.cor ? `drop-shadow(0 0 6px ${armor.cor})` : undefined }}
        >
          {armor.emoji}
        </div>
      )}

      {/* hat overlay */}
      {hat && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]", s.hat)}>
          {hat.emoji}
        </div>
      )}
    </div>
  );
}