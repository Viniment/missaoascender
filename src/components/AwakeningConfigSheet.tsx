import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGame } from '@/lib/GameContext';
import type { AwakeningConfig, AwakeningExerciseType } from '@/lib/gameStore';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const TYPE_LABELS: Record<AwakeningExerciseType, string> = {
  consciencia: '🔎 Consciência',
  confronto: '⚔️ Confronto',
  reprogramacao: '🧬 Reprogramação',
  direcionamento: '🧭 Direcionamento',
  quebra: '🔥 Quebra de padrão',
};

export default function AwakeningConfigSheet({ open, onOpenChange }: Props) {
  const { state, setAwakeningConfig } = useGame() as any;
  const cfg: AwakeningConfig = state.awakeningConfig || {
    intensity: 'moderado', focus: 'auto', quantity: 'auto', mode: 'adaptativo',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-primary glow-text-purple">Configurar Despertar</SheetTitle>
          <SheetDescription>Ajuste como a IA gera seus exercícios.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Intensity */}
          <div className="space-y-2">
            <Label className="text-sm font-display uppercase tracking-wider">Intensidade</Label>
            <RadioGroup
              value={cfg.intensity}
              onValueChange={(v) => setAwakeningConfig({ intensity: v as any })}
              className="grid grid-cols-3 gap-2"
            >
              {(['leve', 'moderado', 'intenso'] as const).map(v => (
                <label
                  key={v}
                  className={`flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer text-xs uppercase font-display transition ${
                    cfg.intensity === v ? 'border-primary bg-primary/15 text-primary' : 'border-border text-foreground/70 hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={v} className="sr-only" />
                  {v}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Focus */}
          <div className="space-y-2">
            <Label className="text-sm font-display uppercase tracking-wider">Foco</Label>
            <Select value={cfg.focus} onValueChange={(v) => setAwakeningConfig({ focus: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (IA decide)</SelectItem>
                <SelectItem value="disciplina">Disciplina</SelectItem>
                <SelectItem value="emocao">Emoção</SelectItem>
                <SelectItem value="identidade">Identidade</SelectItem>
                <SelectItem value="clareza">Clareza mental</SelectItem>
                <SelectItem value="autoconfianca">Autoconfiança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-sm font-display uppercase tracking-wider">Quantidade</Label>
            <RadioGroup
              value={String(cfg.quantity)}
              onValueChange={(v) => setAwakeningConfig({ quantity: v === 'auto' ? 'auto' : (Number(v) as 3 | 5) })}
              className="grid grid-cols-3 gap-2"
            >
              {[
                { v: 'auto', label: 'Auto' },
                { v: '3', label: '3' },
                { v: '5', label: '5' },
              ].map(o => (
                <label
                  key={o.v}
                  className={`flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer text-xs uppercase font-display transition ${
                    String(cfg.quantity) === o.v ? 'border-primary bg-primary/15 text-primary' : 'border-border text-foreground/70 hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={o.v} className="sr-only" />
                  {o.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-display uppercase tracking-wider">Modo</Label>
            <RadioGroup
              value={cfg.mode}
              onValueChange={(v) => setAwakeningConfig({ mode: v as any })}
              className="grid grid-cols-2 gap-2"
            >
              {(['adaptativo', 'manual'] as const).map(v => (
                <label
                  key={v}
                  className={`flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer text-xs uppercase font-display transition ${
                    cfg.mode === v ? 'border-primary bg-primary/15 text-primary' : 'border-border text-foreground/70 hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={v} className="sr-only" />
                  {v}
                </label>
              ))}
            </RadioGroup>
            {cfg.mode === 'manual' && (
              <Select
                value={cfg.manualType || 'consciencia'}
                onValueChange={(v) => setAwakeningConfig({ manualType: v as AwakeningExerciseType })}
              >
                <SelectTrigger><SelectValue placeholder="Tipo de exercício" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as AwakeningExerciseType[]).map(t => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <p className="text-[11px] text-foreground/50 italic">
            Recomendado: Adaptativo + Auto + Moderado. A IA analisa seu estado e escolhe os melhores exercícios.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
