import { useGame } from '@/lib/GameContext';
import { computeIdentityLevel } from '@/lib/identityLevels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  compact?: boolean;
}

export default function IdentityBadge({ compact = false }: Props) {
  const { state } = useGame();
  const il = computeIdentityLevel(state);

  const tip = il.next
    ? `${il.current.description} · ${il.toNext} pts até "${il.next.label}"`
    : il.current.description;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-display uppercase tracking-wider ${il.current.bg} ${il.current.color}`}
          >
            🧬 {compact ? il.current.short : il.current.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px] text-xs">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
