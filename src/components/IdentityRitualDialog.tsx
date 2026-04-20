import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  identity: string;
  codeOfConduct: string[];
}

export default function IdentityRitualDialog({ open, onClose, onConfirm, identity, codeOfConduct }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm w-[95vw] max-h-[85vh] overflow-y-auto bg-background border-primary/30 p-5 sm:p-6">
        <div className="space-y-4 text-center animate-in fade-in duration-700">
          <p className="text-[10px] font-display tracking-[0.25em] text-primary/70 uppercase">Ritual de Reidentificação</p>

          <div className="space-y-1 text-foreground/90">
            <p className="text-xs sm:text-sm font-display tracking-wide">Fique imóvel.</p>
            <p className="text-xs sm:text-sm font-display tracking-wide">Leia quem você é agora.</p>
            <p className="text-xs sm:text-sm font-display tracking-wide">Ignore quem você foi.</p>
          </div>

          <div className="border-y border-primary/20 py-3 space-y-2">
            <p className="text-sm text-foreground leading-relaxed italic">
              {identity || 'Defina sua identidade primeiro.'}
            </p>
            {codeOfConduct.length > 0 && (
              <ol className="space-y-1 text-xs sm:text-sm text-foreground/80 text-left max-w-sm mx-auto">
                {codeOfConduct.map((rule, i) => (
                  <li key={i}>
                    <span className="text-primary mr-2">{i + 1}.</span>{rule}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <Button onClick={onConfirm} size="sm" className="w-full font-display tracking-wider">
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
