import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGame } from '@/lib/GameContext';
import { AlertTriangle, Flame, NotebookPen } from 'lucide-react';
import type { SabotagePattern } from '@/lib/gameStore';
import { toast } from 'sonner';

interface Props {
  pattern: SabotagePattern | null;
  onClose: () => void;
}

const KIND_LABEL: Record<string, string> = {
  fuga_recorrente: 'Fuga Recorrente',
  evitacao_area: 'Evitação de Área',
  sabotagem_pos_pico: 'Autossabotagem Pós-Pico',
};

export default function SabotageConfrontDialog({ pattern, onClose }: Props) {
  const { resolveSabotagePattern, addReflection } = useGame();
  if (!pattern) return null;

  const handleAct = () => {
    resolveSabotagePattern(pattern.id, 'agir');
    toast.success('Você viu o padrão. Agora um pequeno gesto. +10 Honra.');
    onClose();
  };

  const handleReflect = () => {
    resolveSabotagePattern(pattern.id, 'refletir');
    addReflection({
      question: `Padrão observado: ${KIND_LABEL[pattern.kind]} — ${pattern.itemRef}`,
      answerHtml: `<blockquote><p>${pattern.pattern}</p></blockquote><p><strong>O que esse padrão está protegendo em você?</strong></p><p></p><p><strong>Qual gesto pequeno e gentil você pode escolher nas próximas 24h?</strong></p><p></p>`,
      date: new Date().toISOString(),
    });
    toast.success('Reflexão criada no Despertar. +3 Honra.');
    onClose();
  };

  return (
    <Dialog open={!!pattern} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-primary flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Padrão observado: {KIND_LABEL[pattern.kind]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rpg-panel border-primary/40 bg-primary/5">
            <p className="text-sm text-foreground/95 leading-relaxed">{pattern.pattern}</p>
          </div>

          <p className="text-xs text-foreground/60 italic">
            Padrões perdem força quando você os vê com carinho e escolhe diferente. Sem cobrança — só clareza.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleAct} className="bg-primary hover:bg-primary/90">
              <Flame className="w-3.5 h-3.5 mr-1" /> Pequeno gesto agora
            </Button>
            <Button onClick={handleReflect} variant="outline" className="border-primary/40">
              <NotebookPen className="w-3.5 h-3.5 mr-1" /> Quero refletir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
